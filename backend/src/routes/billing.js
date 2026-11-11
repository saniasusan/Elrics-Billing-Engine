const router = require("express").Router();
const { asyncHandler, AppError } = require("../middleware/errors");
const { priceCart } = require("../services/cart");

// POST /api/billing/preview  { items: [{productId, quantity}], couponCode? }
router.post("/preview", asyncHandler(async (req, res) => {
  const { items, couponCode } = req.body;
  const priced = await priceCart(items, couponCode);
  res.json(priced.bill);
}));

// POST /api/billing/coupon  { items, couponCode }  -> validate one coupon
router.post("/coupon", asyncHandler(async (req, res) => {
  const { items, couponCode } = req.body;
  if (!couponCode) throw new AppError(400, "Enter a coupon code.");
  const { bill } = await priceCart(items, couponCode);
  res.json({ valid: !bill.couponError, message: bill.couponError || bill.couponMessage, bill });
}));

module.exports = router;
