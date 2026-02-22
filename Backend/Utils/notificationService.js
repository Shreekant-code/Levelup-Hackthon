import mongoose from "mongoose";
import { sendProductivityEmail } from "./emailService.js";

const getNotificationCollection = () => {
  if (!mongoose.connection?.db) return null;
  return mongoose.connection.collection("notifications");
};

export const createInAppNotification = async ({
  userId,
  type,
  message,
  metadata = {},
}) => {
  try {
    const collection = getNotificationCollection();
    if (!collection || !userId || !type || !message) {
      return { created: false, reason: "notification_unavailable_or_invalid" };
    }

    await collection.insertOne({
      userId,
      type,
      message,
      read: false,
      createdAt: new Date(),
      ...metadata,
    });

    return { created: true };
  } catch (error) {
    console.error("In-app notification create failed:", error?.message || error);
    return { created: false, reason: "notification_insert_failed" };
  }
};

export const getUserNotificationSummary = async (userId, limit = 5) => {
  try {
    const collection = getNotificationCollection();
    if (!collection || !userId) {
      return { unreadCount: 0, recent: [] };
    }

    const [unreadCount, recent] = await Promise.all([
      collection.countDocuments({ userId, read: false }),
      collection.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray(),
    ]);

    return { unreadCount, recent };
  } catch {
    return { unreadCount: 0, recent: [] };
  }
};

export const notifyUserEvent = async ({
  userId,
  email,
  username,
  type,
  message,
  sendEmail = true,
  customMessage,
  additionalData = {},
}) => {
  const inAppResult = await createInAppNotification({
    userId,
    type,
    message,
    metadata: {
      notificationCategory:
        type === "penalty_warning" || type === "streak_broken" ? "critical" :
        type === "streak_warning" ? "warning" :
        type === "task_complete" || type === "level_up" ? "success" :
        "info",
    },
  });

  if (!sendEmail) {
    return { inApp: inAppResult, email: { sent: false, reason: "email_disabled_for_event" } };
  }

  const emailResult = await sendProductivityEmail({
    to: email,
    username,
    type,
    customMessage: customMessage || message,
    additionalData,
  });

  return { inApp: inAppResult, email: emailResult };
};

