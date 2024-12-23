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

export const authorizeBearerToken = async (
  request: any,
  response: any,
  next: any
) => {
  try {
    const token =
      request.headers.authorization &&
      request.headers.authorization.split(" ")[1];
    if (!token) {
      return response.status(400).json({
        message: "Token not provided",
      });
    } else {
      const auth = jwt.verify(token, JWT_SECRET);
      if (!auth) {
        return response.status(401).json({
          message: "Unauthorized - invalid token",
        });
      }

      request.auth = auth;
      request.body.userId = auth.userId;
      next();
    }
  } catch (error) {
    console.error("Error occured here: ", error);
    return response.status(401).json({
      message: "Unauthorized - invalid token",
    });
  }
};
