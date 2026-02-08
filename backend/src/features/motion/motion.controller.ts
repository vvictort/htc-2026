import { Request, Response } from "express";
import MotionLog, { MOTION_CATEGORIES, MotionCategory } from "../../shared/models/MotionLog";
import Notification from "../../shared/models/Notification";
import User from "../../shared/models/User";
import { classifyMotion } from "./gemini.service";
import {
  sendEmail,
  sendSms,
  buildNotificationEmail,
  createSnapshotAttachment,
} from "../notifications/notification.service";

// Socket.IO instance (shared from index.ts via notification controller)
let ioInstance: any = null;
export function setMotionIO(io: any) {
  ioInstance = io;
}

// ── Per-user rate limiting ──
// Prevents amassing requests from the continuously-running OpenCV detector
const RATE_WINDOW_MS = 60_000; // 1-minute window
const MAX_EVENTS_PER_WINDOW = 5; // max 5 events / user / minute (very conservative for free tier)
const SAME_CATEGORY_COOLDOWN_MS = 10_000; // same category within 10s → skip (prevent spamming same event)

interface UserRateBucket {
  count: number;
  windowStart: number;
  lastCategory: string;
  lastCategoryAt: number;
}

const userRateBuckets = new Map<string, UserRateBucket>();

// Cleanup stale buckets every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [uid, bucket] of userRateBuckets) {
    if (now - bucket.windowStart > RATE_WINDOW_MS * 2) {
      userRateBuckets.delete(uid);
    }
  }
}, 5 * 60_000);

