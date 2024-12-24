export const ORIGIN = "*";
export const PORT = process.env.PORT || 8080;
export const supportEmail = "c.m.brilliant34310@gmail.com";
export const adminEmail = "jamesdavis34310@gmail.com";
//export const baseClientUrl = "https://howlucky2025.com"; // in live env
export const baseClientUrl = "http://localhost:5173"; // in dev env

// Stripe env
export const webHookKey =
  process.env.STRIPE_WEBHOOK_SECRET ??
  (() => {
    throw new Error("Missing Stripe Webhook Key");
  })();
export const secretKey =
  process.env.STRIPE_SECRET_KEY ??
  (() => {
    throw new Error("Missing Stripe Secret Key");
  })();
export const priceIds =
  process.env.STRIPE_PRICE_IDS ??
  (() => {
    throw new Error("Missing Stripe Price ID");
  })();
//Paypal env
export const clientId =
  process.env.PAYPAL_CLIENT_ID ??
  (() => {
    throw new Error("Missing Paypal Client ID");
  })();
export const clientSecret =
  process.env.PAYPAL_CLIENT_SECRET ??
  (() => {
    throw new Error("Missing Paypal Client Secret");
  })();
// export const PAYPAL_MODE = "live";
export const PAYPAL_MODE = "live";

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
  activateAccountRequired:
    "Please activeate your account. Check your inbox or resend code to your email!",
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
  contactSubject: "Customer Support Required",
};

export const STORY_MSGG = {
  storyNotFound: "Story not found",
  storyNotAvailable: "Story not available",
  preStoryNotFound: "Previous Story not found",
  errorShowResult: "You have to complete every months.",
  storyNotFoundForMonth: "Story for month doesn't exist.",
};

export const PAYMENT_MSGS = {
  action: { regeneration: "regeneration", preview: "preview" },
};
export const SUBSCRIPTION_BASE_URL = "https://api.nowpayments.io/v1";
export const PAYMENT_CALLBACK_URL =
  "http://localhost:5173/api/payment/crypto/nowpayments/ipn";
// "https://howlucky2025.com/api/payment/crypto/nowpayments/ipn";

export const MONTH_LABEL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
