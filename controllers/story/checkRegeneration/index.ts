import { Request, Response } from 'express';
import User from '../../../models/User';
import { AUTH_ERRORS, PAYMENT_MSGS } from '../../../constants';
import { available } from '../../../functions/story';
import Joi from 'joi';
import Payment from '../../../models/Payment';

interface IReq {
    userId: string;
    month: number;
}

const regenerationSchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.base": "userId must be a string",
        "string.empty": "userId cannot be an empty string",
        "any.required": "userId is required"
    }),
    month: Joi.number().required().messages({
        "number.base": "month must be a number",
        "number.empty": "month cannot be an empty string",
        "any.required": "month is required"
    })

})

export const checkRegeneration = async (req: Request<IReq>, res: Response) => {
    const { error, value } = regenerationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        // Return validation errors to the client
        return res.status(400).json({
            error: true,
            message: error.details.map(err => err.message),
        });
    }
    const { userId, month } = value;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }


    if (!user.accountStatus) {
        return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
    }

    const current_round = user.current_status.current_round;

    const payment = await Payment.findOne({ user_id: userId, round: current_round, action: PAYMENT_MSGS.action.preview });
    if (!payment) {
        return res.status(402).json({ message: PAYMENT_MSGS.notFound });
    }

    const action = PAYMENT_MSGS.action.regeneration;

    if (!await available(userId, current_round, action)) {

        return res.status(200).json({ error: false, payment: false });
    }

    return res.status(200).json({ error: false, payment: true });
}