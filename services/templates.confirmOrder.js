// services/templates.confirmOrder.js
// ✅ Pixel-matched to your screenshot (header + title + 3 boxed sections + product table)
// ✅ SAME HTML for orders email + wholesale email (admin + user templates identical)
// ✅ Supports small product thumbnail images (per item.image / item.imageUrl / etc.)

const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

/* ---------- safe fallbacks (in case BRAND is missing fields) ---------- */
const B = {
  WIDTH: (BRAND && BRAND.WIDTH) || 640,
  BG: (BRAND && BRAND.BG) || "#F3F4F6",
  CARD: (BRAND && BRAND.CARD) || "#FFFFFF",
  TEXT: (BRAND && BRAND.TEXT) || "#111111",
  SUBTLE: (BRAND && BRAND.SUBTLE) || "#6B7280",
  BORDER: (BRAND && BRAND.BORDER) || "#111111",
  BLACK: (BRAND && BRAND.BLACK) || "#0B0B0B",
  YELLOW: (BRAND && BRAND.YELLOW) || "#F5C542",
  RADIUS: (BRAND && BRAND.RADIUS) || 18,
};

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

// ✅ Match your screenshot style: 12/19/2025, 7:52:28 AM
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

const getItemImage = (it = {}) => {
  const direct =
    clean(it.image) ||
    clean(it.imageUrl) ||
    clean(it.image_url) ||
    clean(it.thumbnail) ||
    clean(it.thumb) ||
    clean(it.featuredImage) ||
    clean(it.featured_image) ||
    clean(it.productImage) ||
    clean(it.product_image);

  if (direct) return direct;

  // common nested formats
  if (it.image && typeof it.image === "object") {
    const nested = clean(it.image.src) || clean(it.image.url);
    if (nested) return nested;
  }
  if (it.featured_image && typeof it.featured_image === "object") {
    const nested = clean(it.featured_image.src) || clean(it.featured_image.url);
    if (nested) return nested;
  }

  return "";
};

const pill = (text, tone = "ok") => {
  // screenshot-like pill
  const isBad = tone === "bad";
  const bg = isBad ? "#FEECEC" : "#EAF7EE";
  const fg = isBad ? "#8A0F0F" : "#1C6B38";
  const bd = isBad ? "rgba(220,38,38,.35)" : "rgba(22,163,74,.30)";
  return `
    <span style="
      display:inline-block;
      padding:5px 12px;
      border-radius:999px;
      border:1px solid ${bd};
      background:${bg};
      color:${fg};
      font:900 11px/1 Arial, Helvetica, sans-serif;
      letter-spacing:.10em;
      text-transform:uppercase;
      white-space:nowrap;
    ">${esc(text)}</span>
  `;
};

const box = (innerHTML, extraStyle = "") => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
    border:1px solid ${B.BORDER};
    background:${B.CARD};
    border-radius:0;
    ${extraStyle}
  ">
    <tr>
      <td style="padding:16px 16px;">
        ${innerHTML}
      </td>
    </tr>
  </table>
`;

const spacer = (h = 12) =>
  `<div style="height:${h}px; line-height:${h}px; font-size:${h}px;">&nbsp;</div>`;

const label = (txt) => `
  <div style="
    font:900 12px/1.2 Arial, Helvetica, sans-serif;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:${B.TEXT};
    margin:0 0 6px 0;
  ">${esc(txt)}</div>
`;

const small = (txt) => `
  <div style="
    font:400 12px/1.45 Arial, Helvetica, sans-serif;
    color:${B.SUBTLE};
    margin:0;
  ">${esc(txt)}</div>
`;

const strongLine = (txt) => `
  <div style="
    font:800 13px/1.45 Arial, Helvetica, sans-serif;
    color:${B.TEXT};
    margin:0;
  ">${esc(txt)}</div>
`;

const twoCol = ({ leftHTML, rightHTML }) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <!--[if mso]><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-right:8px;" class="col">
        ${leftHTML}
      </td>
      <!--[if mso]></td><td width="50%" valign="top"><![endif]-->
      <td valign="top" style="width:50%; padding-left:8px;" class="col">
        ${rightHTML}
      </td>
      <!--[if mso]></td><![endif]-->
    </tr>
  </table>
`;

