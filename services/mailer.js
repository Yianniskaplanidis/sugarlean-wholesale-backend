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

// ---- import your templates ----
// We try a few common export names so you don't have to rename your file.
const tpl = require("./templates");
const pick = (...names) => names.find((n) => typeof tpl[n] === "function");

const adminTplName =
  pick("renderAdminEmail", "adminEmail", "buildAdminEmail", "makeAdminEmail") ||
  null;
const userTplName =
  pick("renderUserEmail", "userEmail", "buildUserEmail", "makeUserEmail") ||
  null;

if (!adminTplName || !userTplName) {
  throw new Error(
    "templates.js must export functions to build emails. Expected one of: renderAdminEmail/adminEmail/buildAdminEmail & renderUserEmail/userEmail/buildUserEmail"
  );
}

// ---------- which transport? ----------
const MAIL_TRANSPORT = (process.env.MAIL_TRANSPORT || "smtp").toLowerCase();
const BRAND_FROM = process.env.EMAIL_FROM || process.env.GRAPH_SENDER;

// ---------- SMTP path (not used when MAIL_TRANSPORT=graph) ----------
function makeSmtpTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Mailer not configured (missing EMAIL_HOST/USER/PASS).");
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
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
async function graphSend({ to, subject, html }) {
  const token = await acquireGraphToken();
  const sender = process.env.GRAPH_SENDER;
  if (!sender) throw new Error("GRAPH_SENDER not set.");

  const payload = {
    message: {
      subject,
      body: { contentType: "HTML", content: html },
      toRecipients: [{ emailAddress: { address: to } }],
      from: { emailAddress: { address: sender } },
    },
    saveToSentItems: true,
  };

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
async function sendMail({ to, subject, html }) {
  if (MAIL_TRANSPORT === "graph") {
    return graphSend({ to, subject, html });
  }
  const smtp = makeSmtpTransport();
  const from = BRAND_FROM || process.env.EMAIL_USER;
  return smtp.sendMail({ from, to, subject, html });
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

// ---------- public API used by routes ----------
async function sendWholesaleEmails(data) {
  const adminEmail = await tpl[adminTplName](data); // { subject, html }
  const userEmail = await tpl[userTplName](data);   // { subject, html }

  const results = { admin: false, user: false };

  const adminTo = process.env.ADMIN_EMAIL;
  if (adminTo) {
    await sendMail({ to: adminTo, subject: adminEmail.subject, html: adminEmail.html });
    results.admin = true;
  }

  if (data.email) {
    await sendMail({ to: data.email, subject: userEmail.subject, html: userEmail.html });
    results.user = true;
  }

  return results;
}

module.exports = {
  sendWholesaleEmails,
  verifyTransport,
};
