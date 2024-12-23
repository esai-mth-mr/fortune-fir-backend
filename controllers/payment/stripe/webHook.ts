import Stripe from "stripe";
import Payment from "../../../models/Payment";
import express, { Request, Response } from "express";

const webHookKey = process.env.STRIPE_WEBHOOK_SECRET;
const secretKey = process.env.STRIPE_SECRET_KEY;
const priceIds = process.env.STRIPE_PRICE_IDS;

if (!webHookKey) {
  throw new Error("Missing Stripe Webhook Key");
}
if (!priceIds) {
  throw new Error("Missing Stripe Price IDs");
}

if (!secretKey) {
  throw new Error("Missing Stripe Secret Key");
}
export const stripewebHook = async (request: Request, response: Response) => {
  const stripe = new Stripe(secretKey);

  let event;
  if (!request.body) {
    return;
  }

  try {
    const signature = request.headers["stripe-signature"] as string;
    if (!signature || typeof signature !== "string") {
      return;
    }
    event = stripe.webhooks.constructEvent(request.body, signature, webHookKey);
  } catch (error) {
    console.log(error);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // complete your customer's order
      // e.g. save the purchased product into your database
      // take the clientReferenceId to map your customer to a
      if (session.payment_status === "paid" && session.metadata) {
        const payment = new Payment({
          user_id: session.metadata.user_id, // Provide fallback value if necessary
          provider: session.metadata.provider,
          action: session.metadata.action,
          amount: session.metadata.amount,
          unit: session.metadata.unit,
          round: session.metadata.round,
          created_at: new Date(),
          timestamp: new Date(),
        });
        await payment.save();
      }
    } catch (error) {
      console.log(error);
    }
  }
};
