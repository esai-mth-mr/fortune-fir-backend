import { Request, Response } from 'express';
import User from '../../../models/User';
import Asset from '../../../models/Asset';
import { AUTH_ERRORS, STORY_MSGG, PAYMENT_MSGS } from '../../../constants';
import { available } from '../../../functions/story';
import { generateUniqueRandomIntArray } from '../../../functions/story';
import Log from '../../../models/Log';
import Story from '../../../models/Story';
import Joi from 'joi';

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

    const action = PAYMENT_MSGS.action.regeneration;

    if (!await available(userId, current_round, action)) {
        const log = new Log({
            userId: user._id,
            activity: "regenerate",
            success: false,
            reason: "payment is not verified."
        });
        await log.save();

        return res.status(404).json({ error: true, payment: false });
    }



    return res.status(200).json({ error: false, payment: true });
}