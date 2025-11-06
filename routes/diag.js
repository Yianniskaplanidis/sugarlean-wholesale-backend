// routes/diag.js
const express = require("express");
const net = require("net");
const router = express.Router();
const { verifySmtp, transporter } = require("../services/mailer");

// TCP connect test (host/port)
router.get("/diag-smtp", (req, res) => {
  const host = req.query.host || process.env.EMAIL_HOST || "smtp.office365.com";
  const port = Number(req.query.port || process.env.EMAIL_PORT || 587);
  const secure = String(req.query.secure ?? process.env.EMAIL_SECURE ?? "false");
  const socket = new net.Socket();
  const started = Date.now();
  socket.setTimeout(8000);

  socket.on("connect", () => {
    socket.destroy();
    res.json({ ok: true, host, port, secure, connectMs: Date.now() - started });
  });
  socket.on("timeout", () => {
    socket.destroy();
    res.status(504).json({ ok: false, host, port, secure, error: "timeout" });
  });
  socket.on("error", (err) => {
    res.status(502).json({ ok: false, host, port, secure, error: err.message });
  });

  socket.connect(port, host);
});

// Nodemailer verify() (auth + TLS)
router.get("/diag-nodemailer", async (_req, res) => {
  try {
    const v = await verifySmtp(); // transporter.verify()
    res.json({
      ok: true,
      verify: v,
      transport: {
        host: transporter.options.host,
        port: transporter.options.port,
        secure: transporter.options.secure,
      },
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e.message,
      code: e.code,
      command: e.command,
      response: e.response,
    });
  }
});

module.exports = router;
