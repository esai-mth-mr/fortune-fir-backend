import { Request, Response } from 'express';
import Asset from '../../../models/Asset';
import User from "../../../models/User";
import Story from '../../../models/Story';
import Payment from '../../../models/Payment';
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from '../../../constants';
import { generateUniqueRandomIntArray, getAssetRange } from '../../../functions/story';


export const init = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.body;

    try {
        // Fetch the user and validate the account status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
        }

        if (!user.accountStatus) {
            return res.status(403).json({ message: AUTH_ERRORS.activateAccountRequired });
        }


        const current_round = user.current_status.current_round;

        const payment = await Payment.findOne({ user_id: userId, round: current_round, action: PAYMENT_MSGS.action.preview });
        if (!payment) {
            return res.status(402).json({ message: PAYMENT_MSGS.notPaid });
        }


        const story = await Story.findOne({ round: current_round, user_id: userId });
        let month = story ? story.stories[story.stories.length - 1].month + 1 : 1;
        if (month === 13 && story?.total_story) {
            return res.status(403).json({ message: "You have already processed all months" });
        }
        else if (month === 13) {
            month = 12;
        }

        const total_point = story ? story.total_point : 0;
        let assets: any[] = [];
        let indicesArray: number[] = [];

        if (current_round === 1) {
            // Round 1: Fetch assets using random indices
            const goodArray = generateShuffledArray(6, 0, 100);
            const badArray = generateShuffledArray(6, 101, 200);

            indicesArray = [...goodArray, ...badArray];
            assets = await Asset.find({ index: { $in: indicesArray } });
        } else {
            // Round > 1: Fetch previous story and determine asset range
            const preStory = await Story.findOne({ round: current_round - 1, user_id: userId });
            if (!preStory) {
                return res.status(404).json({ message: STORY_MSGG.preStoryNotFound });
            }

            const point = preStory.stories[preStory.stories.length - 1].point;
            const { start, end } = getAssetRange(point);

            const midPoint = Math.floor((end - start + 1) / 2);
            const goodArray = generateShuffledArray(6, start, midPoint);
            const badArray = generateShuffledArray(6, midPoint + 1, end);

            indicesArray = [...goodArray, ...badArray];
            assets = await Asset.find({ index: { $in: indicesArray } });
        }

        return res.status(200).json({ month, year_point: total_point, data: assets });
    } catch (err) {
        console.error('Error fetching assets:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


const generateShuffledArray = (count: number, start: number, end: number): number[] => {
    const array = generateUniqueRandomIntArray(count, start, end);
    return array.sort(() => Math.random() - 0.5);
};
