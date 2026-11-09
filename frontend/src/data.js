// Replace with fetch("/api/products") once the Express backend is ready.
const img = (seed) => `https://picsum.photos/seed/${seed}/480/320`;
export const PRODUCTS = [
  { id: "p1",  name: "Wireless Headphones",  category: "Audio",       price: 3499, stock: 12, isAccessory: false, image: img("headphones"), description: "Over-ear, 30-hour battery, active noise cancellation." },
  { id: "p2",  name: "Bluetooth Speaker",    category: "Audio",       price: 2299, stock: 8,  isAccessory: false, image: img("speaker"),    description: "Portable, water-resistant, 12-hour playtime." },
  { id: "p3",  name: "Smart Watch",          category: "Wearables",   price: 6999, stock: 5,  isAccessory: false, image: img("smartwatch"), description: "AMOLED display, heart-rate and sleep tracking." },
  { id: "p4",  name: "Laptop Backpack",      category: "Bags",        price: 1799, stock: 15, isAccessory: false, image: img("backpack"),   description: "Fits 15.6 inch laptops, padded straps, USB port." },
  { id: "p5",  name: "Gaming Laptop",        category: "Computers",   price: 64999, stock: 3, isAccessory: false, image: img("laptop"),     description: "16 GB RAM, 512 GB SSD, dedicated graphics." },
  { id: "p6",  name: "USB-C Cable",          category: "Accessories", price: 299,  stock: 50, isAccessory: true,  image: img("cable"),      description: "1 m braided fast-charge cable." },
  { id: "p7",  name: "Phone Case",           category: "Accessories", price: 499,  stock: 30, isAccessory: true,  image: img("phonecase"),  description: "Shockproof transparent case." },
  { id: "p8",  name: "Wireless Mouse",       category: "Accessories", price: 799,  stock: 20, isAccessory: true,  image: img("mouse"),      description: "Silent clicks, 2.4 GHz receiver." },
  { id: "p9",  name: "Screen Protector",     category: "Accessories", price: 199,  stock: 2,  isAccessory: true,  image: img("screen"),     description: "Tempered glass, 9H hardness." },
  { id: "p10", name: "Mechanical Keyboard",  category: "Computers",   price: 4299, stock: 0,  isAccessory: false, image: img("keyboard"),   description: "Hot-swappable switches, RGB backlight." },
];
