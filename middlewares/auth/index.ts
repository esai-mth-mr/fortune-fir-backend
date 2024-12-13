export const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const VERIFY_SECRET = process.env.VERIFY_SECRET;

export const signToken = (payload = {}, expiresIn = "6h") => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    return token;
};

export const verifyToken = (payload = {}, expiresIn = "0.2h") => {
    const token = jwt.sign(payload, VERIFY_SECRET, { expiresIn });
    return token;
};
