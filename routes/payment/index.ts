import express from "express";
import { authorizeBearerToken } from "../../middlewares/auth";
import * as stripeController from "../../controllers/payment/stripe";
import * as paypalController from "../../controllers/payment";
import * as cryptoController from "../../controllers/payment/crypto";
const router = express.Router();

router.post(
  "/stripe/session-initiate",
  authorizeBearerToken,
  stripeController.sessionInitiate
);
router.post("/paypal/pay", authorizeBearerToken, paypalController.pay);
router.post("/paypal/success", authorizeBearerToken, paypalController.success);
router.post("/paypal/cancel", authorizeBearerToken, paypalController.cancel);

router.post(
  "/crypto/create-payment",
  authorizeBearerToken,
  cryptoController.payment
);
router.post("/crypto/nowpayments/ipn", cryptoController.updatePack);

module.exports = router;
