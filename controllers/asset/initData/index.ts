import { Request, Response } from 'express';
import Asset from '../../../models/Asset';
import User from "../../../models/User";
import Story from '../../../models/Story';
import { AUTH_ERRORS, STORY_MSGG } from '../../../constants';
import { generateUniqueRandomIntArray, getAssetRange } from '../../../functions/story';
import Log from '../../../models/Log';

export const init = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.body;

    try {
        // Fetch the user and validate the account status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        if (!user.accountStatus) {
            return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
        }

        const current_round = user.current_status.current_round;
        const story = await Story.findOne({ round: current_round, user_id: userId });
        const month = story ? story.stories[story.stories.length - 1].month + 1 : 1;

        let assets: any[] = [];
        let indicesArray: number[] = [];
        const log = new Log({
            userId,
            activity: current_round === 1 ? "getInitAsset" : "getInitAsset-upgradeRound",
            success: true
        });

        // If round is 1, fetch assets directly or using random indices if there are more than 12
        if (current_round === 1) {
            const count = await Asset.countDocuments();

            if (count <= 12) {
                assets = await Asset.find();
            } else {
                indicesArray = generateUniqueRandomIntArray(12, 0, count - 1);
                const allAssets = await Asset.find();
                assets = indicesArray.map(index => allAssets[index]);
            }
        } else {
            // Round > 1: fetch the previous story and determine asset range based on point value
            const preStory = await Story.findOne({ round: current_round - 1, user_id: userId });
            if (!preStory) {
                return res.status(404).json({ error: true, message: STORY_MSGG.preStoryNotFound });
            }

            const point = preStory.stories[preStory.stories.length - 1].point;
            const { start, end } = getAssetRange(point);

            indicesArray = generateUniqueRandomIntArray(12, start, end);
            const allAssets = await Asset.find();
            assets = indicesArray.map(index => allAssets[index]);
        }

        // Log the successful fetch of assets
        await log.save();

        return res.status(200).json({ error: false, month, data: assets });
    } catch (err) {
        console.error('Error fetching assets:', err);
        return res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};
