// routes/diag.js
const express = require("express");
const dns = require("dns").promises;
const net = require("net");
const tls = require("tls");

const router = express.Router();

/* ----------------------- utils ----------------------- */

// mask a secret but keep a few chars at edges
function mask(v, keep = 3) {
  if (!v) return "";
  const s = String(v);
  if (s.length <= keep * 2) return "*".repeat(Math.max(4, s.length));
  return s.slice(0, keep) + "*".repeat(s.length - keep * 2) + s.slice(-keep);
}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function toTimeoutMs(x, fallback = 8000) {
  const n = Number(x);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return clamp(Math.floor(n), 1000, 20000); // 1–20s
}

const HOST_RE = /^[a-z0-9.-]+$/i;

/* -------------- optional key guard for prod -------------- */
/** If DIAG_KEY is set, require ?key=DIAG_KEY on all diag routes. */
router.use((req, res, next) => {
  const required = process.env.DIAG_KEY;
  if (!required) return next();
  if (req.query.key === required) return next();
  return res.status(403).json({ ok: false, error: "forbidden" });
});

/* ----------------------- routes ----------------------- */

// mounted check
router.get("/", (_req, res) => res.json({ ok: true, diag: true }));

/**
 * GET /api/wholesale/env-summary
 * Safe snapshot of mailer-related env (no secrets exposed)
 */
router.get("/env-summary", (_req, res) => {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_FROM,
    ADMIN_EMAIL,
    DKIM_DOMAIN,
    DKIM_SELECTOR,
    DKIM_PRIVATE_KEY,
  } = process.env;

  res.json({
    ok: true,
    env: {
      EMAIL_HOST: EMAIL_HOST || "",
      EMAIL_PORT: EMAIL_PORT || "",
      EMAIL_SECURE: EMAIL_SECURE || "",
      EMAIL_USER: EMAIL_USER || "",
      EMAIL_FROM: EMAIL_FROM || "",
      ADMIN_EMAIL: ADMIN_EMAIL || "",
      DKIM_DOMAIN: DKIM_DOMAIN || "",
      DKIM_SELECTOR: DKIM_SELECTOR || "",
      DKIM_PRIVATE_KEY: DKIM_PRIVATE_KEY ? mask(DKIM_PRIVATE_KEY, 6) : "",
    },
  });
});

/**
 * GET /api/wholesale/diag-dns?host=smtp.office365.com
 */
router.get("/diag-dns", async (req, res) => {
  const host = String(req.query.host || "").trim();
  if (!host) return res.status(400).json({ ok: false, error: "host required" });
  if (!HOST_RE.test(host)) return res.status(400).json({ ok: false, error: "invalid host" });

  try {
    const look = await dns.lookup(host, { all: true });
    const ips = look.map((r) => ({ address: r.address, family: r.family }));
    res.json({ ok: true, host, ips });
  } catch (e) {
    res.status(502).json({
      ok: false,
      host,
      error: e?.message || e?.code || "dns error",
      code: e?.code,
    });
  }
});

/**
 * GET /api/wholesale/diag-tcp?host=example.com&port=443&secure=true&timeoutMs=8000
 */
router.get("/diag-tcp", async (req, res) => {
  const host = String(req.query.host || "").trim();
  const port = Number(req.query.port || 0);
  const secure = String(req.query.secure || "false").toLowerCase() === "true";
  const timeout = toTimeoutMs(req.query.timeoutMs, 8000);

  if (!host || !port) return res.status(400).json({ ok: false, error: "host/port required" });
  if (!HOST_RE.test(host)) return res.status(400).json({ ok: false, error: "invalid host" });

  try {
    const look = await dns.lookup(host, { all: true });
    const ips = look.map((r) => `${r.address}/${r.family}`).join(", ");

    const started = Date.now();
    const connector = secure ? tls.connect : net.connect;
    const socket = connector({ host, port, servername: host, timeout });

    const done = (ok, extra = {}) => {
      socket.destroy();
      res.status(ok ? 200 : 502).json({
        ok,
        host,
        port,
        secure,
        ips,
        elapsedMs: Date.now() - started,
        ...extra,
      });
    };

    socket.once("secureConnect", () => done(true, { phase: "secureConnect" }));
    socket.once("connect", () => {
      if (!secure) return done(true, { phase: "connect" });
      done(true, { phase: "connect" });
    });
    socket.once("timeout", () => done(false, { error: "timeout" }));
    socket.once("error", (err) =>
      done(false, {
        error: err?.message || err?.code || "unknown",
        code: err?.code,
        syscall: err?.syscall,
        errno: err?.errno,
      })
    );
  } catch (e) {
    res.status(502).json({
      ok: false,
      host,
      port,
      secure,
      error: e?.message || e?.code || "dns/unknown",
    });
  }
});

/**
 * GET /api/wholesale/diag-smtp?host=&port=&secure=&timeoutMs=
 * e.g.
 *  /diag-smtp?host=smtp.office365.com&port=587&secure=false
 *  /diag-smtp?host=smtp.office365.com&port=465&secure=true
 */
router.get("/diag-smtp", async (req, res) => {
  const host = String(req.query.host || "").trim();
  const port = Number(req.query.port || 0);
  const secure = String(req.query.secure || "false").toLowerCase() === "true";
  const timeout = toTimeoutMs(req.query.timeoutMs, 8000);

  if (!host || !port) return res.status(400).json({ ok: false, error: "host/port required" });
  if (!HOST_RE.test(host)) return res.status(400).json({ ok: false, error: "invalid host" });

  try {
    const look = await dns.lookup(host, { all: true });
    const ips = look.map((r) => `${r.address}/${r.family}`).join(", ");

    const started = Date.now();
    const connector = secure ? tls.connect : net.connect;
    const socket = connector({ host, port, servername: host, timeout });

    const done = (ok, extra = {}) => {
      socket.destroy();
      res.status(ok ? 200 : 502).json({
        ok,
        host,
        port,
        secure,
        ips,
        elapsedMs: Date.now() - started,
        ...extra,
      });
    };

    socket.once("secureConnect", () => done(true, { phase: "secureConnect" }));
    socket.once("connect", () => {
      if (!secure) return done(true, { phase: "connect" });
      done(true, { phase: "connect" });
    });
    socket.once("timeout", () => done(false, { error: "timeout" }));
    socket.once("error", (err) =>
      done(false, {
        error: err?.message || err?.code || "unknown",
        code: err?.code,
        syscall: err?.syscall,
        errno: err?.errno,
      })
    );
  } catch (e) {
    res.status(502).json({
      ok: false,
      host,
      port,
      secure,
      error: e?.message || e?.code || "dns/unknown",
    });
  }
});

module.exports = router;
