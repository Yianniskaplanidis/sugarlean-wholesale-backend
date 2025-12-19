// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

/* ----------------------------- core middleware ----------------------------- */
app.set("trust proxy", 1);

app.use(
  cors({
    origin: true, // allow requests from anywhere (Shopify, Postman, browser)
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-ws-token"],
  })
);

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

/* ----------------------------- basic routes ----------------------------- */
app.get("/", (_req, res) => res.json({ ok: true, service: "sugarlean-wholesale-backend" }));
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* ----------------------------- API routes ----------------------------- */
/**
 * IMPORTANT:
 * - routes/wholesale.js is inside /routes
 * - wholesale.js itself does: router.use("/", require("./confirmOrder"))
 *   so confirm order routes will work under /api/wholesale/...
 */
app.use("/api/wholesale", require("./routes/wholesale"));

/**
 * If you have routes/diag.js (as per your screenshot),
 * mount it here so it becomes:
 *   GET /api/wholesale/diag
 */
app.use("/api/wholesale", require("./routes/diag"));

/* ----------------------------- start server ----------------------------- */
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
