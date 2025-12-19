// routes/confirmOrder.js
const express = require("express");
const router = express.Router();

const { sendConfirmOrderEmails } = require("../services/mailer");

/* ----------------------------- helpers ----------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const t = (v) => (v == null ? "" : String(v).trim());
const clampStr = (v, max = 2000) => {
  const s = t(v);
  return s.length > max ? s.slice(0, max) : s;
};
const asNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const safeArray = (v) => (Array.isArray(v) ? v : []);

function getIp(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
}
function getUa(req) {
  return req.headers["user-agent"] || "";
}

function sanitizeAddress(addr) {
  if (!addr) return null;

  if (typeof addr === "string") return clampStr(addr, 1200);
  if (typeof addr !== "object") return null;

  const pick = (k, max = 200) => clampStr(addr[k], max);

  return {
    name: pick("name", 200) || pick("full_name", 200),
    first_name: pick("first_name", 120),
    last_name: pick("last_name", 120),
    company: pick("company", 200),
    address1: pick("address1", 240),
    address2: pick("address2", 240),
    city: pick("city", 160),
    province: pick("province", 160),
    province_code: pick("province_code", 20),
    zip: pick("zip", 30) || pick("postal_code", 30),
    country: pick("country", 120),
    country_code: pick("country_code", 10),
    phone: pick("phone", 80),
  };
}

// ✅ Extract an image URL from many possible item shapes
function pickItemImageUrl(it) {
  if (!it || typeof it !== "object") return "";

  // direct keys
  let url =
    t(it.image) ||
    t(it.imageUrl) ||
    t(it.image_url) ||
    t(it.imageSrc) ||
    t(it.image_src) ||
    t(it.thumbnail) ||
    t(it.thumb) ||
    t(it.featuredImage) ||
    t(it.featured_image) ||
    t(it.productImage) ||
    t(it.product_image) ||
    "";

  // nested objects
  if (!url && it.image && typeof it.image === "object") {
    url = t(it.image.src) || t(it.image.url) || "";
  }
  if (!url && it.featured_image && typeof it.featured_image === "object") {
    url = t(it.featured_image.src) || t(it.featured_image.url) || "";
  }

  // arrays
  if (!url && Array.isArray(it.images) && it.images.length) {
    const first = it.images[0];
    url = typeof first === "string" ? t(first) : t(first?.src) || t(first?.url) || "";
  }

  // product nested
  if (!url && it.product && typeof it.product === "object") {
    url =
      t(it.product.featured_image) ||
      t(it.product.featuredImage) ||
      t(it.product.image?.src) ||
      t(it.product.image?.url) ||
      t(it.product.featured_image?.src) ||
      t(it.product.featured_image?.url) ||
      "";

    if (!url && Array.isArray(it.product.images) && it.product.images.length) {
      const p0 = it.product.images[0];
      url = typeof p0 === "string" ? t(p0) : t(p0?.src) || t(p0?.url) || "";
    }
  }

  // Keep it reasonable length for logs/email payload
  return clampStr(url, 1200);
}

/**
 * Build payload from common Shopify/localStorage shapes.
 */
function buildConfirmOrderPayload(reqBody, req) {
  const b = reqBody || {};
  const customerObj = b.customer || {};
  const totalsObj = b.totals || b.total || {};

  const itemsIn =
    safeArray(b.items) ||
    safeArray(b.orderItems) ||
    safeArray(b.lines) ||
    safeArray((b.order || {}).items);

  const items = itemsIn.slice(0, 250).map((it) => {
    const qtyBoxes =
      asNum(it.qtyBoxes, NaN) ||
      asNum(it.qty_boxes, NaN) ||
      asNum(it.qty, NaN) ||
      asNum(it.quantity, NaN) ||
      0;

    const price =
      asNum(it.price, NaN) ||
      asNum(it.unitPrice, NaN) ||
      asNum(it.unit_price, NaN) ||
      0;

    const lineTotal =
      asNum(it.lineTotal, NaN) ||
      asNum(it.line_total, NaN) ||
      asNum(it.total, NaN) ||
      qtyBoxes * price;

    const available =
      typeof it.available === "boolean"
        ? it.available
        : typeof it.isSoldOut === "boolean"
          ? !it.isSoldOut
          : typeof it.soldOut === "boolean"
            ? !it.soldOut
            : true;

    const imageUrl = pickItemImageUrl(it);

    return {
      title:
        t(it.title) ||
        t(it.product_title) ||
        t(it.productTitle) ||
        t(it.name) ||
        "",

      // ✅ keep brand/vendor if your frontend sends it (shows above title in your email)
      vendor: clampStr(it.vendor || it.brand || it.company || it.collection || "", 120),

      // ✅ keep image URL so email template can render thumbnails
      imageUrl,

      sku: t(it.sku) || t(it.SKU) || t(it.variant_sku) || t(it.variantSku) || "",
      ref: t(it.ref) || t(it.ref_number) || t(it.refNumber) || "",
      barcode: t(it.barcode) || t(it.barcode_override) || t(it.barcodeOverride) || "",
      boxQty: t(it.boxQty) || t(it.box_quantity) || t(it.boxQuantity) || "",

      qtyBoxes: asNum(qtyBoxes, 0),
      price: asNum(price, 0),
      lineTotal: asNum(lineTotal, 0),

      available: available !== false,
    };
  });

  const subtotal =
    asNum(totalsObj.subtotal, NaN) ||
    asNum(totalsObj.subTotal, NaN) ||
    asNum(totalsObj.sub_total, NaN) ||
    items.reduce((sum, it) => sum + asNum(it.lineTotal, 0), 0);

  const shippingAddress = sanitizeAddress(
    b.shippingAddress ||
      b.shipping_address ||
      b.shipping ||
      customerObj.shippingAddress ||
      customerObj.shipping_address ||
      null
  );

  const extraNotes = clampStr(
    b.extraNotes ||
      b.extra_notes ||
      b.customerNotes ||
      b.customer_notes ||
      b.packingNotes ||
      b.packing_notes ||
      b.notesOnly ||
      b.extraNote ||
      "",
    2000
  );

  const customerPhone = clampStr(
    customerObj.phone ||
      b.customerPhone ||
      b.phone ||
      (shippingAddress && typeof shippingAddress === "object" ? shippingAddress.phone : "") ||
      "",
    80
  );

  const customerAbn = clampStr(
    customerObj.abn ||
      customerObj.abnNumber ||
      customerObj.abn_number ||
      b.abn ||
      b.abnNumber ||
      b.abn_number ||
      "",
    80
  );

  const customerCompany = clampStr(
    customerObj.company ||
      customerObj.companyName ||
      customerObj.company_name ||
      b.company ||
      b.companyName ||
      b.company_name ||
      (shippingAddress && typeof shippingAddress === "object" ? shippingAddress.company : "") ||
      "",
    200
  );

  return {
    shop: clampStr(b.shop || b.shopDomain || b.domain, 120),
    orderId: clampStr(b.orderId || b.order_id || b.orderNumber || b.order_number, 80),

    note: clampStr(b.note || b.message || b.notes, 4000),

    extraNotes,
    shippingAddress,

    customer: {
      name: clampStr(customerObj.name || b.customerName || b.name, 200),
      email: clampStr(customerObj.email || b.customerEmail || b.email, 200),
      phone: customerPhone,
      customerNumber: clampStr(
        customerObj.customerNumber ||
          customerObj.customer_number ||
          b.customerNumber ||
          b.customer_number,
        80
      ),
      abn: customerAbn,
      company: customerCompany,
    },

    items,
    totals: { subtotal: asNum(subtotal, 0) },

    ip: getIp(req),
    ua: getUa(req),
  };
}

