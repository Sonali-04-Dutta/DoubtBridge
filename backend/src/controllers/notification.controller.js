import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";

const toPayload = (item) => ({
  id: item._id.toString(),
  title: item.title,
  message: item.message,
  type: item.type,
  isRead: item.isRead,
  actionUrl: item.actionUrl || "",
  createdAt: item.createdAt
});

export const listMyNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 120);
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      notifications: notifications.map(toPayload)
    });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });

    return res.json({ success: true, unreadCount });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(404, "Notification not found");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return res.json({ success: true, notification: toPayload(notification) });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
