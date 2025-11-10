// services/mailer.js (SMTP version – Office 365 friendly)
const nodemailer = require("nodemailer");
const {
  adminNotificationTemplate,
  userConfirmationTemplate,
} = require("./templates");

/* -------------------- ENV -------------------- */
const {
  EMAIL_HOST = "smtp.office365.com", // Office 365/Exchange Online
  EMAIL_PORT = "587",                // 587 STARTTLS (recommended), 465 for SMTPS
  EMAIL_SECURE = "false",            // "true" only for port 465
  EMAIL_USER,                        // required (full mailbox address)
  EMAIL_PASS,                        // required (app password or mailbox password)
  EMAIL_FROM,                        // optional: 'Sugarlean (Do not reply) <no-reply@sugarlean.com.au>'
  ADMIN_EMAIL,                       // admin notification destination
  BRAND_NAME = "Sugarlean",
} = process.env;

const FROM =
  EMAIL_FROM ||
  (EMAIL_USER
    ? `${BRAND_NAME} (Do not reply) <${EMAIL_USER}>`
    : `${BRAND_NAME} (Do not reply) <no-reply@sugarlean.com.au>`);

/* -------------------- Transporter -------------------- */
/**
 * Office 365 tips:
 * - Use port 587 with STARTTLS (secure=false) – most reliable.
 * - Make sure SMTP AUTH is enabled for the mailbox.
 * - If MFA is enabled, use an **App Password**, not the normal password.
 * - Some tenants require "Authenticated SMTP" to be turned on for the user.
 */
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: (EMAIL_SECURE || "false").toLowerCase() === "true", // true only for 465
  auth:
    EMAIL_USER && EMAIL_PASS
      ? { user: EMAIL_USER, pass: EMAIL_PASS }
      : undefined,
  requireTLS: true,              // push STARTTLS on 587
  tls: {
    minVersion: "TLSv1.2",
    // ciphers: "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256",
    // If you hit certificate-chain quirks, you can TEMPORARILY loosen this:
    // rejectUnauthorized: false,
  },
  pool: true,                    // reuse connections (faster)
  maxConnections: 3,
  maxMessages: 20,
  connectionTimeout: 10000,      // 10s
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

/* -------------------- Message builders -------------------- */
function buildMessages(data) {
  const adminSubject = "New Wholesale Application";
  const userSubject  = "Thank you for your application! [DO NOT REPLY]";

  const adminHTML = adminNotificationTemplate(data);
  const userHTML  = userConfirmationTemplate(data);

  const adminText =
    `New wholesale application\n\n` +
    `Business Name: ${data.companyName}\n` +
    `Contact Name: ${data.contactName}\n` +
    `Contact Number: ${data.phone}\n` +
    `Contact Email: ${data.email}\n` +
    `ABN: ${data.abn}\n` +
    `Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.postcode}, ${data.country}\n` +
    `Note: ${data.note}\n` +
    `Accepts Marketing: ${data.marketingOptIn ? "Yes" : "No"}\n` +
    `Terms Accepted: ${data.policyAccepted ? "Yes" : "No"}\n`;

  const userText =
    `Hi ${data.contactName || "Customer"},\n\n` +
    `Thanks for applying for a ${BRAND_NAME} wholesale account${
      data.companyName ? ` for ${data.companyName}` : ""
    }.\n` +
    `We've received your details and will review your submission within a few business days.\n` +
    `If you don’t receive an update, please reply to this email.\n`;

  return {
    admin: {
      from: FROM,
      to: ADMIN_EMAIL || EMAIL_USER,
      subject: adminSubject,
      html: adminHTML,
      text: adminText,
      replyTo: ADMIN_EMAIL || EMAIL_USER,
    },
    user: {
      from: FROM,
      to: data.email,
      subject: userSubject,
      html: userHTML,
      text: userText,
      replyTo: ADMIN_EMAIL || EMAIL_USER,
    },
  };
}

/* -------------------- Public API -------------------- */
/**
 * Send admin notification + user confirmation
 */
async function sendWholesaleEmails(data) {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    const err = new Error("Mailer not configured (missing EMAIL_HOST/USER/PASS).");
    err.step = "config";
    throw err;
  }

  const msgs = buildMessages(data);

  try {
    // send sequentially (clearer logs); you can parallelise with Promise.all
    const admin = await transporter.sendMail(msgs.admin);
    const user  = await transporter.sendMail(msgs.user);
    return { admin, user };
  } catch (e) {
    // bubble a readable error back to the route
    const err = new Error(e?.response || e?.message || "SMTP send failed");
    err.step = "sendMail";
    throw err;
  }
}

/**
 * Optional: verify on boot
 * - Does not send an email; checks if SMTP server is reachable & credentials work.
 */
async function verifyTransport() {
  try {
    await transporter.verify();   // nodemailer’s built-in check
    return true;
  } catch (e) {
    console.warn("SMTP verify failed:", e?.message || e);
    return false;
  }
}

module.exports = {
  transporter,
  sendWholesaleEmails,
  sendSignupEmail: sendWholesaleEmails, // alias
  verifyTransport,
};
