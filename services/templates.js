// services/templates.js
// --- Brand tokens (Sugarlean) ---
const BRAND = {
  YELLOW: "#FEC645",
  BLACK:  "#0C0C0C",
  BG:     "#F4F5F7",
  TEXT:   "#222222",
  SUBTLE: "#6F6F6F",
  BORDER: "#ECECEC",
  CARD:   "#FFFFFF",
  RADIUS: 20,
  WIDTH:  600,
};

const SITE_URL = "https://www.sugarlean.com.au";
const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986";

// ---------- helpers ----------
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const yn = (v) => (v ? "Yes" : "No");

const row = (label, value) => `
  <tr>
    <th style="
      width:200px;
      background:#f3f3f3;
      border:1px solid ${BRAND.BORDER};
      padding:12px 14px;
      font:600 14px/1.35 Arial, Helvetica, sans-serif;
      color:${BRAND.TEXT};
      text-align:left;">${esc(label)}</th>
    <td style="
      border:1px solid ${BRAND.BORDER};
      padding:12px 14px;
      font:400 14px/1.5 Arial, Helvetica, sans-serif;
      color:${BRAND.TEXT};">${esc(value || "-")}</td>
  </tr>
`;

// ---------- base wrapper ----------
const base = ({ title, bodyHTML = "" }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:24px;background:${BRAND.BG};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:${BRAND.WIDTH}px;margin:0 auto;">
      <tr><td>

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="
          background:${BRAND.CARD};
          border-radius:${BRAND.RADIUS}px;
          overflow:hidden;
          box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Brand header -->
          <tr>
            <td style="background:${BRAND.BLACK};padding:44px 20px 18px 20px;text-align:center;">
              <img src="${LOGO_URL}" alt="Sugarlean" width="160" style="display:inline-block;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:26px 24px 22px 24px;text-align:center;">
              <div style="font:700 28px/1.25 'Poppins', Arial, Helvetica, sans-serif;color:#2B2B2B;">
                ${esc(title)}
              </div>
            </td>
          </tr>

          <!-- Body -->
          ${
            bodyHTML
              ? `<tr>
                  <td style="padding:0 24px 32px 24px;">${bodyHTML}</td>
                </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding:12px 16px 6px 16px;text-align:center;">
              <div style="font:500 12px/1.6 Arial, Helvetica, sans-serif;color:#9A9A9A;">
                Sent automatically from
                <a href="${SITE_URL}" style="color:${BRAND.YELLOW};text-decoration:none;">www.sugarlean.com.au</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 16px 18px 16px;text-align:center;">
              <div style="font:400 12px/1.6 Arial, Helvetica, sans-serif;color:#111111;">
                © ${new Date().getFullYear()} SUGARLEAN PTY LTD
              </div>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td></tr>
    </table>
  </body>
</html>
`;

// ---------- templates ----------
function adminNotificationTemplate(data = {}) {
  const title = "New Wholesale Application";

  const detailsTable = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Business Name",     data.companyName)}
      ${row("Contact Name",      data.contactName)}
      ${row("Contact Number",    data.phone)}
      ${row("Contact Email",     data.email)}
      ${row("ABN",               data.abn)}
      ${row("Street Address",    data.streetAddress)}
      ${row("City",              data.city)}
      ${row("State",             data.state)}
      ${row("Postcode",          data.postcode)}
      ${row("Country",           data.country)}
      ${row("Note",              data.note)}
      ${row("Accepts Marketing", yn(data.marketingOptIn))}
      ${row("Terms Accepted",    yn(data.policyAccepted))}
    </table>
  `;

  return base({ title, bodyHTML: detailsTable });
}

function userConfirmationTemplate(data = {}) {
  const title = "Thank you for your application! [DO NOT REPLY]";
  const contactName = data.contactName || "Customer";
  const company = data.companyName ? ` for <strong>${esc(data.companyName)}</strong>` : "";

  const copy = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="text-align:center; padding:18px 0 18px 0;">
          <div style="font:400 16px/1.7 Arial, Helvetica, sans-serif; color:${BRAND.TEXT};">
            Hi ${esc(contactName)},
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align:center;">
          <div style="display:inline-block; max-width:520px; text-align:left;">
            <p style="margin:0 0 26px 0; font:400 15px/1.75 Arial, Helvetica, sans-serif; color:${BRAND.TEXT}; text-align:center;">
              Thank you for applying for a wholesale account with <strong>Sugarlean</strong>${company}.<br>
              Our team will review your submission and get back to you within a few business days.
              If we need anything else, we’ll reach out using the contact details you provided.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align:center; padding:22px 0 26px 0;">
          <a href="${SITE_URL}" style="
              display:inline-block;
              background:${BRAND.YELLOW};
              color:#111111;
              text-decoration:none;
              font:700 14px/1 'Poppins', Arial, Helvetica, sans-serif;
              padding:12px 24px;
              border-radius:9999px;
              box-shadow:0 2px 6px rgba(0,0,0,0.08);
            ">
            Visit us
          </a>
        </td>
      </tr>
    </table>
  `;

  return base({ title, bodyHTML: copy });
}

// ---------- adapters expected by mailer.js ----------
function renderAdminEmail(data = {}) {
  return {
    subject: "New Wholesale Application — Sugarlean",
    html: adminNotificationTemplate(data),
  };
}

function renderUserEmail(data = {}) {
  return {
    subject: "Sugarlean Wholesale — Application received",
    html: userConfirmationTemplate(data),
  };
}

// Legacy aliases
const adminTemplate = (d = {}) => adminNotificationTemplate(d);
const userTemplate  = (d = {}) => userConfirmationTemplate(d);

module.exports = {
  BRAND,
  SITE_URL,
  LOGO_URL,
  esc,
  row,
  adminNotificationTemplate,
  userConfirmationTemplate,
  // names used by the mailer
  renderAdminEmail,
  renderUserEmail,
  // legacy aliases
  adminTemplate,
  userTemplate,
};
