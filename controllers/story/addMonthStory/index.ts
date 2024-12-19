import { Request, Response } from 'express';
import Story from "../../../models/Story";
import Log from '../../../models/Log';
import User from '../../../models/User';
import Asset from '../../../models/Asset';
import { monthStory } from '../../../functions/openai/month_story';
import mongoose from 'mongoose';
import { AUTH_ERRORS } from '../../../constants';
import { ITransferStoryInput } from '../../../interfaces';

export const addMonthStory = async (req: Request, res: Response) => {
    const { point, total_point, assets, month, userId } = req.body;

    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    // Validate assets length
    if (!assets || assets.length !== 7) {
        return res.status(400).json({ message: "Assets must be exactly 7" });
    }

    const current_round = user.current_status.current_round;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Fetch all required assets in a single query
        const assetDocuments = await Asset.find({ index: { $in: assets } }).session(session);

        // Check if all assets were found
        if (assetDocuments.length !== assets.length) {
            throw new Error("Not all assets were found");
        }

        // Map the fetched assets into the desired format for the story input
        const storyInput: ITransferStoryInput[] = assetDocuments.map(asset => ({
            name: asset.name,
            luck: asset.luck,
            description: asset.description,
        }));

        // Construct the user prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;
        const userPrompt = `I am ${age} years old. I am a ${gender} and work as a ${job}.`;

        // Generate the story text using OpenAI
        const result_txt = await monthStory(storyInput, userPrompt);
        if (result_txt.error) {
            await session.abortTransaction();
            return res.status(500).json({ message: result_txt.message });
        }
        const story_txt = result_txt.message;

        // Find or create the story document for the current round and user
        let story = await Story.findOne({ round: current_round, user_id: userId }).session(session);

        if (!story) {
            // Create a new story document if it doesn't exist
            story = new Story({
                user_id: userId,
                round: current_round,
                total_point: total_point,
                stories: [{
                    month: month,
                    point: point,
                    story: story_txt,
                    asset: assets,
                }],
            });

            // Save the new story document
            await story.save({ session });

            // Log the activity
            await new Log({
                userId: userId,
                activity: "addNewStory",
                success: true,
                reason: "Story created successfully",
            }).save({ session });
        } else {
            // Check if a story for the given month already exists
            const existingMonthStory = story.stories.find(s => s.month === month);

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

            // Save the updated story document
            await story.save({ session });

            // Log the activity
            await new Log({
                userId: userId,
                activity: existingMonthStory ? "updateMonthStory" : "addMonthStory",
                success: true,
                reason: existingMonthStory ? "Month Story updated successfully" : "Month Story created successfully",
            }).save({ session });
        }

        // Commit the transaction
        await session.commitTransaction();
        res.status(201).json({ message: "Successfully created or updated month story!" });
    } catch (error: any) {
        // Rollback the transaction and handle errors
        await session.abortTransaction();
        console.error("Error in addMonthStory:", error);
        res.status(500).json({ error: "Failed to create or update story", details: error.message });
    } finally {
        session.endSession();
    }
};