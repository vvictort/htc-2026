import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: "motion" | "sound" | "boundary" | "unknown" | "system";
    message: string;
    snapshot?: string;
    read: boolean;
    details?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["motion", "sound", "boundary", "unknown", "system"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        snapshot: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
        details: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
