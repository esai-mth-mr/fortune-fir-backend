import { Request, Response } from "express";
import User from "../../../models/User";
import Story from "../../../models/Story";
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from "../../../constants";
import { available } from "../../../functions/story";
import Log from "../../../models/Log";

export const showStory = async (req: Request, res: Response) => {
  const { month, userId } = req.body;

  if (!userId || !month) {
    return res.status(403).json({ error: true, message: AUTH_ERRORS.missingParams });
  }

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

    if (story.total_story === "") {
      return res.status(403).json({ error: true, message: STORY_MSGG.errorShowResult });
    }

    // Check payment availability
    const action = PAYMENT_MSGS.action.preview;
    const isPaymentAvailable = await available(userId, currentRound, action);

    // Prepare response data based on the requested month
    let responseData;

    if (month === 13) {
      // Return total story data for month 13
      responseData = {
        month: 13,
        point: story.total_point,
        ...(isPaymentAvailable && { story: story }),
      };
    } else {
      // Find the specific month's data in the stories
      const specificStory = story.stories.find((each) => each.month === month);

      if (!specificStory) {
        return res.status(404).json({ error: true, message: STORY_MSGG.storyNotFoundForMonth });
      }

      responseData = {
        month: specificStory.month,
        point: specificStory.point,
        ...(isPaymentAvailable && { story: specificStory.story }),
      };
    }

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
      message: responseData,
    });
  } catch (error) {
    console.error("Error in showStory:", error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
};