import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    duration: { type: Number, required: true },
    amount: { type: Number, required: true },
    extended_minutes: { type: Number, default: 0 },
    extension_amount: { type: Number, default: 0 },
    payment_status: { type: String, enum: ["unpaid", "created", "paid", "failed", "refunded"], default: "unpaid", index: true },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_refund_id: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "paid", "completed", "cancelled", "refunded"],
      default: "pending"
    },
    is_paid: { type: Boolean, default: false, index: true },
    session_status: {
      type: String,
      enum: ["pending", "scheduled", "live", "expired", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true
    },
    expires_at: { type: Date, default: null, index: true },
    join_deadline_at: { type: Date, default: null, index: true },
    student_joined_at: { type: Date, default: null },
    teacher_joined_at: { type: Date, default: null },
    student_left_at: { type: Date, default: null },
    actual_started_at: { type: Date, default: null },
    refund_status: { type: String, enum: ["none", "pending", "refunded", "failed"], default: "none", index: true },
    refund_amount: { type: Number, default: 0 },
    refunded_at: { type: Date, default: null },
    session_room: { type: String, default: "" },
    scheduled_at: { type: Date, default: Date.now },
    sessionStartedAt: { type: Date, default: null },
    sessionEndedAt: { type: Date, default: null },
    refundId: { type: String, default: null },
    refundStatus: { type: String, enum: ["none", "pending", "refunded", "failed"], default: "none", index: true },
    paymentId: { type: String, default: null },
    liveRoomId: { type: String, default: "" },
    sessionDuration: { type: Number, default: null },
    teacherJoinedAt: { type: Date, default: null },
    studentJoinedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
