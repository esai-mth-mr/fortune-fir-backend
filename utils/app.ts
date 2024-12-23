import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import { ORIGIN } from "../constants";
import path from "path";
import { stripewebHook } from "../controllers/payment/stripe/webHook";
const urlencodedParser = bodyParser.urlencoded({ extended: true });

const cors = require("cors"); // HTTP headers (enable requests)

// initialize app
const app = express();

app.post(
  "/api/payment/stripe/session-complete",
  express.raw({ type: "application/json" }),
  stripewebHook
);

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
