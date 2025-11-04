// services/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // helps avoid certificate rejection on Render
  },
});

async function sendMail({ to, from, subject, html, replyTo }) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      replyTo,
    });
    console.log('✅ Email sent:', info.messageId);
  } catch (err) {
    console.error('❌ Email send failed:', err);
    throw err;
  }
}

module.exports = { sendMail };
