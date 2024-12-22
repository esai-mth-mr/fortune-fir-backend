import { Request, Response } from 'express';
import { AUTH_ERRORS, GLOBAL_ERRORS, SUCCESS_MSGS } from "../../../constants";
import User from "../../../models/User";



export const checkUser = async (req: Request, res: Response) => {

    console.log("-------controller log")
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.accountNotFound });
        }
        return res.status(200).json({ message: SUCCESS_MSGS.verify });
    } catch (error) {
        return res.status(500).json({ error: GLOBAL_ERRORS.serverError });
    }
};