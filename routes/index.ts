export const express = require("express");
const app = express();


const authRoutes = require("./auth");
const assetRoutes = require("./asset");

app.use("/auth", authRoutes);
app.use("/asset", assetRoutes);

module.exports = app;
