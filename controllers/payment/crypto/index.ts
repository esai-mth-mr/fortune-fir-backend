import { Response, Request } from "express";
import { NextFunction } from "express";
import User from "../../../models/User";
import Payment from "../../../models/Payment";
import {
  SUBSCRIPTION_BASE_URL,
  PAYMENT_CALLBACK_URL,
} from "../../../constants";
import axios from "axios";
import { npSignatureCheck } from "../../../functions/payment/crypto";
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
console.log(NOWPAYMENTS_API_KEY);
export const payment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { pay_currency, userId } = req.body;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.json({ error: true, message: "You are not registered." });
    }
    console.log("----------before data");

    const data = await packPayment(userId, pay_currency);
    console.log("----------data");
    return res.status(200).json(data);
  } catch (err: any) {
    next(err);
  }
};

export const packPayment = async (userId: string, payCurrency: string) => {
  try {
    const PAY_AMOUNT = 0.99;
    // const isAvailableDate = await isChrismas();
    // const PAY_AMOUNT = isAvailableDate ? 0.99 : 1.99;
    //create a unique deposit address
    const data = {
      price_amount: PAY_AMOUNT,
      price_currency: "USD",
      pay_currency: payCurrency,
      order_id: userId,
      ipn_callback_url: PAYMENT_CALLBACK_URL,
    };

    const response = await axios.post(
      // `${SUBSCRIPTION_BASE_URL}/payment`,
      "https://api.sandbox.nowpayments.io/v1/payment",
      data,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("ererer" + response.data);
    return response.data;
  } catch (error: any) {
    console.log("-------error", error);
    throw new Error(error.response.data.message);
  }
};

export const updatePack = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;
    console.log("BODY: ", body);
    const sortedMsg = JSON.stringify(
      Object.keys(body)
        .sort()
        .reduce((obj: any, key) => {
          obj[key] = body[key];
          return obj;
        }, {})
    );
    // Signature Check from the callback
    const npXSignature = req.headers["x-nowpayments-sig"] as string;
    if (!npSignatureCheck(sortedMsg, npXSignature)) {
      return res.status(400).json({ message: "Signature does match!" });
    }
    const status = body.payment_status;
    if (status === "finished") {
      console.log("============FINISHED");
      const id = body.order_id;
      // const result = await User.updateOne(
      // { userId: id},
      // {
      //     $inc: {
      //         xs: body.price_amount,
      //         entry: body.price_amount,
      //         point: body.price_amount * 1000000
      //     }
      // });
      //   await addBalance(id, body.price_amount.toString(), "xs");
      //   await addBalance(id, body.price_amount.toString(), "entry");
      //   await addBalance(id, (body.price_amount * 1000000).toString(), "point");
      // if (result.modifiedCount > 0) {
      // ADD Transation
      const payment = new Payment({
        userId: id,
        currency: body.pay_currency,
        user_id: body.userId, // Provide fallback value if necessary
        provider: "crypto",
        action: body.action,
        amount: body.price_amount,
        unit: body.unit,
        round: body.round,
        created_at: new Date(),
        timestamp: new Date(),
      });
      //   await transaction.save();
      // TODO: Notification to user.
      console.log("User is updated.");
      return res.status(200).json({ message: "User updated successfully" });
      // } else {
      //     console.log(" User Update is Failed.");
      //     return res.status(404).json({ message: 'User not found or no changes made' });
      // }
    } else {
      // TODO: According to the body type
      console.log("Status is NOT FINISHED. : ", status);
      return res.status(200).send({ status });
    }
  } catch (error: any) {
    next(error);
  }
};
