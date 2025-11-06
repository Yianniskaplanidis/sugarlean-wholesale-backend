// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());        // ← parses JSON bodies
app.use(morgan("dev"));

// routes
const wholesaleRoutes = require("./routes/wholesale");
const diagRoutes = require("./routes/diag");

app.use("/api/wholesale", wholesaleRoutes);
app.use("/api/wholesale", diagRoutes);

// root
app.get("/", (_req, res) => {
  res.send({
    message: "Sugarlean Wholesale Backend is running ✅",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
