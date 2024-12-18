import { Request, Response } from 'express';
import User from '../../../models/User';
import { AUTH_ERRORS } from '../../../constants';

export const upgradeRound = async (req: Request, res: Response) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
        }
        user.current_status.current_round += 1;
        user.current_status.round_status = "progress";
        await user.save();
        return res.status(200).json({ message: 'Round upgraded' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}