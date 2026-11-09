import { useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "./data";
import { computeBill, evaluateCoupon, COUPONS, CONFIG } from "./billing";
import "./App.css";

const inr = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (n) => "₹" + n.toLocaleString("en-IN");

export default function App() {
  const [products, setProducts] = useState(PRODUCTS);
  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState("");
  const [couponMsg, setCouponMsg] = useState(null); // { type: "ok" | "error", text }
  const [toast, setToast] = useState(null);
  const [order, setOrder] = useState(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const items = useMemo(
    () => cart.map((l) => ({ ...products.find((p) => p.id === l.id), qty: l.qty })),
    [cart, products]
  );
  const bill = useMemo(() => computeBill(items, applied), [items, applied]);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const visible = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const notify = (type, text) => setToast({ type, text });

  // Re-validate the active coupon whenever cart changes; drop it if no longer valid.
  useEffect(() => {
    if (applied && bill.couponError) {
      setCouponMsg({ type: "error", text: `${bill.couponError} ${applied} was removed.` });
      setApplied("");
    }
  }, [applied, bill.couponError]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- cart actions ---------- */
  const addToCart = (p) => {
    const line = cart.find((l) => l.id === p.id);
    const current = line ? line.qty : 0;
    if (p.stock <= 0) return notify("error", `${p.name} is out of stock.`);
    if (current + 1 > p.stock) return notify("error", `Only ${p.stock} of ${p.name} in stock.`);
    // Duplicate product -> increment existing line, never a second line.
    setCart(line ? cart.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...cart, { id: p.id, qty: 1 }]);
  };

  const setQty = (id, raw) => {
    const p = products.find((x) => x.id === id);
    let n = Number(raw);
    if (raw === "" || Number.isNaN(n)) return;
    if (n < 0) return notify("error", "Quantity cannot be negative.");
    n = Math.floor(n);
    if (n === 0) return removeLine(id);
    if (n > p.stock) {
      notify("error", `Only ${p.stock} of ${p.name} in stock.`);
      n = p.stock;
    }
    setCart(cart.map((l) => (l.id === id ? { ...l, qty: n } : l)));
  };

  const removeLine = (id) => setCart(cart.filter((l) => l.id !== id));

  const clearCart = () => {
    setCart([]);
    setApplied("");
    setCouponMsg(null);
  };

  /* ---------- coupon actions ---------- */
  const applyCoupon = (rawCode = codeInput) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return setCouponMsg({ type: "error", text: "Enter a coupon code." });
    if (applied) {
      return setCouponMsg({
        type: "error",
        text: applied === code ? `${code} is already applied.` : `Only one coupon at a time. Remove ${applied} first.`,
      });
    }
    const r = evaluateCoupon(code, items);
    if (!r.ok) return setCouponMsg({ type: "error", text: r.message });
    setApplied(code);
    setCouponMsg({ type: "ok", text: r.message });
    setCodeInput("");
  };

  const removeCoupon = () => {
    setApplied("");
    setCouponMsg(null);
  };

  /* ---------- order ---------- */
  const placeOrder = () => {
    if (!items.length) return notify("error", "Your cart is empty. Add items before placing an order.");
    // Re-validate everything at the moment of ordering.
    for (const i of items) {
      const p = products.find((x) => x.id === i.id);
      if (i.qty > p.stock) return notify("error", `Only ${p.stock} of ${p.name} left in stock.`);
    }
    const fresh = computeBill(items, applied);
    if (fresh.couponError) {
      setApplied("");
      setCouponMsg({ type: "error", text: `${fresh.couponError} ${applied} was removed.` });
      return notify("error", "Coupon is no longer valid. Review your total and try again.");
    }
    setOrder({
      orderId: "ELR-" + Date.now().toString(36).toUpperCase(),
      items,
      coupon: applied || null,
      ...fresh,
      placedAt: new Date(),
    });
    setProducts(products.map((p) => {
      const line = cart.find((l) => l.id === p.id);
      return line ? { ...p, stock: p.stock - line.qty } : p;
    }));
    clearCart();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Elrics<span>Store</span></div>
        <div className="cart-pill" aria-live="polite">
          Cart · {itemCount} {itemCount === 1 ? "item" : "items"}
        </div>
      </header>

      {toast && <div className={`toast ${toast.type}`} role="status">{toast.text}</div>}

      {order ? (
        <Confirmation order={order} onDone={() => setOrder(null)} />
      ) : (
        <main className="layout">
          <section className="catalog">
            <div className="filters">
              <input
                className="search"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
              <div className="chips">
                {categories.map((c) => (
                  <button key={c} className={`chip ${c === category ? "on" : ""}`} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="empty">No products match your search. Try a different name or category.</p>
            ) : (
              <div className="grid">
                {visible.map((p) => (
                  <article key={p.id} className="card">
                    <img src={p.image} alt={p.name} loading="lazy" />
                    <div className="card-body">
                      <span className="cat">{p.category}</span>
                      <h3>{p.name}</h3>
                      <p className="desc">{p.description}</p>
                      <div className="card-foot">
                        <div>
                          <div className="price">{inr0(p.price)}</div>
                          <div className={`stock ${p.stock === 0 ? "out" : p.stock <= 5 ? "low" : ""}`}>
                            {p.stock === 0 ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : `${p.stock} in stock`}
                          </div>
                        </div>
                        <button className="btn" disabled={p.stock === 0} onClick={() => addToCart(p)}>
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="panel">
            <div className="panel-head">
              <h2>Your cart</h2>
              {items.length > 0 && <button className="link" onClick={clearCart}>Clear cart</button>}
            </div>

            {items.length === 0 ? (
              <p className="empty">Your cart is empty. Add a product to get started.</p>
            ) : (
              <ul className="lines">
                {items.map((i) => (
                  <li key={i.id} className="line">
                    <div className="line-info">
                      <strong>{i.name}</strong>
                      <span>{inr0(i.price)} each</span>
                    </div>
                    <div className="qty">
                      <button aria-label={`Decrease ${i.name}`} onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                      <input
                        type="number"
                        min="1"
                        max={i.stock}
                        value={i.qty}
                        onChange={(e) => setQty(i.id, e.target.value)}
                        aria-label={`${i.name} quantity`}
                      />
                      <button aria-label={`Increase ${i.name}`} onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                    </div>
                    <div className="line-total">{inr0(i.price * i.qty)}</div>
                    <button className="remove" aria-label={`Remove ${i.name}`} onClick={() => removeLine(i.id)}>✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="coupon">
              <h3>Coupon</h3>
              {applied ? (
                <div className="applied">
                  <span><b>{applied}</b> applied</span>
                  <button className="link" onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <div className="coupon-row">
                  <input
                    placeholder="Enter code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    aria-label="Coupon code"
                  />
                  <button className="btn alt" onClick={() => applyCoupon()}>Apply</button>
                </div>
              )}
              {couponMsg && <p className={`msg ${couponMsg.type}`}>{couponMsg.text}</p>}
              {!applied && (
                <div className="hints">
                  {Object.values(COUPONS).filter((c) => !c.hidden).map((c) => (
                    <button key={c.code} className="hint" title={c.label} onClick={() => { setCodeInput(c.code); applyCoupon(c.code); }}>
                      {c.code}
                    </button>
                  ))}
                  <button className="hint" title="Expired (for testing)" onClick={() => { setCodeInput("OLDDEAL"); applyCoupon("OLDDEAL"); }}>
                    OLDDEAL
                  </button>
                </div>
              )}
            </div>

            <dl className="summary">
              <Row label="Subtotal" value={inr(bill.subtotal)} />
              <Row
                label={applied && !bill.couponError ? `Discount (${applied})` : "Discount"}
                value={bill.discount > 0 ? "− " + inr(bill.discount) : inr(0)}
                good={bill.discount > 0}
              />
              {bill.freeItemName && <p className="note">{bill.freeItemName} is free</p>}
              <Row label={`GST (${CONFIG.GST_RATE}%)`} value={inr(bill.gst)} />
              <Row
                label="Shipping"
                value={items.length === 0 ? inr(0) : bill.shipping === 0 ? "Free" : inr(bill.shipping)}
                good={items.length > 0 && bill.shipping === 0}
              />
              {items.length > 0 && bill.shipping > 0 && (
                <p className="note">Free shipping above {inr0(CONFIG.FREE_SHIP_ABOVE)}</p>
              )}
              <div className="total">
                <dt>Total payable</dt>
                <dd>{inr(bill.total)}</dd>
              </div>
            </dl>

            <button className="btn big" onClick={placeOrder}>Place order</button>
          </aside>
        </main>
      )}
    </div>
  );
}

function Row({ label, value, good }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd className={good ? "good" : ""}>{value}</dd>
    </div>
  );
}

function Confirmation({ order, onDone }) {
  return (
    <main className="confirm">
      <div className="tick" aria-hidden>✓</div>
      <h1>Order placed</h1>
      <p className="oid">Order ID <b>{order.orderId}</b></p>
      <ul className="lines">
        {order.items.map((i) => (
          <li key={i.id} className="line simple">
            <span>{i.name} × {i.qty}</span>
            <span>{inr0(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="summary">
        <Row label="Subtotal" value={inr(order.subtotal)} />
        <Row label={order.coupon ? `Discount (${order.coupon})` : "Discount"} value={order.discount > 0 ? "− " + inr(order.discount) : inr(0)} good={order.discount > 0} />
        <Row label={`GST (${CONFIG.GST_RATE}%)`} value={inr(order.gst)} />
        <Row label="Shipping" value={order.shipping === 0 ? "Free" : inr(order.shipping)} good={order.shipping === 0} />
        <div className="total"><dt>Total paid</dt><dd>{inr(order.total)}</dd></div>
      </dl>
      <button className="btn big" onClick={onDone}>Continue shopping</button>
    </main>
  );
}
