import dotenv from "dotenv";
import nodemailer from "nodemailer";
import twilio from "twilio";
import CourseWorkNotification from "../models/CourseWorkNotification.js";
import User from "../models/User.js";
import { getCourseWork, getStudents, getCourses } from "../services/googleClassroomService.js";
import { getAccessTokenFromRefresh } from "../services/googleAuthService.js";

dotenv.config();

function buildEmailTransport() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) throw new Error("EMAIL_USER/EMAIL_PASS no configurados");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function buildTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error("TWILIO_* no configurados");
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function toE164(n) {
  const trimmed = String(n || "").replace(/\s|-/g, "");
  if (/^\+?[1-9]\d{7,14}$/.test(trimmed)) return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  return null;
}

async function sendCourseNotifications({ courseId, courseWork, accessToken }) {
  const { EMAIL_USER, TWILIO_PHONE_NUMBER } = process.env;
  const transporter = buildEmailTransport();
  const twilioClient = buildTwilioClient();

  // Roster
  const studentsData = await getStudents(courseId, accessToken);
  const roster = (Array.isArray(studentsData) ? studentsData : studentsData?.students) || [];
  const ids = roster.map((s) => String(s?.userId || s?.profile?.id)).filter(Boolean);

  // DB lookup: altEmail/phone
  const users = await User.find(
    { googleId: { $in: ids } },
    { googleId: 1, altEmail: 1, phone: 1 }
  ).lean();

  const altEmails = users.map((u) => u.altEmail).filter(Boolean);
  const phones = users.map((u) => toE164(u.phone)).filter(Boolean);

  // Build message
  const title = courseWork?.title || "Nueva tarea";
  const dueDate = courseWork?.dueDate;
  const dueTime = courseWork?.dueTime;
  const yyyy = dueDate?.year;
  const mm = dueDate?.month ? String(dueDate.month).padStart(2, "0") : null;
  const dd = dueDate?.day ? String(dueDate.day).padStart(2, "0") : null;
  const HH = dueTime?.hours != null ? String(dueTime.hours).padStart(2, "0") : "00";
  const MM = dueTime?.minutes != null ? String(dueTime.minutes).padStart(2, "0") : "00";
  const dueStr = yyyy && mm && dd ? `${yyyy}-${mm}-${dd} ${HH}:${MM}` : "sin fecha límite";

  const emailSubject = `Nueva tarea: ${title}`;
  // SMS body: breve, legible y similar al correo (sin links/botón)
  const plainDesc = courseWork?.description
    ? String(courseWork.description).replace(/\s+/g, " ").trim()
    : "";
  const descLine = plainDesc ? `\n${plainDesc}` : "";
  const body = `NUEVA TAREA: ${title}${descLine}\nVencimiento: ${dueStr}\n— Aviso automático`;

  // Build Classroom details URL if possible
  const detailsUrl = courseId && courseWork?.id
    ? `https://classroom.google.com/c/${courseId}/a/${courseWork.id}`
    : undefined;

  // Minimal HTML email template inspired by Classroom card
  const html = `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:16px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:20px;">
      <div style="font-size:14px; color:#6b7280; margin-bottom:8px;">NUEVA TAREA</div>
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <div style="flex-shrink:0; width:36px; height:36px; border-radius:50%; background:#eef2ff; display:flex; align-items:center; justify-content:center; color:#4f46e5; font-weight:bold;">📘</div>
        <div style="flex:1;">
          <div style="font-size:18px; font-weight:700; color:#111827; line-height:1.3;">${title}</div>
          ${courseWork?.description ? `<div style=\"margin-top:4px; color:#374151;\">${courseWork.description}</div>` : ""}
          <div style="margin-top:8px; font-size:13px; color:#6b7280;">Vencimiento: ${dueStr}</div>
        </div>
      </div>
      <div style="margin-top:16px; font-size:12px; color:#6b7280;">Este es un aviso automático.</div>
    </div>
  </div>`;

  // Send email (altEmail)
  if (altEmails.length) {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: altEmails,
      subject: emailSubject,
      text: body,
      html,
      replyTo: EMAIL_USER,
    });
  }

  // Send SMS
  if (phones.length && TWILIO_PHONE_NUMBER) {
    await Promise.allSettled(
      phones.map((to) => twilioClient.messages.create({ from: TWILIO_PHONE_NUMBER, to, body }))
    );
  }
}

async function checkNewCourseWorkOnce() {
  try {
    // Buscar docentes con refreshToken
    const teachers = await User.find(
      { role: "teacher", refreshToken: { $exists: true, $ne: null } },
      { googleId: 1, refreshToken: 1 }
    ).lean();
    if (!teachers.length) return;

    for (const teacher of teachers) {
      let accessToken;
      try {
        accessToken = await getAccessTokenFromRefresh(teacher.refreshToken);
      } catch (e) {
        console.error("No se pudo refrescar token para teacher", teacher.googleId, e.message);
        continue;
      }

      // 1) Si COURSES_TO_WATCH está definido, usarlo; si no, autodetectar cursos del docente
      let courseIds = [];
      const listEnv = process.env.COURSES_TO_WATCH || "";
      const envIds = listEnv.split(/[\,\s]+/).filter(Boolean);
      if (envIds.length) {
        courseIds = envIds;
      } else {
        const data = await getCourses(accessToken);
        const courses = Array.isArray(data?.courses) ? data.courses : [];
        courseIds = courses.map((c) => String(c.id)).filter(Boolean);
      }
      if (!courseIds.length) continue;

      await Promise.all(
        courseIds.map(async (courseId) => {
          const cwData = await getCourseWork(courseId, accessToken);
          const items = Array.isArray(cwData) ? cwData : cwData?.courseWork || [];
          for (const cw of items) {
            const courseWorkId = String(cw.id);
            const exists = await CourseWorkNotification.findOne({ courseId, courseWorkId }).lean();
            if (exists) continue;
            await sendCourseNotifications({ courseId, courseWork: cw, accessToken });
            await CourseWorkNotification.create({ courseId, courseWorkId });
          }
        })
      );
    }
  } catch (err) {
    console.error("Scheduler check error:", err.message);
  }
}

let intervalHandle = null;
export function startNotifier() {
  const enabled = process.env.NOTIFIER_ENABLED === "true";
  const everyMs = Number(process.env.NOTIFIER_INTERVAL_MS || 600000); // default 10 min
  if (!enabled) return;
  if (intervalHandle) return;
  intervalHandle = setInterval(checkNewCourseWorkOnce, everyMs);
  // Kick first run after server starts (delay a bit)
  setTimeout(checkNewCourseWorkOnce, 5000);
  console.log(`Notifier started: interval ${everyMs}ms`);
}

export function stopNotifier() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}
