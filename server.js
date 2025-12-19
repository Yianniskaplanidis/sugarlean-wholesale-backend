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
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------------------------------------------
 * CORS
 * -------------------------------------------*/
const DEFAULT_ORIGINS = [
  "https://www.sugarlean.com.au",
  "https://sugarlean.com.au",
  "https://sugarlean.myshopify.com",
  "http://localhost:3000",
];

const corsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";

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
 * Optional: Base path for Shopify App Proxy later
 * -------------------------------------------*/
const APP_PROXY_PREFIX = (process.env.SHOPIFY_APP_PROXY_PREFIX || "").trim();

/* ---------------------------------------------
 * Optional shared-secret guard for /api/wholesale
 * Enforced ONLY if WS_SHARED_TOKEN is set
 * -------------------------------------------*/
const REQUIRED_WS_TOKEN = (process.env.WS_SHARED_TOKEN || "").trim();

function optionalTokenGuard(req, res, next) {
  if (!REQUIRED_WS_TOKEN) return next();
  const sent = (req.get("x-ws-token") || req.get("X-WS-Token") || "").trim();
  if (sent === REQUIRED_WS_TOKEN) return next();
  return res.status(401).json({ ok: false, error: "unauthorized" });
}

/* ---------------------------------------------
 * Routes mounting helper (supports optional prefix)
 * -------------------------------------------*/
function mountWholesaleRoutes(basePath) {
  // ✅ Public ping endpoints (NO token required)
  app.get(`${basePath}/ping`, (_req, res) => {
    res.json({ ok: true, route: "wholesale", ts: Date.now() });
  });

  app.get(`${basePath}/confirm-order/ping`, (_req, res) => {
    res.json({ ok: true, route: "confirm-order", ts: Date.now() });
  });

  // ✅ Everything else under basePath requires token (if WS_SHARED_TOKEN is set)
  app.use(basePath, optionalTokenGuard);

  // Main wholesale routes (includes confirm-order because routes/wholesale.js uses router.use("./confirmOrder"))
  app.use(basePath, require("./routes/wholesale"));

  // ❌ IMPORTANT: remove duplicate mount (confirmOrder is already mounted inside routes/wholesale.js)
  // app.use(basePath, require("./routes/confirmOrder"));

  // Optional diagnostics
  try {
    app.use(basePath, require("./routes/diag"));
  } catch (e) {
    console.warn("diag routes not loaded:", e?.message || e);
  }
}

/* ---------------------------------------------
 * Mount routes
 * -------------------------------------------*/
mountWholesaleRoutes("/api/wholesale");

if (APP_PROXY_PREFIX) {
  mountWholesaleRoutes(APP_PROXY_PREFIX);
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
 * Optional: verify transport on boot
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
 * Process guards
 * -------------------------------------------*/
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

/* ---------------------------------------------
 * Start server
 * -------------------------------------------*/
const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log("Allowed CORS origins:", ALLOW_ORIGINS.join(", "));
    if (APP_PROXY_PREFIX) console.log("App Proxy prefix enabled:", APP_PROXY_PREFIX);
    if (REQUIRED_WS_TOKEN) console.log("WS token guard: ON");
    else console.log("WS token guard: OFF");
  });
}

module.exports = app;
