// services/templates.confirmOrder.js
// ✅ Sugarlean clean + tidy email restyle
// ✅ Wider wrapper (default 760px) + responsive
// ✅ Softer borders, real card look, consistent typography
// ✅ Table: REF | PRODUCT | BOXES | STATUS (NO thumbnails)

const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

/* ---------- safe fallbacks ---------- */
const B = {
  // ✅ wider overall email
  WIDTH: (BRAND && BRAND.WIDTH) || 760,

  BG: (BRAND && BRAND.BG) || "#F3F4F6",
  CARD: (BRAND && BRAND.CARD) || "#FFFFFF",

  // text
  TEXT: (BRAND && BRAND.TEXT) || "#111111",
  SUBTLE: (BRAND && BRAND.SUBTLE) || "#6B7280",
  BLACK: (BRAND && BRAND.BLACK) || "#0B0B0B",
  YELLOW: (BRAND && BRAND.YELLOW) || "#F5C542",

  // ✅ softer lines (don’t use thick black borders)
  LINE: (BRAND && BRAND.LINE) || "rgba(17,17,17,.12)",
  LINE_STRONG: (BRAND && BRAND.LINE_STRONG) || "rgba(17,17,17,.18)",

  // radius
  RADIUS: (BRAND && BRAND.RADIUS) || 18,
  CARD_RADIUS: (BRAND && BRAND.CARD_RADIUS) || 16,

  // Typography tokens (Sugarlean feel)
  FONT: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`,
  TRACK_WIDE: ".16em",
  TRACK: ".06em",
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
    return d.toLocaleString("en-US", {
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

const pill = (text, tone = "ok") => {
  const isBad = tone === "bad";
  const bg = isBad ? "#FEECEC" : "#EAF7EE";
  const fg = isBad ? "#8A0F0F" : "#1C6B38";
  const bd = isBad ? "rgba(220,38,38,.30)" : "rgba(22,163,74,.26)";
  return `
    <span style="
      display:inline-block;
      padding:6px 12px;
      border-radius:999px;
      border:1px solid ${bd};
      background:${bg};
      color:${fg};
      font-family:${B.FONT};
      font-size:11px;
      font-weight:800;
      letter-spacing:${B.TRACK};
      text-transform:uppercase;
      white-space:nowrap;
    ">${esc(text)}</span>
  `;
};

/* ✅ clean card box */
const box = (innerHTML, extraStyle = "") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
    border:1px solid ${B.LINE};
    background:${B.CARD};
    border-radius:${B.CARD_RADIUS}px;
    border-collapse:separate;
    box-shadow:0 2px 10px rgba(17,17,17,.06);
    ${extraStyle}
  ">
    <tr>
      <td style="padding:18px 18px; font-family:${B.FONT};">
        ${innerHTML}
      </td>
    </tr>
  </table>
`;

/* ✅ typography primitives */
const kicker = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:12px;
    font-weight:900;
    letter-spacing:${B.TRACK_WIDE};
    text-transform:uppercase;
    color:${B.TEXT};
    margin:0 0 10px 0;
  ">${esc(txt)}</div>
`;

const bodyText = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:14px;
    font-weight:400;
    line-height:1.7;
    color:${B.SUBTLE};
    margin:0;
  ">${esc(txt)}</div>
`;

const lineStrong = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:14px;
    font-weight:800;
    line-height:1.5;
    color:${B.TEXT};
    margin:0;
  ">${esc(txt)}</div>
`;

const line = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:14px;
    font-weight:500;
    line-height:1.6;
    color:${B.TEXT};
    margin:0;
  ">${esc(txt)}</div>
`;

const metaSmall = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:12px;
    font-weight:500;
    line-height:1.55;
    color:${B.SUBTLE};
    margin:0;
  ">${esc(txt)}</div>
`;

const bigLabel = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:22px;
    font-weight:600;
    letter-spacing:-0.01em;
    color:${B.TEXT};
    margin:0;
  ">${esc(txt)}</div>
`;

const bigNumber = (txt) => `
  <div style="
    font-family:${B.FONT};
    font-size:34px;
    font-weight:900;
    letter-spacing:-0.02em;
    color:${B.TEXT};
    margin:10px 0 0 0;
    line-height:1.06;
  ">${esc(txt)}</div>
`;

const rightRow = (k, v, bold = false) => `
  <div style="margin:0 0 12px 0;">
    <div style="
      font-family:${B.FONT};
      font-size:12px;
      font-weight:900;
      letter-spacing:${B.TRACK};
      color:${B.SUBTLE};
      margin:0 0 4px 0;
    ">${esc(k)}</div>
    <div style="
      font-family:${B.FONT};
      font-size:${bold ? "18px" : "14px"};
      font-weight:${bold ? "900" : "600"};
      letter-spacing:${bold ? "-0.01em" : "0"};
      color:${B.TEXT};
      line-height:1.25;
      margin:0;
    ">${esc(v || "-")}</div>
  </div>
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

/* ---------- product table (REF | PRODUCT | BOXES | STATUS) ---------- */
function orderItemsTableScreenshot(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const th = (txt, align = "left", widthPx = null) => `
    <th style="
      padding:12px 14px;
      background:#F6F6F6;
      border-bottom:1px solid ${B.LINE};
      text-align:${align};
      font-family:${B.FONT};
      font-size:12px;
      font-weight:900;
      letter-spacing:${B.TRACK_WIDE};
      text-transform:uppercase;
      ${widthPx ? `width:${widthPx}px;` : ""}
      white-space:nowrap;
      color:${B.TEXT};
    ">${esc(txt)}</th>
  `;

  const header = `
    <tr>
      ${th("REF", "left", 110)}
      ${th("PRODUCT", "left")}
      ${th("BOXES", "center", 110)}
      ${th("STATUS", "center", 150)}
    </tr>
  `;

  const divider = `1px solid ${B.LINE}`;

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
          <td style="
            padding:12px 14px;
            border-bottom:${divider};
            text-align:left;
            font-family:${B.FONT};
            font-size:14px;
            font-weight:800;
            color:${B.TEXT};
            white-space:nowrap;
          ">${esc(ref)}</td>

          <td style="padding:12px 14px;border-bottom:${divider};text-align:left;">
            <div style="font-family:${B.FONT};font-size:14px;font-weight:800;line-height:1.25;color:${B.TEXT};margin:0;">
              ${esc(title)}
            </div>
            ${
              barcode
                ? `<div style="margin-top:4px;font-family:${B.FONT};font-size:12px;font-weight:500;line-height:1.4;color:${B.SUBTLE};">
                    Barcode: ${esc(barcode)}
                  </div>`
                : ""
            }
          </td>

          <td style="
            padding:12px 14px;
            border-bottom:${divider};
            text-align:center;
            font-family:${B.FONT};
            font-size:16px;
            font-weight:900;
            color:${B.TEXT};
          ">${esc(String(qtyBoxes))}</td>

          <td style="padding:12px 14px;border-bottom:${divider};text-align:center;">
            ${isBackorder ? pill(statusText, "bad") : pill(statusText, "ok")}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="4" style="padding:14px 16px;text-align:center;color:${B.SUBTLE};font-family:${B.FONT};font-size:14px;font-weight:500;line-height:1.6;">
        No items found.
      </td>
    </tr>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
      border-collapse:separate;
      border-spacing:0;
      border:1px solid ${B.LINE};
      border-radius:${B.CARD_RADIUS}px;
      overflow:hidden;
      font-family:${B.FONT};
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
                padding:28px 18px 16px 18px;
                text-align:center;
              ">
                <img src="${LOGO_URL}" alt="Sugarlean" width="155" style="display:inline-block;border:0;outline:none;text-decoration:none;">
                <div style="
                  margin-top:10px;
                  font-family:${B.FONT};
                  font-weight:900;
                  font-size:12px;
                  letter-spacing:${B.TRACK_WIDE};
                  text-transform:uppercase;
                  color:${B.YELLOW};
                ">WHOLESALE PORTAL</div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="background:${B.CARD};padding:18px 22px 10px 22px;text-align:center;">
                <div class="h1" style="
                  font-family:${B.FONT};
                  font-weight:900;
                  font-size:32px;
                  letter-spacing:-0.02em;
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
                <div style="font-family:${B.FONT}; font-size:12px; line-height:1.6; color:${B.SUBTLE}; font-weight:500;">
                  Sent automatically from
                  <a href="${SITE_URL}" style="color:${B.YELLOW};text-decoration:none;font-weight:800;">www.sugarlean.com.au</a>
                </div>
                <div style="margin-top:6px;font-family:${B.FONT}; font-size:12px; line-height:1.6; color:${B.TEXT}; font-weight:500;">
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

  const submitted =
    fmtDateTime(data.submittedAt) ||
    fmtDateTime(data.submitted) ||
    fmtDateTime(data.createdAt) ||
    "";

  const orderId = clean(data.orderId) || "No Order ID";
  const custNo =
    clean(c.customerNumber) ||
    clean(c.customer_no) ||
    clean(c.customerNo) ||
    "";

  const abn =
    clean(c.abn) ||
    clean(c.abnNumber) ||
    clean(c.abn_num) ||
    clean(c.abn_no) ||
    "";

  const customerName = clean(c.name) || "-";
  const customerEmail = clean(c.email) || "-";
  const customerPhone = clean(c.phone) || "-";

  const mapsQ = encodeURIComponent((shippingText || "").replace(/\n/g, ", "));
  const mapsUrl = mapsQ ? `https://www.google.com/maps/search/?api=1&query=${mapsQ}` : "";

  /* TOP CARD */
  const topLeft = `
    ${kicker("Wholesaler Order")}
    ${bodyText("Review your wholesale order summary below.")}
    ${spacer(14)}
    ${bigLabel("Customer No.")}
    ${bigNumber(custNo || "-")}
  `;

  const topRight = `
    ${rightRow("Order ID", orderId, true)}
    ${rightRow("Wholesaler ABN Number", abn, true)}
    ${rightRow("Submitted", submitted || "-", false)}
  `;

  const topBox = box(twoCol({ leftHTML: topLeft, rightHTML: topRight }));

  /* Contact card */
  const contactBox = box(`
    ${kicker("Contact Information")}
    ${lineStrong(customerName)}
    ${spacer(10)}
    ${line(customerEmail)}
    ${spacer(8)}
    ${line(customerPhone)}
    ${spacer(10)}
    ${metaSmall("Wholesaler ABN Number: " + (abn ? abn : "-")).replace(
      abn ? esc(abn) : "-",
      `<span style="font-weight:900;color:${B.TEXT};">${esc(abn || "-")}</span>`
    )}
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
    ${kicker("Default Address")}
    ${lineStrong(customerName)}
    ${spacer(10)}

    <div style="font-family:${B.FONT}; font-size:14px; font-weight:500; line-height:1.75; color:${B.SUBTLE};">
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
          font-size:13px;
          font-weight:900;
          letter-spacing:${B.TRACK};
          color:${B.TEXT};
          text-decoration:none;
          background:#FFFFFF;
        ">select on map</a>
      `
        : ""
    }
  `);

  /* Products table in its own clean card */
  const productsBox = box(`
    ${kicker("Order Items")}
    ${orderItemsTableScreenshot(items)}
  `);

  return `
    ${topBox}
    ${spacer(14)}
    ${twoCol({ leftHTML: contactBox, rightHTML: addressBox })}
    ${spacer(14)}
    ${productsBox}
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
