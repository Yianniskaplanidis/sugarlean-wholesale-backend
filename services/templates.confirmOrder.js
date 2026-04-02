// 🔥 FORCE UPDATED TEMPLATE (ORDER METHOD BELOW CONTACT)

const { BRAND, SITE_URL, LOGO_URL } = require("./templates");

const B = {
  WIDTH: 760,
  BG: "#F3F4F6",
  CARD: "#FFFFFF",
  TEXT: "#111111",
  SUBTLE: "#777777",
  BLACK: "#0B0B0B",
  YELLOW: "#F5C542",
  GREEN: "#31C16B",
  LINE: "rgba(0,0,0,.10)",
  LINE_STRONG: "rgba(0,0,0,.28)",
  RADIUS: 18,
  FONT: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`,
};

console.log("🔥 NEW TEMPLATE LOADED 🔥");

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
  );

const spacer = (h = 12) => `<div style="height:${h}px;"></div>`;

const box = (inner, extra = "") => `
<table width="100%" style="border:1px solid ${B.LINE_STRONG};background:${B.CARD};${extra}">
<tr><td style="padding:18px;font-family:${B.FONT};">${inner}</td></tr>
</table>
`;

const h16 = (t) => `<div style="font-size:16px;font-weight:500;margin-bottom:8px;">${esc(t)}</div>`;
const p12 = (t, c = B.TEXT) => `<div style="font-size:12px;color:${c};line-height:1.6;">${esc(t)}</div>`;

function renderOrderMethodSection(method, notes) {
  return `
    ${h16("How would you like to place your order? *")}
    <div style="border:1px solid ${B.GREEN};padding:12px;border-radius:10px;">
      <div style="font-weight:600;">${esc(method || "None")}</div>
      <div style="color:${B.SUBTLE};font-size:12px;margin-top:4px;">
        Follows this site and sends your order through the wholesale portal.
      </div>
    </div>

    ${spacer(14)}

    ${h16("Extra notes")}
    ${p12(notes || "None", B.SUBTLE)}
  `;
}

function buildOrderEmailLayout(data = {}) {
  const contact = box(`
    ${h16("Contact information")}
    ${p12(data.customer?.name || "-")}
    ${p12(data.customer?.email || "-")}
    ${p12(data.customer?.phone || "-")}
  `);

  const address = box(`
    ${h16("Default address")}
    ${p12(data.shippingAddress?.address1 || "-")}
    ${p12(data.shippingAddress?.city || "-")}
  `);

  const orderMethodBox = box(
    renderOrderMethodSection(data.orderMethodLabel, data.extraNotes),
    "background:#F1F1F1;"
  );

  const items = box(`${h16("Items")} ${p12("...")}`);

  return `
    ${contact}
    ${spacer(14)}
    ${address}
    ${spacer(14)}
    ${orderMethodBox}
    ${spacer(14)}
    ${items}
  `;
}

function confirmOrderUserTemplate(data = {}) {
  return `
    <html>
    <body style="background:${B.BG};font-family:${B.FONT};padding:20px;">
      ${buildOrderEmailLayout(data)}
    </body>
    </html>
  `;
}

module.exports = {
  confirmOrderUserTemplate
};
