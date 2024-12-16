import mongoose, { Document, Schema } from "mongoose";
import { IAsset } from "../interfaces";

const assetSchema: Schema<IAsset> = new Schema(
    {
        index: { type: Number, required: true },
        url: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        luck: {
            type: String,
            enum: [
                "extremely good",
                "very good",
                "good",
                "bad",
                "very bad",
                "extremely bad",
            ],
            default: "good",
            required: true,
        },
    },
    { timestamps: true }
);

const Asset = mongoose.model<IAsset>("Asset", assetSchema);
export default Asset;
