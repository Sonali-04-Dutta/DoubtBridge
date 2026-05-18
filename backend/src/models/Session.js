import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true, index: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "expired", "completed", "cancelled", "refunded"],
      default: "scheduled",
      index: true
    },
    room: { type: String, default: "" },
    duration: { type: Number, required: true },
    join_deadline_at: { type: Date, default: null, index: true },
    student_joined_at: { type: Date, default: null },
    teacher_joined_at: { type: Date, default: null },
    started_at: { type: Date, default: null },
    expires_at: { type: Date, default: null, index: true },
    ended_at: { type: Date, default: null },
    extended_minutes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
