// services/templates.confirmOrder.js
const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

/* ---------- helpers ---------- */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const n = (v, fallback = 0) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

const money = (v) => `$${n(v, 0).toFixed(2)}`;

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

/* ---------- base wrapper (same as templates.js style) ---------- */
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

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="
          background:${BRAND.CARD};
          border-radius:${BRAND.RADIUS}px;
          overflow:hidden;
          box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:${BRAND.BLACK};padding:44px 20px 18px 20px;text-align:center;">
              <img src="${LOGO_URL}" alt="Sugarlean" width="160" style="display:inline-block;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td style="padding:26px 24px 22px 24px;text-align:center;">
              <div style="font:700 28px/1.25 'Poppins', Arial, Helvetica, sans-serif;color:#2B2B2B;">
                ${esc(title)}
              </div>
            </td>
          </tr>

          ${
            bodyHTML
              ? `<tr><td style="padding:0 24px 32px 24px;">${bodyHTML}</td></tr>`
              : ""
          }

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

      </td></tr>
    </table>
  </body>
</html>
`;

/* ---------- items table ---------- */
function orderItemsTable(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const header = `
    <tr>
      <th style="padding:10px 12px;border:1px solid ${BRAND.BORDER};background:#f3f3f3;text-align:left;font:700 13px/1.3 Arial, Helvetica, sans-serif;">Product</th>
      <th style="padding:10px 12px;border:1px solid ${BRAND.BORDER};background:#f3f3f3;text-align:center;font:700 13px/1.3 Arial, Helvetica, sans-serif;">Boxes</th>
      <th style="padding:10px 12px;border:1px solid ${BRAND.BORDER};background:#f3f3f3;text-align:right;font:700 13px/1.3 Arial, Helvetica, sans-serif;">Unit</th>
      <th style="padding:10px 12px;border:1px solid ${BRAND.BORDER};background:#f3f3f3;text-align:right;font:700 13px/1.3 Arial, Helvetica, sans-serif;">Line</th>
      <th style="padding:10px 12px;border:1px solid ${BRAND.BORDER};background:#f3f3f3;text-align:center;font:700 13px/1.3 Arial, Helvetica, sans-serif;">Status</th>
    </tr>
  `;

  const rowsHTML = safeItems
    .map((it) => {
      const title = it.title || "-";
      const meta = [
        it.sku ? `SKU: ${esc(it.sku)}` : "",
        it.ref ? `REF: ${esc(it.ref)}` : "",
        it.barcode ? `Barcode: ${esc(it.barcode)}` : "",
        it.boxQty ? `Box QTY: ${esc(it.boxQty)}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const soldOut = it.available === false;
      const status = soldOut ? "SOLD OUT / BACK ORDER" : "OK";

      return `
        <tr>
          <td style="padding:10px 12px;border:1px solid ${BRAND.BORDER};vertical-align:top;">
            <div style="font:700 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">${esc(title)}</div>
            ${
              meta
                ? `<div style="margin-top:4px;font:400 12px/1.5 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">${meta}</div>`
                : ""
            }
          </td>
          <td style="padding:10px 12px;border:1px solid ${BRAND.BORDER};text-align:center;font:400 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
            ${esc(String(n(it.qtyBoxes, 0)))}
          </td>
          <td style="padding:10px 12px;border:1px solid ${BRAND.BORDER};text-align:right;font:400 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
            ${money(it.price)}
          </td>
          <td style="padding:10px 12px;border:1px solid ${BRAND.BORDER};text-align:right;font:800 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
            ${money(it.lineTotal)}
          </td>
          <td style="padding:10px 12px;border:1px solid ${BRAND.BORDER};text-align:center;font:800 12px/1.3 Arial, Helvetica, sans-serif;color:${soldOut ? "#B00020" : "#2B2B2B"};">
            ${esc(status)}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="5" style="padding:14px;border:1px solid ${BRAND.BORDER};color:${BRAND.SUBTLE};font:400 14px/1.5 Arial, Helvetica, sans-serif;text-align:center;">
        No items found.
      </td>
    </tr>
  `;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${header}
      ${rowsHTML || empty}
    </table>
  `;
}

/* ---------- templates ---------- */
function confirmOrderAdminTemplate(data = {}) {
  const title = "Wholesale Order Submission";
  const c = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal =
    n(data?.totals?.subtotal, 0) ||
    items.reduce((sum, it) => sum + n(it.lineTotal, 0), 0);

  const detailsTable = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:14px;">
      ${row("Customer Name", c.name)}
      ${row("Customer Email", c.email)}
      ${row("Customer Number", c.customerNumber)}
      ${data.orderId ? row("Order ID", data.orderId) : ""}
      ${row("Shop", data.shop)}
      ${row("Note", data.note)}
    </table>
  `;

  const itemsBlock = `
    <div style="margin:10px 0 10px 0;font:700 16px/1.3 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
      Items
    </div>
    ${orderItemsTable(items)}
    <div style="margin-top:12px;padding:12px 14px;border:1px solid ${BRAND.BORDER};border-radius:14px;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <div style="font:700 14px/1.3 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">Subtotal</div>
        <div style="font:900 16px/1.3 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">${money(subtotal)}</div>
      </div>
      <div style="margin-top:6px;font:400 12px/1.5 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">
        Email submission (not a Shopify checkout order).
      </div>
    </div>
  `;

  return base({ title, bodyHTML: `${detailsTable}${itemsBlock}` });
}

