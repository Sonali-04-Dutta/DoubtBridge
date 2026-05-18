import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student", index: true },
    avatar_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false, index: true },
    isVerifiedTeacher: { type: Boolean, default: false },
    adminApprovedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
