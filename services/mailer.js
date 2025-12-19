// services/mailer.js
const qs = require("querystring");
const nodemailer = require("nodemailer");

// Use node-fetch v2 (CommonJS). If you don't have it, run: npm i node-fetch@2
let fetch;
try {
  fetch = require("node-fetch");
} catch (e) {
  throw new Error(
    'Missing dependency "node-fetch". Run: npm i node-fetch@2 and redeploy.'
  );
}

// ---- import templates ----
const tpl = require("./templates"); // /apply templates (existing)

// Confirm-order templates in separate file
let tplConfirm = null;
try {
  tplConfirm = require("./templates.confirmOrder"); // services/templates.confirmOrder.js
} catch (e) {
  // Optional: allow server to boot even if file not created yet
  tplConfirm = null;
}

const pickFrom = (obj, ...names) =>
  obj ? names.find((n) => typeof obj[n] === "function") : null;

// Existing application (apply) templates
const adminTplName =
  pickFrom(tpl, "renderAdminEmail", "adminEmail", "buildAdminEmail", "makeAdminEmail") ||
  null;

const userTplName =
  pickFrom(tpl, "renderUserEmail", "userEmail", "buildUserEmail", "makeUserEmail") ||
  null;

if (!adminTplName || !userTplName) {
  throw new Error(
    "templates.js must export functions to build emails for /apply. Expected one of: renderAdminEmail/adminEmail/buildAdminEmail & renderUserEmail/userEmail/buildUserEmail"
  );
}

// Confirm-order templates (prefer services/templates.confirmOrder.js)
const confirmAdminTplName =
  pickFrom(
    tplConfirm,
    "renderConfirmOrderAdminEmail",
    "confirmOrderAdminEmail",
    "buildConfirmOrderAdminEmail",
    "renderOrderAdminEmail",
    "orderAdminEmail",
    "buildOrderAdminEmail"
  ) ||
  // fallback: if confirm templates are still in templates.js
  pickFrom(
    tpl,
    "renderConfirmOrderAdminEmail",
    "confirmOrderAdminEmail",
    "buildConfirmOrderAdminEmail",
    "renderOrderAdminEmail",
    "orderAdminEmail",
    "buildOrderAdminEmail"
  ) ||
  null;

const confirmUserTplName =
  pickFrom(
    tplConfirm,
    "renderConfirmOrderUserEmail",
    "confirmOrderUserEmail",
    "buildConfirmOrderUserEmail",
    "renderOrderUserEmail",
    "orderUserEmail",
    "buildOrderUserEmail"
  ) ||
  // fallback: if confirm templates are still in templates.js
  pickFrom(
    tpl,
    "renderConfirmOrderUserEmail",
    "confirmOrderUserEmail",
    "buildConfirmOrderUserEmail",
    "renderOrderUserEmail",
    "orderUserEmail",
    "buildOrderUserEmail"
  ) ||
  null;

// ---------- helpers ----------
const clean = (v) => (v == null ? "" : String(v)).trim();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function isEmail(v) {
  return EMAIL_RE.test(clean(v));
}

function splitEmailList(v) {
  return clean(v)
    .split(/[;,]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((e) => isEmail(e));
}

// ---------- which transport? ----------
const MAIL_TRANSPORT = (process.env.MAIL_TRANSPORT || "smtp").toLowerCase();
const BRAND_FROM = process.env.EMAIL_FROM || process.env.GRAPH_SENDER;

// ---------- SMTP path (not used when MAIL_TRANSPORT=graph) ----------
let _smtpTransport = null;

function makeSmtpTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure =
    String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Mailer not configured (missing EMAIL_HOST/USER/PASS).");
  }

  // cache transporter so we don't reconnect for every email
  if (_smtpTransport) return _smtpTransport;

  _smtpTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return _smtpTransport;
}

// ---------- Graph token ----------
async function acquireGraphToken() {
  const tenant = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenant || !clientId || !clientSecret) {
    throw new Error(
      "Graph not configured (missing AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)."
    );
  }

  const resp = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.error_description || JSON.stringify(json));
  }
  return json.access_token;
}

