import { Request, Response } from 'express';
import { AUTH_ERRORS, GLOBAL_ERRORS, SUCCESS_MSGS } from "../../../constants";
import User from "../../../models/User";
import Log from "../../../models/Log";
import bcrypt from 'bcrypt';
import { signToken } from "../../../middlewares/auth";


export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Insufficient params" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: AUTH_ERRORS.accountNotFound });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const log = new Log({ userId: user.id, activity: 'signin', success: false, reason: AUTH_ERRORS.passwordNotMatch });
            await log.save();
            return res.status(400).json({ message: AUTH_ERRORS.passwordNotMatch });
        }
        const token = signToken({ userId: user.id });
        const log = new Log({ userId: user.id, activity: 'signin', success: true });
        await log.save();
        return res.status(200).json({ message: SUCCESS_MSGS.signin, token });
    } catch (error) {
        console.error('Error during signin:', error);
        const errorMessage = error instanceof Error ? error.message : GLOBAL_ERRORS.serverError;
        return res.status(500).json({ message: errorMessage });
    }


};