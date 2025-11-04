// ---------- Sugarlean email templates (CommonJS) ----------

const BRAND_BG = "#FEC645";     // Sugarlean yellow
const TEXT = "#222222";
const MUTED = "#666666";
const BORDER = "#ececec";

function brisbaneNow() {
  return new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function safe(v) {
  // tiny helper in case a value is null/undefined/empty string
  return (v === undefined || v === null || v === "") ? null : String(v);
}

function row(label, value) {
  if (!safe(value)) return "";
  return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};white-space:nowrap;"><strong>${label}</strong></td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BORDER};">${value}</td>
    </tr>`;
}

function linkifyEmail(email) {
  return safe(email) ? `<a href="mailto:${email}" style="color:${TEXT};text-decoration:underline;">${email}</a>` : "";
}

function linkifyPhone(phone) {
  return safe(phone) ? `<a href="tel:${phone.replace(/\s+/g,"")}" style="color:${TEXT};text-decoration:underline;">${phone}</a>` : "";
}

function adminSubject(company) {
  return `New Wholesale Application — ${company}`;
}

function adminHtml(payload) {
  const {
    companyName, contactName, phone, abn, email,
    street, city, state, postCode, country,
    message, marketingOptIn, termsAccepted,
  } = payload;

  const address = [street, city, state, postCode, country].filter(Boolean).join(", ");
  const yesNo = (b) => (b ? "Yes" : "No");

  return `
  <div style="background:#f7f7f7;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND_BG};padding:18px 22px;">
          <div style="font-size:18px;font-weight:700;color:${TEXT};">Sugarlean — New Wholesale Application</div>
          <div style="font-size:12px;color:${TEXT};opacity:0.8;">Received ${brisbaneNow()} (AEST)</div>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${row("Company", companyName)}
            ${row("Contact", contactName)}
            ${row("Phone", linkifyPhone(phone))}
            ${row("ABN", abn)}
            ${row("Email", linkifyEmail(email))}
            ${row("Address", address)}
            ${row("Message", safe(message) || "-")}
            ${row("Marketing opt-in", yesNo(!!marketingOptIn))}
            ${row("Terms accepted", yesNo(!!termsAccepted))}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 22px;color:${MUTED};font-size:12px;">
          Replying to this email will send to the applicant (via <code>reply-to</code>).
        </td>
      </tr>
    </table>
    <div style="text-align:center;color:${MUTED};font-size:12px;margin-top:10px;">
      Sugarlean • Brisbane, Australia
    </div>
  </div>`;
}

function customerSubject() {
  return "We’ve received your wholesale application";
}

function customerHtml({ companyName }) {
  return `
  <div style="background:#f7f7f7;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND_BG};padding:18px 22px;">
          <div style="font-size:18px;font-weight:700;color:${TEXT};">Thanks for your application</div>
          <div style="font-size:12px;color:${TEXT};opacity:0.8;">Received ${brisbaneNow()} (AEST)</div>
        </td>
      </tr>
      <tr>
        <td style="padding:22px;color:${TEXT};line-height:1.6;">
          <p style="margin:0 0 10px 0;">Hi${companyName ? ` ${companyName}` : ""},</p>
          <p style="margin:0 0 10px 0;">We’ve received your wholesale application and our team is reviewing it now.</p>
          <p style="margin:0 0 10px 0;">We typically reply within <strong>1–2 business days</strong>. If we need more info, we’ll reach out directly.</p>
          <p style="margin:18px 0 0 0;">Warmly,<br/>The Sugarlean Team</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 22px;color:${MUTED};font-size:12px;">
          If this wasn’t you, please contact <a href="mailto:info@sugarlean.com.au" style="color:${MUTED};text-decoration:underline;">info@sugarlean.com.au</a>.
        </td>
      </tr>
    </table>
  </div>`;
}

module.exports = { adminSubject, adminHtml, customerSubject, customerHtml };
