import mongoose, { Document, Schema } from "mongoose";
import { IStory, ISection } from "../interfaces";


const storeSchema: Schema<ISection> = new Schema({
    month: { type: Number, required: true },
    story: { type: Text, required: true },
    point: { type: Number, required: true },
    asset: { type: [Number], required: true },
    tip: { type: Text }
});

const storySchema: Schema<IStory> = new Schema({
    round: { type: Number, default: 1, required: true },
    user_id: { type: String, required: true },
    stories: [storeSchema],
    total_story: { type: Text, required: true },
    total_point: { type: Number, required: true },

}, { timestamps: true });

const Story = mongoose.model<IStory>("Story", storySchema);
export default Story;