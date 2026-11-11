const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: Number,
    discount: Number,
    gst: Number,
    shipping: Number,
    total: Number,
    coupon: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = model("Order", orderSchema);
