// Pure billing + coupon engine. Order: subtotal -> discount -> GST -> shipping -> total.
// items: [{ name, price, quantity, isAccessory }]

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const inr = (n) => "₹" + n.toLocaleString("en-IN");
const subtotalOf = (items) => items.reduce((s, i) => s + i.price * i.quantity, 0);

function evaluateCoupon(code, coupon, items, now = new Date()) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return { ok: false, message: "Enter a coupon code." };
  if (!coupon || !coupon.active) return { ok: false, message: `"${c}" is not a valid coupon code.` };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now)
    return { ok: false, message: `Coupon ${c} has expired.` };
  if (!items.length) return { ok: false, message: "Your cart is empty. Add items to use a coupon." };

  const subtotal = subtotalOf(items);
  if (subtotal < (coupon.minPurchase || 0))
    return {
      ok: false,
      message: `${c} needs a minimum purchase of ${inr(coupon.minPurchase)}. Add ${inr(coupon.minPurchase - subtotal)} more.`,
    };

  switch (coupon.type) {
    case "percent": {
      const discount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity);
      return { ok: true, code: c, discount, message: `${c} applied: ${coupon.value}% off.` };
    }
    case "flat":
      return { ok: true, code: c, discount: Math.min(coupon.value, subtotal), message: `${c} applied: ₹${coupon.value} off.` };
    case "shipping":
      return { ok: true, code: c, discount: 0, freeShipping: true, message: `${c} applied: shipping is free.` };
    case "bogo": {
      const units = [];
      items.filter((i) => i.isAccessory).forEach((i) => {
        for (let k = 0; k < i.quantity; k++) units.push(i);
      });
      if (units.length < 3)
        return { ok: false, message: `${c} needs 3 accessories in your cart (you have ${units.length}).` };
      units.sort((a, b) => a.price - b.price);
      return { ok: true, code: c, discount: units[0].price, freeItemName: units[0].name, message: `${c} applied: ${units[0].name} is free.` };
    }
    default:
      return { ok: false, message: "Unsupported coupon type." };
  }
}

function computeBill(items, couponResult, cfg) {
  const subtotal = subtotalOf(items);
  const ok = couponResult && couponResult.ok;
  const discount = ok ? couponResult.discount : 0;
  const freeShipping = !!(ok && couponResult.freeShipping);

  const taxable = Math.max(subtotal - discount, 0);
  const gst = (taxable * cfg.GST_RATE) / 100; // shipping is not taxed
  const shipping = !items.length || freeShipping || taxable > cfg.FREE_SHIP_ABOVE ? 0 : cfg.SHIPPING_FEE;
  const total = taxable + gst + shipping;

  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    gst: round2(gst),
    shipping: round2(shipping),
    total: round2(total),
    coupon: ok ? couponResult.code : null,
    couponMessage: ok ? couponResult.message : null,
    couponError: couponResult && !couponResult.ok ? couponResult.message : null,
    freeItemName: ok ? couponResult.freeItemName || null : null,
  };
}

module.exports = { evaluateCoupon, computeBill, subtotalOf, round2 };
