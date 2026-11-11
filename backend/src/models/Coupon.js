const { Schema, model } = require("mongoose");

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "flat", "shipping", "bogo"], required: true },
  value: { type: Number, default: 0 },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true },
});

module.exports = model("Coupon", couponSchema);
