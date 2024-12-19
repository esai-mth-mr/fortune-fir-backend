import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from "../../../constants";
import { available } from "../../../functions/story";


export const showStory = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    const current_round = user.current_status.current_round;

    const story = await Story.findOne({ round: current_round, user_id: userId });
    if (!story) {
        return res.status(404).json({ message: STORY_MSGG.storyNotFound });
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

    console.log(sendData);

    const action = PAYMENT_MSGS.action.preview;

    if (!await available(userId, current_round, action)) return res.status(200).json({ display: false, message: "Unavailable" });

    return res.status(200).json({ display: true, message: sendData });
};
