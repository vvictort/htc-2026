import mongoose, { Document, Schema } from "mongoose";

export interface IAudioLog extends Document {
  userId: mongoose.Types.ObjectId;
  babyDeviceId: string;
  text: string;
  voiceId: string;
  duration?: number;
  characterCount: number;
  status: "success" | "failed";
  createdAt: Date;
}

const AudioLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    babyDeviceId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    voiceId: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    characterCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IAudioLog>("AudioLog", AudioLogSchema);
