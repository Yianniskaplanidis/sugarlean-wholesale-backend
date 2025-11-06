// routes/wholesale.js
const express = require("express");
const router = express.Router();
const { sendSignupEmail } = require("../services/mailer");

// simple email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// normalize booleans from strings like "on", "true", "1"
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "on" || s === "yes";
};

router.post("/apply", async (req, res) => {
  console.log("🪵 Incoming /apply:", req.body); // add this

  const body = req.body || {};
  // ...rest of your code unchanged
});

// GET /api/wholesale/ping
router.get("/ping", (_req, res) => res.json({ ok: true, route: "wholesale" }));

// POST /api/wholesale/apply
router.post("/apply", async (req, res) => {
  // Support both your new names and the older ones we used earlier
  const body = req.body || {};

  const data = {
    companyName: body.companyName || body.businessName || "",
    contactName: body.contactName || body.name || "",
    phone: body.phone || body.phoneNumber || "",
    abn: body.abn || "",
    email: body.email || "",
    streetAddress: body.streetAddress || body.address || "",
    city: body.city || "",
    state: body.state || "",
    postCode: body.postCode || body.postcode || body.post_code || "",
    country: body.country || "",
    note: body.note || body.notes || "",
    marketingOptIn: toBool(body.marketingOptIn || body.receiveMarketing),
    policyAccepted: toBool(body.policyAccepted || body.acceptPolicy || body.termsAccepted),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    ua: req.headers["user-agent"] || "",
  };

  // ---- validation (requireds + sanity checks) ----
  const missing = [];
  if (!data.companyName) missing.push("companyName");
  if (!data.contactName) missing.push("contactName");
  if (!data.phone) missing.push("phone");
  if (!data.abn) missing.push("abn");
  if (!data.email) missing.push("email");
  if (!data.streetAddress) missing.push("streetAddress");
  if (!data.city) missing.push("city");
  if (!data.state) missing.push("state");
  if (!data.postCode) missing.push("postCode");
  if (!data.country) missing.push("country");


  console.log("🔍 Validating data:", data);

  
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Missing fields", missing });
  }
  if (!EMAIL_RE.test(data.email)) {
    return res.status(400).json({ ok: false, error: "Invalid email format" });
  }
  // hard requirement: policy must be accepted
  if (!data.policyAccepted) {
    return res.status(400).json({ ok: false, error: "You must accept the policy to submit." });
  }

  try {
    await sendSignupEmail(data);
    return res.json({ ok: true, message: "Application received. Email sent." });
  } catch (e) {
    console.error("Email send failed:", e);
    return res.status(502).json({ ok: false, error: "Email send failed" });
  }
});

module.exports = router;