function validateConfirmOrderPayload(data) {
  if (!data || typeof data !== "object") {
    return { ok: false, status: 400, error: "Invalid payload" };
  }

  const email = t(data.customer?.email);
  const customerNumber = t(data.customer?.customerNumber);

  if (!email && !customerNumber) {
    return { ok: false, status: 422, error: "Missing customer email or customer number" };
  }

  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, status: 422, error: "Invalid email format" };
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { ok: false, status: 422, error: "No items to submit" };
  }

  const bad = data.items.find((it) => !t(it.title) || asNum(it.qtyBoxes, 0) <= 0);
  if (bad) {
    return { ok: false, status: 422, error: "Each item must have a title and qtyBoxes > 0" };
  }

  return { ok: true };
}

/* ------------------------------ routes ------------------------------ */

router.get("/confirm-order/ping", (_req, res) =>
  res.json({ ok: true, route: "confirm-order" })
);

/**
 * POST /api/wholesale/confirm-order
 * Fast ACK (202) so Shopify never waits on SMTP.
 */
router.post("/confirm-order", async (req, res) => {
  if (t(req.body?.website)) {
    return res.status(202).json({ ok: true, message: "Received." });
  }

  const data = buildConfirmOrderPayload(req.body, req);
  const v = validateConfirmOrderPayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  res.status(202).json({
    ok: true,
    queued: true,
    orderId: data.orderId || null,
    message: "Order received. Email will follow shortly.",
  });

  setImmediate(async () => {
    try {
      const info = await sendConfirmOrderEmails(data);
      console.log("✅ Confirm-order emails sent", {
        toAdmin: !!info?.admin,
        toUser: !!info?.user,
        customer: data.customer?.email || data.customer?.customerNumber,
        company: data.customer?.company || "",
        items: data.items?.length || 0,
        hasShipping: !!data.shippingAddress,
        hasExtraNotes: !!t(data.extraNotes),
        // ✅ quick visibility: how many images came through
        images: (data.items || []).filter((x) => t(x.imageUrl)).length,
      });
    } catch (err) {
      console.error("💥 Confirm-order send failed (background):", err?.stack || err?.message || err);
    }
  });
});

/**
 * POST /api/wholesale/confirm-order-sync
 * Waits for SMTP/Graph. Use for Postman/debugging.
 */
router.post("/confirm-order-sync", async (req, res) => {
  const data = buildConfirmOrderPayload(req.body, req);
  const v = validateConfirmOrderPayload(data);
  if (!v.ok) return res.status(v.status).json(v);

  try {
    const info = await sendConfirmOrderEmails(data);
    return res.json({
      ok: true,
      orderId: data.orderId || null,
      sent: { admin: !!info?.admin, user: !!info?.user },
      // ✅ helps you confirm thumbnails are present in payload
      images: (data.items || []).filter((x) => t(x.imageUrl)).length,
    });
  } catch (e) {
    console.error("confirm-order-sync failed:", e?.stack || e);
    return res.status(502).json({
      ok: false,
      error: "Email send failed",
      reason: e?.message || String(e),
    });
  }
});

module.exports = router;
