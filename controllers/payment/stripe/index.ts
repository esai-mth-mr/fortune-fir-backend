import { Request, Response } from "express";
import Stripe from "stripe";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { baseClientUrl } from "../../../constants";
import { isChrismas } from "../../../functions/story";

const webHookKey = process.env.STRIPE_WEBHOOK_SECRET;
const secretKey = process.env.STRIPE_SECRET_KEY;
const priceIds = process.env.STRIPE_PRICE_IDS;

if (!webHookKey || !secretKey || !priceIds) {
  throw new Error("Missing required Stripe environment variables");
}

const priceIdsParsed = JSON.parse(priceIds) as Record<string, string>;

interface PaymentSessionRequestBody {
  action: string;
  userId: string;
}

export const sessionInitiate = async (
  req: Request<{}, {}, PaymentSessionRequestBody>,
  res: Response
) => {
  const { action, userId } = req.body;

  if (!action || !userId) {
    return res.status(400).json({
      error: true,
      message: "Action and userId are required",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      error: true,
      message: "You are not registered in our app",
    });
  }

  const { current_round: currentRound } = user.current_status || {};
  const existingPayment = await Payment.findOne({
    user_id: userId,
    action,
    round: currentRound,
  });

  if (existingPayment) {
    return res.status(400).json({
      error: true,
      message: "You already paid.",
    });
  }
  const isAvailableDate = await isChrismas();
  let price = priceIdsParsed[action];
  if (action === "preview") {
    price = isAvailableDate ? priceIdsParsed[action] : priceIdsParsed["preview-enhance"]
  }
  if (!price) {
    return res.status(400).json({
      error: true,
      message: "Invalid action provided, no price found.",
    });
  }

  const stripe = new Stripe(secretKey);

  try {
    const amount = isAvailableDate ? 0.99 : 1.99;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        action,
        user_id: userId,
        provider: "stripe",
        amount,
        unit: "USD",
        round: currentRound,
      },
      mode: "payment",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: `${baseClientUrl}/payment/success`,
      cancel_url: `${baseClientUrl}/payment/cancel`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error! Please try again later!",
    });
  }
};
