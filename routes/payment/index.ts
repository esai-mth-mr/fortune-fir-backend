import express from "express";
import * as stripeController from "../../controllers/payment/stripe";

const router = express.Router();

router.post("/stripe/session-complete", stripeController.sessionComplete);
router.post("/stripe/session-initiate", stripeController.sessionInitiate);

module.exports = router;
