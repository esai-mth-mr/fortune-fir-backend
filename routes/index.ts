export const express = require("express");
const app = express();


const authRoutes = require("./auth");
const assetRoutes = require("./asset");
const paymentRoutes = require("./payment");

app.use("/auth", authRoutes);
app.use("/asset", assetRoutes);
app.use("/payment", paymentRoutes);

module.exports = app;
