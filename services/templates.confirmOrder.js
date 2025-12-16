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

// Preserve new lines in email while staying safe
const escWithBreaks = (s = "") => esc(s).replace(/\r\n|\r|\n/g, "<br>");

const clean = (v) => (v == null ? "" : String(v)).trim();

const sectionTitle = (label) => `
  <div style="
    margin:0 0 10px 0;
    font:900 13px/1.2 Arial, Helvetica, sans-serif;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:${BRAND.SUBTLE};
  ">
    ${esc(label)}
  </div>
`;

const pill = (text, tone = "ok") => {
  const bg = tone === "bad" ? "#FEE2E2" : "#DCFCE7";
  const fg = tone === "bad" ? "#B00020" : "#166534";
  const bd = tone === "bad" ? "rgba(239,68,68,.35)" : "rgba(34,197,94,.35)";
  return `
    <span style="
      display:inline-block;
      padding:6px 10px;
      border-radius:999px;
      border:1px solid ${bd};
      background:${bg};
      color:${fg};
      font:900 11px/1 Arial, Helvetica, sans-serif;
      letter-spacing:.06em;
      text-transform:uppercase;
      white-space:nowrap;
    ">
      ${esc(text)}
    </span>
  `;
};

const row = (label, value, { multiline = false } = {}) => {
  const v = clean(value) === "" ? "-" : String(value);
  const cell = multiline ? escWithBreaks(v) : esc(v);

  return `
    <tr>
      <th style="
        width:190px;
        background:#F7F7F7;
        border:1px solid ${BRAND.BORDER};
        padding:12px 14px;
        font:900 13px/1.35 Arial, Helvetica, sans-serif;
        letter-spacing:.02em;
        color:${BRAND.TEXT};
        text-align:left;
        vertical-align:top;
      ">${esc(label)}</th>

      <td style="
        border:1px solid ${BRAND.BORDER};
        padding:12px 14px;
        font:400 14px/1.6 Arial, Helvetica, sans-serif;
        color:${BRAND.TEXT};
        vertical-align:top;
      ">${cell}</td>
    </tr>
  `;
};

const card = (innerHTML) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
    border:1px solid ${BRAND.BORDER};
    background:${BRAND.CARD};
    border-radius:${BRAND.RADIUS}px;
    overflow:hidden;
  ">
    <tr><td style="padding:18px 18px;">
      ${innerHTML}
    </td></tr>
  </table>
