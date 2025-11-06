// routes/diag.js
const express = require("express");
const net = require("net");
const dns = require("dns").promises;
const tls = require("tls");
const { transporter } = require("../services/mailer");

const router = express.Router();

// GET /api/wholesale/diag-smtp?host=&port=&secure=
router.get("/diag-smtp", async (req, res) => {
  const host = (req.query.host || process.env.EMAIL_HOST || "").trim();
  const port = Number(req.query.port || process.env.EMAIL_PORT || 0);
  const secure =
    (req.query.secure ?? process.env.EMAIL_SECURE ?? "false").toString() === "true";

  if (!host || !port) {
    return res.status(400).json({ ok: false, error: "host/port required" });
  }

  try {
    const look = await dns.lookup(host, { all: true });
    const ips = look.map(r => `${r.address}/${r.family}`).join(", ");
    const started = Date.now();

    const connector = secure ? tls.connect : net.connect;
    const socket = connector({ host, port, servername: host, minVersion: "TLSv1.2" });
    socket.setTimeout(8000); // ← important

    socket.on("secureConnect", () => { // tls.connect emits 'secureConnect'
      if (!secure) return;             // ignore if using plain TCP
      const ms = Date.now() - started;
      socket.destroy();
      res.json({ ok: true, host, port, secure, ips, connectMs: ms });
    });

    socket.on("connect", () => {       // net.connect emits 'connect'
      if (secure) return;              // ignore if doing TLS (handled above)
      const ms = Date.now() - started;
      socket.destroy();
      res.json({ ok: true, host, port, secure, ips, connectMs: ms });
    });

    socket.on("timeout", () => {
      socket.destroy();
      res.status(504).json({ ok: false, host, port, secure, ips, error: "ETIMEDOUT" });
    });

    socket.on("error", (err) => {
      socket.destroy();
      res.status(502).json({ ok: false, host, port, secure, ips, error: err.code || err.message });
    });
  } catch (e) {
    res.status(502).json({ ok: false, host, port, secure, error: e.message });
  }
});

// GET /api/wholesale/diag-smtp-verify
router.get("/diag-smtp-verify", async (_req, res) => {
  try {
    await transporter.verify(); // EHLO + STARTTLS/SSL + AUTH (if configured)
    res.json({ ok: true, message: "SMTP connection verified successfully" });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message, code: e.code });
  }
});

module.exports = router;
