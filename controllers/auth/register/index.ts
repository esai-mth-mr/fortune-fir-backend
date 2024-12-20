import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../../models/User";
import Log from "../../../models/Log";
import {
    AUTH_ERRORS,
    baseClientUrl,
    EMAIL_MSGS,
    GLOBAL_ERRORS,
    SUCCESS_MSGS,
} from "../../../constants";

import mongoose from "mongoose";
import { verifyToken } from "../../../middlewares/auth";
import { createRegisterEmailCotent, sendEmail } from "../../../functions/email";


export const register = async (req: Request, res: Response) => {
    const { name, password, email, gender, date, job } = req.body;
    if (!name || !password || !email || !gender || !date || !job) {
        return res.status(400).json({ error: true, message: AUTH_ERRORS.missingParams });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = await User.findOne({ email }).session(session);
        if (user) {
            const log = new Log({
                userId: user.id,
                activity: "register",
                success: false,
                reason: AUTH_ERRORS.accountExist,
            });
            await log.save();
            return res.status(400).json({ error: true, message: AUTH_ERRORS.accountExist });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ name, email, password: hashedPassword, gender, dob: new Date(date), job });
        await newUser.save({ session });

        const log = new Log({
            userId: newUser.id,
            activity: "register",
            success: true,
        });
        await log.save({ session });


        const hashedToken = await verifyToken({ userId: newUser.id });
        const verifyLink = `${baseClientUrl}/verifing/?token=${hashedToken}`;
        const registerEmailContent = await createRegisterEmailCotent(
            verifyLink,
            name
        );
        const isDelivered = await sendEmail(
            email,
            EMAIL_MSGS.registerSubject,
            registerEmailContent
        );

        if (isDelivered !== 200) {
            await session.abortTransaction();
            return res.status(500).json({ error: true, message: GLOBAL_ERRORS.serverError });
        }

        await session.commitTransaction();
        return res.json({ error: false, message: SUCCESS_MSGS.register });


    } catch (error) {
        await session.abortTransaction();
        console.error("Error during registration:", error);
        const errorMessage =
            error instanceof Error ? error.message : GLOBAL_ERRORS.serverError;
        return res.status(500).json({ error: true, message: errorMessage });
    } finally {
        session.endSession();
    }
};
