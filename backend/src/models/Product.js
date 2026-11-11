const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: String,
    description: String,
    isAccessory: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("Product", productSchema);
