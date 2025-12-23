// services/templates.confirmOrder.js
// ✅ Screenshot-style layout
// ✅ Contact + Default address combined into ONE block (2 columns inside)
// ✅ No big "Wholesale Order Summary" title row
// ✅ Thin borders + clean dividers (no shadows)
// ✅ Block headings: 16px / 500
// ✅ Block details: 12px / 400 (no bold in blocks)
// ✅ Submitted shows AU local time (Australia/Brisbane) — fallback to "now"
// ✅ Items table: no outer outline, no vertical grid lines, tighter SKU/REF + BOXES, product title max 2 lines
// ✅ Keep STATUS pill
// ✅ NEW: Under "WHOLESALE PORTAL" add message "We’ve received your order..." (USER email only)
// ✅ User subject: "Your order has been received — <orderId>"

const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

/* ---------- safe fallbacks ---------- */
const B = {
  WIDTH: (BRAND && BRAND.WIDTH) || 760,

  BG: (BRAND && BRAND.BG) || "#F3F4F6",
  CARD: (BRAND && BRAND.CARD) || "#FFFFFF",

  TEXT: (BRAND && BRAND.TEXT) || "#111111",
  SUBTLE: (BRAND && BRAND.SUBTLE) || "#777777",
  BLACK: (BRAND && BRAND.BLACK) || "#0B0B0B",
  YELLOW: (BRAND && BRAND.YELLOW) || "#F5C542",

  LINE: (BRAND && BRAND.LINE) || "rgba(0,0,0,.10)",
  LINE_STRONG: (BRAND && BRAND.LINE_STRONG) || "rgba(0,0,0,.28)",

  RADIUS: (BRAND && BRAND.RADIUS) || 18,

  FONT: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`,
};

/* ---------- helpers ---------- */
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const clean = (v) => (v == null ? "" : String(v)).trim();

const n = (v, fallback = 0) => {
  const num = Number(v);
  return Number.isFinite(num) ? num : fallback;
};

const norm = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/\s+/g, " ");

/* ✅ local AU time (QLD / GMT+10) */
const fmtDateTime = (v) => {
  const raw = clean(v);
  if (!raw) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return raw;

  try {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch (e) {
    try {
      return d.toLocaleString("en-AU");
    } catch (e2) {
      return d.toISOString();
    }
  }
};

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

/* ---------- components ---------- */
const spacer = (h = 12) =>
  `<div style="height:${h}px; line-height:${h}px; font-size:${h}px;">&nbsp;</div>`;

/* ✅ keep STATUS pill */
const pill = (text, tone = "ok") => {
  const isBad = tone === "bad";
  const bg = isBad ? "#FEECEC" : "#EAF7EE";
  const fg = isBad ? "#8A0F0F" : "#1C6B38";
  const bd = isBad ? "rgba(220,38,38,.30)" : "rgba(22,163,74,.26)";
  return `
    <span style="
      display:inline-block;
      padding:5px 10px;
      border-radius:999px;
      border:1px solid ${bd};
      background:${bg};
      color:${fg};
      font-family:${B.FONT};
      font-size:10px;
      font-weight:600;
      letter-spacing:.06em;
      text-transform:uppercase;
      white-space:nowrap;
      line-height:1;
    ">${esc(text)}</span>
  `;
};

/* ✅ screenshot-style box */
const box = (innerHTML, extraStyle = "", cellStyle = "") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
    border:1px solid ${B.LINE_STRONG};
    background:${B.CARD};
    border-radius:0;
    border-collapse:collapse;
    ${extraStyle}
  ">
    <tr>
      <td style="
        padding:18px 18px;
        font-family:${B.FONT};
        ${cellStyle}
      ">
        ${innerHTML}
      </td>
    </tr>
  </table>
`;

/* ✅ headings & details */
const h16 = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:16px;
    font-weight:500;
    color:${B.TEXT};
    margin:0 0 10px 0;
  ">${esc(txt)}</div>
`;

const p12 = (txt, color = B.TEXT) => `
  <div style="
    font-family:${B.FONT};
    font-size:12px;
    font-weight:400;
    line-height:1.6;
    color:${color};
    margin:0;
  ">${esc(txt)}</div>
`;

const topLeadTitle = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:18px;
    font-weight:600;
    color:${B.TEXT};
    margin:0 0 4px 0;
  ">${esc(txt)}</div>
`;

const rightRow = (k, v) => `
  <div style="margin:0 0 12px 0;">
    ${h16(k)}
    ${p12(v || "-", B.TEXT)}
  </div>
`;

const twoCol = ({ leftHTML, rightHTML }) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <!--[if mso]><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-right:12px;" class="col">
        ${leftHTML}
      </td>
      <!--[if mso]></td><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-left:12px;" class="col">
        ${rightHTML}
      </td>
      <!--[if mso]></td><![endif]-->
    </tr>
  </table>
`;

/* ---------- items table ---------- */
function orderItemsTableScreenshot(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const COL_REF = 80;
  const COL_BOX = 70;
  const COL_STATUS = 130;

  const th = (txt, align = "left", widthPx = null) => `
    <th style="
      padding:12px 12px;
      background:#F7F7F7;
      border-bottom:1px solid ${B.LINE};
      text-align:${align};
      font-family:${B.FONT};
      font-size:12px;
      font-weight:500;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:${B.TEXT};
      ${widthPx ? `width:${widthPx}px;` : ""}
      white-space:nowrap;
    ">${esc(txt)}</th>
  `;

  const header = `
    <tr>
      ${th("SKU / REF", "left", COL_REF)}
      ${th("PRODUCT", "left")}
      ${th("BOXES", "center", COL_BOX)}
      ${th("STATUS", "center", COL_STATUS)}
    </tr>
  `;

  const rowDivider = `1px solid ${B.LINE}`;

  const rows = safeItems
    .map((it) => {
      const title = clean(it.title) || "-";
      const ref =
        clean(it.ref) ||
        clean(it.ref_number) ||
        clean(it.refNumber) ||
        clean(it.sku) ||
        clean(it.SKU) ||
        "-";
      const barcode = clean(it.barcode) || "";

      const qtyBoxes =
        n(it.qtyBoxes, NaN) ||
        n(it.boxes, NaN) ||
        n(it.qty, NaN) ||
        n(it.quantity, 0);

      const statusRaw = String(it.status || "").trim().toLowerCase();
      const isBackorder =
        it.available === false ||
        it.soldOut === true ||
        statusRaw === "backorder" ||
        statusRaw === "back order" ||
        statusRaw === "sold out" ||
        statusRaw === "soldout";

      const statusText = isBackorder ? "Back order" : "In stock";

      const titleHTML = `
        <div style="
          font-family:${B.FONT};
          font-size:12px;
          font-weight:500;
          line-height:1.35;
          color:${B.TEXT};
          margin:0;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
          word-break:break-word;
        ">${esc(title)}</div>
      `;

      const barcodeHTML = barcode
        ? `<div style="margin-top:4px;font-family:${B.FONT};font-size:12px;font-weight:400;line-height:1.35;color:${B.SUBTLE};">
            Barcode: ${esc(barcode)}
          </div>`
        : "";

      return `
        <tr>
          <td style="
            padding:14px 12px;
            border-bottom:${rowDivider};
            text-align:left;
            font-family:${B.FONT};
            font-size:12px;
            font-weight:400;
            color:${B.TEXT};
            white-space:nowrap;
          ">${esc(ref)}</td>

          <td style="padding:14px 12px;border-bottom:${rowDivider};text-align:left;">
            ${titleHTML}
            ${barcodeHTML}
          </td>

          <td style="
            padding:14px 12px;
            border-bottom:${rowDivider};
            text-align:center;
            font-family:${B.FONT};
            font-size:12px;
            font-weight:400;
            color:${B.TEXT};
            white-space:nowrap;
          ">${esc(String(qtyBoxes))}</td>

          <td style="
            padding:14px 12px;
            border-bottom:${rowDivider};
            text-align:center;
            white-space:nowrap;
          ">
            ${isBackorder ? pill(statusText, "bad") : pill(statusText, "ok")}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="4" style="padding:14px 16px;text-align:center;color:${B.SUBTLE};font-family:${B.FONT};font-size:12px;font-weight:400;line-height:1.6;">
        No items found.
      </td>
    </tr>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
      border-collapse:collapse;
      font-family:${B.FONT};
    ">
      ${header}
      ${rows || empty}
    </table>
  `;
}

/* ---------- main email wrapper ---------- */
/* ✅ subtitle is optional (used for wholesaler email only) */
const base = ({ bodyHTML = "", subtitle = "" }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Wholesale Order</title>

    <style>
      @media only screen and (max-width: 740px){
        .wrap { width: 100% !important; max-width: 100% !important; }
        .pad { padding-left: 12px !important; padding-right: 12px !important; }
        .col { display:block !important; width:100% !important; padding:0 !important; }
        .col + .col { padding-top:12px !important; }
        .vline { display:none !important; }
      }
    </style>
  </head>

  <body style="margin:0;padding:0;background:${B.BG}; font-family:${B.FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${B.BG};">
      <tr>
        <td class="pad" style="padding:22px 14px;">

          <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="${B.WIDTH}" class="wrap" style="width:${B.WIDTH}px;max-width:${B.WIDTH}px;margin:0 auto;">

            <!-- Header -->
            <tr>
              <td style="
                background:${B.BLACK};
                border-radius:${B.RADIUS}px ${B.RADIUS}px 0 0;
                padding:22px 18px 14px 18px;
                text-align:center;
              ">
                <img src="${LOGO_URL}" alt="Sugarlean" width="155" style="display:inline-block;border:0;outline:none;text-decoration:none;">
                <div style="
                  margin-top:8px;
                  font-family:${B.FONT};
                  font-weight:800;
                  font-size:12px;
                  letter-spacing:.16em;
                  text-transform:uppercase;
                  color:${B.YELLOW};
                ">WHOLESALE PORTAL</div>

                ${
                  subtitle
                    ? `<div style="
                        margin-top:10px;
                        font-family:${B.FONT};
                        font-size:12px;
                        font-weight:400;
                        line-height:1.6;
                        color:rgba(255,255,255,.82);
                      ">${esc(subtitle)}</div>`
                    : ""
                }
              </td>
            </tr>

            <!-- Body (no big title row) -->
            <tr>
              <td style="background:${B.CARD};padding:18px 22px 22px 22px;">
                ${bodyHTML}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                background:${B.CARD};
                border-radius:0 0 ${B.RADIUS}px ${B.RADIUS}px;
                padding:14px 16px 20px 16px;
                text-align:center;
              ">
                <div style="font-family:${B.FONT}; font-size:12px; line-height:1.6; color:${B.SUBTLE}; font-weight:400;">
                  Sent automatically from
                  <a href="${SITE_URL}" style="color:${B.YELLOW};text-decoration:none;font-weight:700;">www.sugarlean.com.au</a>
                </div>
                <div style="margin-top:6px;font-family:${B.FONT}; font-size:12px; line-height:1.6; color:${B.TEXT}; font-weight:400;">
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

