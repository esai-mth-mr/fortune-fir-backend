import { GLOBAL_ERRORS } from "../../constants";

export const jwt = require("jsonwebtoken");
const VERIFY_SECRET = process.env.VERIFY_SECRET;

export async function verifyEmail(
    verificationCode: string
): Promise<string | null> {
    try {
        const verifyAuth = jwt.verify(verificationCode, VERIFY_SECRET) as {
            userId: string;
        };
        return verifyAuth.userId || null;
    } catch (error) {
        return null;
    }
}

export async function verifyResetPasswordEmail(
    verificationToken: string
): Promise<string | null> {
    try {
        const verifyAuth = jwt.verify(verificationToken, VERIFY_SECRET) as {
            email: string;
        };
        return verifyAuth.email || null;
    } catch (error) {
        return null;
    }
}
