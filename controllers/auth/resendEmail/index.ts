import { Request, Response } from 'express';
import { AUTH_ERRORS, baseClientUrl, EMAIL_MSGS, GLOBAL_ERRORS, SUCCESS_MSGS } from '../../../constants';
import User from '../../../models/User';
import { verifyToken } from '../../../middlewares/auth';
import { createRegisterEmailCotent, sendEmail } from '../../../functions/email';

export const resendEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: AUTH_ERRORS.missingParams });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: AUTH_ERRORS.accountNotFound });
        }

        const hashedToken = await verifyToken({ userId: user.id });
        const verifyLink = `${baseClientUrl}/verifing/?token=${hashedToken}`;
        const registerEmailContent = await createRegisterEmailCotent(verifyLink, user.name);
        const isDelivered = await sendEmail(
            email,
            EMAIL_MSGS.registerSubject,
            registerEmailContent
        );

        if (isDelivered !== 200) {
            return res.status(500).json({ message: GLOBAL_ERRORS.serverError });
        }
        return res.json({ message: SUCCESS_MSGS.sendEmail });
    }
    catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : GLOBAL_ERRORS.serverError;
        return res.status(500).json({ message: errorMessage });
    }

}