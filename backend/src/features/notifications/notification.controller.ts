import { Request, Response } from "express";
import Notification from "../../shared/models/Notification";
import User from "../../shared/models/User";
import { sendEmail, sendSms, buildNotificationEmail } from "./notification.service";

// Shared reference to Socket.IO instance — set from index.ts
let ioInstance: any = null;
export function setIO(io: any) {
  ioInstance = io;
}

// ─────────── helpers ───────────

function mapEventTypeToNotificationType(reason: string): "motion" | "boundary" | "unknown" | "sound" | "system" {
  switch (reason) {
    case "ACTIVE":
      return "motion";
    case "BOUNDARY":
      return "boundary";
    case "UNKNOWN":
      return "unknown";
    case "SOUND":
      return "sound";
    default:
      return "system";
  }
}

function buildMessage(type: string, details?: Record<string, unknown>): string {
  switch (type) {
    case "motion":
      return "Sustained motion detected — your baby is moving actively.";
    case "boundary":
      return `Boundary breach detected (${(details?.side as string) || "edge"} side).`;
    case "unknown":
      return "Baby not detected — pose lost or out of frame.";
    case "sound":
      return "Sound detected in the nursery.";
    default:
      return "System event detected.";
  }
}

// ─────────── POST /api/notifications ───────────
// Called by the broadcaster/camera frontend when a monitor event fires.

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason, snapshot, details } = req.body as {
      reason: string;
      snapshot?: string; // base64 JPEG (no data-url prefix)
      details?: Record<string, unknown>;
    };

    if (!reason) {
      res.status(400).json({ error: "reason is required" });
      return;
    }

    // Find user in DB
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const type = mapEventTypeToNotificationType(reason);
    const message = buildMessage(type, details);

    const notification = await Notification.create({
      userId: user._id,
      type,
      message,
      snapshot: snapshot || undefined,
      details,
    });

    // ────── Realtime push via Socket.IO ──────
    if (ioInstance) {
      ioInstance.to(`user:${user.firebaseUid}`).emit("new-notification", {
        id: notification._id,
        type: notification.type,
        message: notification.message,
        snapshot: notification.snapshot,
        time: notification.createdAt,
        read: notification.read,
      });
    }

    // ────── External delivery (fire-and-forget) ──────
    const prefs = user.notificationPreferences || {
      email: true,
      sms: false,
      push: true,
    };
    const timeStr = new Date().toLocaleTimeString();

    if (prefs.email && user.email) {
      sendEmail(user.email, `🍼 Lullalink: ${message}`, buildNotificationEmail(type, message, timeStr, snapshot)).catch(
        (e) => console.error("Email send error:", e),
      );
    }

    if (prefs.sms && user.phone) {
      sendSms(user.phone, `Lullalink: ${message} (${timeStr})`).catch((e) => console.error("SMS send error:", e));
    }

    res.status(201).json({
      id: notification._id,
      type: notification.type,
      message: notification.message,
      snapshot: notification.snapshot ? true : false, // don't echo full base64 back
      time: notification.createdAt,
      read: notification.read,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// ─────────── GET /api/notifications ───────────

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: user._id }),
    ]);

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      read: false,
    });

    res.json({
      notifications: notifications.map((n) => ({
        id: n._id,
        type: n.type,
        message: n.message,
        snapshot: n.snapshot || null,
        time: n.createdAt,
        read: n.read,
        details: n.details,
      })),
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ─────────── PUT /api/notifications/:id/read ───────────

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// ─────────── PUT /api/notifications/read-all ───────────

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await Notification.updateMany({ userId: user._id, read: false }, { read: true });

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking all as read:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

// ─────────── PUT /api/notifications/preferences ───────────

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, sms, push, phone } = req.body;

    const update: Record<string, unknown> = {};
    if (email !== undefined) update["notificationPreferences.email"] = !!email;
    if (sms !== undefined) update["notificationPreferences.sms"] = !!sms;
    if (push !== undefined) update["notificationPreferences.push"] = !!push;
    if (phone !== undefined) update.phone = phone;

    const user = await User.findOneAndUpdate({ firebaseUid: req.user?.uid }, { $set: update }, { new: true });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      notificationPreferences: user.notificationPreferences,
      phone: user.phone,
    });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

// ─────────── GET /api/notifications/preferences ───────────

export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      notificationPreferences: user.notificationPreferences || {
        email: true,
        sms: false,
        push: true,
      },
      phone: user.phone || "",
    });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
};
