export const express = require("express");
const app = express();


const authRoutes = require("./auth");
const assetRoutes = require("./asset");
const storyRoutes = require("./story");

app.use("/auth", authRoutes);
app.use("/asset", assetRoutes);
app.use("/story", storyRoutes);

module.exports = app;
