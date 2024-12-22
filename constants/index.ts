import { regeneration } from "../controllers/story/regeneration";

export const ORIGIN = "*";
export const PORT = process.env.PORT || 8000;
export const supportEmail = "c.m.brilliant34310@gmail.com";
export const adminEmail = "jamesdavis34310@gmail.com";
export const baseClientUrl = "https://howlucky2025.com"; // in live env

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
    activateAccountRequired: "Please activeate your account. Check your inbox or resend code to your email!"
};
export const SUCCESS_MSGS = {
    register: "Successfully registered",
    verify: "Successfully verified",
    signin: "Successfully logged in",
    changePassword: "Successfully Password Changed",
    sendEmail: "Email sent successfully",
};
export const EMAIL_MSGS = {
    registerSubject: `Action Required: Verify Email`,
    contactSubject: "Customer Support Required"
};

export const STORY_MSGG = {
    storyNotFound: "Story not found",
    storyNotAvailable: "Story not available",
    preStoryNotFound: "Previous Story not found",
}

export const PAYMENT_MSGS = {
    action: { regeneration: "regeneration", preview: "preview" }
}
