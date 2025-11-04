// routes/applications.js
const express = require('express');
const net = require('net');
const router = express.Router();

const { ApplicationSchema } = require('../utils/validate');
const { sendMail } = require('../services/mailer');
const {
  adminSubject,
  adminHtml,
  customerSubject,
  customerHtml,
} = require('../services/templates');

/* =============================
   POST /api/wholesale/apply
   ============================= */
router.post('/apply', async (req, res) => {
  try {
    // Validate payload with Zod
    const data = ApplicationSchema.parse(req.body);

    // 1) Email to admin
    await sendMail({
      to: process.env.ADMIN_TO,
      from: process.env.FROM_ADDRESS || process.env.EMAIL_USER,
      replyTo: data.email,
      subject: adminSubject(data.companyName),
      html: adminHtml(data),
    });

    // 2) Auto-reply to applicant
    await sendMail({
      to: data.email,
      from: process.env.FROM_ADDRESS || process.env.EMAIL_USER,
      subject: customerSubject(),
      html: customerHtml({ companyName: data.companyName }),
    });

    return res.status(200).json({ ok: true, message: 'Application received.' });
  } catch (err) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ ok: false, errors: err.errors });
    }
    console.error('Application error:', err);
    return res.status(500).json({ ok: false, message: 'Unexpected error' });
  }
});

/* =============================
   GET /api/wholesale/diag-smtp
   Connectivity check: can the
   server open a TCP socket to
   your SMTP host/port?
   ============================= */
router.get('/diag-smtp', (req, res) => {
  const host = process.env.EMAIL_HOST || 'smtp.office365.com';
  const port = Number(process.env.EMAIL_PORT || 587);

  const socket = new net.Socket();
  const started = Date.now();
  socket.setTimeout(8000);

  socket.on('connect', () => {
    const ms = Date.now() - started;
    socket.destroy();
    res.json({ ok: true, host, port, connectMs: ms });
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.status(504).json({ ok: false, host, port, error: 'timeout' });
  });

  socket.on('error', (err) => {
    socket.destroy();
    res.status(502).json({ ok: false, host, port, error: err.message });
  });

  socket.connect(port, host);
});

/* =============================
   GET /api/wholesale/diag-env
   Quick sanity check for the
   env variables you rely on.
   (Masks passwords)
   ============================= */
router.get('/diag-env', (_req, res) => {
  const mask = (v) => (v ? '***' : '(empty)');
  res.json({
    ok: true,
    PORT: process.env.PORT || '(default 4000)',
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.office365.com',
    EMAIL_PORT: process.env.EMAIL_PORT || '587',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
    EMAIL_USER: process.env.EMAIL_USER || '(empty)',
    EMAIL_PASS: mask(process.env.EMAIL_PASS),
    FROM_ADDRESS: process.env.FROM_ADDRESS || '(empty)',
    ADMIN_TO: process.env.ADMIN_TO || '(empty)',
  });
});

module.exports = router;
