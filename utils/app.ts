import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser"
import { baseClientUrl } from "../constants";

const urlencodedParser = bodyParser.urlencoded({ extended: true });

const cors = require('cors') // HTTP headers (enable requests)
const {ORIGIN} = require('../constants')
// initialize app
const app = express()

const corsOptions = {
  origin: baseClientUrl, // Replace with your frontend URL
  methods: ['GET', 'POST', 'DELETE', 'UPDATE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Include cookies in requests
};

app.use(cors(corsOptions));
// middlewares
app.use(urlencodedParser) // body parser
app.use(express.json())

// // error handling
app.use((err : Error, req : Request, res : Response, next : NextFunction) => {
  console.error(err)
  res.status(500).send()
  next()
})

module.exports = app