function checkRateLimit(uid: string, category: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let bucket = userRateBuckets.get(uid);

  if (!bucket) {
    bucket = { count: 0, windowStart: now, lastCategory: "", lastCategoryAt: 0 };
    userRateBuckets.set(uid, bucket);
  }

  // Reset window if expired
  if (now - bucket.windowStart > RATE_WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  // Same category cooldown
  if (category === bucket.lastCategory && now - bucket.lastCategoryAt < SAME_CATEGORY_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: `Duplicate category '${category}' within cooldown (${SAME_CATEGORY_COOLDOWN_MS / 1000}s)`,
    };
  }

  // Per-window cap
  if (bucket.count >= MAX_EVENTS_PER_WINDOW) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (${MAX_EVENTS_PER_WINDOW} events / ${RATE_WINDOW_MS / 1000}s)`,
    };
  }

  // Allow
  bucket.count++;
  bucket.lastCategory = category;
  bucket.lastCategoryAt = now;
  return { allowed: true };
}

// ─────────── POST /api/motion ───────────
/**
 * Receives a motion event from the OpenCV camera monitor.
 * 1. Rate-limits per user (max 10/min, same-category cooldown 30 s)
 * 2. Validates the category
 * 3. Calls Gemini to classify threat level
 * 4. Logs to MotionLog collection
 * 5. If caution/danger → creates a Notification + sends email/SMS
 */
export const logMotionEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, confidence, snapshot, metadata } = req.body as {
      category: string;
      confidence: number;
      snapshot?: string;
      metadata?: Record<string, unknown>;
    };

    // Validate category
    if (!category || !MOTION_CATEGORIES.includes(category as MotionCategory)) {
      res.status(400).json({
        error: "Invalid or missing 'category'",
        validCategories: MOTION_CATEGORIES,
      });
      return;
    }

    // ── Rate limit check (before any DB / Gemini calls) ──
    const uid = req.user?.uid || "anon";
    const rl = checkRateLimit(uid, category);
    if (!rl.allowed) {
      res.status(429).json({ error: "Rate limited", reason: rl.reason });
      return;
    }

    // Validate confidence
    const conf = typeof confidence === "number" ? confidence : 0.5;
    if (conf < 0 || conf > 1) {
      res.status(400).json({ error: "'confidence' must be between 0 and 1" });
      return;
    }

    // Find user
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // ── Gemini classification ──
    console.log(`[motion] 📥 Received: category="${category}", confidence=${conf}`);
    const classification = await classifyMotion(category as MotionCategory, conf, metadata);
    console.log(`[motion] 🤖 Gemini result: ${classification.threatLevel} — "${classification.reason}"`);

    const shouldNotify = classification.threatLevel === "caution" || classification.threatLevel === "danger";

    // ── Save motion log ──
    const motionLog = await MotionLog.create({
      userId: user._id,
      category,
      confidence: conf,
      threatLevel: classification.threatLevel,
      threatReason: classification.reason,
      notified: shouldNotify,
      snapshot: snapshot || undefined,
      metadata,
    });
    console.log(`[motion] 💾 Saved MotionLog ${motionLog._id} | notify=${shouldNotify}`);

    // ── If threat → create notification + deliver alerts ──
    if (shouldNotify) {
      const emoji = classification.threatLevel === "danger" ? "🚨" : "⚠️";
      const message = `${emoji} ${classification.reason}`;

      // Save to Notifications collection
      const notification = await Notification.create({
        userId: user._id,
        type: classification.threatLevel === "danger" ? "boundary" : "motion",
        message,
        snapshot: snapshot || undefined,
        details: {
          motionCategory: category,
          confidence: conf,
          threatLevel: classification.threatLevel,
          motionLogId: motionLog._id,
        },
      });

      // ── External delivery (fire-and-forget) ──
      const prefs = user.notificationPreferences || {
        email: true,
        sms: false,
        push: true,
      };

      // ── Realtime push via Socket.IO ──
      if (ioInstance && prefs.push) {
        ioInstance.to(`user:${user.firebaseUid}`).emit("new-notification", {
          id: notification._id,
          type: notification.type,
          message: notification.message,
          snapshot: notification.snapshot ? true : false,
          time: notification.createdAt,
          read: notification.read,
        });
      }
      const timeStr = new Date().toLocaleTimeString();

      if (prefs.email && user.email) {
        const attachments = snapshot ? [createSnapshotAttachment(snapshot)] : undefined;
        sendEmail(
          user.email,
          `🍼 Lullalink: ${classification.reason}`,
          buildNotificationEmail(classification.threatLevel, message, timeStr, !!snapshot),
          attachments,
        ).catch((e) => console.error("Email send error:", e));
      }

      if (prefs.sms && user.phone) {
        console.log(`📱 Sending SMS to ${user.phone}...`);
        sendSms(user.phone, `Lullalink ${emoji}: ${classification.reason} (${timeStr})`).catch((e) =>
          console.error("SMS send error:", e),
        );
      } else if (prefs.sms && !user.phone) {
        console.warn("⚠️ SMS preference enabled but no phone number on user profile");
      }
    }

    res.status(201).json({
      id: motionLog._id,
      category: motionLog.category,
      confidence: motionLog.confidence,
      threatLevel: motionLog.threatLevel,
      threatReason: motionLog.threatReason,
      notified: motionLog.notified,
      time: motionLog.createdAt,
    });
  } catch (err) {
    console.error("Error logging motion event:", err);
    res.status(500).json({ error: "Failed to log motion event" });
  }
};

// ─────────── GET /api/motion ───────────
/**
 * List motion logs for the authenticated user (paginated).
 */
export const getMotionLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Optional filters
    const filter: Record<string, unknown> = { userId: user._id };
    if (req.query.threatLevel) {
      filter.threatLevel = req.query.threatLevel;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [logs, total] = await Promise.all([
      MotionLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MotionLog.countDocuments(filter),
    ]);

    const dangerCount = await MotionLog.countDocuments({
      userId: user._id,
      threatLevel: "danger",
    });

    const cautionCount = await MotionLog.countDocuments({
      userId: user._id,
      threatLevel: "caution",
    });

    res.json({
      logs: logs.map((l) => ({
        id: l._id,
        category: l.category,
        confidence: l.confidence,
        threatLevel: l.threatLevel,
        threatReason: l.threatReason,
        notified: l.notified,
        time: l.createdAt,
        metadata: l.metadata,
      })),
      total,
      dangerCount,
      cautionCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching motion logs:", err);
    res.status(500).json({ error: "Failed to fetch motion logs" });
  }
};

// ─────────── GET /api/motion/categories ───────────
/**
 * Return the list of valid motion categories (handy reference for the OpenCV client).
 */
export const getCategories = (_req: Request, res: Response): void => {
  res.json({ categories: MOTION_CATEGORIES });
};
