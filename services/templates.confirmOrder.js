// services/templates.confirmOrder.js
// ✅ Screenshot-style layout (matches your target screenshot)
// ✅ Titles (block headings): 16px / 500
// ✅ Details (content): 12px / 400 (no bold in blocks)
// ✅ Remove ABN line from Contact Information
// ✅ Submitted always shows date/time (fallback to now)
// ✅ Items table: no outline, no vertical grid lines, tighter SKU/REF + BOXES, product title max 2 lines
// ✅ Smaller STATUS pill

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

const fmtDateTime = (v) => {
  const raw = clean(v);
  if (!raw) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return raw;
  try {
    // AU style like your screenshot
    return d.toLocaleString("en-AU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return d.toISOString();
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

/* ✅ smaller status pill */
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

/* ✅ screenshot-style box (thin border, no shadow, square corners) */
const box = (innerHTML, extraStyle = "") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
    border:1px solid ${B.LINE_STRONG};
    background:${B.CARD};
    border-radius:0;
    border-collapse:collapse;
    ${extraStyle}
  ">
    <tr>
      <td style="padding:18px 18px; font-family:${B.FONT};">
        ${innerHTML}
      </td>
    </tr>
  </table>
`;

/* ✅ TITLES: 16px / 500 */
const title16 = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:16px;
    font-weight:500;
    color:${B.TEXT};
    margin:0 0 4px 0;
  ">${esc(txt)}</div>
`;

/* ✅ DETAILS: 12px / 400 (no bold) */
const detail12 = (txt, color = B.TEXT) => `
  <div style="
    font-family:${B.FONT};
    font-size:12px;
    font-weight:400;
    line-height:1.55;
    color:${color};
    margin:0;
  ">${esc(txt)}</div>
`;

const customerLabel = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:16px;
    font-weight:500;
    color:${B.TEXT};
    margin:14px 0 6px 0;
  ">${esc(txt)}</div>
`;

const customerNumber = (txt) => detail12(txt || "-", B.TEXT);

const rightRow = (k, v) => `
  <div style="margin:0 0 12px 0;">
    ${title16(k)}
    ${detail12(v || "-", B.TEXT)}
  </div>
`;

const sectionTitle = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:16px;
    font-weight:500;
    color:${B.TEXT};
    margin:0 0 12px 0;
  ">${esc(txt)}</div>
`;

const noteLine = (html) => `
  <div style="
    margin-top:12px;
    font-family:${B.FONT};
    font-size:12px;
    font-weight:400;
    line-height:1.55;
    color:${B.SUBTLE};
  ">${html}</div>
`;

const twoCol = ({ leftHTML, rightHTML }) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <!--[if mso]><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-right:10px;" class="col">
        ${leftHTML}
      </td>
      <!--[if mso]></td><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-left:10px;" class="col">
        ${rightHTML}
      </td>
      <!--[if mso]></td><![endif]-->
    </tr>
  </table>
`;

/* ---------- items table (SKU/REF | PRODUCT | BOXES | STATUS) ---------- */
function orderItemsTableScreenshot(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  // tighter columns (tidy like screenshot)
  const COL_REF = 90;
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

  // subtle row divider only (no table outline, no vertical lines)
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

      return `
        <tr>
          <!-- SKU / REF (tight) -->
          <td style="
            padding:14px 12px;
            border-bottom:${rowDivider};
            text-align:left;
            font-family:${B.FONT};
            font-size:12px;
            font-weight:400;
            color:${B.TEXT};
            white-space:nowrap;
            width:${COL_REF}px;
          ">${esc(ref)}</td>

          <!-- PRODUCT (2-line clamp) -->
          <td style="
            padding:14px 12px;
            border-bottom:${rowDivider};
            text-align:left;
          ">
            <div style="
              font-family:${B.FONT};
              font-size:12px;
              font-weight:400;
              line-height:1.35;
              color:${B.TEXT};
              margin:0;
              display:-webkit-box;
              -webkit-line-clamp:2;
              -webkit-box-orient:vertical;
              overflow:hidden;
            ">${esc(title)}</div>

            ${
              barcode
                ? `<div style="
                    margin-top:6px;
                    font-family:${B.FONT};
                    font-size:12px;
                    font-weight:400;
                    line-height:1.35;
                    color:${B.SUBTLE};
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  ">Barcode: ${esc(barcode)}</div>`
                : ""
            }
          </td>

          <!-- BOXES (tight) -->
          <td style="
            padding:14px 10px;
            border-bottom:${rowDivider};
            text-align:center;
            font-family:${B.FONT};
            font-size:12px;
            font-weight:400;
            color:${B.TEXT};
            width:${COL_BOX}px;
            white-space:nowrap;
          ">${esc(String(qtyBoxes))}</td>

          <!-- STATUS -->
          <td style="
            padding:14px 10px;
            border-bottom:${rowDivider};
            text-align:center;
            width:${COL_STATUS}px;
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
      <td colspan="4" style="
        padding:14px 12px;
        text-align:center;
        color:${B.SUBTLE};
        font-family:${B.FONT};
        font-size:12px;
        font-weight:400;
        line-height:1.6;
        border-bottom:${rowDivider};
      ">
        No items found.
      </td>
    </tr>
  `;

  // ✅ NO outline / NO vertical grid lines
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
      border-collapse:collapse;
      font-family:${B.FONT};
      background:#fff;
    ">
      ${header}
      ${rows || empty}
    </table>
  `;
}

/* ---------- main email wrapper ---------- */
const base = ({ title, bodyHTML = "" }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>

    <style>
      @media only screen and (max-width: 740px){
        .wrap { width: 100% !important; max-width: 100% !important; }
        .pad { padding-left: 12px !important; padding-right: 12px !important; }
        .col { display:block !important; width:100% !important; padding:0 !important; }
        .col + .col { padding-top:12px !important; }
        .h1 { font-size: 28px !important; }
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
                  font-weight:900;
                  font-size:12px;
                  letter-spacing:.16em;
                  text-transform:uppercase;
                  color:${B.YELLOW};
                ">WHOLESALE PORTAL</div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="background:${B.CARD};padding:16px 22px 8px 22px;text-align:center;">
                <div class="h1" style="
                  font-family:${B.FONT};
                  font-weight:900;
                  font-size:34px;
                  letter-spacing:-0.01em;
                  color:${B.TEXT};
                  line-height:1.12;
                ">${esc(title)}</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background:${B.CARD};padding:10px 22px 22px 22px;">
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
                  <a href="${SITE_URL}" style="color:${B.YELLOW};text-decoration:none;font-weight:800;">www.sugarlean.com.au</a>
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

  // ✅ ensure Submitted always has date/time (fallback to NOW)
  const submittedRaw =
    data.submittedAt ||
    data.submitted ||
    data.createdAt ||
    data.updatedAt ||
    new Date().toISOString();

  const submitted = fmtDateTime(submittedRaw) || fmtDateTime(new Date().toISOString());

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
    ${title16("Wholesaler Order")}
    ${detail12("Review your wholesale order summary below.", B.TEXT)}
    ${customerLabel("Customer No.")}
    ${customerNumber(custNo)}
  `;

  const topRight = `
    ${rightRow("Order ID:", orderId)}
    ${rightRow("Wholesaler ABN Number", abn)}
    ${rightRow("Submitted:", submitted)}
  `;

  const topBox = box(twoCol({ leftHTML: topLeft, rightHTML: topRight }));

  /* Contact box (NO ABN line here) */
  const contactBox = box(`
    ${title16("Contact information")}
    ${spacer(8)}
    ${detail12(customerName, B.TEXT)}
    ${spacer(10)}
    ${detail12(customerEmail, B.TEXT)}
    ${spacer(10)}
    ${detail12(customerPhone, B.TEXT)}
  `);

  /* Default address (remove duplicate name line) */
  let addressLines = (shippingText || "-")
    .split("\n")
    .map((x) => clean(x))
    .filter(Boolean);

  if (addressLines.length && norm(addressLines[0]) === norm(customerName)) {
    addressLines = addressLines.slice(1);
  }

  const addressBox = box(`
    ${title16("Default address")}
    ${spacer(8)}
    ${detail12(customerName, B.TEXT)}
    ${spacer(10)}

    <div style="font-family:${B.FONT}; font-size:12px; font-weight:400; line-height:1.55; color:${B.SUBTLE};">
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
  `);

  /* Items box */
  const itemsBox = box(`
    ${sectionTitle("Items")}
    ${orderItemsTableScreenshot(items)}
    ${noteLine(`Items marked as <span style="font-weight:600;color:${B.TEXT};">Back order</span> are currently unavailable and will be supplied when stock is available.`)}
  `);

  return `
    ${topBox}
    ${spacer(14)}
    ${twoCol({ leftHTML: contactBox, rightHTML: addressBox })}
    ${spacer(14)}
    ${itemsBox}
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
