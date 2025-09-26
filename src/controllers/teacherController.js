import User from "../models/User.js";
import { getTeacher } from "../services/googleClassroomService.js";

const mongoUri = process.env.MONGODB_URI;

export async function getTeacherById(req, res) {
  try {
    const teacher = await getTeacher(
      req.params.courseId,
      req.params.teacherId,
      req.user.accessToken
    );

    if (mongoUri && teacher) {
      const googleId = teacher?.userId || teacher?.profile?.id;
      const name = teacher?.profile?.name?.fullName;
      const email = teacher?.profile?.emailAddress;
      const photoUrl = teacher?.profile?.photoUrl;
      if (googleId) {
        await User.findOneAndUpdate(
          { googleId },
          { $set: { role: "teacher", name, email, photoUrl } },
          { upsert: true, new: true }
        ).exec();
      }
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
