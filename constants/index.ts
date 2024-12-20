export const ORIGIN = "*";
export const PORT = process.env.PORT || 8000;
export const supportEmail = "c.m.brilliant34310@gmail.com";
export const baseClientUrl = "http://localhost:3000"; // in dev env

export const GLOBAL_ERRORS = {
    serverError: "An unexpected error occurred",
};

export const PAY_AMOUNT = 0.99;
export const AUTH_ERRORS = {
    missingParams: "Insufficient params",
    accountExist: "An account already exists",
    accountNotFound: "Account not found.",
    passwordNotMatch: "Password doesn't match.",
    validToken: "Unauthorized - invalid token",
    rightMethod: "Use right method",
};
export const SUCCESS_MSGS = {
    register: "Successfully registered",
    verify: "Successfully verified",
    signin: "Successfully logged in",
    changePassword: "Successfully Password Changed",
};
export const EMAIL_MSGS = {
    registerSubject: `Action Required: Verify Email`,
};
