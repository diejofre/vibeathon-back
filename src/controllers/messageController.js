import nodemailer from "nodemailer";
import twilio from "twilio";
import { getStudents } from "../services/googleClassroomService.js";
import User from "../models/User.js";

export async function sendAltEmail(req, res) {
  try {
    const { courseId } = req.params;
    const { subject, message } = req.body || {};

    if (!subject || !message) {
      return res.status(400).json({ error: "Faltan 'subject' o 'message'" });
    }

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    if (!EMAIL_USER || !EMAIL_PASS) {
      return res.status(500).json({ error: "EMAIL_USER o EMAIL_PASS no configurados" });
    }

    // Obtener roster del curso desde Google Classroom
    const studentsData = await getStudents(courseId, req.user.accessToken);
    const roster = (Array.isArray(studentsData) ? studentsData : studentsData?.students) || [];

    const ids = roster
      .map((s) => String(s?.userId || s?.profile?.id))
      .filter(Boolean);

    // Buscar altEmail en nuestra DB para los ids
    const users = await User.find({ googleId: { $in: ids } }, { googleId: 1, altEmail: 1 }).lean();
    const altEmails = users.map((u) => u.altEmail).filter((e) => !!e);

    if (!altEmails.length) {
      return res.status(200).json({ ok: true, sent: 0, recipients: [] });
    }

    // Configurar transporte Nodemailer (Gmail con contraseña de aplicaciones)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: altEmails,
      subject,
      text: message,
      replyTo: EMAIL_USER,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true, sent: altEmails.length, recipients: altEmails });
  } catch (err) {
    console.error("sendAltEmail error", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function sendSMS(req, res) {
  try {
    const { courseId } = req.params;
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Falta 'message'" });
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return res.status(500).json({ error: "Variables de Twilio no configuradas" });
    }

    // Obtener roster y los IDs de alumnos
    const studentsData = await getStudents(courseId, req.user.accessToken);
    const roster = (Array.isArray(studentsData) ? studentsData : studentsData?.students) || [];
    const ids = roster.map((s) => String(s?.userId || s?.profile?.id)).filter(Boolean);

    // Buscar teléfonos en nuestra DB para los ids
    const users = await User.find({ googleId: { $in: ids } }, { googleId: 1, phone: 1 }).lean();
    let phones = users.map((u) => u.phone).filter((p) => !!p);

    // Normalización básica a E.164 si falta el '+' inicial
    const e164 = (n) => {
      const trimmed = String(n).replace(/\s|-/g, "");
      if (/^\+?[1-9]\d{7,14}$/.test(trimmed)) {
        return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
      }
      return null;
    };
    phones = phones.map(e164).filter(Boolean);

    if (!phones.length) {
      return res.status(200).json({ ok: true, sent: 0, recipients: [] });
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const results = await Promise.allSettled(
      phones.map((to) =>
        client.messages.create({ from: TWILIO_PHONE_NUMBER, to, body: message })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .map((r, i) => ({ r, to: phones[i] }))
      .filter((x) => x.r.status === "rejected");

    return res.json({ ok: true, sent, recipients: phones, failed: failed.map((x) => x.to) });
  } catch (err) {
    console.error("sendSMS error", err);
    return res.status(500).json({ error: err.message });
  }
}
