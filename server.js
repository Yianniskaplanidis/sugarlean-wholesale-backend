// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

/* ---------------------------------------------
 * Render / proxies
 * -------------------------------------------*/
app.set("trust proxy", true);

/* ---------------------------------------------
 * Security headers
 * -------------------------------------------*/
app.use(
  helmet({
    // allow loading assets across origins (e.g., CDN images in emails)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------------------------------------
 * CORS
 * -------------------------------------------*/
const DEFAULT_ORIGINS = [
  "https://www.sugarlean.com.au",
  "https://sugarlean.com.au",
  "https://sugarlean.myshopify.com", // Shopify preview/editor
  "http://localhost:3000",           // local FE
];

// Accept either CORS_ORIGINS or CORS_ORIGIN (comma-separated)
const corsEnv =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  "";

const extraOrigin = corsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...extraOrigin]));

app.use(
  cors({
    origin: ALLOW_ORIGINS,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-WS-Token", "x-ws-token"],
    credentials: false,
  })
);

// quick response for preflights
app.options("*", cors());

/* ---------------------------------------------
 * Body parser + logging
 * -------------------------------------------*/
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

/* ---------------------------------------------
 * Health
 * -------------------------------------------*/
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------------------------------------------
 * Optional shared-secret guard for /api/wholesale
 * Enforced ONLY if WS_SHARED_TOKEN is set
 * -------------------------------------------*/
const REQUIRED_WS_TOKEN = (process.env.WS_SHARED_TOKEN || "").trim();

app.use("/api/wholesale", (req, res, next) => {
  if (!REQUIRED_WS_TOKEN) return next(); // no token configured → allow
  const sent = (req.get("x-ws-token") || req.get("X-WS-Token") || "").trim();
  if (sent === REQUIRED_WS_TOKEN) return next();
  return res.status(401).json({ ok: false, error: "unauthorized" });
});

/* ---------------------------------------------
 * Routes
 * -------------------------------------------*/
app.use("/api/wholesale", require("./routes/wholesale"));

try {
  // optional diagnostics (DNS/TCP/SMTP checks)
  app.use("/api/wholesale", require("./routes/diag"));
} catch (e) {
  console.warn("diag routes not loaded:", e?.message || e);
}

/* ---------------------------------------------
 * 404 + error handler
 * -------------------------------------------*/
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not Found", path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err?.stack || err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

/* ---------------------------------------------
 * Optional: verify transport on boot (SMTP or Graph),
 * depending on how services/mailer.js is implemented.
 * -------------------------------------------*/
(async () => {
  try {
    const { verifyTransport } = require("./services/mailer");
    if (typeof verifyTransport === "function") {
      const ok = await verifyTransport();
      console.log("SMTP verify:", ok ? "OK" : "Not ready");
    }
  } catch (e) {
    console.warn("SMTP verify skipped:", e?.message || e);
  }
})();

/* ---------------------------------------------
 * Process guards (don’t crash silently)
 * -------------------------------------------*/
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

/* ---------------------------------------------
 * Start server (Render-friendly)
 * -------------------------------------------*/
const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log("Allowed CORS origins:", ALLOW_ORIGINS.join(", "));
  });
}

module.exports = app;
