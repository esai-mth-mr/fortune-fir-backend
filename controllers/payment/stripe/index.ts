import { Request, Response } from "express";
import Stripe from "stripe";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { baseClientUrl, PAY_AMOUNT, priceIds, secretKey, webHookKey } from "../../../constants";

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

  let { current_round: currentRound } = user.current_status || {};


  const existingPayment = await Payment.findOne({
    user_id: userId,
    action,
    round: currentRound,
  });

  if (existingPayment) {
    user.current_status.current_round += 1;
    user.current_status.round_status = "progress";
    await user.save();
    currentRound += 1;
  }
  let price = priceIdsParsed[action];

  if (!price) {
    return res.status(400).json({
      error: true,
      message: "Invalid action provided, no price found.",
    });
  }

  const stripe = new Stripe(secretKey);

  try {
    const amount = PAY_AMOUNT;

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
