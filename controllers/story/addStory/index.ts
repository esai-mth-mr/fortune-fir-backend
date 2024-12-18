import { Request, Response } from 'express';
import Story from "../../../models/Story";
import Log from '../../../models/Log';
import User from '../../../models/User';
import Asset from '../../../models/Asset';
import { monthStory } from '../../../functions/openai/month_story';
import mongoose from 'mongoose';
import { AUTH_ERRORS } from '../../../constants';
import { available } from '../../../functions/story';
import { ITransferStoryInput } from '../../../interfaces';

export const addStory = async (req: Request, res: Response) => {
    const { point, total_point, assets, month, userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    const current_round = user.current_status.current_round;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        let storyInput: ITransferStoryInput[] = [];

        for (const element of assets) {
            const asset = await Asset.findOne({ index: element }).session(session);
            if (!asset) {
                throw new Error('Asset not found');
            }
            storyInput.push({
                name: asset.name,
                description: asset.description,
                luck: asset.luck,
            });
        }

        //Set User Prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;

        const userPrompt = `I am ${age} years old. I am ${gender} and am a ${job}.`;

        const result_txt = await monthStory(storyInput, userPrompt);
        let story_txt = "";

        if (result_txt.error) {
            story_txt = "Sorry, I can't generate a story for you. Please try again later.";
        } else {
            story_txt = result_txt.message as string;
        }

        // Find the story document for the current round and user
        const story = await Story.findOne({ round: current_round, user_id: userId }).session(session);

        if (!story) {
            // If no story document exists, create a new one
            const newStory = new Story({
                user_id: userId,
                round: current_round,
                total_point: total_point,
                stories: [{
                    month: month,
                    point: point,
                    story: story_txt,
                    asset: assets
                }]
            });

            // Save the new story document
            await newStory.save({ session });

            // Log the activity
            const log = new Log({
                userId: userId,
                activity: "addNewStory",
                success: true,
                reason: "Story created successfully"
            });
            await log.save({ session });

        } else {
            // If a story document exists, update it by pushing a new story section

            story.stories.push({
                month: month,
                point: point,
                story: story_txt,
                asset: assets
            });


            // Save the updated story document
            await story.save({ session });

            const log = new Log({
                userId: userId,
                activity: "addMonthStory",
                success: true,
                reason: "Month Story created successfully"
            });
            await log.save({ session });
        }

        await session.commitTransaction();

        //whether display the story or not
        let display = false;
        if (await available()) display = true;
        else display = false;

        res.status(201).json({ month_story: story_txt, display });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: 'Failed to create story' });
    }
    finally {
        session.endSession();
    }
}