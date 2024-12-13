import mongoose, { Document, Schema } from "mongoose";
import { ILog } from "../interfaces";

const logSchema: Schema<ILog> = new Schema({
    userId: { type: String, required: true },
    activity: { type: String, required: true },
    success: { type: Boolean, required: true },
    reason: { type: String }
}, { timestamps: true })

const Log = mongoose.model<ILog>('Log', logSchema);

export default Log;