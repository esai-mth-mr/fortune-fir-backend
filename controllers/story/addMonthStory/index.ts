import { Request, Response } from "express";
import Story from "../../../models/Story";
import User from "../../../models/User";
import Asset from "../../../models/Asset";
import { monthStory } from "../../../functions/openai/month_story";
import { AUTH_ERRORS } from "../../../constants";
import { ITransferStoryInput } from "../../../interfaces";
import Joi from "joi";
import { MONTH_LABEL } from "../../../constants";

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
        .length(1)
        .required()
        .messages({
            "array.base": "Assets must be an array of numbers",
            "array.length": "Assets must contain exactly 1 item",
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
    const { error, value } = addMonthStorySchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        // Return validation errors to the client
        return res.status(400).json({
            error: true,
            message: error.details.map((err) => err.message),
        });
    }
    const { point, total_point, asset, month, userId } = value;

    try {
        // Validate user existence
        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        if (!user.accountStatus) {
            return res.status(403).json({
                error: true,
                action: "verify",
                message: AUTH_ERRORS.activateAccountRequired,
            });
        }

        const current_round = user.current_status.current_round;

        const preStory = await Story.findOne({
            round: current_round,
            user_id: userId,
        });

        if (!preStory) {
            if (month !== 1)
                return res
                    .status(400)
                    .json({ error: true, message: "You must try January" });
        } else if (preStory.stories.length !== month - 1)
            return res.status(400).json({
                error: true,
                message: `You must try ${MONTH_LABEL[preStory.stories.length]}`,
            });

        // Fetch required asset in a single query
        const assetDocument = await Asset.findOne({ index: asset });
        if (!assetDocument) {
            return res.status(404).json({ error: true, message: "Asset not found" });
        }

        // Map the fetched assets into the desired format for the story input
        const storyInput: ITransferStoryInput = {
            name: asset.name,
            luck: asset.luck,
            description: asset.description,
        };
        // Construct the user prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;

        const userPrompt = `I am ${age} years old. I am a ${gender} and work as a ${job}.`;

        // Generate the story text using OpenAI
        const result_txt = await monthStory(storyInput, userPrompt);
        if (result_txt.error) {
            return res.status(500).json({ error: true, message: result_txt.message });
        }

        const story_txt = result_txt.message;

        // Find or create the story document for the current round and user
        let story = await Story.findOne({
            round: current_round,
            user_id: userId,
        });

        if (!story) {
            // Create a new story document if it doesn't exist
            story = new Story({
                user_id: userId,
                round: current_round,
                total_point: total_point,
                stories: [
                    {
                        month: month,
                        point: point,
                        story: story_txt,
                        asset: [asset],
                    },
                ],
            });

            // Save the new story document
            await story.save();
        } else {
            // Check if a story for the given month already exists
            const existingMonthStory = story.stories.find((s) => s.month === month);

            if (existingMonthStory) {
                // Update the existing story for the given month
                existingMonthStory.point = point;
                existingMonthStory.story = story_txt;
                existingMonthStory.asset = asset;
            } else {
                // Add a new story section for the month

                story.stories.push({
                    month: month,
                    point: point,
                    story: story_txt,
                    asset: [asset],
                });
            }

            story.total_point = total_point;
            // Save the updated story document
            await story.save();

            res.status(201).json({
                error: false,
                message: "Successfully created or updated month story!",
            });
        }
    } catch (error: any) {
        // Rollback the transaction and handle errors

        console.error("Error in addMonthStory:", error);

        res.status(500).json({
            error: true,
            message: error.message || "Failed to create or update story",
        });
    }
};