/* ---------- product table (with thumbnails) ---------- */
function orderItemsTableScreenshot(items = []) {
  const safeItems = Array.isArray(items) ? items : [];

  const header = `
    <tr>
      <th style="padding:14px 16px;background:#EFEFEF;border-bottom:1px solid ${B.BORDER};text-align:left;font:900 16px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.04em;">PRODUCT</th>
      <th style="padding:14px 16px;background:#EFEFEF;border-bottom:1px solid ${B.BORDER};text-align:center;font:900 16px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.04em;">BOXES</th>
      <th style="padding:14px 16px;background:#EFEFEF;border-bottom:1px solid ${B.BORDER};text-align:center;font:900 16px/1.2 Arial, Helvetica, sans-serif;letter-spacing:.04em;">STATUS</th>
    </tr>
  `;

  const rows = safeItems
    .map((it, idx) => {
      const title = clean(it.title) || "-";
      const sku = clean(it.sku) || clean(it.ref) || "";
      const ref = clean(it.ref);
      const barcode = clean(it.barcode);

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

      const img = getItemImage(it);
      const zebra = idx % 2 === 0 ? "#FFFFFF" : "#FFFFFF"; // screenshot looks clean white; keep consistent
      const divider = `1px solid rgba(17,17,17,.12)`;

      const vendor =
        clean(it.vendor) ||
        clean(it.brand) ||
        clean(it.company) ||
        clean(it.collection) ||
        "";

      const imgCell = img
        ? `<img src="${esc(img)}" width="34" height="34" style="display:block;border:0;outline:none;text-decoration:none;border-radius:6px;" alt="${esc(title)}">`
        : `<div style="width:34px;height:34px;border-radius:6px;background:#E5E7EB;border:1px solid rgba(17,17,17,.10);"></div>`;

      return `
        <tr>
          <td style="padding:10px 16px;background:${zebra};border-bottom:${divider};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td valign="top" style="padding-right:10px;">
                  ${imgCell}
                </td>
                <td valign="top">
                  ${
                    vendor
                      ? `<div style="font:700 10px/1.2 Arial, Helvetica, sans-serif;color:${B.SUBTLE};margin:0 0 2px 0;">${esc(
                          vendor
                        )}</div>`
                      : ""
                  }
                  <div style="font:800 12px/1.25 Arial, Helvetica, sans-serif;color:${B.TEXT};margin:0;">
                    ${esc(title)}
                  </div>
                  ${
                    sku || ref || barcode
                      ? `<div style="margin-top:3px;font:400 10.5px/1.35 Arial, Helvetica, sans-serif;color:${B.SUBTLE};">
                          ${sku ? `Ref: ${esc(sku)}` : ref ? `Ref: ${esc(ref)}` : ""}
                          ${barcode ? `${sku || ref ? "&nbsp;&nbsp;•&nbsp;&nbsp;" : ""}Barcode: ${esc(barcode)}` : ""}
                        </div>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>

          <td style="padding:10px 16px;background:${zebra};border-bottom:${divider};text-align:center;font:900 14px/1.2 Arial, Helvetica, sans-serif;color:${B.TEXT};">
            ${esc(String(qtyBoxes))}
          </td>

          <td style="padding:10px 16px;background:${zebra};border-bottom:${divider};text-align:center;">
            ${isBackorder ? pill(statusText, "bad") : pill(statusText, "ok")}
          </td>
        </tr>
      `;
    })
    .join("");

  const empty = `
    <tr>
      <td colspan="3" style="padding:14px 16px;text-align:center;color:${B.SUBTLE};font:400 13px/1.6 Arial, Helvetica, sans-serif;">
        No items found.
      </td>
    </tr>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
      border-collapse:collapse;
      border:1px solid ${B.BORDER};
    ">
      ${header}
      ${rows || empty}
    </table>
  `;
}

/* ---------- main email wrapper (matches screenshot layout) ---------- */
const base = ({ title, bodyHTML = "" }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>

    <style>
      /* Mobile stacking for 2-col blocks */
      @media only screen and (max-width: 640px){
        .wrap { width: 100% !important; }
        .pad { padding-left: 12px !important; padding-right: 12px !important; }
        .col { display:block !important; width:100% !important; padding:0 !important; }
        .col + .col { padding-top:12px !important; }
      }
    </style>
  </head>

  <body style="margin:0;padding:0;background:${B.BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${B.BG};">
      <tr>
        <td class="pad" style="padding:22px 14px;">

          <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="${B.WIDTH}" class="wrap" style="width:${B.WIDTH}px;max-width:${B.WIDTH}px;margin:0 auto;">

            <!-- Header (black rounded) -->
            <tr>
              <td style="
                background:${B.BLACK};
                border-radius:${B.RADIUS}px ${B.RADIUS}px 0 0;
                padding:28px 18px 16px 18px;
                text-align:center;
              ">
                <img src="${LOGO_URL}" alt="Sugarlean" width="155" style="display:inline-block;border:0;outline:none;text-decoration:none;">
                <div style="margin-top:10px;font:900 12px/1 Arial, Helvetica, sans-serif;letter-spacing:.18em;text-transform:uppercase;color:${B.YELLOW};">
                  WHOLESALE PORTAL
                </div>
              </td>
            </tr>

            <!-- White title area -->
            <tr>
              <td style="background:${B.CARD};padding:18px 18px 10px 18px;text-align:center;">
                <div style="font:900 30px/1.12 Arial, Helvetica, sans-serif;color:${B.TEXT};">
                  ${esc(title)}
                </div>
              </td>
            </tr>

            <!-- Main body -->
            <tr>
              <td style="background:${B.CARD};padding:10px 18px 18px 18px;">
                ${bodyHTML}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                background:${B.CARD};
                border-radius:0 0 ${B.RADIUS}px ${B.RADIUS}px;
                padding:14px 16px 18px 16px;
                text-align:center;
              ">
                <div style="font:500 12px/1.6 Arial, Helvetica, sans-serif;color:${B.SUBTLE};">
                  Sent automatically from
                  <a href="${SITE_URL}" style="color:${B.YELLOW};text-decoration:none;">www.sugarlean.com.au</a>
                </div>
                <div style="margin-top:6px;font:400 12px/1.6 Arial, Helvetica, sans-serif;color:${B.TEXT};">
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

/* ---------- build layout to match your screenshot ---------- */
function buildOrderEmailLayout(data = {}) {
  const c = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];

  const shippingObj =
    (data.shippingAddress && typeof data.shippingAddress === "object" ? data.shippingAddress : null) ||
    (c.shippingAddress && typeof c.shippingAddress === "object" ? c.shippingAddress : null) ||
    (c.shipping_address && typeof c.shipping_address === "object" ? c.shipping_address : null) ||
    (data.shipping_address && typeof data.shipping_address === "object" ? data.shipping_address : null) ||
    null;

  const companyVal =
    clean(c.company) ||
    clean(c.companyName) ||
    clean(c.company_name) ||
    clean(shippingObj && shippingObj.company) ||
    "";

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

  // Google maps link for “select on map”
  const mapsQ = encodeURIComponent((shippingText || "").replace(/\n/g, ", "));
  const mapsUrl = mapsQ ? `https://www.google.com/maps/search/?api=1&query=${mapsQ}` : "";

  /* TOP BOX (Wholesaler Order + right details) */
  const topLeft = `
    ${label("Wholesaler Order")}
    ${small("Review your wholesale order summary below.")}
    <div style="height:16px;line-height:16px;font-size:16px;">&nbsp;</div>

    <div style="font:400 22px/1.25 Arial, Helvetica, sans-serif;color:${B.TEXT};margin:0;">Customer No.</div>
    <div style="margin-top:8px;font:900 22px/1.15 Arial, Helvetica, sans-serif;color:${B.TEXT};">
      ${esc(custNo || "-")}
    </div>
  `;

  const rightRow = (k, v, bold = false) => `
    <div style="margin:0 0 10px 0;">
      <div style="font:700 13px/1.25 Arial, Helvetica, sans-serif;color:${B.TEXT};">${esc(k)}</div>
      <div style="font:${bold ? "900" : "700"} 13px/1.25 Arial, Helvetica, sans-serif;color:${B.TEXT};">${esc(
        v || "-"
      )}</div>
    </div>
  `;

  const topRight = `
    ${rightRow("Order ID:", orderId, true)}
    ${rightRow("Wholesaler ABN Number", abn, true)}
    ${rightRow("Submitted:", submitted, true)}
  `;

  const topBox = box(
    twoCol({
      leftHTML: topLeft,
      rightHTML: topRight,
    })
  );

  /* Contact Information box */
  const contactBox = box(`
    ${label("Contact Information")}
    <div style="height:4px;line-height:4px;font-size:4px;">&nbsp;</div>
    ${strongLine(customerName)}
    <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>
    ${strongLine(customerEmail)}
    <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>
    ${strongLine(customerPhone)}
    <div style="height:10px;line-height:10px;font-size:10px;">&nbsp;</div>
    <div style="font:500 12px/1.4 Arial, Helvetica, sans-serif;color:${B.SUBTLE};">
      Wholesaler ABN Number: <span style="font-weight:900;color:${B.TEXT};">${esc(abn || "-")}</span>
    </div>
  `);

  /* Default address box */
  const addressName = customerName;
  const addressLines = (shippingText || "-").split("\n").map((x) => clean(x)).filter(Boolean);

  const addressHTML = `
    ${label("Default address")}
    <div style="height:4px;line-height:4px;font-size:4px;">&nbsp;</div>
    ${strongLine(addressName)}
    <div style="height:8px;line-height:8px;font-size:8px;">&nbsp;</div>
    <div style="font:500 12px/1.45 Arial, Helvetica, sans-serif;color:${B.SUBTLE};">
      ${addressLines.length ? addressLines.map((l) => `${esc(l)}<br>`).join("") : esc("-")}
    </div>
    ${
      mapsUrl
        ? `
        <div style="height:12px;line-height:12px;font-size:12px;">&nbsp;</div>
        <a href="${mapsUrl}" style="
          display:inline-block;
          border:1px solid rgba(17,17,17,.35);
          border-radius:999px;
          padding:7px 12px;
          font:800 12px/1 Arial, Helvetica, sans-serif;
          color:${B.TEXT};
          text-decoration:none;
          background:#FFFFFF;
        ">select on map</a>
      `
        : ""
    }
  `;

  const addressBox = box(addressHTML);

  /* Products table outer box */
  const productsBox = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
      border:1px solid ${B.BORDER};
      background:${B.CARD};
    ">
      <tr>
        <td style="padding:0;">
          ${orderItemsTableScreenshot(items)}
        </td>
      </tr>
    </table>
  `;

  return `
    ${topBox}
    ${spacer(12)}

    ${twoCol({ leftHTML: contactBox, rightHTML: addressBox })}
    ${spacer(12)}

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
  // ✅ EXACT same template as admin (per your request)
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
