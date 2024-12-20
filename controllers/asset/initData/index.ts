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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
        }

        if (!user.accountStatus) {
            return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
        }

        const current_round = user.current_status.current_round;

        // Determine the current month
        const story = await Story.findOne({ round: current_round, user_id: userId });
        const month = story ? story.stories[story.stories.length - 1].month + 1 : 1;

        if (current_round == 1) {

            // Get the total count of assets
            const count: number = await Asset.countDocuments();

            // If there are fewer than or equal to 12 assets, return all assets
            if (count <= 12) {
                const assets = await Asset.find();
                return res.status(200).json(assets);
            }


            // Generate 12 unique random indices within the range of available assets
            const indicesArray: number[] = generateUniqueRandomIntArray(12, 0, count - 1);
            const allAssets = await Asset.find();
            const assets = indicesArray.map(index => allAssets[index]);

            const log = new Log({
                userId: userId,
                activity: "getInitAsset",
                success: true
            })

            await log.save();

            //const assets = await Asset.find().skip(indicesArray[0]).limit(indicesArray.length); // Skip the first index and limit to 12 assets
            return res.status(200).json({ error: false, month: month, data: assets });
        }

        // Fetch the previous story to determine the user's point
        const preStory = await Story.findOne({ round: current_round - 1, user_id: userId });
        if (!preStory) {
            return res.status(404).json({ error: true, message: STORY_MSGG.storyNotFound });
        }

        const point = preStory.stories[preStory.stories.length - 1].point;

        // Determine the range of assets based on the point value
        const { start, end } = getAssetRange(point);

        // Generate 12 unique random indices within the selected range
        const indicesArray = generateUniqueRandomIntArray(12, start, end);

        // Fetch assets using the random indices
        const allAssets = await Asset.find();
        const assets = indicesArray.map(index => allAssets[index]);

        const log = new Log({
            userId: userId,
            activity: "getInitAsset-upgradeRound",
            success: true
        })

        await log.save();

        return res.status(200).json({ error: false, month, data: assets });


    } catch (err) {
        console.error('Error fetching assets:', err);
        return res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
};