import { Request, Response } from "express";
import Story from "../../../models/Story";
import Log from "../../../models/Log";
import User from "../../../models/User";
import Asset from "../../../models/Asset";
import { monthStory } from "../../../functions/openai/month_story";
import mongoose from "mongoose";
import { AUTH_ERRORS } from "../../../constants";
import { ITransferStoryInput } from "../../../interfaces";
import Joi from "joi";

interface IReq {
    point: number;
    total_point: number;
    assets: number[];
    month: number;
    userId: string;
}

// Define a Joi schema for input validation
const addMonthStorySchema = Joi.object({
    point: Joi.number().required().messages({
        "number.base": "Point must be a number",
        "any.required": "Point is required",
    }),
    total_point: Joi.number().required().messages({
        "number.base": "Total point must be a number",
        "any.required": "Total point is required",
    }),
    assets: Joi.array()
        .items(Joi.number().min(0).max(200))
        .length(7)
        .required()
        .messages({
            "array.base": "Assets must be an array of numbers",
            "array.length": "Assets must contain exactly 7 items",
            "array.includes": "Each asset must be a number between 0 and 200",
            "any.required": "Assets are required",
        }),
    month: Joi.number().integer().min(1).max(12).required().messages({
        "number.base": "Month must be a number",
        "number.min": "Month must be between 1 and 12",
        "number.max": "Month must be between 1 and 12",
        "any.required": "Month is required",
    }),
    userId: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "any.required": "User ID is required",
    }),
});

export const addMonthStory = async (req: Request<IReq>, res: Response) => {
    const { error, value } = addMonthStorySchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            error: true,
            message: error.details.map((err) => err.message),
        });
    }

    const { point, total_point, assets, month, userId } = value;

    try {
        // Fetch user and story data in parallel
        const [user, preStory] = await Promise.all([
            User.findById(userId).select("accountStatus current_status.dob current_status.current_round gender job").lean(),
            Story.findOne({ user_id: userId }).select("stories round").lean(),
        ]);

        if (!user) {
            return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        if (!user.accountStatus) {
            return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
        }

        const current_round = user.current_status.current_round;
        const month_label = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ];

        // Validate story progression
        if (!preStory) {
            if (month !== 1) {
                return res.status(400).json({ error: true, message: "You must try January" });
            }
        } else if (preStory.stories.length !== month - 1) {
            return res.status(400).json({
                error: true,
                message: `You must try ${month_label[preStory.stories.length]}`,
            });
        }

        // Fetch assets in a single query
        const assetDocuments = await Asset.find({ index: { $in: assets } }).select("name luck description").lean();

        if (assetDocuments.length !== assets.length) {
            return res.status(400).json({ error: true, message: "Some assets were not found" });
        }

        // Prepare story input
        const storyInput: ITransferStoryInput[] = assetDocuments.map((asset) => ({
            name: asset.name,
            luck: asset.luck,
            description: asset.description,
        }));

        // Construct user prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;
        const userPrompt = `I am ${age} years old. I am a ${gender} and work as a ${job}.`;

        // Generate story using OpenAI
        const result_txt = await monthStory(storyInput, userPrompt);
        if (result_txt.error) {
            return res.status(500).json({ error: true, message: result_txt.message });
        }

        const story_txt = result_txt.message;

        // Start a transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find or create the story document
            let story = await Story.findOne({ round: current_round, user_id: userId }).session(session);

            if (!story) {
                story = new Story({
                    user_id: userId,
                    round: current_round,
                    total_point: total_point,
                    stories: [
                        {
                            month: month,
                            point: point,
                            story: story_txt,
                            asset: assets,
                        },
                    ],
                });
            } else {
                // Check if a story for the given month already exists
                const existingMonthStory = story.stories.find((s) => s.month === month);
                if (existingMonthStory) {
                    // Update the existing story
                    existingMonthStory.point = point;
                    existingMonthStory.story = story_txt;
                    existingMonthStory.asset = assets;
                } else {
                    // Add a new story section for the month
                    story.stories.push({
                        month: month,
                        point: point,
                        story: story_txt,
                        asset: assets,
                    });
                }
                story.total_point = total_point;
            }

            // Save the story document
            await story.save({ session });

            // Log the activity
            await new Log({
                userId: userId,
                activity: story.isNew ? "addNewStory" : "updateMonthStory",
                success: true,
                reason: story.isNew ? "Story created successfully" : "Month Story updated successfully",
            }).save({ session });

            // Commit the transaction
            await session.commitTransaction();
            res.status(201).json({ error: false, message: "Successfully created or updated month story!" });
        } catch (err) {
            // Rollback the transaction on error
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (err: any) {
        console.error("Error in addMonthStory:", err);
        res.status(500).json({ error: true, message: err.message || "Failed to create or update story" });
    }
};