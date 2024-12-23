import { Request, Response } from 'express';
import { AUTH_ERRORS, EMAIL_MSGS, GLOBAL_ERRORS, SUCCESS_MSGS } from '../../../constants';
import { contactEmail } from '../../../functions/email';

export const sendData = async (req: Request, res: Response) => {
    const { email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: AUTH_ERRORS.missingParams });
    }

    try {

        const content = `
        <p>From: ${email}</p>
        <p>=======================================================================</p>
        <p>Message: ${message}</p>
        `;

        const isDelivered = await contactEmail(
            email,
            EMAIL_MSGS.contactSubject,
            content
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