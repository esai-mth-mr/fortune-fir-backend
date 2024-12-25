import { Request, Response } from "express";
import Story from "../../../models/Story";
import User from "../../../models/User";
import Asset from "../../../models/Asset";
import { monthStory } from "../../../functions/openai/month_story";
import { AUTH_ERRORS, PAYMENT_MSGS } from "../../../constants";
import { IAddMonthReq, ITransferStoryInput } from "../../../interfaces";
import Joi from "joi";
import { MONTH_LABEL } from "../../../constants";
import Payment from "../../../models/Payment";


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
            "array.length": "Assets must contain exactly 1 items",
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

export const addMonthStory = async (req: Request<IAddMonthReq>, res: Response) => {
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
    const { point, total_point, assets, month, userId } = value;

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

    const payment = await Payment.findOne({ user_id: userId, round: current_round, action: PAYMENT_MSGS.action.preview });
    if (!payment) {
        return res.status(402).json({ message: PAYMENT_MSGS.notPaid });
    }

    const preStory = await Story.findOne({
        round: current_round,
        user_id: userId,
    });

    if (!preStory) {
        // Ensure the user starts with January (month 1)
        if (month !== 1) {
            return res.status(400).json({
                error: true,
                message: "You must try January",
            });
        }
    } else {
        // Validate if the user's story progression matches the current month
        const expectedMonth = preStory.stories.length + 1;
        if (month !== expectedMonth) {
            if (!(month === 12 && expectedMonth === 13)) {
                return res.status(400).json({
                    error: true,
                    message: `You must try ${MONTH_LABEL[expectedMonth - 1]}`,
                });
            }
        }
    }

    try {
        // Fetch all required assets in a single query
        const assetDocuments = await Asset.find({ index: { $in: assets } });

        // Check if all assets were found
        if (assetDocuments.length !== assets.length) {
            throw new Error("Not all assets were found");
        }

        // Map the fetched assets into the desired format for the story input
        const storyInput: ITransferStoryInput = {
            name: assetDocuments[0].name,
            luck: assetDocuments[0].luck,
            description: assetDocuments[0].description,
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
                        asset: assets,
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

            // Save the updated story document
            await story.save();

        }

        // Commit the transaction
        res.status(201).json({
            error: false,
            message: story_txt
        });
    } catch (error: any) {
        // Rollback the transaction and handle errors

        console.error("Error in addMonthStory:", error);

        res.status(500).json({
            error: true,
            message: error.message || "Failed to create or update story",
        });
    }
};
