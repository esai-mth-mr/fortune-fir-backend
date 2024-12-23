import { Request, Response } from "express";
// import bcrypt from 'bcrypt';
import Stripe from "stripe";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { baseClientUrl } from "../../../constants";
import { json } from "body-parser";

let price_ids: {
  [action: string]: string; // Define the shape of the price_ids object
};
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
interface PaymentSessionRequestBody {
  action: string; // Ensures action must be one of the keys from PriceIds
  userId: string;
}

export const sessionInitiate = async (
  req: Request<{}, {}, PaymentSessionRequestBody>,
  res: Response
) => {
  const { action } = req.body;
  const user_id = req.body.userId;
  //user exists or not
  const user = await User.findOne({ _id: user_id });
  if (!user) {
    return res.status(404).json({
      error: true,
      message: "You are not registered in our app",
    });
  }
  //use already paid or not
  const round = user.current_status.current_round;
  const payment = await Payment.findOne({
    user_id: user_id,
    action: action,
    round: round,
  });

  if (payment) {
    return res.status(400).json({ error: false, message: "You already paid." });
  }

  const stripe = new Stripe(secretKey);
  let session;

  try {
    price_ids = JSON.parse(priceIds);
    if (!price_ids[action]) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid action provided" });
    }
    const price = price_ids[action];
    if (!price) {
      return res.status(400).json({
        error: true,
        message: "Invalid action provided, no price found.",
      });
    }
    session = await stripe.checkout.sessions.create({
      //client_reference_id: clientReferenceId,
      //customer_email: customerEmail,
      payment_method_types: ["card"],
      metadata: {
        action: action,
        user_id: user_id,
        provider: "stripe",
        amount: 0.99,
        unit: "USD",
        round: round,
      },
      mode: "payment",
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      success_url: `${baseClientUrl}/payment/success`,
      cancel_url: `${baseClientUrl}/payment/cancel`,
    });
    return res.status(200).send({ sessionId: session?.id });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};
