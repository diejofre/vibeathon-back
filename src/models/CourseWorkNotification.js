import mongoose from "mongoose";

const CourseWorkNotificationSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, index: true },
    courseWorkId: { type: String, required: true },
    notifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CourseWorkNotificationSchema.index({ courseId: 1, courseWorkId: 1 }, { unique: true });

const CourseWorkNotification = mongoose.model(
  "CourseWorkNotification",
  CourseWorkNotificationSchema
);

export default CourseWorkNotification;
