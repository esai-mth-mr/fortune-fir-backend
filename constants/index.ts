import { regeneration } from "../controllers/story/regeneration";

export const ORIGIN = "*";
export const PORT = process.env.PORT || 8000;
export const supportEmail = "c.m.brilliant34310@gmail.com";
export const baseClientUrl = "http://localhost:3000"; // in dev env

export const GLOBAL_ERRORS = {
    serverError: "An unexpected error occurred",
};
export const AUTH_ERRORS = {
    missingParams: "Insufficient params",
    accountExist: "An account already exists",
    accountNotFound: "Account not found.",
    passwordNotMatch: "Password doesn't match.",
    validToken: "Unauthorized - invalid token",
    rightMethod: "Use right method",
    activateAccountRequired : "Please activeate your account. Check your inbox or resend code to your email!"
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

export const STORY_MSGG = {
    storyNotFound: "Story not found",
    storyNotAvailable: "Story not available",
}

export const PAYMENT_MSGS = {
    action: { regeneration: "regeneration", preview: "preview" }
}
