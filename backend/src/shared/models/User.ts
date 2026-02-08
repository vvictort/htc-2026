import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName?: string;
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
    },
    {
        timestamps: true,
    }
);
const User = mongoose.model<IUser>('User', userSchema);

export default User;