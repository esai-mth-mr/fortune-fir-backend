export const express = require("express");
const app = express();


const authRoutes = require("./auth");
const assetRoutes = require("./asset");
const paymentRoutes = require("./payment");
const storyRoutes = require("./story");
const contactRoutes = require("./contact");

app.use("/auth", authRoutes);
app.use("/asset", assetRoutes);
app.use("/payment", paymentRoutes);
app.use("/story", storyRoutes);
app.use("/contact", contactRoutes);

module.exports = app;
