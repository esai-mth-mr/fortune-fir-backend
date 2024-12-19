import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import Log from "../../../models/Log";
import { AUTH_ERRORS } from "../../../constants";
import mongoose from "mongoose";
import { ISection } from "../../../interfaces";
import { yearStory } from "../../../functions/openai/year_story";
import Joi from "joi";

interface DataType {
    month: number;
    story: string;
}

interface IReq {
    userId: string, total_point: number
}

//Define a Joi Schema for input validation
const addYearStorySchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "any.required": "User ID is required",
    }),
    total_point: Joi.number().required().messages({
        "number.base": "Total point must be a number",
        "any.required": "Total point is required",
    })
})

export const addYearStory = async (req: Request<IReq>, res: Response) => {
    const { error, value } = addYearStorySchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: true, message: error.details.map(err => err.message) });
    }
    // Extract userId and total_point from the request body
    const { userId, total_point } = value;

    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }


    if (!user.accountStatus) {
        return res.status(403).json({ error: true, message: AUTH_ERRORS.activateAccountRequired });
    }


    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Set user's current status to "complete"
        if (user.current_status.round_status !== "complete") {
            // Update round status and save the user in a single step
            await Promise.all([
                User.updateOne(
                    { _id: user._id },
                    { $set: { "current_status.round_status": "complete" } }
                ).session(session),
                // Log the status update
                new Log({
                    userId: user._id,
                    activity: "story_Status",
                    success: true,
                    reason: "complete",
                }).save({ session }),
            ]);
        }

        // Get the current round
        const current_round = user.current_status.current_round;

        // Fetch stories for the user and current round
        const storyData = await Story.findOne({ round: current_round, user_id: user._id }).session(session);
        if (!storyData) {
            return res.status(404).json({ error: true, message: "Stories not found" });
        }

        // Prepare input for yearStory
        const input: DataType[] = storyData.stories.map((section: ISection) => ({
            month: section.month,
            story: section.story,
        }));

        // Construct user prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;
        const userPrompt = `I am ${age} years old. I am a ${gender} and work as a ${job}.`;

        // Generate the year story using OpenAI
        const result_txt = await yearStory(input, userPrompt);

        if (result_txt.error) {
            await session.abortTransaction();
            return res.status(500).json({ error: true, message: result_txt.message });
        }

        const story_txt = result_txt.message;

        // Update the story data
        storyData.total_story = story_txt;
        storyData.total_point = total_point;
        await storyData.save({ session });

        const log = new Log({
            userId: user._id,
            activity: "addTotalStory",
            success: true,
        });
        await log.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        res.status(200).json({ error: false, message: "Successfully generated total story" });
    } catch (error: any) {
        // Rollback the transaction and handle errors
        await session.abortTransaction();
        console.error("Error in addYearStory:", error);
        res.status(500).json({ error: true, message: error.message || "An unknown error occurred" });
    } finally {
        session.endSession();
    }
};