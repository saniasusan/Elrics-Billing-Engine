const { evaluateCoupon, computeBill } = require("../src/services/billing");

const cfg = { GST_RATE: 18, SHIPPING_FEE: 49, FREE_SHIP_ABOVE: 999 };
const far = new Date("2030-12-31");
const speaker = { name: "Speaker", price: 2299, quantity: 2, isAccessory: false };
const bill = (items, code, coupon) => computeBill(items, code ? evaluateCoupon(code, coupon, items) : null, cfg);

test("no coupon: GST on subtotal, free shipping above threshold", () => {
  const b = bill([speaker]);
  expect(b).toMatchObject({ subtotal: 4598, discount: 0, gst: 827.64, shipping: 0, total: 5425.64 });
});

test("small cart pays shipping", () => {
  const b = bill([{ name: "Cable", price: 299, quantity: 1, isAccessory: true }]);
  expect(b.shipping).toBe(49);
  expect(b.total).toBe(round(299 * 1.18 + 49));
});

test("WELCOME10: 10% off, GST after discount", () => {
  const b = bill([speaker], "WELCOME10", { code: "WELCOME10", type: "percent", value: 10, minPurchase: 1000, maxDiscount: 500, expiresAt: far, active: true });
  expect(b).toMatchObject({ discount: 459.8, gst: 744.88, total: 4883.08 });
});

test("WELCOME10 is capped at 500", () => {
  const items = [{ name: "Laptop", price: 64999, quantity: 1, isAccessory: false }];
  const b = bill(items, "WELCOME10", { code: "WELCOME10", type: "percent", value: 10, minPurchase: 1000, maxDiscount: 500, expiresAt: far, active: true });
  expect(b.discount).toBe(500);
});

test("below minimum purchase is rejected with a message", () => {
  const items = [{ name: "Cable", price: 299, quantity: 1, isAccessory: true }];
  const r = evaluateCoupon("FLAT500", { code: "FLAT500", type: "flat", value: 500, minPurchase: 5000, expiresAt: far, active: true }, items);
  expect(r.ok).toBe(false);
  expect(r.message).toMatch(/minimum purchase/);
});

test("expired and unknown coupons are rejected", () => {
  const items = [speaker];
  expect(evaluateCoupon("OLD", { code: "OLD", type: "flat", value: 100, expiresAt: new Date("2020-01-01"), active: true }, items).message).toMatch(/expired/);
  expect(evaluateCoupon("NOPE", null, items).message).toMatch(/not a valid/);
});

test("BUY2GET1: cheapest accessory is free, needs 3 units", () => {
  const coupon = { code: "BUY2GET1", type: "bogo", expiresAt: far, active: true };
  const items = [
    { name: "Cable", price: 299, quantity: 1, isAccessory: true },
    { name: "Case", price: 499, quantity: 1, isAccessory: true },
    { name: "Mouse", price: 799, quantity: 1, isAccessory: true },
  ];
  expect(evaluateCoupon("BUY2GET1", coupon, items)).toMatchObject({ ok: true, discount: 299, freeItemName: "Cable" });
  expect(evaluateCoupon("BUY2GET1", coupon, items.slice(0, 2)).ok).toBe(false);
});

test("FREESHIP removes the shipping fee", () => {
  const items = [{ name: "Cable", price: 299, quantity: 1, isAccessory: true }];
  const b = bill(items, "FREESHIP", { code: "FREESHIP", type: "shipping", expiresAt: far, active: true });
  expect(b.shipping).toBe(0);
});

function round(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
