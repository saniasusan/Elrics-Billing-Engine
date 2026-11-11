const router = require("express").Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { asyncHandler, AppError } = require("../middleware/errors");
const { priceCart } = require("../services/cart");

const newOrderId = () =>
  "ELR-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

// POST /api/orders  { items: [{productId, quantity}], couponCode? }
router.post("/", asyncHandler(async (req, res) => {
  const { items: rawItems, couponCode } = req.body;
  if (!Array.isArray(rawItems) || rawItems.length === 0)
    throw new AppError(400, "Your cart is empty. Add items before placing an order.");

  // Re-validate stock, prices and coupon on the server at order time.
  const { items, bill } = await priceCart(rawItems, couponCode);
  if (bill.couponError) throw new AppError(400, bill.couponError);

  // Decrement stock atomically per product; roll back if any line fails.
  const done = [];
  try {
    for (const i of items) {
      const r = await Product.updateOne({ _id: i.productId, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity } });
      if (r.modifiedCount === 0) throw new AppError(409, `Only limited stock left for ${i.name}. Please review your cart.`);
      done.push(i);
    }
  } catch (err) {
    for (const i of done) await Product.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } });
    throw err;
  }

  const order = await Order.create({
    orderId: newOrderId(),
    items: items.map((i) => ({ product: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
    subtotal: bill.subtotal,
    discount: bill.discount,
    gst: bill.gst,
    shipping: bill.shipping,
    total: bill.total,
    coupon: bill.coupon,
  });

  res.status(201).json(order);
}));

router.get("/:orderId", asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).lean();
  if (!order) throw new AppError(404, "Order not found.");
  res.json(order);
}));

module.exports = router;
