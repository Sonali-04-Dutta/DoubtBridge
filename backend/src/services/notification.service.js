import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { emitToUser } from "../socket/realtime.js";

const toPayload = (item) => ({
  id: item._id.toString(),
  title: item.title,
  message: item.message,
  type: item.type,
  isRead: item.isRead,
  actionUrl: item.actionUrl || "",
  createdAt: item.createdAt
});

export const createNotification = async ({ userId, title, message, type = "system", actionUrl = "" }) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  try {
    const notification = await Notification.create({
      userId,
      title: String(title || "").trim(),
      message: String(message || "").trim(),
      type,
      actionUrl: String(actionUrl || "").trim()
    });
    emitToUser(userId, "notification:new", toPayload(notification));
    return notification;
  } catch (_error) {
    return null;
  }
};
