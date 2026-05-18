import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 400 },
    type: {
      type: String,
      enum: ["message", "booking", "payment", "session", "reminder", "system"],
      default: "system",
      index: true
    },
    isRead: { type: Boolean, default: false, index: true },
    actionUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
