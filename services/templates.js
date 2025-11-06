// services/templates.js
const BRAND_COLOR = "#FEC645";
const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986";
const SITE_URL = "https://www.sugarlean.com.au";

// simple esc helper
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Wholesale Application Received – Sugarlean</title>
  </head>
  <body style="font-family: Poppins, Arial, sans-serif; background:#f6f6f6; margin:0; padding:40px;">
    <div style="max-width:640px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 3px 10px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#000; padding:32px; text-align:center;">
        <img src="https://cdn.shopify.com/s/files/1/0508/5528/0818/files/SUGARLEAN_PTY_LTD_White.png?v=1751947986" 
             alt="Sugarlean Pty Ltd" 
             style="width:200px; display:block; margin:auto;" />
      </div>

      <!-- Main content -->
      <div style="padding:48px 40px 32px; color:#222;">
        <h1 style="font-size:24px; margin:0; text-align:center;">Thank you for your application</h1>
        <p style="text-align:center; color:#777; margin-top:8px; margin-bottom:32px;">
          We’ve received your wholesale application.
        </p>

        <p style="margin:0 0 16px;">Hi ${data.contactName},</p>

        <p style="margin:0 0 16px; line-height:1.6;">
          Thank you for applying for a <strong>wholesale account with Sugarlean</strong>. 
          We’ve successfully received your application details for 
          <strong>${data.companyName}</strong>.
        </p>

        <p style="margin:0 0 16px; line-height:1.6;">
          Our team will review your submission carefully and get back to you within a few business days. 
          If we require any additional information, we’ll reach out using the contact details you provided.
        </p>

        <p style="margin:0 0 28px; line-height:1.6;">
          We appreciate your interest in partnering with us and look forward to the opportunity of working together.
        </p>

        <div style="text-align:center; margin-top:32px;">
          <a href="https://www.sugarlean.com.au" 
             style="background:#FEC645; color:#000; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:8px; display:inline-block;">
            Visit Sugarlean Website
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa; text-align:center; padding:24px 20px;">
        <p style="font-size:13px; color:#999; margin:0;">
          Sent automatically from 
          <a href="https://www.sugarlean.com.au" style="color:#FEC645; text-decoration:none;">
            www.sugarlean.com.au
          </a>
        </p>
        <p style="font-size:12px; color:#bbb; margin:6px 0 0;">
          © ${new Date().getFullYear()} Sugarlean Pty Ltd. All rights reserved.
        </p>
      </div>
    </div>
  </body>
</html>
`;

