import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from "../../../constants";
import { available } from "../../../functions/story";
import Log from "../../../models/Log";

export const showStory = async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        // Fetch user and validate existence
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        // Check if account is active
        if (!user.accountStatus) {
            return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
        }

        const currentRound = user.current_status.current_round;

        // Fetch story for the current round
        const story = await Story.findOne({ round: currentRound, user_id: userId });
        if (!story) {
            return res.status(404).json({ error: true, message: STORY_MSGG.storyNotFound });
        }

        // Check payment availability
        const action = PAYMENT_MSGS.action.preview;
        const isPaymentAvailable = await available(userId, currentRound, action);

        // Prepare response data
        const sendData = [
            {
                month: 13,
                point: story.total_point,
                ...(isPaymentAvailable && { story: story }),
            },
            ...story.stories.map((each) => ({
                month: each.month,
                point: each.point,
                ...(isPaymentAvailable && { story: each.story }),
            })),
        ];

        // Log activity
        const log = new Log({
            userId: user._id,
            activity: "showStory",
            success: isPaymentAvailable,
            ...(isPaymentAvailable ? {} : { reason: "payment is not verified" }),
        });
        await log.save();

        // Send response
        return res.status(200).json({
            error: false,
            display: isPaymentAvailable,
            message: sendData,
        });
    } catch (error) {
        console.error("Error in showStory:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};