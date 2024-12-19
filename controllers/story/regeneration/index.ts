import { Request, Response } from 'express';
import User from '../../../models/User';
import Asset from '../../../models/Asset';
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from '../../../constants';
import { available } from '../../../functions/story';
import { generateUniqueRandomIntArray } from '../../../functions/story';
import Log from '../../../models/Log';

export const regeneration = async (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
    }

    const current_round = user.current_status.current_round;

    const action = PAYMENT_MSGS.action.regeneration;

    if (!await available(userId, current_round, action)) {
        const log = new Log({
            userId: user._id,
            activity: "regenerate",
            success: false,
            reason: "payment is not verified."
        });
        await log.save();

        return res.status(404).json({ message: STORY_MSGG.storyNotAvailable });
    }

    // Get the total count of assets
    const count: number = await Asset.countDocuments();

    // If there are fewer than or equal to 12 assets, return all assets
    if (count <= 12) {
        const assets = await Asset.find();
        return res.status(200).json(assets);
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

    return res.status(200).json({ data: assets });
}