function confirmOrderUserTemplate(data = {}) {
  const title = "We received your wholesale order!";
  const c = data.customer || {};

  const copy = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="text-align:center; padding:10px 0 6px 0;">
          <div style="font:400 16px/1.7 Arial, Helvetica, sans-serif; color:${BRAND.TEXT};">
            Hi ${esc(c.name || "there")},
          </div>
        </td>
      </tr>

      <tr>
        <td style="text-align:center;">
          <div style="display:inline-block; max-width:520px; text-align:left;">
            <p style="margin:0 0 18px 0; font:400 15px/1.75 Arial, Helvetica, sans-serif; color:${BRAND.TEXT}; text-align:center;">
              Thanks! We’ve received your wholesale order submission and our team will process it shortly.
              If we need anything else, we’ll contact you via the details on your account.
            </p>

            ${
              c.customerNumber
                ? `<p style="margin:0 0 18px 0; font:800 14px/1.6 Arial, Helvetica, sans-serif; color:${BRAND.TEXT}; text-align:center;">
                    Customer Number: ${esc(c.customerNumber)}
                   </p>`
                : ""
            }

            <p style="margin:0 0 18px 0; font:400 13px/1.6 Arial, Helvetica, sans-serif; color:${BRAND.SUBTLE}; text-align:center;">
              This is a confirmation of your submission (not a Shopify checkout order).
            </p>
          </div>
        </td>
      </tr>

      <tr>
        <td style="text-align:center; padding:10px 0 2px 0;">
          <a href="${SITE_URL}/pages/wholesale-make-an-order" style="
              display:inline-block;
              background:${BRAND.YELLOW};
              color:#111111;
              text-decoration:none;
              font:700 14px/1 'Poppins', Arial, Helvetica, sans-serif;
              padding:12px 22px;
              border-radius:9999px;
              box-shadow:0 2px 6px rgba(0,0,0,0.08);
            ">
            Back to Wholesale Shopping
          </a>
        </td>
      </tr>
    </table>
  `;

  return base({ title, bodyHTML: copy });
}

/* ---------- exports expected by mailer.js ---------- */
function renderConfirmOrderAdminEmail(data = {}) {
  const c = data.customer || {};
  return {
    subject: `Wholesale Order Submission — ${c.customerNumber || "No Customer #"} — ${c.name || c.email || "Unknown"}`,
    html: confirmOrderAdminTemplate(data),
  };
}

function renderConfirmOrderUserEmail(data = {}) {
  return {
    subject: "Wholesale Order received [DO NOT REPLY]",
    html: confirmOrderUserTemplate(data),
  };
}

module.exports = {
  confirmOrderAdminTemplate,
  confirmOrderUserTemplate,
  renderConfirmOrderAdminEmail,
  renderConfirmOrderUserEmail,
};
