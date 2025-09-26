import User from "../models/User.js";
import { getStudents, getStudent } from "../services/googleClassroomService.js";

export async function listStudents(req, res) {
  try {
    const students = await getStudents(req.params.courseId, req.user.accessToken);
    const list = Array.isArray(students) ? students : students?.students || [];
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && list.length) {
      await Promise.all(
        list.map((s) => {
          const googleId = s?.userId || s?.profile?.id;
          const name = s?.profile?.name?.fullName;
          const email = s?.profile?.emailAddress;
          const photoUrl = s?.profile?.photoUrl;
          if (!googleId) return Promise.resolve();
          return User.findOneAndUpdate(
            { googleId },
            { $set: { role: "student", name, email, photoUrl } },
            { upsert: true, new: true }
          ).exec();
        })
      );
    }
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStudentById(req, res) {
  try {
    const student = await getStudent(
      req.params.courseId,
      req.params.studentId,
      req.user.accessToken
    );
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && student) {
      const googleId = student?.userId || student?.profile?.id;
      const name = student?.profile?.name?.fullName;
      const email = student?.profile?.emailAddress;
      const photoUrl = student?.profile?.photoUrl;
      if (googleId) {
        await User.findOneAndUpdate(
          { googleId },
          { $set: { role: "student", name, email, photoUrl } },
          { upsert: true, new: true }
        ).exec();
      }
    }

    let phone = undefined;
    let altEmail = undefined;
    if (mongoUri) {
      const googleId = student?.userId || student?.profile?.id || req.params.studentId;
      if (googleId) {
        const userDoc = await User.findOne({ googleId }).lean();
        phone = userDoc?.phone;
        altEmail = userDoc?.altEmail;
      }
    }

    res.json({ ...student, phone, altEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStudent(req, res) {
  try {
    const { phone, altEmail } = req.body || {};
    const googleId = req.params.studentId;
    if (!googleId) return res.status(400).json({ error: "Missing studentId" });

    const updated = await User.findOneAndUpdate(
      { googleId },
      { $set: { phone, altEmail, role: "student" } },
      { upsert: true, new: true }
    ).lean();

    return res.json({
      ok: true,
      user: { id: updated.googleId, phone: updated.phone, altEmail: updated.altEmail },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
