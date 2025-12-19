// routes/wholesale.js
const express = require("express");
const router = express.Router();

const { sendWholesaleEmails } = require("../services/mailer"); // ✅ correct path

/* ----------------------------- helpers ----------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const t = (v) => (v == null ? "" : String(v).trim());

const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "on" || s === "yes";
};

function buildPayload(reqBody, req) {
  const b = reqBody || {};
  return {
    companyName: t(b.companyName) || t(b.businessName) || t(b.company) || t(b.business_name),
    contactName: t(b.contactName) || t(b.contact) || t(b.name) || t(b.contact_name),
    phone: t(b.phone) || t(b.phoneNumber) || t(b.contact_number) || t(b.mobile),
    abn: t(b.abn) || t(b.taxId) || t(b.tax_id),
    email: t(b.email) || t(b.contact_email),
    streetAddress: t(b.streetAddress) || t(b.street) || t(b.address) || t(b.street_address),
    city: t(b.city) || t(b.town),
    state: t(b.state) || t(b.region) || t(b.province),
    postcode: t(b.postcode) || t(b.postCode) || t(b.post_code) || t(b.zip),
    country: t(b.country),
    note: t(b.note) || t(b.message) || t(b.notes),
    marketingOptIn: toBool(b.marketingOptIn || b.acceptsMarketing || b.accepts_marketing || b.consentMarketing),
    policyAccepted: toBool(b.policyAccepted || b.termsAccepted || b.terms_accepted || b.acceptPolicy),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    ua: req.headers["user-agent"] || "",
  };
}

function validatePayload(data) {
  const missing = [];
  ["companyName","contactName","phone","abn","email","streetAddress","city","state","postcode","country"].forEach((k) => {
    if (!data[k]) missing.push(k);
  });

  if (missing.length) return { ok: false, status: 422, error: "Missing fields", missing };
  if (!EMAIL_RE.test(data.email)) return { ok: false, status: 422, error: "Invalid email format" };
  if (!data.policyAccepted) return { ok: false, status: 422, error: "You must accept the policy to submit." };
  return { ok: true };
}

/* ------------------------------ routes ------------------------------ */
router.get("/ping", (_req, res) => res.json({ ok: true, route: "wholesale" }));

router.post("/apply", async (req, res) => {
  if (t(req.body?.website)) return res.status(202).json({ ok: true, message: "Received." });

  const data = buildPayload(req.body, req);
  const v = validatePayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  res.status(202).json({ ok: true, message: "Application received. Email will follow shortly." });

  setImmediate(async () => {
    try {
      const info = await sendWholesaleEmails(data);
      console.log("✅ Wholesale /apply emails sent", { toAdmin: !!info?.admin, toUser: !!info?.user, user: data.email });
    } catch (err) {
      console.error("💥 /apply email send failed (background):", err?.message || err);
    }
  });
});

router.post("/apply-sync", async (req, res) => {
  const data = buildPayload(req.body, req);
  const v = validatePayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  try {
    const info = await sendWholesaleEmails(data);
    return res.json({ ok: true, sent: { admin: !!info?.admin, user: !!info?.user } });
  } catch (e) {
    console.error("apply-sync failed:", e);
    return res.status(502).json({ ok: false, error: "Email send failed", reason: e?.message || String(e) });
  }
});

// ✅ confirm-order routes mounted here (routes/confirmOrder.js)
router.use("/", require("./confirmOrder"));

module.exports = router;
