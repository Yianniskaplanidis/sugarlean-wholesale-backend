// services/mailer.js
// Sugarlean Mailer — sends Admin + Applicant emails using services/templates.js

const nodemailer = require("nodemailer");
const { adminTemplate, userTemplate } = require("./templates");

/* ──────────────────────────────────────────────────────────────
 * SMTP (from env)
 * ──────────────────────────────────────────────────────────── */
const host   = (process.env.EMAIL_HOST || "").trim();
const port   = Number(process.env.EMAIL_PORT || 587);
const secure = (process.env.EMAIL_SECURE || "false").toString() === "true"; // 465 => true
const user   = (process.env.EMAIL_USER || "").trim();
const pass   = (process.env.EMAIL_PASS || "").trim();

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,                      // true for 465, false for 587
  auth: user && pass ? { user, pass } : undefined,
  requireTLS: port === 587,    // STARTTLS on 587
  tls: { minVersion: "TLSv1.2", servername: host },
});

/* ──────────────────────────────────────────────────────────────
 * Identities + Subjects
 * ──────────────────────────────────────────────────────────── */
const FROM_NO_REPLY = `"Sugarlean Pty Ltd (Do not reply)" <${process.env.NO_REPLY_FROM || user || "no-reply@sugarlean.com.au"}>`;
const FROM_ADMIN    = `"Sugarlean Orders" <${process.env.ADMIN_FROM || user || "orders@sugarlean.com.au"}>`;
const ADMIN_TO      = (process.env.ADMIN_TO || user || "").trim();

const SUBJECT_USER  = "Thank you for your application! [DO NOT REPLY]";
const SUBJECT_ADMIN = "New wholesale application received";

/* ──────────────────────────────────────────────────────────────
 * utils
 * ──────────────────────────────────────────────────────────── */
const stripHtml = (html) =>
  String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/* ──────────────────────────────────────────────────────────────
 * Public: verify + send
 * ──────────────────────────────────────────────────────────── */
async function verifySmtp() {
  return transporter.verify();
}

async function sendSignupEmail(d) {
  // 1) Admin notification (HTML from templates.js)
  const adminHtml = adminTemplate(d);
  const infoAdmin = await transporter.sendMail({
    from: FROM_ADMIN,
    to: ADMIN_TO || user,
    replyTo: d.email || undefined,
    subject: SUBJECT_ADMIN,
    html: adminHtml,
    text: stripHtml(adminHtml),
  });
  console.log(`✅ Admin email sent to ${ADMIN_TO || user}:`, infoAdmin.messageId);

  // 2) Applicant confirmation (do-not-reply) — HTML from templates.js
  if (d.email) {
    const userHtml = userTemplate(d);
    const infoUser = await transporter.sendMail({
      from: FROM_NO_REPLY,
      to: d.email,
      subject: SUBJECT_USER,
      html: userHtml,
      text: stripHtml(userHtml),
    });
    console.log(`📩 Applicant confirmation sent to ${d.email}:`, infoUser.messageId);
  }

  return { ok: true };
}

/* ──────────────────────────────────────────────────────────────
 * exports
 * ──────────────────────────────────────────────────────────── */
module.exports = {
  transporter,
  verifySmtp,
  sendSignupEmail,
};
