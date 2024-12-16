import { Request, Response } from 'express';
import Story from "../../../models/Story";
import Log from '../../../models/Log';
import { storyText } from '../../../functions/openai/storyText';
import { tipText } from '../../../functions/openai/tipText';
import mongoose from 'mongoose';

export const addStory = async (req: Request, res: Response) => {
    const { point, total_point, assets, month, userId } = req.body;

    const session = await mongoose.startSession();


    try {
        session.startTransaction();

        const story_txt = (await storyText(point)).message;
        const tip_txt = (await tipText(total_point)).message;
        const story = new Story({
            user_id: userId,
            total_point: total_point,
            stories: {
                month: month,
                point: point,
                tip: tip_txt,
                story: story_txt,
                asset: assets
            }
        });
        await story.save({ session });

        const log = new Log({
            userId: userId,
            activity: "addStory",
            success: true,
            reason: "Story created successfully"
        });
        await log.save({ session });

        await session.commitTransaction();
        res.status(201).json({ message: 'Story created successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: 'Failed to create story' });
    }
    finally {
        session.endSession();
    }
}