// ---------- Graph send ----------
async function graphSend({ to, subject, html, replyTo }) {
  const token = await acquireGraphToken();
  const sender = process.env.GRAPH_SENDER;
  if (!sender) throw new Error("GRAPH_SENDER not set.");

  // support multi recipients
  const recipients = Array.isArray(to) ? to : splitEmailList(to);
  if (!recipients.length) throw new Error("No valid recipient(s) for Graph send.");

  const msg = {
    subject,
    body: { contentType: "HTML", content: html },
    toRecipients: recipients.map((addr) => ({ emailAddress: { address: addr } })),
    from: { emailAddress: { address: sender } },
  };

  if (replyTo && isEmail(replyTo)) {
    msg.replyTo = [{ emailAddress: { address: replyTo } }];
  }

  const payload = { message: msg, saveToSentItems: true };

  const resp = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Graph sendMail ${resp.status}: ${text}`);
  }
}

// ---------- unified send ----------
async function sendMail({ to, subject, html, replyTo }) {
  if (MAIL_TRANSPORT === "graph") {
    return graphSend({ to, subject, html, replyTo });
  }
  const smtp = makeSmtpTransport();
  const from = BRAND_FROM || process.env.EMAIL_USER;

  // support multi recipients for SMTP too
  const toList = Array.isArray(to) ? to : splitEmailList(to);
  if (!toList.length) throw new Error("No valid recipient(s) for SMTP send.");

  return smtp.sendMail({
    from,
    to: toList.join(", "),
    subject,
    html,
    replyTo: replyTo && isEmail(replyTo) ? replyTo : undefined,
  });
}

// Optional verify used at boot
async function verifyTransport() {
  try {
    if (MAIL_TRANSPORT === "graph") {
      await acquireGraphToken();
      console.log("Mail transport: graph (token OK)");
      return true;
    }
    const smtp = makeSmtpTransport();
    await smtp.verify();
    console.log("Mail transport: smtp (verify OK)");
    return true;
  } catch (e) {
    console.log(
      `Mail transport verify failed (${MAIL_TRANSPORT}):`,
      e?.message || e
    );
    return false;
  }
}

/* ---------------- confirm-order fallback templates (safety net) ---------------- */

let _warnedConfirmFallback = false;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* NOTE: Fallbacks are ONLY used if confirm templates are missing.
   If you still see old “New Wholesale Order Submitted …” text,
   it means your real confirm template wasn’t loaded or exported correctly. */
function buildConfirmAdminEmailFallback(data) {
  const c = data.customer || {};
  const subject = `Wholesale Order Submission — ${c.customerNumber || "No Customer #"} — ${c.name || c.email || "Unknown"}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="padding:18px 20px;background:#111;color:#fff;">
          <div style="font-size:18px;font-weight:800;">Wholesale Order Summary</div>
        </div>
        <div style="padding:18px 20px;color:#111;">
          <div><b>Order ID:</b> ${esc(data.orderId || "-")}</div>
          <div><b>Customer #:</b> ${esc(c.customerNumber || "-")}</div>
          <div><b>Name:</b> ${esc(c.name || "-")}</div>
          <div><b>Email:</b> ${esc(c.email || "-")}</div>
        </div>
      </div>
    </div>
  `;
  return { subject, html };
}

function buildConfirmUserEmailFallback(data) {
  const c = data.customer || {};
  return {
    subject: "Wholesale Order received [DO NOT REPLY]",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:24px;">
        <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
          <div style="padding:18px 20px;background:#111;color:#fff;">
            <div style="font-size:18px;font-weight:800;">Wholesale Order Summary</div>
          </div>
          <div style="padding:18px 20px;color:#111;">
            <p style="margin:0 0 10px;">Hi ${esc(c.name || "there")},</p>
            <p style="margin:0;">We received your wholesale order. Our team will process it shortly.</p>
          </div>
        </div>
      </div>
    `,
  };
}

/* -------------------------- public API used by routes -------------------------- */

async function sendWholesaleEmails(data) {
  const adminEmail = await tpl[adminTplName](data); // { subject, html }
  const userEmail = await tpl[userTplName](data);   // { subject, html }

  const results = { admin: false, user: false };

  const adminTo = process.env.ADMIN_EMAIL;
  if (adminTo) {
    await sendMail({
      to: adminTo,
      subject: adminEmail.subject,
      html: adminEmail.html,
      replyTo: data.email || undefined,
    });
    results.admin = true;
  }

  if (data.email) {
    await sendMail({
      to: data.email,
      subject: userEmail.subject,
      html: userEmail.html,
    });
    results.user = true;
  }

  return results;
}

/**
 * Confirm order email sending:
 * - Admin goes to CONFIRM_ORDER_TO (or WHOLESALE_TO or ADMIN_EMAIL as fallback)
 * - Customer ALWAYS receives a copy (to data.customer.email) if valid
 *
 * Prefers services/templates.confirmOrder.js; falls back only if missing.
 */
async function sendConfirmOrderEmails(data) {
  const results = { admin: false, user: false };

  // ----- build admin email -----
  let adminEmail;
  if (confirmAdminTplName) {
    const source =
      tplConfirm && typeof tplConfirm[confirmAdminTplName] === "function"
        ? tplConfirm
        : tpl;
    adminEmail = await source[confirmAdminTplName](data); // { subject, html }
  } else {
    if (!_warnedConfirmFallback) {
      _warnedConfirmFallback = true;
      console.warn(
        "⚠️ Confirm-order templates not found. Using fallback email HTML. " +
          "Create services/templates.confirmOrder.js exporting renderConfirmOrderAdminEmail/renderConfirmOrderUserEmail."
      );
    }
    adminEmail = buildConfirmAdminEmailFallback(data);
  }

  // ----- build user email -----
  let userEmail;
  if (confirmUserTplName) {
    const source =
      tplConfirm && typeof tplConfirm[confirmUserTplName] === "function"
        ? tplConfirm
        : tpl;
    userEmail = await source[confirmUserTplName](data); // { subject, html }
  } else {
    userEmail = buildConfirmUserEmailFallback(data);
  }

  // ----- recipients -----
  const adminTo =
    process.env.CONFIRM_ORDER_TO ||
    process.env.WHOLESALE_TO ||
    process.env.ADMIN_EMAIL;

  const adminList = Array.isArray(adminTo) ? adminTo : splitEmailList(adminTo || "");
  if (!adminList.length) {
    throw new Error(
      "No admin recipient configured. Set CONFIRM_ORDER_TO or WHOLESALE_TO or ADMIN_EMAIL."
    );
  }

  const customerEmail = clean(data?.customer?.email);

  // Admin email: reply-to should be customer email if valid
  await sendMail({
    to: adminList,
    subject: adminEmail.subject,
    html: adminEmail.html,
    replyTo: isEmail(customerEmail) ? customerEmail : undefined,
  });
  results.admin = true;

  // Customer email: ALWAYS send if valid
  if (isEmail(customerEmail)) {
    await sendMail({
      to: customerEmail,
      subject: userEmail.subject,
      html: userEmail.html,
      replyTo: "wholesale@sugarlean.com.au", // optional (feel free to change/remove)
    });
    results.user = true;
  }

  return results;
}

module.exports = {
  sendWholesaleEmails,
  sendConfirmOrderEmails,
  verifyTransport,
};