`;

const spacer = (h = 14) => `<div style="height:${h}px; line-height:${h}px;">&nbsp;</div>`;

const fmtAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;

  const parts = [
    addr.name,
    addr.company,
    addr.address1,
    addr.address2,
    [addr.city, addr.province, addr.zip].filter(Boolean).join(" "),
    addr.country,
  ]
    .map(clean)
    .filter(Boolean);

  return parts.join("\n");
};

/* ---------- base wrapper (Sugarlean style) ---------- */
const base = ({ title, bodyHTML = "" }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
  </head>

  <body style="margin:0;padding:0;background:${BRAND.BG};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.BG};">
      <tr>
        <td style="padding:26px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:${BRAND.WIDTH}px;margin:0 auto;">

            <!-- Header -->
            <tr>
              <td style="
                background:${BRAND.BLACK};
                border-radius:${BRAND.RADIUS}px ${BRAND.RADIUS}px 0 0;
                padding:44px 18px 20px 18px;
                text-align:center;
              ">
                <img src="${LOGO_URL}" alt="Sugarlean" width="160" style="display:inline-block;border:0;outline:none;text-decoration:none;">
                <div style="margin-top:12px;font:900 12px/1 Arial, Helvetica, sans-serif;letter-spacing:.18em;text-transform:uppercase;color:${BRAND.YELLOW};">
                  Wholesale Portal
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="
                background:${BRAND.CARD};
                border-left:1px solid ${BRAND.BORDER};
                border-right:1px solid ${BRAND.BORDER};
                padding:22px 22px 6px 22px;
                text-align:center;
              ">
                <div style="font:900 26px/1.25 'Poppins', Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
                  ${esc(title)}
                </div>
                <div style="margin-top:8px;height:3px;width:92px;background:${BRAND.YELLOW};border-radius:999px;display:inline-block;"></div>
              </td>
            </tr>

            <!-- Body -->
            ${
              bodyHTML
                ? `
            <tr>
              <td style="
                background:${BRAND.CARD};
                border-left:1px solid ${BRAND.BORDER};
                border-right:1px solid ${BRAND.BORDER};
                padding:18px 22px 18px 22px;
              ">
                ${bodyHTML}
              </td>
            </tr>`
                : ""
            }

            <!-- Footer -->
            <tr>
              <td style="
                background:${BRAND.CARD};
                border:1px solid ${BRAND.BORDER};
                border-top:none;
                border-radius:0 0 ${BRAND.RADIUS}px ${BRAND.RADIUS}px;
                padding:14px 16px 18px 16px;
                text-align:center;
              ">
                <div style="font:500 12px/1.6 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">
                  Sent automatically from
                  <a href="${SITE_URL}" style="color:${BRAND.YELLOW};text-decoration:none;">www.sugarlean.com.au</a>
                </div>
                <div style="margin-top:6px;font:400 12px/1.6 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
                  © ${new Date().getFullYear()} SUGARLEAN PTY LTD
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

/* ---------- items table (SKU - Product - Boxes - Status) ---------- */
function orderItemsTable(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const header = `
    <tr>
      <th style="padding:12px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:left;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">SKU / REF No.</th>
      <th style="padding:12px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:left;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Product</th>
      <th style="padding:12px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:center;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Boxes</th>
      <th style="padding:12px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:center;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Status</th>
    </tr>
  `;

  const rowsHTML = safeItems
    .map((it, idx) => {
      const sku = clean(it.sku) || clean(it.ref) || "-";
      const ref = clean(it.ref);
      const title = clean(it.title) || "-";
      const barcode = clean(it.barcode);

      const soldOut = it.available === false;
      const statusText = soldOut ? "Back order" : "In Stock"; // ✅ instock instead of ok
      const zebra = idx % 2 === 0 ? "#FFFFFF" : "#FCFCFD";

      return `
        <tr>
          <td style="padding:12px;border:1px solid ${BRAND.BORDER};vertical-align:top;background:${zebra};">
            <div style="font:900 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
              SKU: ${esc(sku)}
            </div>
            ${
              ref && ref !== sku
                ? `<div style="margin-top:4px;font:400 12px/1.55 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">REF: ${esc(ref)}</div>`
                : ""
            }
          </td>

          <td style="padding:12px;border:1px solid ${BRAND.BORDER};vertical-align:top;background:${zebra};">
            <div style="font:900 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
              ${esc(title)}
            </div>
            ${
              barcode
                ? `<div style="margin-top:5px;font:400 12px/1.55 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">Barcode: ${esc(barcode)}</div>`
                : ""
            }
          </td>

          <td style="padding:12px;border:1px solid ${BRAND.BORDER};text-align:center;font:900 14px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};background:${zebra};">
            ${esc(String(n(it.qtyBoxes, 0)))}
          </td>

          <td style="padding:12px;border:1px solid ${BRAND.BORDER};text-align:center;background:${zebra};">
            ${soldOut ? pill(statusText, "bad") : pill(statusText, "ok")}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="4" style="padding:14px;border:1px solid ${BRAND.BORDER};color:${BRAND.SUBTLE};font:400 14px/1.6 Arial, Helvetica, sans-serif;text-align:center;">
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

  // Shipping address can come from multiple shapes
  const ship =
    data.shippingAddress ||
    c.shippingAddress ||
    c.shipping_address ||
    data.shipping_address ||
    "";

  const shippingText = fmtAddress(ship);

  /* PART 1: Order ID + Customer Number */
  const part1 = `
    ${sectionTitle("Order")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Order ID", data.orderId)}
      ${row("Customer Number", c.customerNumber)}
    </table>
  `;

  /* PART 2: Customer info + Shipping address + Notes (sent) */
  const part2 = `
    ${sectionTitle("Customer Information")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Customer name", c.name)}
      ${row("Customer email", c.email)}
      ${row("Customer phone", c.phone)}
      ${row("Customer ABN", c.abn)}
    </table>

    ${spacer(14)}

    ${sectionTitle("Shipping Address")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Customer shipping address", shippingText || "-", { multiline: true })}
    </table>

    ${spacer(14)}

    ${sectionTitle("Notes (sent)")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="
          border:1px solid ${BRAND.BORDER};
          background:#FAFAFA;
          border-radius:14px;
          padding:12px 14px;
          font:400 13px/1.65 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          color:${BRAND.TEXT};
        ">
          ${data.note ? escWithBreaks(String(data.note)) : `<span style="color:${BRAND.SUBTLE};">-</span>`}
        </td>
      </tr>
    </table>
  `;

  /* PART 3: Items */
  const part3 = `
    ${sectionTitle("Items")}
    ${orderItemsTable(items)}
  `;

  const topBadges = `
    <div style="text-align:center;">
      ${data.orderId ? pill(`Order ID: ${data.orderId}`, "ok") : ""}
      ${
        c.customerNumber
          ? `<span style="display:inline-block;margin-left:8px;">${pill(`Customer #: ${c.customerNumber}`, "ok")}</span>`
          : ""
      }
      ${
        data.shop
          ? `<span style="display:inline-block;margin-left:8px;">${pill(String(data.shop), "ok")}</span>`
          : ""
      }
    </div>
  `;

  const bodyHTML = `
    ${topBadges}
    ${spacer(16)}
    ${card(part1)}
    ${spacer(14)}
    ${card(part2)}
    ${spacer(14)}
    ${card(part3)}
  `;

  return base({ title, bodyHTML });
}

