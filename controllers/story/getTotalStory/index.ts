import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import Log from "../../../models/Log";
import { AUTH_ERRORS } from "../../../constants";
import mongoose from "mongoose";
import { ISection, IStory } from "../../../interfaces";
import { yearStory } from "../../../functions/openai/year_story";

interface dataType {
    month: number,
    story: string
}

export const getTotalStory = async (req: Request, res: Response) => {
    const { userId, total_point } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        //set current status complete
        user.current_status.round_status = "complete";
        await user.save({ session });

        const log = new Log({
            userId: user._id,
            activity: "story_Status",
            success: true,
            reason: "complete",
        })
        await log.save({ session });

        //get current round
        const current_round = user.current_status.current_round;

        //get stories with userId and current round
        const storyData = await Story.findOne({ round: current_round, user_id: user._id });
        if (!storyData) {
            return res.status(404).json({ message: "Stories not found" });
        }

        let input: dataType[] = [];

        //get months and stories
        storyData.stories.forEach((section: ISection) => {
            input.push({
                month: section.month,
                story: section.story
            })
        });

        //Set User Prompt
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        const gender = user.gender === "male" ? "man" : "woman";
        const job = user.job;
        const userPrompt = `I am ${age} years old. I am ${gender} and am a ${job}.`;

        const result_txt = await yearStory(input, userPrompt);
        let story_txt = "";

        if (result_txt.error) {
            story_txt = "Sorry, I can't generate a story for you. Please try again later.";
        } else {
            story_txt = result_txt.message as string;
        }

        storyData.total_story = story_txt;
        storyData.total_point = total_point;

        await storyData.save({ session });

        await session.commitTransaction();

        res.status(200).json({ message: "successfully get total story" });

    } catch (error) {
        res.status(500).json({ error });
    }
    finally {
        session.endSession();
    }
};