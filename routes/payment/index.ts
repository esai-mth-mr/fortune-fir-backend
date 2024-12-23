import express from "express";
import { authorizeBearerToken } from "../../middlewares/auth";
import * as stripeController from "../../controllers/payment/stripe";
import * as paypalController from "../../controllers/payment";
import bodyParser from "body-parser";
const router = express.Router();

router.post("/stripe/session-complete", express.raw({ type: "application/json" }), stripeController.sessionComplete);
router.post(
  "/stripe/session-initiate",
  authorizeBearerToken,
  stripeController.sessionInitiate
);
router.post("/paypal/pay", authorizeBearerToken, paypalController.pay);
router.post("/paypal/success", authorizeBearerToken, paypalController.success);
router.post("/paypal/cancel", authorizeBearerToken, paypalController.cancel);

module.exports = router;
