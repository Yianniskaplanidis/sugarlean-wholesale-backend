// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

/* -------------------- trust proxy (Render) -------------------- */
app.set("trust proxy", true);

/* -------------------- security headers -------------------- */
app.use(
  helmet({
    // allow loading assets across origins (e.g., CDN images in emails)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* -------------------- CORS -------------------- */
const DEFAULT_ORIGINS = [
  "https://www.sugarlean.com.au",
  "https://sugarlean.com.au",
  "https://sugarlean.myshopify.com", // Shopify theme editor/preview
  "http://localhost:3000",           // local dev FE
];

// Allow adding more via env: CORS_ORIGIN="https://foo.com,https://bar.com"
const extraOrigin = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOW_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...extraOrigin]));

app.use(
  cors({
    origin: ALLOW_ORIGINS,
    methods: ["GET", "POST", "OPTIONS"],
    // include the custom header used to protect the API
    allowedHeaders: ["Content-Type", "X-WS-Token"],
    credentials: false,
  })
);

/* -------------------- body parsing + logs -------------------- */
app.use(express.json({ limit: "1mb" })); // payloads are small
app.use(morgan("tiny"));

/* -------------------- health -------------------- */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* -------------------- protect wholesale API -------------------- */
/**
 * Quick shared-secret guard so randoms can't post to your public endpoint.
 * Set WS_SHARED_TOKEN in Render env (use a long random string).
 * Your frontend must send header:  X-WS-Token: <same value>
 */
app.use("/api/wholesale", (req, res, next) => {
  const token = req.get("X-WS-Token") || "";
  if (!process.env.WS_SHARED_TOKEN || token !== process.env.WS_SHARED_TOKEN) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
});

/* -------------------- routes -------------------- */
app.use("/api/wholesale", require("./routes/wholesale"));
try {
  // optional diagnostics (DNS/TCP/SMTP checks)
  app.use("/api/wholesale", require("./routes/diag"));
} catch (e) {
  console.warn("diag routes not loaded:", e?.message || e);
}

/* -------------------- 404 + error handlers -------------------- */
app.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: "Not Found", path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

/* -------------------- optional SMTP verify on boot -------------------- */
(async () => {
  try {
    const { verifyTransport } = require("./services/mailer");
    if (typeof verifyTransport === "function") {
      const ok = await verifyTransport();
      console.log("SMTP verify:", ok ? "OK" : "Not ready");
    }
  } catch (e) {
    // don’t block the app if mailer verify isn’t present
    console.warn("SMTP verify skipped:", e?.message || e);
  }
})();

/* -------------------- start server (Render-friendly) -------------------- */
const PORT = process.env.PORT || 4000;
if (require.main === module) {
  // Bind to 0.0.0.0 so Render can reach the process
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log("Allowed CORS origins:", ALLOW_ORIGINS.join(", "));
  });
}

module.exports = app;
