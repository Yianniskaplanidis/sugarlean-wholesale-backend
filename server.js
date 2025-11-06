// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

/* ──────────────────────────────────────────────────────────
   App setup
────────────────────────────────────────────────────────── */
app.set("trust proxy", 1); // needed on Render / behind proxies

// CORS — allow your storefront + tools to call the API
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN.split(",").map(s => s.trim()),
    methods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Security headers
app.use(
  helmet({
    // emails/templates may inline CSS/IMGs fetched by clients; keep defaults simple
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Body parsing & logging
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

/* ──────────────────────────────────────────────────────────
   Routes
────────────────────────────────────────────────────────── */
const wholesaleRoutes = require("./routes/wholesale");
const diagRoutes = require("./routes/diag");

app.use("/api/wholesale", wholesaleRoutes);
app.use("/api/wholesale", diagRoutes);

// Root & health
app.get("/", (_req, res) => {
  res.json({
    message: "Sugarlean Wholesale Backend is running ✅",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/version", (_req, res) =>
  res.json({ name: "sugarlean-wholesale-backend", version: "1.0.0" })
);

/* ──────────────────────────────────────────────────────────
   404 & Error handlers
────────────────────────────────────────────────────────── */
app.use((req, res, _next) => {
  res.status(404).json({ ok: false, error: "Not Found", path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal Server Error",
    detail: process.env.NODE_ENV === "production" ? undefined : String(err?.message || err),
  });
});

/* ──────────────────────────────────────────────────────────
   Start server
────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
