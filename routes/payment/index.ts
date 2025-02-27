import express from "express";
import { authorizeBearerToken } from "../../middlewares/auth";
import * as stripeController from "../../controllers/payment/stripe";
import * as paypalController from "../../controllers/payment";
const router = express.Router();

router.post(
  "/stripe/session-initiate",
  authorizeBearerToken,
  stripeController.sessionInitiate
);
router.post("/paypal/pay", authorizeBearerToken, paypalController.pay);
router.post("/paypal/success", authorizeBearerToken, paypalController.success);
router.post("/paypal/cancel", authorizeBearerToken, paypalController.cancel);
router.post("/checkStatus", authorizeBearerToken, paypalController.checkStatus);

module.exports = router;
