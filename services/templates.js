// services/templates.js
const BRAND_COLOR = "#FEC645";
const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986";
const SITE_URL = "https://www.sugarlean.com.au";
const POLICY_URL = "https://www.sugarlean.com.au/policies/privacy-policy";

// simple esc helper
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// table row that can optionally render raw HTML (for the policy link)
const row = (label, value, { raw = false } = {}) => {
  const v = value == null || value === "" ? "—" : value;
  return `
    <tr>
      <td style="background:#f4f4f4;padding:8px 12px;font-weight:600;">${esc(label)}</td>
      <td style="padding:8px 12px;">${raw ? String(v) : esc(String(v))}</td>
    </tr>
  `;
};

exports.adminTemplate = (data) => `
<!DOCTYPE html>
<html>
  <body style="font-family:Poppins, Arial, sans-serif; background:#f7f7f7; margin:0; padding:40px;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
      <div style="background:#000;padding:30px;text-align:center;">
        <img src="${LOGO_URL}" alt="Sugarlean Pty Ltd" style="width:180px;">
      </div>
      <div style="padding:40px 30px;">
        <h2 style="text-align:center;font-size:22px;margin:0 0 10px;color:#222;">
          New Wholesale <span style="background:${BRAND_COLOR};padding:2px 6px;border-radius:4px;">Application</span>
        </h2>
        <p style="text-align:center;color:#666;margin:0;">
          A new wholesale signup has been submitted through the Sugarlean website.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:25px;">
          ${row("Business Name", data.companyName)}
          ${row("Contact Name", data.contactName)}
          ${row("Contact Number", data.phone)}
          ${row("Contact Email", data.email)}
          ${row("ABN", data.abn)}
          ${row("Street Address", data.streetAddress)}
          ${row("City", data.city)}
          ${row("State", data.state)}
          ${row("Postcode", data.postCode)}
          ${row("Country", data.country)}
          ${data.note ? row("Note", data.note) : ""} 
          ${row("Accepts Marketing", data.marketingOptIn ? "Yes" : "No")}
          ${row("Terms Accepted", data.policyAccepted ? "Yes" : "No")}
          ${row(
            "Policy",
            `<a href="${esc(POLICY_URL)}" style="color:${BRAND_COLOR};text-decoration:none;">View policy</a>`,
            { raw: true }
          )}
        </table>

        <p style="text-align:center;color:#888;margin-top:40px;font-size:13px;">
          Sent automatically from <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Sugarlean.com.au</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

exports.userTemplate = (data) => `
<!DOCTYPE html>
<html>
  <body style="font-family:Poppins, Arial, sans-serif; background:#f7f7f7; margin:0; padding:40px;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
      <div style="background:#000;padding:30px;text-align:center;">
        <img src="${LOGO_URL}" alt="Sugarlean Pty Ltd" style="width:180px;">
      </div>
      <div style="padding:40px 30px;text-align:center;">
        <h2 style="font-size:22px;margin:0 0 10px;color:#222;">
          Thanks for applying! <span style="background:${BRAND_COLOR};padding:2px 6px;border-radius:4px;">Application</span>
        </h2>
        <p style="color:#666;margin:15px 0 0;">
          We’ve received your wholesale application.
        </p>
        <p style="color:#444;margin:25px 0 35px;">
          Hi ${esc(data.contactName)}, we’ll review your details for <strong>${esc(data.companyName)}</strong> and get back to you shortly.
        </p>
        <a href="${SITE_URL}" style="background:${BRAND_COLOR};color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">
          Visit Store
        </a>
        <p style="text-align:center;color:#888;margin-top:40px;font-size:13px;">
          Sent automatically from <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Sugarlean.com.au</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;
