// routes/wholesale.js
const express = require("express");
const router = express.Router();

// uses services/mailer.js
const { sendWholesaleEmails } = require("../services/mailer");

/* ----------------------------- CORS + WS TOKEN ----------------------------- */

// If you have a specific domain(s), set env CORS_ORIGIN to:
// "https://sugarlean.com.au,https://www.sugarlean.com.au"
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "*").trim();

function setCors(res) {
  // If you use "*" it's simplest (no cookies/credentials)
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-ws-token, Authorization"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}

// Handle preflight BEFORE any auth
router.use((req, res, next) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// WS token auth for /api/wholesale/*
const expectedToken = String(
  process.env.WS_TOKEN || process.env.API_WS_TOKEN || ""
).trim();

function wsAuth(req, res, next) {
  // Allow pings without token so you can test in browser
  const isPing = req.method === "GET" && (req.path === "/ping" || req.path === "/confirm-order/ping");
  if (isPing) return next();

  // If you want the server to boot even when token missing, keep this,
  // but it will effectively block protected endpoints until you set WS_TOKEN.
  if (!expectedToken) {
    return res.status(500).json({
      ok: false,
      error: "Server WS token not configured",
      hint: "Set WS_TOKEN (or API_WS_TOKEN) in Render environment variables",
    });
  }

  const got = String(req.get("x-ws-token") || "").trim();
  if (!got || got !== expectedToken) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  next();
}

router.use(wsAuth);

/* ----------------------------- helpers ----------------------------- */

// loose email regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// safe trim
const t = (v) => (v == null ? "" : String(v).trim());

// normalise booleans: true/1/on/yes
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "on" || s === "yes";
};

// build a canonical payload from a variety of possible keys
function buildPayload(reqBody, req) {
  const b = reqBody || {};

  return {
    companyName:
      t(b.companyName) ||
      t(b.businessName) ||
      t(b.company) ||
      t(b.business_name),

    contactName:
      t(b.contactName) ||
      t(b.contact) ||
      t(b.name) ||
      t(b.contact_name),

    phone:
      t(b.phone) ||
      t(b.phoneNumber) ||
      t(b.contact_number) ||
      t(b.mobile),

    abn: t(b.abn) || t(b.taxId) || t(b.tax_id),

    email: t(b.email) || t(b.contact_email),

    streetAddress:
      t(b.streetAddress) ||
      t(b.street) ||
      t(b.address) ||
      t(b.street_address),

    city: t(b.city) || t(b.town),

    state: t(b.state) || t(b.region) || t(b.province),

    postcode: t(b.postcode) || t(b.postCode) || t(b.post_code) || t(b.zip),

    country: t(b.country),

    note: t(b.note) || t(b.message) || t(b.notes),

    marketingOptIn: toBool(
      b.marketingOptIn ||
        b.acceptsMarketing ||
        b.accepts_marketing ||
        b.consentMarketing
    ),

    policyAccepted: toBool(
      b.policyAccepted || b.termsAccepted || b.terms_accepted || b.acceptPolicy
    ),

    // meta
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    ua: req.headers["user-agent"] || "",
  };
}

function validatePayload(data) {
  const missing = [];
  [
    "companyName",
    "contactName",
    "phone",
    "abn",
    "email",
    "streetAddress",
    "city",
    "state",
    "postcode",
    "country",
  ].forEach((k) => {
    if (!data[k]) missing.push(k);
  });

  if (missing.length) {
    return { ok: false, status: 422, error: "Missing fields", missing };
  }
  if (!EMAIL_RE.test(data.email)) {
    return { ok: false, status: 422, error: "Invalid email format" };
  }
  if (!data.policyAccepted) {
    return {
      ok: false,
      status: 422,
      error: "You must accept the policy to submit.",
    };
  }
  return { ok: true };
}

/* ------------------------------ routes ------------------------------ */

// quick router check (no token required due to wsAuth exception)
router.get("/ping", (_req, res) => res.json({ ok: true, route: "wholesale" }));

/**
 * POST /api/wholesale/apply
 * Fast ACK (202) so Shopify never waits on SMTP.
 */
router.post("/apply", async (req, res) => {
  // Honeypot (hidden field named "website")
  if (t(req.body?.website)) {
    return res.status(202).json({ ok: true, message: "Received." });
  }

  const data = buildPayload(req.body, req);
  const v = validatePayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  // return immediately
  res.status(202).json({
    ok: true,
    message: "Application received. Email will follow shortly.",
  });

  // send emails in background
  setImmediate(async () => {
    try {
      const info = await sendWholesaleEmails(data);
      console.log("✅ Wholesale /apply emails sent", {
        toAdmin: !!info?.admin,
        toUser: !!info?.user,
        user: data.email,
      });
    } catch (err) {
      console.error(
        "💥 /apply email send failed (background):",
        err?.message || err
      );
    }
  });
});

/**
 * POST /api/wholesale/apply-sync
 * Same validation but waits for SMTP/Graph. Use only for local/Postman debugging.
 */
router.post("/apply-sync", async (req, res) => {
  const data = buildPayload(req.body, req);
  const v = validatePayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  try {
    const info = await sendWholesaleEmails(data);
    return res.json({
      ok: true,
      sent: { admin: !!info?.admin, user: !!info?.user },
    });
  } catch (e) {
    console.error("apply-sync failed:", e);
    return res.status(502).json({
      ok: false,
      error: "Email send failed",
      reason: e?.message || String(e),
    });
  }
});

/**
 * ✅ Mount confirm-order routes here so they become:
 * - /api/wholesale/confirm-order
 * - /api/wholesale/confirm-order-sync
 * - /api/wholesale/confirm-order/ping
 */
router.use("/", require("./confirmOrder"));

module.exports = router;
