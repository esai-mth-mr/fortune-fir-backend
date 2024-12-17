import { Request, Response } from 'express';
import Story from "../../../models/Story";
import Log from '../../../models/Log';
import User from '../../../models/User';
import { storyText } from '../../../functions/openai/storyText';
import { tipText } from '../../../functions/openai/tipText';
import mongoose from 'mongoose';
import { AUTH_ERRORS } from '../../../constants';
import { available } from '../../../functions/story';


export const addStory = async (req: Request, res: Response) => {
    const { end, point, total_point, assets, month, userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    const current_round = user.current_status.current_round;
    const round_staus = user.current_status.round_status;

    const session = await mongoose.startSession();


    try {
        session.startTransaction();

        const story_txt = (await storyText(point)).message;
        const tip_txt = (await tipText(total_point)).message;
        const story = new Story({
            user_id: userId,
            round: current_round,
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



        //whether display the story or not
        let display = false;
        if (available()) display = true;
        else display = false;

        res.status(201).json({ month_story: story_txt, month_tip: tip_txt, display });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: 'Failed to create story' });
    }
    finally {
        session.endSession();
    }
}