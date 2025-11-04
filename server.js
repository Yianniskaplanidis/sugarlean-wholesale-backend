// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

/* ---------- Config ---------- */
const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/* ---------- Middlewares ---------- */
app.set('trust proxy', 1); // needed on Render/behind proxies

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: false,
  })
);

app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json({ limit: '1mb' }));       // JSON body
app.use(express.urlencoded({ extended: true })); // form-encoded body

// Basic rate limit (per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests/min/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/* ---------- Routers ---------- */
const applicationsRouter = require('./routes/applications');

// Everything in routes/applications.js is mounted under /api/wholesale
app.use('/api/wholesale', applicationsRouter);

/* ---------- Health / Debug ---------- */
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'sugarlean-wholesale-backend',
    status: 'live',
    time: new Date().toISOString(),
  });
});

app.get('/healthz', (_req, res) => res.status(204).send());

/* ---------- 404 + Error handler ---------- */
app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ ok: false, error: 'Not Found', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ ok: false, message: 'Unexpected error' });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // (handy for tests)
