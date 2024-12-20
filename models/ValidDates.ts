import mongoose, { Document, Schema } from "mongoose";
import { IValidDates } from "../interfaces";

const ValidDatesSchema: Schema<IValidDates> = new Schema(
    {
        available_dates: { type: [String], required: true },
    },
    { timestamps: true }
);

const ValidDates = mongoose.model<IValidDates>("ValidDates", ValidDatesSchema);

export default ValidDates;