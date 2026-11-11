const mongoose = require("mongoose");
const config = require("./config");
const Product = require("./models/Product");
const Coupon = require("./models/Coupon");

const img = (seed) => `https://picsum.photos/seed/${seed}/480/320`;

const products = [
  { name: "Wireless Headphones", category: "Audio", price: 3499, stock: 12, isAccessory: false, image: img("headphones"), description: "Over-ear, 30-hour battery, active noise cancellation." },
  { name: "Bluetooth Speaker", category: "Audio", price: 2299, stock: 8, isAccessory: false, image: img("speaker"), description: "Portable, water-resistant, 12-hour playtime." },
  { name: "Smart Watch", category: "Wearables", price: 6999, stock: 5, isAccessory: false, image: img("smartwatch"), description: "AMOLED display, heart-rate and sleep tracking." },
  { name: "Laptop Backpack", category: "Bags", price: 1799, stock: 15, isAccessory: false, image: img("backpack"), description: "Fits 15.6 inch laptops, padded straps, USB port." },
  { name: "Gaming Laptop", category: "Computers", price: 64999, stock: 3, isAccessory: false, image: img("laptop"), description: "16 GB RAM, 512 GB SSD, dedicated graphics." },
  { name: "USB-C Cable", category: "Accessories", price: 299, stock: 50, isAccessory: true, image: img("cable"), description: "1 m braided fast-charge cable." },
  { name: "Phone Case", category: "Accessories", price: 499, stock: 30, isAccessory: true, image: img("phonecase"), description: "Shockproof transparent case." },
  { name: "Wireless Mouse", category: "Accessories", price: 799, stock: 20, isAccessory: true, image: img("mouse"), description: "Silent clicks, 2.4 GHz receiver." },
  { name: "Screen Protector", category: "Accessories", price: 199, stock: 2, isAccessory: true, image: img("screen"), description: "Tempered glass, 9H hardness." },
  { name: "Mechanical Keyboard", category: "Computers", price: 4299, stock: 0, isAccessory: false, image: img("keyboard"), description: "Hot-swappable switches, RGB backlight." },
];

const far = new Date("2030-12-31");
const coupons = [
  { code: "WELCOME10", type: "percent", value: 10, minPurchase: 1000, maxDiscount: 500, expiresAt: far },
  { code: "FLAT500", type: "flat", value: 500, minPurchase: 5000, expiresAt: far },
  { code: "FESTIVAL20", type: "percent", value: 20, minPurchase: 10000, maxDiscount: 2000, expiresAt: far },
  { code: "FREESHIP", type: "shipping", minPurchase: 0, expiresAt: far },
  { code: "BUY2GET1", type: "bogo", minPurchase: 0, expiresAt: far },
  { code: "OLDDEAL", type: "flat", value: 100, minPurchase: 0, expiresAt: new Date("2020-01-01") }, // expired, for testing
];

(async () => {
  await mongoose.connect(config.mongoUri);
  await Product.deleteMany({});
  await Coupon.deleteMany({});
  await Product.insertMany(products);
  await Coupon.insertMany(coupons);
  console.log(`Seeded ${products.length} products and ${coupons.length} coupons.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
