import { Request, Response } from 'express';
import User from '../../../models/User';
import { AUTH_ERRORS } from '../../../constants';
import Log from '../../../models/Log';
import mongoose from 'mongoose';

export const upgradeRound = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }

    if (!user.accountStatus) {
        return res.status(403).json({ error: true, message: AUTH_ERRORS.activateAccountRequired });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        user.current_status.current_round += 1;
        user.current_status.round_status = "progress";
        await user.save({ session });

        const log = new Log({
            userId: user._id,
            activity: "upgrade round",
            success: true,
        })

        await log.save({ session });

        await session.commitTransaction();

        return res.status(200).json({ error: false, message: 'Round upgraded' });
    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ error: true, message: 'Internal server error' });
    }
    finally {
        session.endSession();
    }
}