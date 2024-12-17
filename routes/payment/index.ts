import express from "express";
import * as stripeController from "../../controllers/payment/stripe";
import * as paypalController from "../../controllers/payment/paypal";
const router = express.Router();

router.post("/stripe/session-complete", stripeController.sessionComplete);
router.post("/stripe/session-initiate", stripeController.sessionInitiate);
router.post("paypal", )

module.exports = router;
