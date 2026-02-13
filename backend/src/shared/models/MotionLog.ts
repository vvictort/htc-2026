import mongoose, { Document, Schema } from "mongoose";

/**
 * Predefined baby motion categories detected by the OpenCV camera monitor.
 */
export const MOTION_CATEGORIES = [
    "still",
    "slight_movement",
    "rolling",
    "crawling",
    "sitting_up",
    "standing",
    "flailing",
    "crying_motion",
    "face_covered",
    "out_of_frame",
    "unknown",
] as const;

export type MotionCategory = (typeof MOTION_CATEGORIES)[number];

export type ThreatLevel = "safe" | "caution" | "danger";

export interface IMotionLog extends Document {
    userId: mongoose.Types.ObjectId;
    category: MotionCategory;
    confidence: number;
    threatLevel: ThreatLevel;
    threatReason: string;
    notified: boolean;
    snapshot?: string;
    metadata?: Record<string, unknown>;
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
