// Pure billing + coupon engine. No React, no side effects -> easy to unit test.
// Order: subtotal -> coupon discount -> GST -> shipping -> final payable.
export const CONFIG = { GST_RATE: 18, SHIPPING_FEE: 49, FREE_SHIP_ABOVE: 999 };

export const COUPONS = {
  WELCOME10:  { code: "WELCOME10",  type: "percent",  value: 10, minPurchase: 1000,  maxDiscount: 500,  expiresAt: "2030-12-31", active: true, label: "10% off over ₹1,000 (max ₹500)" },
  FLAT500:    { code: "FLAT500",    type: "flat",     value: 500, minPurchase: 5000, expiresAt: "2030-12-31", active: true, label: "₹500 off over ₹5,000" },
  FESTIVAL20: { code: "FESTIVAL20", type: "percent",  value: 20, minPurchase: 10000, maxDiscount: 2000, expiresAt: "2030-12-31", active: true, label: "20% off over ₹10,000 (max ₹2,000)" },
  FREESHIP:   { code: "FREESHIP",   type: "shipping", minPurchase: 0, expiresAt: "2030-12-31", active: true, label: "Free shipping" },
  BUY2GET1:   { code: "BUY2GET1",   type: "bogo",     minPurchase: 0, expiresAt: "2030-12-31", active: true, label: "3 accessories, cheapest free" },
  OLDDEAL:    { code: "OLDDEAL",    type: "flat",     value: 100, minPurchase: 0, expiresAt: "2020-01-01", active: true, hidden: true, label: "Expired (for testing)" },
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const inr = (n) => "₹" + n.toLocaleString("en-IN");

export const subtotalOf = (items) => items.reduce((s, i) => s + i.price * i.qty, 0);

export function evaluateCoupon(rawCode, items, now = new Date()) {
  const code = String(rawCode || "").trim().toUpperCase();
  const c = COUPONS[code];
  if (!code) return { ok: false, message: "Enter a coupon code." };
  if (!c || !c.active) return { ok: false, message: `"${code}" is not a valid coupon code.` };
  if (new Date(c.expiresAt) < now) return { ok: false, message: `Coupon ${code} has expired.` };
  if (!items.length) return { ok: false, message: "Your cart is empty. Add items to use a coupon." };

  const subtotal = subtotalOf(items);
  if (subtotal < c.minPurchase)
    return { ok: false, message: `${code} needs a minimum purchase of ${inr(c.minPurchase)}. Add ${inr(c.minPurchase - subtotal)} more.` };

  if (c.type === "percent") {
    const d = Math.min((subtotal * c.value) / 100, c.maxDiscount ?? Infinity);
    return { ok: true, coupon: c, discount: d, message: `${code} applied: ${c.value}% off.` };
  }
  if (c.type === "flat")
    return { ok: true, coupon: c, discount: Math.min(c.value, subtotal), message: `${code} applied: ₹${c.value} off.` };
  if (c.type === "shipping")
    return { ok: true, coupon: c, discount: 0, freeShipping: true, message: "FREESHIP applied: shipping is free." };
  if (c.type === "bogo") {
    const units = [];
    items.filter((i) => i.isAccessory).forEach((i) => { for (let k = 0; k < i.qty; k++) units.push(i); });
    if (units.length < 3)
      return { ok: false, message: `BUY2GET1 needs 3 accessories in your cart (you have ${units.length}).` };
    units.sort((a, b) => a.price - b.price);
    return { ok: true, coupon: c, discount: units[0].price, freeItemName: units[0].name, message: `BUY2GET1 applied: ${units[0].name} is free.` };
  }
  return { ok: false, message: "Unsupported coupon." };
}

export function computeBill(items, couponCode, cfg = CONFIG) {
  const subtotal = subtotalOf(items);
  let discount = 0, freeShipping = false, couponError = null, couponMessage = null, freeItemName = null;

  if (couponCode) {
    const r = evaluateCoupon(couponCode, items);
    if (r.ok) { discount = r.discount; freeShipping = !!r.freeShipping; couponMessage = r.message; freeItemName = r.freeItemName || null; }
    else couponError = r.message;
  }

  const taxable = Math.max(subtotal - discount, 0);
  const gst = (taxable * cfg.GST_RATE) / 100;                 // shipping is not taxed
  const shipping = !items.length || freeShipping || taxable > cfg.FREE_SHIP_ABOVE ? 0 : cfg.SHIPPING_FEE;
  const total = taxable + gst + shipping;

  return {
    subtotal: round2(subtotal), discount: round2(discount), gst: round2(gst),
    shipping: round2(shipping), total: round2(total),
    freeShipping, freeItemName, couponError, couponMessage,
  };
}
