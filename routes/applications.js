const express = require('express');
const router = express.Router();
const { ApplicationSchema } = require('../utils/validate');
const { sendMail } = require('../services/mailer');
const { adminSubject, adminHtml, customerSubject, customerHtml } = require('../services/templates');

router.post('/apply', async (req, res) => {
  try {
    const data = ApplicationSchema.parse(req.body);

    // 1) email to admin
    await sendMail({
      to: process.env.ADMIN_TO,
      from: process.env.FROM_ADDRESS,
      replyTo: data.email,
      subject: adminSubject(data.companyName),
      html: adminHtml(data),
    });

    // 2) auto-reply to applicant
    await sendMail({
      to: data.email,
      from: process.env.FROM_ADDRESS,
      subject: customerSubject(),
      html: customerHtml({ companyName: data.companyName }),
    });

    res.status(200).json({ ok: true, message: 'Application received.' });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ ok: false, errors: err.errors });
    }
    console.error('Application error:', err);
    res.status(500).json({ ok: false, message: 'Unexpected error' });
  }
});

module.exports = router;
