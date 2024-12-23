import { Request, Response } from 'express';
import User from '../../../models/User';
import Asset from '../../../models/Asset';
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from '../../../constants';
import { available } from '../../../functions/story';
import { generateUniqueRandomIntArray } from '../../../functions/story';
import Log from '../../../models/Log';
import Story from '../../../models/Story';
import Joi from 'joi';

interface IReq {
    userId: string;
    month: number;
}

const regenerationSchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.base": "userId must be a string",
        "string.empty": "userId cannot be an empty string",
        "any.required": "userId is required"
    }),
    month: Joi.number().required().messages({
        "number.base": "month must be a number",
        "number.empty": "month cannot be an empty string",
        "any.required": "month is required"
    })

})

export const regeneration = async (req: Request<IReq>, res: Response) => {
    const { error, value } = regenerationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        // Return validation errors to the client
        return res.status(400).json({
            error: true,
            message: error.details.map(err => err.message),
        });
    }
    const { userId, month } = value;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }


    if (!user.accountStatus) {
        return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
    }

    const current_round = user.current_status.current_round;

    // Get the total count of assets
    const count: number = await Asset.countDocuments();

    // If there are fewer than or equal to 12 assets, return all assets
    if (count <= 12) {
        const assets = await Asset.find();
        return res.status(200).json({ error: false, data: assets });
    }

    // Generate 12 unique random indices within the range of available assets
    const indicesArray: number[] = generateUniqueRandomIntArray(12, 0, count - 1);

    // Fetch assets using random indices (with skip and limit)
    const allAssets = await Asset.find(); // Fetch all documents
    const assets = indicesArray.map(index => allAssets[index]); // Select the required indices

    const log = new Log({
        userId: user._id,
        activity: "regenerate",
        success: true,
    });

    await log.save();

    //refind necessary Info
    const story = await Story.findOne({ user_id: userId, round: current_round });
    if (!story) {
        return res.status(404).json({ error: true, message: STORY_MSGG.storyNotFound });
    }

    const total_point = story.total_point;
    // const point = story.stories[month - 1].point;


    return res.status(200).json({ error: false, month, year_point: total_point, data: assets });
}