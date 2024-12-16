import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../../../models/User';
import Log from '../../../models/Log';
import { AUTH_ERRORS, GLOBAL_ERRORS, SUCCESS_MSGS } from '../../../constants';
import { verifyEmail } from '../../../functions/auth';

export const Emailverify = async (req: Request, res: Response) => {
    const { verificationCode } = req.body;
    if (!verificationCode) {
        return res.status(400).json({ message: AUTH_ERRORS.missingParams });
    }

    const userId = await verifyEmail(verificationCode);
    if (!userId) {
        return res.status(400).json({ message: AUTH_ERRORS.validToken });
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const user = await User.findById(userId).session(session);
            if (!user) {
                await session.abortTransaction();
                return res.status(404).json({ message: AUTH_ERRORS.accountNotFound });
            }

            user.accountStatus = true;
            await user.save({ session });

            const log = new Log({
                userId: user.id,
                activity: "verify",
                success: true,
            });
            await log.save({ session });

            await session.commitTransaction();
            return res.status(200).json({ message: SUCCESS_MSGS.verify });
        } catch (error: any) {
            await session.abortTransaction();

            if (error.errorLabels?.includes("TransientTransactionError")) {
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error("Max retries reached:", error);
                    return res.status(500).json({ message: GLOBAL_ERRORS.serverError });
                }
                // Add exponential backoff
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, retryCount) * 100)
                );
                continue;
            }

            console.error("Error during verification:", error);
            const errorMessage =
                error instanceof Error ? error.message : GLOBAL_ERRORS.serverError;
            return res.status(500).json({ message: errorMessage });
        } finally {
            session.endSession();
        }
    }
}