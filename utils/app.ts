import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser"
import { baseClientUrl } from "../constants";
import path from "path";

const urlencodedParser = bodyParser.urlencoded({ extended: true });

const cors = require('cors') // HTTP headers (enable requests)
const app = express()

app.use(express.static(path.join(__dirname, '../dist')));

// Handle other routes and return the main index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve static files from the 'storage' directory
app.use('/storage', express.static('storage'));

const corsOptions = {
  origin: baseClientUrl, 
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
