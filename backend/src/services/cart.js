const mongoose = require("mongoose");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const config = require("../config");
const { AppError } = require("../middleware/errors");
const { evaluateCoupon, computeBill } = require("./billing");

// Validates the raw request items against the database. Never trusts client prices.
async function resolveItems(rawItems) {
  if (!Array.isArray(rawItems)) throw new AppError(400, "items must be an array.");

  const merged = new Map(); // duplicate products are merged into one line
  for (const r of rawItems) {
    if (!mongoose.isValidObjectId(r?.productId)) throw new AppError(400, "Invalid product id.");
    const q = Number(r.quantity);
    if (!Number.isInteger(q) || q <= 0) throw new AppError(400, "Quantity must be a positive whole number.");
    const key = String(r.productId);
    merged.set(key, (merged.get(key) || 0) + q);
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } }).lean();
  if (products.length !== merged.size) throw new AppError(404, "One or more products were not found.");

  return products.map((p) => {
    const quantity = merged.get(String(p._id));
    if (quantity > p.stock) throw new AppError(409, `Only ${p.stock} of ${p.name} in stock.`);
    return { productId: p._id, name: p.name, price: p.price, quantity, isAccessory: p.isAccessory };
  });
}

async function priceCart(rawItems, couponCode) {
  const items = await resolveItems(rawItems);
  let couponResult = null;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code }).lean();
    couponResult = evaluateCoupon(code, coupon, items);
  }
  return { items, bill: computeBill(items, couponResult, config) };
}

module.exports = { resolveItems, priceCart };
