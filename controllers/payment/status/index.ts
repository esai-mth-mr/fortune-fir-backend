import { Request, Response } from "express";
import User from "../../../models/User";
import { AUTH_ERRORS, PAYMENT_MSGS } from "../../../constants";
import Payment from "../../../models/Payment";


export const checkStatus = async (req: Request, res: Response) => {
    // Extract userId and total_point from the request body
    const { userId } = req.body;

    // Validate user existence
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
    }

    if (!user.accountStatus) {
        return res.status(403).json({
            error: true,
            action: "verify",
            message: AUTH_ERRORS.activateAccountRequired,
        });
    }

    // Get the current round
    const current_round = user.current_status.current_round;


    const payment = await Payment.findOne({ user_id: userId, round: current_round, action: PAYMENT_MSGS.action.preview });
    if (!payment) {
        return res.status(402).json({ message: PAYMENT_MSGS.notPaid });
    }

    return res.status(200).json({ message: PAYMENT_MSGS.paid })

};
