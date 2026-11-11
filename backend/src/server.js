const mongoose = require("mongoose");
const config = require("./config");
const app = require("./app");

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(config.port, () => console.log(`API running on http://localhost:${config.port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
