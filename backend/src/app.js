const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/products", require("./routes/products"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/orders", require("./routes/orders"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
