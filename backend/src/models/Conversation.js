import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isPaid: { type: Boolean, default: false, index: true },
    studentFreeMessageCount: { type: Number, default: 0, min: 0 },
    studentFreeMessageWindowStartedAt: { type: Date, default: null },
    activeBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, index: true }
  },
  { timestamps: true }
);

conversationSchema.index({ studentId: 1, teacherId: 1 }, { unique: true });

export const Conversation = mongoose.model("Conversation", conversationSchema);
