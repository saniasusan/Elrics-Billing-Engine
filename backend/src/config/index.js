require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/elrics-billing",
  GST_RATE: Number(process.env.GST_RATE ?? 18),
  SHIPPING_FEE: Number(process.env.SHIPPING_FEE ?? 49),
  FREE_SHIP_ABOVE: Number(process.env.FREE_SHIP_ABOVE ?? 999),
};
