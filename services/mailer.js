// services/mailer.js
// Sugarlean Mailer — branded admin + applicant emails (no-reply user)

const nodemailer = require("nodemailer");

/* ──────────────────────────────────────────────────────────────
 * Brand config (can be overridden via env)
 * ──────────────────────────────────────────────────────────── */
const BRAND         = (process.env.BRAND_NAME   || "Sugarlean").trim();
const BRAND_URL     = (process.env.BRAND_URL    || "https://www.sugarlean.com.au").trim();
const ACCENT        = (process.env.ACCENT_COLOR || "#FEC645").trim();
const LOGO_URL      = (process.env.LOGO_URL     ||
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986").trim();
const PRIVACY_URL   = (process.env.PRIVACY_URL  || "https://www.sugarlean.com.au/policies/privacy-policy").trim();
const SUPPORT_EMAIL = (process.env.SUPPORT_EMAIL || "").trim(); // optional
const SUPPORT_PHONE = (process.env.SUPPORT_PHONE || "").trim(); // optional

// for footer: "sugarlean.com.au"
const displayHost = (() => {
  try { return new URL(BRAND_URL).host; }
  catch { return BRAND_URL.replace(/^https?:\/\/(www\.)?/, ""); }
})();

/* ──────────────────────────────────────────────────────────────
 * SMTP
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
 * Mail identities + subjects
 * ──────────────────────────────────────────────────────────── */
const FROM_NO_REPLY = `"Sugarlean Pty Ltd (Do not reply)" <${process.env.NO_REPLY_FROM || user || "no-reply@sugarlean.com.au"}>`;
const FROM_ADMIN    = `"Sugarlean Orders" <${process.env.ADMIN_FROM || user || "orders@sugarlean.com.au"}>`;
const ADMIN_TO      = (process.env.ADMIN_TO || user || "").trim();

const SUBJECT_USER  = "Thank you for your application! [DO NOT REPLY]";
const SUBJECT_ADMIN = "New wholesale application received";

/* ──────────────────────────────────────────────────────────────
 * utils
 * ──────────────────────────────────────────────────────────── */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const yesNo = (b) => (b ? "Yes" : "No");

const stripHtml = (html) =>
  String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function tableRow(label, value, { raw = false } = {}) {
  const v = value === undefined || value === null || value === "" ? "—" : value;
  return `
  <tr>
    <td style="background:#f3f3f3;border:1px solid #e8e8e8;padding:10px 12px;font-weight:700;color:#333;width:42%;">
      ${esc(label)}
    </td>
    <td style="border:1px solid #e8e8e8;padding:10px 12px;color:#333;">
      ${raw ? String(v) : esc(String(v))}
    </td>
  </tr>`;
}

function detailsTable(d) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
    ${tableRow("Business Name", d.companyName)}
    ${tableRow("Contact Name", d.contactName)}
    ${tableRow("Contact Number", d.phone)}
    ${tableRow("Contact Email", d.email)}
    ${tableRow("ABN", d.abn)}
    ${tableRow("Street Address", d.streetAddress)}
    ${tableRow("City", d.city)}
    ${tableRow("State", d.state)}
    ${tableRow("Postcode", d.postCode)}
    ${tableRow("Country", d.country)}
    ${d.note ? tableRow("Note", d.note) : ""}
    ${tableRow("Accepts Marketing", yesNo(!!d.marketingOptIn))}
    ${tableRow("Terms Accepted", yesNo(!!d.policyAccepted))}
  </table>`;
}

/* ──────────────────────────────────────────────────────────────
 * Card shell (A4-ish width, professional layout)
 * ──────────────────────────────────────────────────────────── */
function legalFooter() {
  const year = new Date().getFullYear();
  return `
    <hr style="border:none;border-top:1px solid #eee;margin:18px 0;">
    <p style="margin:8px 0 0 0;color:#9a9a9a;font-size:12px;line-height:1.5;">
      © ${year} <strong>SUGARLEAN PTY LTD</strong>
      &nbsp; | &nbsp;
      <a href="${PRIVACY_URL}" style="color:#666;text-decoration:none;">Privacy Policy</a>
      &nbsp; | &nbsp;
      <a href="${BRAND_URL}" style="color:#666;text-decoration:none;">Website</a>
    </p>`;
}

function cardShell({ title, subtitle, bodyHtml, footerHtml }) {
  return `
  <div style="margin:0;padding:48px;background:#f5f5f5;">
    <div style="max-width:602px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.08);overflow:hidden;">
      <!-- Header -->
      <div style="background:#000;padding:28px 32px;text-align:center;">
        <a href="${BRAND_URL}" target="_blank" style="text-decoration:none;">
          <img src="${LOGO_URL}" alt="${esc(BRAND)}" style="width:200px;height:auto;display:block;margin:0 auto;"/>
        </a>
      </div>

      <!-- Title -->
      <div style="padding:32px 40px 6px 40px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="margin:0 0 8px 0;font-size:24px;line-height:1.25;color:#111;">${esc(title)}</h1>
        ${subtitle ? `<p style="margin:0;color:#777;">${esc(subtitle)}</p>` : ""}
      </div>

      <!-- Body -->
      <div style="padding:18px 40px 24px 40px;font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div style="padding:0 40px 28px 40px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
        ${
          footerHtml ||
          `<p style="margin:0;color:#8d8d8d;font-size:13px;">
             Sent automatically from
             <a href="${BRAND_URL}" style="color:${ACCENT};text-decoration:none;">${displayHost}</a>
           </p>`
        }
        ${legalFooter()}
      </div>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────────────────────────
 * Public: verify + send
 * ──────────────────────────────────────────────────────────── */
async function verifySmtp() {
  return transporter.verify();
}

async function sendSignupEmail(d) {
  // 1) Admin notification
  const adminHtml = cardShell({
    title: "New Wholesale Application",
    subtitle: `A new wholesale signup has been submitted through the ${BRAND} website.`,
    bodyHtml: detailsTable(d),
  });

  const infoAdmin = await transporter.sendMail({
    from: FROM_ADMIN,
    to: ADMIN_TO || user,
    replyTo: d.email || undefined,
    subject: SUBJECT_ADMIN,
    html: adminHtml,
    text: stripHtml(adminHtml),
  });
  console.log(`✅ Admin email sent to ${ADMIN_TO || user}:`, infoAdmin.messageId);

  // 2) Applicant confirmation (do-not-reply)
  if (d.email) {
    const hi = d.contactName ? `Hi ${esc(d.contactName)},` : "Hi there,";
    const confirmHtml = cardShell({
      title: "We’ve received your wholesale application!",
      subtitle: "Thanks for your application — we’ll review it shortly.",
      bodyHtml: `
        <p style="margin:0 0 14px 0;">${hi}</p>
        <p style="margin:0 0 14px 0;">
          Thank you for applying for a <strong>wholesale account with ${esc(BRAND)}</strong>.
          We’ve received your details for <strong>${esc(d.companyName || "")}</strong>.
        </p>
        <p style="margin:0 0 14px 0;">
          Our team will review your submission and get back to you within a few business days.
          If we need anything else, we’ll reach out using the contact information you provided.
        </p>
        <div style="text-align:center;margin:22px 0 0 0;">
          <a href="${BRAND_URL}"
             style="background:${ACCENT};color:#000;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;">
            Visit ${esc(BRAND)}
          </a>
        </div>
        <p style="margin:16px 0 0 0;font-size:12px;color:#777;text-align:center;">
          This inbox is unattended — please do not reply to this email.
        </p>
      `,
    });

    const infoUser = await transporter.sendMail({
      from: FROM_NO_REPLY,
      to: d.email,
      subject: SUBJECT_USER,
      html: confirmHtml,
      text: stripHtml(confirmHtml),
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
