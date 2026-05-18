import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    razorpay_refund_id: { type: String, default: null },
    amount: { type: Number, required: true },
    purpose: { type: String, enum: ["booking", "extension"], default: "booking", index: true },
    extension_minutes: { type: Number, default: 0 },
    refund_amount: { type: Number, default: 0 },
    refund_status: { type: String, default: "none" },
    refund_created_at: { type: Date, default: null },
    refunded_at: { type: Date, default: null },
    status: { type: String, default: "created" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
