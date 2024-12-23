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
    userId: string;
    total_point: number;
}

// Define a Joi schema for input validation
const addYearStorySchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "any.required": "User ID is required",
    }),
    total_point: Joi.number().required().messages({
        "number.base": "Total point must be a number",
        "any.required": "Total point is required",
    }),
});

export const addYearStory = async (req: Request<IReq>, res: Response) => {
    const { error, value } = addYearStorySchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            error: true,
            message: error.details.map((err) => err.message),
        });
    }

    const { userId, total_point } = value;

    try {
        // Fetch user and their story data in parallel
        const [user, storyData] = await Promise.all([
            User.findById(userId)
                .select("accountStatus current_status.dob current_status.current_round current_status.round_status gender job")
                .lean(),
            Story.findOne({ user_id: userId }).select("stories total_story total_point round").lean(),
        ]);

        // Validate user existence
        if (!user) {
            return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        // Validate user account status
        if (!user.accountStatus) {
            return res.status(403).json({
                error: true,
                action: "verify",
                message: AUTH_ERRORS.activateAccountRequired,
            });
        }

        // Check if the story data exists
        if (!storyData) {
            return res.status(404).json({ error: true, message: "Stories not found" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update the user's round status if not already "complete"
            if (user.current_status.round_status !== "complete") {
                await Promise.all([
                    User.updateOne(
                        { _id: userId },
                        { $set: { "current_status.round_status": "complete" } }
                    ).session(session),
                    new Log({
                        userId: userId,
                        activity: "story_Status",
                        success: true,
                        reason: "complete",
                    }).save({ session }),
                ]);
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
            await Promise.all([
                Story.updateOne(
                    { _id: storyData._id },
                    { $set: { total_story: story_txt, total_point: total_point } }
                ).session(session),
                new Log({
                    userId: userId,
                    activity: "addTotalStory",
                    success: true,
                }).save({ session }),
            ]);

            // Commit the transaction
            await session.commitTransaction();
            res.status(200).json({ error: false, message: "Successfully generated total story" });
        } catch (err) {
            // Rollback the transaction on error
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (err: any) {
        console.error("Error in addYearStory:", err);
        res.status(500).json({ error: true, message: err.message || "An unknown error occurred" });
    }
};