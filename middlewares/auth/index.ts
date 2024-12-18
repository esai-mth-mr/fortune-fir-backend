export const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const VERIFY_SECRET = process.env.VERIFY_SECRET;
import User from "../../models/User";
import { AUTH_ERRORS } from "../../constants";

export const signToken = (payload = {}, expiresIn = "6h") => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    return token;
};

export const verifyToken = (payload = {}, expiresIn = "0.2h") => {
    const token = jwt.sign(payload, VERIFY_SECRET, { expiresIn });
    return token;
};

export const authorizeBearerToken = async (request: any, response: any, next: any) => {
    try {
        const token = request.headers.authorization && request.headers.authorization.split(' ')[1];

        if (!token) {
            return response.json({
                status: 400,
                message: 'Token not provided',
            })
        }
        else {
            const auth = jwt.verify(token, JWT_SECRET)
            if (!auth) {
                return response.json({
                    status: 401,
                    message: 'Unauthorized - invalid token',
                })
            }

            const user = await User.findById(auth.userId);
            if (!user) {
                return response.json({ status: 404, message: AUTH_ERRORS.accountNotFound });
            }

            request.auth = auth
            request.body.userId = auth.userId
            next()
        }
    } catch (error) {
        console.error('Error occured here: ', error);
        return response.json({
            status: 401,
            message: 'Unauthorized - invalid token',
        })
    }
}