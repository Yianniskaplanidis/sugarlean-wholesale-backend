// services/templates.js
const BRAND_COLOR = "#FEC645"; // Sugarlean gold
const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986";
const SITE_URL = "https://www.sugarlean.com.au";

// simple escape helper
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// admin table row helper
const row = (label, value) => `
  <tr>
    <th style="text-align:left;background:#f3f3f3;border:1px solid #e6e6e6;padding:12px 14px;width:42%;font-weight:600;">
      ${esc(label)}
    </th>
    <td style="border:1px solid #e6e6e6;padding:12px 14px;">
      ${esc(value ?? "")}
    </td>
  </tr>
`;

exports.adminTemplate = (data) => `
<!DOCTYPE html>
<html>
  <body style="font-family:Poppins, Arial, sans-serif; background:#f7f7f7; margin:0; padding:48px;">
    <div style="max-width:602px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,0.08)">
      <div style="background:#000;padding:32px;text-align:center;">
        <img src="${LOGO_URL}" alt="Sugarlean Pty Ltd" style="width:200px;display:block;margin:auto;">
      </div>

      <div style="padding:40px 32px;">
        <h2 style="text-align:center;font-size:24px;margin:0 0 10px;color:#222;">
          New Wholesale <span style="background:${BRAND_COLOR};padding:2px 8px;border-radius:6px;">Application</span>
        </h2>
        <p style="text-align:center;color:#666;margin:0 0 20px;">
          A new wholesale signup has been submitted through the Sugarlean website.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
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
        </table>

        <p style="text-align:center;color:#888;margin-top:28px;font-size:13px;">
          Sent automatically from <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//,"")}</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

exports.userTemplate = (data) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Thank you for your application! [DO NOT REPLY]</title>
  </head>
  <body style="font-family:Poppins, Arial, sans-serif; background:#f6f6f6; margin:0; padding:48px;">
    <div style="max-width:602px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#000; padding:32px; text-align:center;">
        <img src="${LOGO_URL}" alt="Sugarlean Pty Ltd" style="width:200px; display:block; margin:auto;" />
      </div>

      <!-- Main content (tight, professional layout) -->
      <div style="padding:40px 48px 0; color:#222;">
        <h1 style="font-size:24px; margin:0; text-align:center;">Thank you for your application!</h1>
        <p style="text-align:center; color:#777; margin-top:8px; margin-bottom:28px;">
          Thanks for your application — we’ll review it shortly.
        </p>

        <div style="max-width:520px;margin:0 auto;line-height:1.75;font-size:15px;">
          <p style="margin:0 0 18px;">Hi ${esc(data.contactName)},</p>

          <p style="margin:0 0 18px;">
            Thanks for applying for a wholesale account with Sugarlean. We’ve received your submission for
            <strong>${esc(data.companyName)}</strong> and passed it to our team for review.
          </p>

          <p style="margin:0 0 18px;">
            We’ll be in touch shortly. If you haven’t heard from us within <strong>3 business days</strong>—or if your
            application is declined and you’d like to discuss—please contact us at
            <a href="mailto:info@sugarlean.com.au" style="color:#222;text-decoration:none;border-bottom:1px solid #ddd;">info@sugarlean.com.au</a>.
          </p>

          <p style="margin:0 0 24px;">
            Kind regards,<br>
            Sugarlean Pty Ltd
          </p>
        </div>
      </div>

      <!-- Notice bar -->
      <div style="background:${BRAND_COLOR};padding:14px 24px;text-align:center;margin-top:28px;">
        <p style="margin:0;color:#fff;font-size:13px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:14px 24px 24px; text-align:center; color:#9a9a9a; font-size:12px;">
        © ${new Date().getFullYear()} <strong>SUGARLEAN PTY LTD</strong>
        &nbsp; | &nbsp;
        <a href="${SITE_URL}" style="color:#6f6f6f;text-decoration:none;">
          ${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      </div>
    </div>
  </body>
</html>
`;
