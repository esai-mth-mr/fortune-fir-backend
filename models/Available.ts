import mongoose, { Document, Schema } from "mongoose";
import { IAvailable } from "../interfaces";

const availableSchema: Schema<IAvailable> = new Schema(
    {
        available_dates: { type: [Date], required: true },
    },
    { timestamps: true }
);

const Available = mongoose.model<IAvailable>("Available", availableSchema);

export default Available;