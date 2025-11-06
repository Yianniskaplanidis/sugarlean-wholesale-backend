// services/mailer.js
// Sugarlean Mailer — branded admin + applicant emails

const nodemailer = require("nodemailer");

/* ──────────────────────────────────────────────────────────────
 * Brand config (override via env)
 * ──────────────────────────────────────────────────────────── */
const BRAND       = process.env.BRAND_NAME   || "Sugarlean";
const BRAND_URL   = (process.env.BRAND_URL   || "https://www.sugarlean.com.au").trim();
const ACCENT      = (process.env.ACCENT_COLOR || "#FEC645").trim();
const LOGO_URL    = (process.env.LOGO_URL     ||
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986").trim();
const SUPPORT_EMAIL = (process.env.SUPPORT_EMAIL || "").trim(); // optional
const SUPPORT_PHONE = (process.env.SUPPORT_PHONE || "").trim(); // optional

// displayHost: used in footer ("sugarlean.com.au" instead of full URL)
const displayHost = (() => {
  try { return new URL(BRAND_URL).host; }
  catch { return BRAND_URL.replace(/^https?:\/\/(www\.)?/, ""); }
})();

/* ──────────────────────────────────────────────────────────────
 * SMTP
 * ──────────────────────────────────────────────────────────── */
const host        = (process.env.EMAIL_HOST || "").trim();
const port        = Number(process.env.EMAIL_PORT || 587);
const secure      = (process.env.EMAIL_SECURE || "false").toString() === "true"; // 465 => true
const user        = (process.env.EMAIL_USER || "").trim();
const pass        = (process.env.EMAIL_PASS || "").trim();
const defaultFrom = (process.env.EMAIL_FROM || user || "").trim();
const defaultTo   = (process.env.EMAIL_TO   || user || "").trim();

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,                     // true for 465, false for 587
  auth: user && pass ? { user, pass } : undefined,
  requireTLS: port === 587,   // STARTTLS on 587
  tls: { minVersion: "TLSv1.2", servername: host },
});

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

// table row (supports raw HTML in value cell via { raw:true })
function tableRow(label, value, { raw = false } = {}) {
  const v = value === undefined || value === null || value === "" ? "—" : value;
  return `
  <tr>
    <td style="background:#f3f3f3;border:1px solid #e8e8e8;padding:10px 12px;font-weight:700;color:#333;width:190px;">
      ${esc(label)}
    </td>
    <td style="border:1px solid #e8e8e8;padding:10px 12px;color:#333;">
      ${raw ? String(v) : esc(String(v))}
    </td>
  </tr>`;
}

function detailsTable(d) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:720px;">
    ${tableRow("Business Name", d.companyName)}
    ${tableRow("Contact Name", d.contactName)}
    ${tableRow("Contact Number", d.phone)}
    ${tableRow("Contact Email", d.email)}
    ${tableRow("Abn", d.abn)}
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
 * card shell
 * ──────────────────────────────────────────────────────────── */
function cardShell({ title, subtitle, bodyHtml, footerHtml }) {
  // Black banner header, rounded card, subtle shadow
  return `
  <div style="margin:0;padding:24px;background:#efefef;">
    <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 8px 22px rgba(0,0,0,.10);overflow:hidden;">
      <!-- Header -->
      <div style="background:#0f0f0f;padding:18px 22px;">
        <a href="${BRAND_URL}" target="_blank" style="text-decoration:none;">
          <img src="${LOGO_URL}" alt="${esc(BRAND)}" style="height:42px;display:block;margin:0 auto;"/>
        </a>
      </div>

      <!-- Title -->
      <div style="padding:26px 26px 6px 26px;text-align:center;">
        <h1 style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;color:#111;">
          ${esc(title)}
        </h1>
        ${subtitle ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6b6b6b;">${esc(subtitle)}</p>` : ""}
      </div>

      <!-- Body -->
      <div style="padding:22px 26px 8px 26px;font-family:Arial,Helvetica,sans-serif;color:#111;">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div style="padding:16px 26px 26px 26px;text-align:center;">
        ${
          footerHtml ||
          `<p style="margin:10px 0 0 0;color:#9b9b9b;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
            Sent automatically from
            <a href="${BRAND_URL}" style="color:${ACCENT};text-decoration:none;">${displayHost}</a>
          </p>`
        }
      </div>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────────────────────────
 * helpers
 * ──────────────────────────────────────────────────────────── */
async function verifySmtp() {
  return transporter.verify();
}

/* ──────────────────────────────────────────────────────────────
 * main: admin + applicant
 * ──────────────────────────────────────────────────────────── */
async function sendSignupEmail(d) {
  const adminTo = defaultTo || user;
  const from    = defaultFrom || user;

  // 1) Admin notification — table only (NO BUTTONS)
  const adminHtml = cardShell({
    title: "New Wholesale Application",
    subtitle: `A new wholesale signup has been submitted through the ${BRAND} website.`,
    bodyHtml: detailsTable(d),
  });

  const subjectAdmin = `New Wholesale Application — ${d.companyName || d.contactName || BRAND}`;
  const infoAdmin = await transporter.sendMail({
    from,
    to: adminTo,
    replyTo: d.email || undefined,
    subject: subjectAdmin,
    html: adminHtml,
    text: stripHtml(adminHtml),
  });
  console.log("✅ Admin email sent:", infoAdmin.messageId);

  // 2) Applicant confirmation (professional tone, to applicant email)
  if (d.email) {
    const hi = d.contactName ? `Hi ${esc(d.contactName)},` : "Hi there,";
    const confirmHtml = cardShell({
      title: "Thanks for your application",
      subtitle: "We’ve received your wholesale application.",
      bodyHtml: `
        <p style="margin:0 0 12px 0;">${hi}</p>
        <p style="margin:0 0 12px 0;">Thanks for applying for a wholesale account with <b>${esc(BRAND)}</b>. We’ve received your details for <b>${esc(d.companyName || "")}</b>.</p>
        <p style="margin:0 0 12px 0;">Our team will review your application and get back to you shortly. If we need anything else, we’ll reach out to the contact information you provided.</p>
        ${
          SUPPORT_EMAIL || SUPPORT_PHONE
            ? `<p style="margin:10px 0 0 0;font-size:13px;color:#666;">Questions? Reply to this email or contact us:</p>
               <p style="margin:0;font-size:13px;color:#666;">
                 ${SUPPORT_EMAIL ? `<b>Email:</b> <a style="color:${ACCENT};text-decoration:none;" href="mailto:${esc(SUPPORT_EMAIL)}">${esc(SUPPORT_EMAIL)}</a><br>` : ""}
                 ${SUPPORT_PHONE ? `<b>Phone:</b> ${esc(SUPPORT_PHONE)}` : ""}
               </p>`
            : ""
        }
      `,
    });

    const subjectUser = `${BRAND} — We’ve received your wholesale application`;
    const infoUser = await transporter.sendMail({
      from,
      to: d.email, // send to applicant
      subject: subjectUser,
      html: confirmHtml,
      text: stripHtml(confirmHtml),
    });
    console.log("📩 Applicant confirmation sent:", infoUser.messageId);
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
