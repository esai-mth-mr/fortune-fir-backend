import { Request, Response } from "express";
// import bcrypt from 'bcrypt';
import Stripe from "stripe";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { baseClientUrl } from "../../../constants";

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

  const user = await User.findOne({ _id: user_id });
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  const payment = await Payment.findOne({ user_id: user_id, action: action });
  if (payment) {
    return res
      .status(400)
      .send({ error: "Payment already exists for this action" });
  }

  const round = user.current_status.current_round;
  const stripe = new Stripe(secretKey);
  let session;

  try {
    price_ids = JSON.parse(priceIds);

    if (!price_ids[action]) {
      return res.status(400).send({ error: "Invalid action provided" });
    }
    const price = price_ids[action];
    if (!price) {
      return res
        .status(400)
        .send({ error: "Invalid action provided, no price found." });
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
    console.log("this is session id:", session?.id);
    return res.status(200).send({ sessionId: session?.id });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
};

export const sessionComplete = async (req: Request, res: Response) => {
  const stripe = new Stripe(secretKey);
  console.log("----------endpoint test---")

  let event;

  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature || typeof signature !== "string") {
      console.log("-----------signature error----------")
      return;
    }

    event = stripe.webhooks.constructEvent(req.body, signature , webHookKey);
  } catch (error) {
    console.log("-----------error in signation--------")
    console.log(error);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("----------session log-------", session)
    try {
      // complete your customer's order
      // e.g. save the purchased product into your database
      // take the clientReferenceId to map your customer to a
      if (session.metadata) {
        const payment = new Payment({
          user_id: session.metadata.user_id, // Provide fallback value if necessary
          provider: session.metadata.provider,
          action: session.metadata.action,
          amount: session.metadata.amount,
          unit: session.metadata.unit,
          round: session.metadata.round,
        });
        await payment.save();
      }
    } catch (error) {
      console.log(error)
    }
  } else {
    console.log("---------------")
  }
};
