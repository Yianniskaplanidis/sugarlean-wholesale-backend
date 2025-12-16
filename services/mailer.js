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

// NEW: confirm-order templates in separate file (as you wanted)
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
  // Backward-compatible fallback: if you kept confirm templates in templates.js
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
  // Backward-compatible fallback: if you kept confirm templates in templates.js
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

  const msg = {
    subject,
    body: { contentType: "HTML", content: html },
    toRecipients: [{ emailAddress: { address: to } }],
    from: { emailAddress: { address: sender } },
  };

  // Reply-To (Graph supports replyTo array)
  if (replyTo) {
    msg.replyTo = [{ emailAddress: { address: replyTo } }];
  }

  const payload = { message: msg, saveToSentItems: true };

  const resp = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      sender
    )}/sendMail`,
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
  return smtp.sendMail({ from, to, subject, html, replyTo });
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

function money(n) {
  const num = Number(n || 0);
  return num.toFixed(2);
}

function buildConfirmAdminEmailFallback(data) {
  const c = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal =
    Number(data?.totals?.subtotal) ||
    items.reduce((sum, it) => sum + Number(it.lineTotal || 0), 0);

  const rows = items
    .map((it) => {
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            <div style="font-weight:700;">${esc(it.title)}</div>
            ${it.sku ? `<div style="color:#666;font-size:12px;">SKU: ${esc(it.sku)}</div>` : ""}
            ${it.ref ? `<div style="color:#666;font-size:12px;">REF: ${esc(it.ref)}</div>` : ""}
            ${it.barcode ? `<div style="color:#666;font-size:12px;">Barcode: ${esc(it.barcode)}</div>` : ""}
            ${it.boxQty ? `<div style="color:#666;font-size:12px;">Box QTY: ${esc(it.boxQty)}</div>` : ""}
            ${it.available === false ? `<div style="margin-top:6px;color:#b00020;font-weight:800;">SOLD OUT / BACK ORDER</div>` : ""}
          </td>
          <td style="padding:10px;text-align:center;border-bottom:1px solid #eee;">${esc(it.qtyBoxes)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">$${money(it.price)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">$${money(it.lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const subject = `Wholesale Order Submission — ${c.customerNumber || "No Customer #"} — ${c.name || c.email || "Unknown"}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:24px;">
      <div style="max-width:820px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="padding:18px 20px;background:#111;color:#fff;">
          <div style="font-size:18px;font-weight:800;">Wholesale Order Submission</div>
          <div style="opacity:.85;font-size:13px;margin-top:4px;">From: wholesale-confirm-order</div>
        </div>

        <div style="padding:18px 20px;">
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <div style="flex:1;min-width:260px;padding:12px;border:1px solid #eee;border-radius:12px;">
              <div style="font-weight:800;margin-bottom:6px;">Customer</div>
              <div><b>Name:</b> ${esc(c.name || "")}</div>
              <div><b>Email:</b> ${esc(c.email || "")}</div>
              <div><b>Customer #:</b> ${esc(c.customerNumber || "")}</div>
              ${data.orderId ? `<div><b>Order ID:</b> ${esc(data.orderId)}</div>` : ""}
              <div style="color:#666;font-size:12px;margin-top:6px;">
                <b>Shop:</b> ${esc(data.shop || "")}
              </div>
            </div>

            <div style="flex:1;min-width:260px;padding:12px;border:1px solid #eee;border-radius:12px;">
              <div style="font-weight:800;margin-bottom:6px;">Note</div>
              <div style="white-space:pre-wrap;color:#333;">${esc(data.note || "") || "<span style='color:#888;'>—</span>"}</div>
            </div>
          </div>

          <h3 style="margin:18px 0 10px;">Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px;border-bottom:2px solid #111;">Product</th>
                <th style="text-align:center;padding:10px;border-bottom:2px solid #111;">Boxes</th>
                <th style="text-align:right;padding:10px;border-bottom:2px solid #111;">Unit</th>
                <th style="text-align:right;padding:10px;border-bottom:2px solid #111;">Line</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4" style="padding:14px;color:#888;">No items found.</td></tr>`}
            </tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;margin-top:14px;">
            <div style="min-width:260px;border:1px solid #eee;border-radius:12px;padding:12px;">
              <div style="display:flex;justify-content:space-between;">
                <div style="font-weight:800;">Subtotal</div>
                <div style="font-weight:800;">$${money(subtotal)}</div>
              </div>
              <div style="color:#666;font-size:12px;margin-top:6px;">
                (Email submission — not a Shopify checkout order)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

function buildConfirmUserEmailFallback(data) {
  const c = data.customer || {};
  const subject = `We received your wholesale order — Sugarlean`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="padding:18px 20px;background:#111;color:#fff;">
          <div style="font-size:18px;font-weight:800;">Thanks — we received your order</div>
          <div style="opacity:.85;font-size:13px;margin-top:4px;">Sugarlean Wholesale</div>
        </div>

        <div style="padding:18px 20px;color:#111;">
          <p style="margin:0 0 10px;">Hi ${esc(c.name || "there")},</p>
          <p style="margin:0 0 10px;">
            We’ve received your wholesale order submission and our team will process it shortly.
          </p>

          ${c.customerNumber ? `<p style="margin:0 0 10px;"><b>Customer #:</b> ${esc(c.customerNumber)}</p>` : ""}

          <p style="margin:14px 0 0;color:#666;font-size:13px;">
            This email confirms your submission (it is not a Shopify checkout order).
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
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
 * - Optional user confirmation goes to customer.email (controlled by env CONFIRM_SEND_USER=true)
 *
 * Prefers services/templates.confirmOrder.js; falls back only if missing.
 */
async function sendConfirmOrderEmails(data) {
  const results = { admin: false, user: false };

  // ----- build admin email -----
  let adminEmail;
  if (confirmAdminTplName) {
    const source = tplConfirm && typeof tplConfirm[confirmAdminTplName] === "function" ? tplConfirm : tpl;
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

  // ----- build user email (optional) -----
  let userEmail;
  if (confirmUserTplName) {
    const source = tplConfirm && typeof tplConfirm[confirmUserTplName] === "function" ? tplConfirm : tpl;
    userEmail = await source[confirmUserTplName](data); // { subject, html }
  } else {
    userEmail = buildConfirmUserEmailFallback(data);
  }

  // ----- recipients -----
  const adminTo =
    process.env.CONFIRM_ORDER_TO ||
    process.env.WHOLESALE_TO ||
    process.env.ADMIN_EMAIL;

  if (!adminTo) {
    throw new Error(
      "No admin recipient configured. Set CONFIRM_ORDER_TO or WHOLESALE_TO or ADMIN_EMAIL."
    );
  }

  // Admin email: reply-to should be the customer email if present
  await sendMail({
    to: adminTo,
    subject: adminEmail.subject,
    html: adminEmail.html,
    replyTo: data?.customer?.email || undefined,
  });
  results.admin = true;

  // User email is optional
  const sendUser =
    String(process.env.CONFIRM_SEND_USER || "false").toLowerCase() === "true";

  const customerEmail = data?.customer?.email;
  if (sendUser && customerEmail) {
    await sendMail({
      to: customerEmail,
      subject: userEmail.subject,
      html: userEmail.html,
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
