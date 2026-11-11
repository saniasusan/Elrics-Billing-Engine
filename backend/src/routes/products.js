const router = require("express").Router();
const Product = require("../models/Product");
const { asyncHandler } = require("../middleware/errors");

router.get("/", asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 }).lean();
  res.json(products);
}));

module.exports = router;
