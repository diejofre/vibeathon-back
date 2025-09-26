import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, index: true },
    role: { type: String, enum: ["student", "teacher", "unknown"], default: "unknown" },
    name: { type: String },
    email: { type: String, index: true },
    altEmail: { type: String },
    photoUrl: { type: String },
    phone: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

