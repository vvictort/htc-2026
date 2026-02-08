import mongoose, { Document, Schema } from "mongoose";

/**
 * Predefined baby motion categories detected by the OpenCV camera monitor.
 */
export const MOTION_CATEGORIES = [
    "still",            // Baby lying still / sleeping
    "slight_movement",  // Minor twitching, subtle shifts
    "rolling",          // Rolling over
    "crawling",         // Crawling movement
    "sitting_up",       // Sitting up from lying position
    "standing",         // Pulling to stand / standing
    "flailing",         // Erratic arm/leg flailing
    "crying_motion",    // Body shaking associated with crying
    "face_covered",     // Face covered by blanket/object
    "out_of_frame",     // Baby moved out of camera frame
    "unknown",          // Unclassifiable motion
] as const;

export type MotionCategory = (typeof MOTION_CATEGORIES)[number];

export type ThreatLevel = "safe" | "caution" | "danger";

export interface IMotionLog extends Document {
    userId: mongoose.Types.ObjectId;
    category: MotionCategory;
    confidence: number;            // 0–1 confidence from OpenCV detector
    threatLevel: ThreatLevel;      // Gemini classification result
    threatReason: string;          // Gemini's explanation
    notified: boolean;             // Whether an alert was sent
    snapshot?: string;             // Base64 JPEG thumbnail
    metadata?: Record<string, unknown>; // Extra OpenCV data (e.g. bounding boxes)
    createdAt: Date;
    updatedAt: Date;
}

const motionLogSchema = new Schema<IMotionLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: MOTION_CATEGORIES,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        threatLevel: {
            type: String,
            enum: ["safe", "caution", "danger"],
            required: true,
        },
        threatReason: {
            type: String,
            required: true,
        },
        notified: {
            type: Boolean,
            default: false,
        },
        snapshot: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

motionLogSchema.index({ userId: 1, createdAt: -1 });
motionLogSchema.index({ userId: 1, threatLevel: 1 });

export default mongoose.model<IMotionLog>("MotionLog", motionLogSchema);
