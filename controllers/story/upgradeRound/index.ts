import { Request, Response } from 'express';
import User from '../../../models/User';
import { AUTH_ERRORS, PAYMENT_MSGS } from '../../../constants';
import Payment from '../../../models/Payment';

export const upgradeRound = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }

    if (!user.accountStatus) {
        return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
    }


    const currentRound = user.current_status.current_round;
    const payment = await Payment.findOne({ user_id: userId, round: currentRound, action: PAYMENT_MSGS.action.preview });
    if (!payment) {
        return res.status(402).json({ message: PAYMENT_MSGS.notPaid });
    }


    try {

        user.current_status.current_round += 1;
        user.current_status.round_status = "progress";
        await user.save();

        return res.status(200).json({ error: false, message: 'Round upgraded' });
    } catch (error) {

        return res.status(500).json({ error: true, message: 'Internal server error' });
    }

}