import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from "../../../constants";
import { available } from "../../../functions/story";
import Log from "../../../models/Log";

export const showStory = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }


    if (!user.accountStatus) {
        return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
    }


    const current_round = user.current_status.current_round;

    const story = await Story.findOne({ round: current_round, user_id: userId });
    if (!story) {
        return res.status(404).json({ error: true, message: STORY_MSGG.storyNotFound });
    }


    let sendData = [];
    sendData.push({
        month: "total",
        story: story.total_story
    })

    story.stories.map((each) => {
        sendData.push({
            month: each.month,
            story: each.story
        })
    })


    const action = PAYMENT_MSGS.action.preview;

    if (!await available(userId, current_round, action)) {
        const log = new Log({
            userId: user._id,
            activity: "showStory",
            success: false,
            reason: "payment is not verified"
        });

        await log.save();

        return res.status(200).json({ error: false, display: false, message: "Unavailable" });

    }

    const log = new Log({
        userId: user._id,
        activity: "showStory",
        success: true,
    });

    await log.save();
    return res.status(200).json({ error: false, display: true, message: sendData });
};
