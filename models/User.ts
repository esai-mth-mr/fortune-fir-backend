import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "../interfaces";

const userSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    pass: { type: String, required: true },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male',
        required: true
    },
    dob: { type: Date, required: true },
    current_status: {
        current_round: {
            type: Number,
            default: 1,
            required: true,
        },
        round_status: {
            type: String,
            enum: ['progress', 'complete'],
            default: 'progress',
            required: true,
        }
    },
    job: {
        type: String,
        required: true,
    },

    accountStatus: {
        type: Boolean,
        default: false,
        required: true,
    }
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);

export default User;