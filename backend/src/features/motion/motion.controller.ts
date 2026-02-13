import { Request, Response } from "express";
import MotionLog, { MOTION_CATEGORIES, MotionCategory } from "../../shared/models/MotionLog";
import Notification from "../../shared/models/Notification";
import User from "../../shared/models/User";
import { classifyMotion } from "./gemini.service";
import { sendEmail, buildNotificationEmail, createSnapshotAttachment } from "../notifications/notification.service";

let ioInstance: any = null;
export function setMotionIO(io: any) {
  ioInstance = io;
}

const RATE_WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 5;
const SAME_CATEGORY_COOLDOWN_MS = 10_000;

interface UserRateBucket {
  count: number;
  windowStart: number;
  lastCategory: string;
  lastCategoryAt: number;
}

const userRateBuckets = new Map<string, UserRateBucket>();

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

  if (now - bucket.windowStart > RATE_WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  if (category === bucket.lastCategory && now - bucket.lastCategoryAt < SAME_CATEGORY_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: `Duplicate category '${category}' within cooldown (${SAME_CATEGORY_COOLDOWN_MS / 1000}s)`,
    };
  }

  if (bucket.count >= MAX_EVENTS_PER_WINDOW) {
    return {
      allowed: false,
      reason: `Rate limit exceeded (${MAX_EVENTS_PER_WINDOW} events / ${RATE_WINDOW_MS / 1000}s)`,
    };
  }

  bucket.count++;
  bucket.lastCategory = category;
  bucket.lastCategoryAt = now;
  return { allowed: true };
}

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

    if (!category || !MOTION_CATEGORIES.includes(category as MotionCategory)) {
      res.status(400).json({
        error: "Invalid or missing 'category'",
        validCategories: MOTION_CATEGORIES,
      });
      return;
    }

    const uid = req.user?.uid || "anon";
    const rl = checkRateLimit(uid, category);

    let useGemini = rl.allowed;

    if (!rl.allowed) {
      if (rl.reason?.includes("Duplicate")) {
        res.status(429).json({ error: "Rate limited", reason: rl.reason });
        return;
      }

      if (rl.reason?.includes("Rate limit exceeded")) {
        console.warn(`[rate-limit] User ${uid} exceeded Gemini quota. Falling back to rules for ${category}.`);
        useGemini = false;
      } else {
        res.status(429).json({ error: "Rate limited", reason: rl.reason });
        return;
      }
    }

    const conf = typeof confidence === "number" ? confidence : 0.5;
    if (conf < 0 || conf > 1) {
      res.status(400).json({ error: "'confidence' must be between 0 and 1" });
      return;
    }

    const user = await User.findOne({ firebaseUid: req.user?.uid });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log(`[motion] 📥 Received: category="${category}", confidence=${conf} | useGemini=${useGemini}`);
    const classification = await classifyMotion(category as MotionCategory, conf, metadata, !useGemini);
    console.log(`[motion] 🤖 Gemini result: ${classification.threatLevel} — "${classification.reason}"`);

    const shouldNotify = classification.threatLevel === "caution" || classification.threatLevel === "danger";

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

    if (shouldNotify) {
      const emoji = classification.threatLevel === "danger" ? "🚨" : "⚠️";
      const message = `${emoji} ${classification.reason}`;

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

      const prefs = user.notificationPreferences || {
        email: true,
        push: true,
      };

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

/**
 * Return the list of valid motion categories (handy reference for the OpenCV client).
 */
export const getCategories = (_req: Request, res: Response): void => {
  res.json({ categories: MOTION_CATEGORIES });
};
