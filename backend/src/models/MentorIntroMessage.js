import mongoose from "mongoose";

const mentorIntroMessageSchema = new mongoose.Schema(
  {
    teacher_profile_id: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    teacher_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender_role: { type: String, enum: ["student", "teacher"], required: true },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    read_by_teacher: { type: Boolean, default: false, index: true },
    read_by_student: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

mentorIntroMessageSchema.index({ teacher_profile_id: 1, student_id: 1, createdAt: -1 });

export const MentorIntroMessage = mongoose.model("MentorIntroMessage", mentorIntroMessageSchema);