function confirmOrderUserTemplate(data = {}) {
  const title = "We received your wholesale order!";
  const c = data.customer || {};

  const orderIdLine = data.orderId
    ? `<div style="margin:10px 0 0 0;text-align:center;">${pill(`Order ID: ${data.orderId}`, "ok")}</div>`
    : "";

  const customerNumLine = c.customerNumber
    ? `<div style="margin:10px 0 0 0;text-align:center;">${pill(`Customer #: ${c.customerNumber}`, "ok")}</div>`
    : "";

  const copy = `
    <div style="text-align:center;">
      <div style="font:400 16px/1.7 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
        Hi ${esc(c.name || "there")},
      </div>

      <div style="margin-top:10px;font:400 15px/1.75 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
        Thanks! We’ve received your wholesale order submission and our team will process it shortly.<br>
        If we need anything else, we’ll contact you using the details on your account.
      </div>

      ${orderIdLine}
      ${customerNumLine}

      <div style="margin-top:14px;font:400 13px/1.6 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">
        This is a confirmation of your submission (not a Shopify checkout order).
      </div>

      <div style="margin-top:18px;">
        <a href="${SITE_URL}/pages/wholesale-make-an-order" style="
          display:inline-block;
          background:${BRAND.YELLOW};
          color:#111111;
          text-decoration:none;
          font:900 14px/1 'Poppins', Arial, Helvetica, sans-serif;
          padding:12px 22px;
          border-radius:9999px;
          box-shadow:0 2px 8px rgba(0,0,0,0.10);
        ">
          Back to Wholesale Shopping
        </a>
      </div>
    </div>
  `;

  return base({ title, bodyHTML: card(copy) });
}

/* ---------- exports expected by mailer.js ---------- */
function renderConfirmOrderAdminEmail(data = {}) {
  const c = data.customer || {};
  const orderId = data.orderId || "No Order ID";
  const custNo = c.customerNumber || "No Customer #";
  const who = c.name || c.email || "Unknown";

  return {
    subject: `Wholesale Order Submission — ${orderId} — ${custNo} — ${who}`,
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
