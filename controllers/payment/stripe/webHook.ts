import Stripe from "stripe";
import Payment from "../../../models/Payment";
import { Request, Response } from "express";
import { secretKey, webHookKey } from "../../../constants";

if (!webHookKey) throw new Error("Missing Stripe Webhook Key");
if (!secretKey) throw new Error("Missing Stripe Secret Key");

export const stripewebHook = async (req: Request, res: Response) => {
  const stripe = new Stripe(secretKey);

  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webHookKey);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).send("Event type not handled");
  }


  try {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" && session.metadata) {
      const { user_id, round, action, provider, amount, unit } = session.metadata;

      // Ensure metadata fields exist
      if (!user_id || !round || !action || !provider || !amount || !unit) {
        console.error("Missing required metadata fields");
        return res.status(400).send("Invalid session metadata");
      }

      // Check if payment already exists
      const existingPayment = await Payment.findOne({ user_id, round, action });
      if (existingPayment) {
        console.log("Payment already exists for user:", user_id);
        return res.status(200).send("Payment already processed");
      }

      // Save payment to the database
      const payment = new Payment({
        user_id,
        provider,
        action,
        amount: parseFloat(amount),
        unit,
        round,
        created_at: new Date(),
        timestamp: new Date(),
      });

      await payment.save();
      console.log("Payment successfully saved for user:", user_id);
      return res.status(200).send("Webhook handled successfully");

    } else {
      console.error("Session metadata missing or payment status invalid");
      return res.status(400).send("Session metadata missing or payment status invalid");
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).send("Error processing payment");
  }

};
