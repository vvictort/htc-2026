import mongoose, { Document, Schema } from "mongoose";

export interface INotificationPreferences {
  email: boolean;
  push: boolean;
}

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName?: string;
  customVoiceId?: string;
  enableCustomVoice?: boolean;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },

    customVoiceId: {
      type: String,
      trim: true,
    },
    enableCustomVoice: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);
const User = mongoose.model<IUser>("User", userSchema);

export default User;