/* ---------- build layout ---------- */
function buildOrderEmailLayout(data = {}) {
  const c = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];

  const shippingText = fmtAddress(
    data.shippingAddress || c.shippingAddress || c.shipping_address || data.shipping_address || ""
  );

  const submittedRaw = data.submittedAt || data.submitted || data.createdAt || "";
  const submitted =
    fmtDateTime(submittedRaw || new Date().toISOString()) || fmtDateTime(new Date().toISOString());

  const orderId = clean(data.orderId) || "No Order ID";
  const custNo =
    clean(c.customerNumber) ||
    clean(c.customer_no) ||
    clean(c.customerNo) ||
    "-";

  const abn =
    clean(c.abn) ||
    clean(c.abnNumber) ||
    clean(c.abn_num) ||
    clean(c.abn_no) ||
    "-";

  const customerName = clean(c.name) || "-";
  const customerEmail = clean(c.email) || "-";
  const customerPhone = clean(c.phone) || "-";

  const mapsQ = encodeURIComponent((shippingText || "").replace(/\n/g, ", "));
  const mapsUrl = mapsQ ? `https://www.google.com/maps/search/?api=1&query=${mapsQ}` : "";

  /* TOP BOX */
  const topLeft = `
    ${topLeadTitle("Wholesaler Order")}
    ${p12("Review your wholesale order summary below.", B.TEXT)}
    ${spacer(10)}
    ${h16("Customer No.")}
    ${p12(custNo, B.TEXT)}
  `;

  const topRight = `
    ${rightRow("Order ID:", orderId)}
    ${rightRow("Wholesaler ABN Number", abn)}
    ${rightRow("Submitted:", submitted)}
  `;

  const topBox = box(twoCol({ leftHTML: topLeft, rightHTML: topRight }));

  /* ✅ Combined Contact + Default address (one block, 2 columns) */
  let addressLines = (shippingText || "-")
    .split("\n")
    .map((x) => clean(x))
    .filter(Boolean);

  if (addressLines.length && norm(addressLines[0]) === norm(customerName)) {
    addressLines = addressLines.slice(1);
  }

  const contactInner = `
    ${h16("Contact information")}
    ${p12(customerName, B.TEXT)}
    ${spacer(10)}
    ${p12(customerEmail, B.TEXT)}
    ${spacer(10)}
    ${p12(customerPhone, B.TEXT)}
  `;

  const addressInner = `
    ${h16("Default address")}
    ${p12(customerName, B.TEXT)}
    ${spacer(10)}
    <div style="font-family:${B.FONT}; font-size:12px; font-weight:400; line-height:1.6; color:${B.SUBTLE};">
      ${addressLines.length ? addressLines.map((l) => `${esc(l)}<br>`).join("") : esc("-")}
    </div>
    ${
      mapsUrl
        ? `
        ${spacer(14)}
        <a href="${mapsUrl}" style="
          display:inline-block;
          border:1px solid ${B.LINE_STRONG};
          border-radius:999px;
          padding:9px 14px;
          font-family:${B.FONT};
          font-size:12px;
          font-weight:400;
          letter-spacing:0.04em;
          color:${B.TEXT};
          text-decoration:none;
          background:#FFFFFF;
        ">select on map</a>
      `
        : ""
    }
  `;

  const contactAddressBox = box(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td valign="top" style="width:50%; padding-right:14px;">
          ${contactInner}
        </td>

        <td class="vline" valign="top" style="width:1px; background:${B.LINE}; font-size:0; line-height:0;">
          &nbsp;
        </td>

        <td valign="top" style="width:50%; padding-left:14px;">
          ${addressInner}
        </td>
      </tr>
    </table>
  `);

  /* Items block */
  const itemsBox = box(`
    ${h16("Items")}
    ${spacer(10)}
    <div style="border:1px solid ${B.LINE};">
      ${orderItemsTableScreenshot(items)}
    </div>
    ${spacer(12)}
    ${p12("Items marked as Back order are currently unavailable and will be supplied when stock is available.", B.SUBTLE)}
  `);

  return `
    ${topBox}
    ${spacer(14)}
    ${contactAddressBox}
    ${spacer(14)}
    ${itemsBox}
  `;
}

/* ---------- templates ---------- */
function confirmOrderAdminTemplate(data = {}) {
  const bodyHTML = buildOrderEmailLayout(data);
  return base({ bodyHTML }); // no subtitle for admin
}

function confirmOrderUserTemplate(data = {}) {
  const bodyHTML = buildOrderEmailLayout(data);
  return base({
    bodyHTML,
    subtitle: "We’ve received your order — we’ll review stock, packing and shipping and confirm shortly.",
  });
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
  const orderId = data.orderId || "No Order ID";
  return {
    subject: `Your order has been received — ${orderId}`,
    html: confirmOrderUserTemplate(data),
  };
}

module.exports = {
  confirmOrderAdminTemplate,
  confirmOrderUserTemplate,
  renderConfirmOrderAdminEmail,
  renderConfirmOrderUserEmail,
};
