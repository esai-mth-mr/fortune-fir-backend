import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import { ORIGIN } from "../constants";
import path from "path";
import Stripe from "stripe";
import Payment from "../models/Payment";

const urlencodedParser = bodyParser.urlencoded({ extended: true });

const cors = require("cors"); // HTTP headers (enable requests)

// initialize app
const app = express();

const webHookKey = process.env.STRIPE_WEBHOOK_SECRET;
const secretKey = process.env.STRIPE_SECRET_KEY ;
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

app.post('/api/payment/stripe/session-complete', express.raw({ type: 'application/json' }), async (request: Request, response: Response) => {

  const stripe = new Stripe(secretKey);

  let event;

  try {
    const signature = request.headers["stripe-signature"] as string;
    if (!signature || typeof signature !== "string") {
      console.log("-----------signature error----------")
      return;
    }
    console.log('--------signature data-----', signature);
    event = stripe.webhooks.constructEvent(request.body, signature , webHookKey);
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
      if (session.payment_status ==="paid" && session.metadata) {
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
      console.log(error)
    }
  } else {
    console.log("---------------")
  }

})


// middlewares
app.use(cors({ origin: ORIGIN }));

app.use(express.static(path.join(__dirname, "../dist")));

// Handle other routes and return the main index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Serve static files from the 'storage' directory
app.use("/storage", express.static("storage"));

app.use(cors({ origin: ORIGIN }));
// middlewares

app.use(urlencodedParser); // body parser
app.use(express.json());

// // error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send();
  next();
});

module.exports = app;
