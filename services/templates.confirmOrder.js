// services/templates.confirmOrder.js
// Expects frontend to POST:
//   data.customer = { name, email, phone, customerNumber, abn }
//   data.shippingAddress = object OR string
//   data.extraNotes = textarea value

const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

/* ---------- helpers ---------- */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escWithBreaks = (s = "") => esc(s).replace(/\r\n|\r|\n/g, "<br>");
const clean = (v) => (v == null ? "" : String(v)).trim();

const n = (v, fallback = 0) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

const pill = (text, tone = "ok") => {
  const bg = tone === "bad" ? "#FEE2E2" : "#DCFCE7";
  const fg = tone === "bad" ? "#B00020" : "#166534";
  const bd = tone === "bad" ? "rgba(239,68,68,.35)" : "rgba(34,197,94,.35)";
  return `
    <span style="
      display:inline-block;
      padding:5px 9px;
      border-radius:999px;
      border:1px solid ${bd};
      background:${bg};
      color:${fg};
      font:900 11px/1 Arial, Helvetica, sans-serif;
      letter-spacing:.06em;
      text-transform:uppercase;
      white-space:nowrap;
    ">${esc(text)}</span>
  `;
};

const row = (label, value, { multiline = false } = {}) => {
  const v = clean(value) === "" ? "-" : String(value);
  const cell = multiline ? escWithBreaks(v) : esc(v);

  return `
    <tr>
      <td style="
        width:170px;
        padding:10px 12px;
        border:1px solid ${BRAND.BORDER};
        background:#F7F7F7;
        font:900 12px/1.35 Arial, Helvetica, sans-serif;
        color:${BRAND.TEXT};
        vertical-align:top;
      ">${esc(label)}</td>
      <td style="
        padding:10px 12px;
        border:1px solid ${BRAND.BORDER};
        font:400 13px/1.6 Arial, Helvetica, sans-serif;
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
    <tr><td style="padding:14px 14px;">
      ${innerHTML}
    </td></tr>
  </table>
`;

const spacer = (h = 12) =>
  `<div style="height:${h}px; line-height:${h}px;">&nbsp;</div>`;

const blockTitle = (label) => `
  <div style="
    margin:0 0 10px 0;
    font:900 15px/1.2 'Poppins', Arial, Helvetica, sans-serif;
    color:${BRAND.TEXT};
  ">${esc(label)}</div>
`;

const fmtAddress = (addr) => {
  if (!addr) return "";

  if (typeof addr === "string") return addr;

  const parts = [
    addr.name || [addr.first_name, addr.last_name].filter(Boolean).join(" "),
    addr.company,
    addr.address1,
    addr.address2,
    [addr.city, addr.province || addr.province_code, addr.zip].filter(Boolean).join(" "),
    addr.country,
    addr.phone ? `Phone: ${addr.phone}` : "",
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
        <td style="padding:22px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:${BRAND.WIDTH}px;margin:0 auto;">

            <!-- Header -->
            <tr>
              <td style="
                background:${BRAND.BLACK};
                border-radius:${BRAND.RADIUS}px ${BRAND.RADIUS}px 0 0;
                padding:34px 18px 18px 18px;
                text-align:center;
              ">
                <img src="${LOGO_URL}" alt="Sugarlean" width="150" style="display:inline-block;border:0;outline:none;text-decoration:none;">
                <div style="margin-top:10px;font:900 11px/1 Arial, Helvetica, sans-serif;letter-spacing:.18em;text-transform:uppercase;color:${BRAND.YELLOW};">
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
                padding:18px 18px 8px 18px;
                text-align:center;
              ">
                <div style="font:900 22px/1.25 'Poppins', Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
                  ${esc(title)}
                </div>
                <div style="margin-top:8px;height:3px;width:84px;background:${BRAND.YELLOW};border-radius:999px;display:inline-block;"></div>
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
                padding:14px 18px 16px 18px;
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
                padding:12px 16px 16px 16px;
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

/* ---------- items table ---------- */
function orderItemsTable(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const header = `
    <tr>
      <th style="padding:10px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:left;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">SKU / REF</th>
      <th style="padding:10px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:left;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Product</th>
      <th style="padding:10px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:center;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Boxes</th>
      <th style="padding:10px;border:1px solid ${BRAND.BORDER};background:#F7F7F7;text-align:center;font:900 12px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.06em;text-transform:uppercase;">Status</th>
    </tr>
  `;

  const rowsHTML = safeItems
    .map((it, idx) => {
      const sku = clean(it.sku) || clean(it.ref) || "-";
      const ref = clean(it.ref);
      const title = clean(it.title) || "-";
      const barcode = clean(it.barcode);

      const qtyBoxes =
        n(it.qtyBoxes, NaN) ||
        n(it.boxes, NaN) ||
        n(it.qty, NaN) ||
        n(it.quantity, 0);

      const soldOut =
        it.available === false ||
        it.soldOut === true ||
        String(it.status || "").toLowerCase() === "backorder" ||
        String(it.status || "").toLowerCase() === "back order";

      const statusText = soldOut ? "Back order" : "In stock";
      const zebra = idx % 2 === 0 ? "#FFFFFF" : "#FCFCFD";

      return `
        <tr>
          <td style="padding:10px;border:1px solid ${BRAND.BORDER};vertical-align:top;background:${zebra};">
            <div style="font:900 13px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
              ${esc(sku)}
            </div>
            ${
              ref && ref !== sku
                ? `<div style="margin-top:4px;font:400 12px/1.55 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">REF: ${esc(ref)}</div>`
                : ""
            }
          </td>

          <td style="padding:10px;border:1px solid ${BRAND.BORDER};vertical-align:top;background:${zebra};">
            <div style="font:900 13px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};">
              ${esc(title)}
            </div>
            ${
              barcode
                ? `<div style="margin-top:5px;font:400 12px/1.55 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">Barcode: ${esc(barcode)}</div>`
                : ""
            }
          </td>

          <td style="padding:10px;border:1px solid ${BRAND.BORDER};text-align:center;font:900 13px/1.35 Arial, Helvetica, sans-serif;color:${BRAND.TEXT};background:${zebra};">
            ${esc(String(qtyBoxes))}
          </td>

          <td style="padding:10px;border:1px solid ${BRAND.BORDER};text-align:center;background:${zebra};">
            ${soldOut ? pill(statusText, "bad") : pill(statusText, "ok")}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="4" style="padding:12px;border:1px solid ${BRAND.BORDER};color:${BRAND.SUBTLE};font:400 13px/1.6 Arial, Helvetica, sans-serif;text-align:center;">
        No items found.
      </td>
    </tr>
  `;

  const footnote = `
    <div style="margin-top:10px;font:400 12px/1.6 Arial, Helvetica, sans-serif;color:${BRAND.SUBTLE};">
      Items marked as <b>Back order</b> are currently unavailable and will be supplied when stock is available.
    </div>
  `;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${header}
      ${rowsHTML || empty}
    </table>
    ${footnote}
  `;
}

/* ---------- layout builder (single-column only) ---------- */
function buildOrderEmailLayout(data = {}) {
  const c = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];

  const shippingText = fmtAddress(
    data.shippingAddress ||
      c.shippingAddress ||
      c.shipping_address ||
      data.shipping_address ||
      ""
  );

  const extra =
    clean(data.extraNotes) ||
    clean(data.notes) ||
    clean(data.customerNotes) ||
    clean(data.packingNotes) ||
    clean(data.extraNote) ||
    "";

  // 1) Customer Information (includes order id + customer number + ABN)
  const customerInfo = `
    ${blockTitle("Customer Information")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Order ID", data.orderId)}
      ${row("Customer Number", c.customerNumber)}
      ${row("Customer name", c.name)}
      ${row("Customer email", c.email)}
      ${row("Customer phone", c.phone)}
      ${row("ABN", c.abn)}
    </table>
  `;

  // 2) Shipping Address
  const shippingInfo = `
    ${blockTitle("Shipping Address")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row("Address", shippingText || "-", { multiline: true })}
    </table>
  `;

  // 3) Items
  const itemsBlock = `
    ${blockTitle("Items")}
    ${orderItemsTable(items)}
  `;

  // Optional: Extra notes (only if exists to keep email short)
  const notesBlock = extra
    ? `
      ${blockTitle("Extra notes")}
      <div style="
        border:1px solid ${BRAND.BORDER};
        background:#FAFAFA;
        border-radius:14px;
        padding:12px 14px;
        font:400 13px/1.65 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        color:${BRAND.TEXT};
      ">${escWithBreaks(extra)}</div>
    `
    : "";

  return `
    ${card(customerInfo)}
    ${spacer(12)}
    ${card(shippingInfo)}
    ${notesBlock ? spacer(12) + card(notesBlock) : ""}
    ${spacer(12)}
    ${card(itemsBlock)}
  `;
}

/* ---------- templates ---------- */
function confirmOrderAdminTemplate(data = {}) {
  const title = "Wholesale Order Summary";
  const bodyHTML = buildOrderEmailLayout(data);
  return base({ title, bodyHTML });
}

function confirmOrderUserTemplate(data = {}) {
  const title = "Wholesale Order Summary";
  const bodyHTML = buildOrderEmailLayout(data);
  return base({ title, bodyHTML });
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
