require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');

// Run migrations on startup
require('./migrate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/internships', require('./routes/internships'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/scrape', require('./routes/scrape'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Schedule scraper every 24 hours at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Starting scheduled scrape at', new Date().toISOString());
  try {
    const { runAll } = require('./scraper-runner');
    await runAll();
  } catch (err) {
    console.error('[CRON] Scrape failed:', err.message);
  }
}, { timezone: 'Europe/Dublin' });

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Scraper scheduled to run daily at 03:00 Europe/Dublin`);
});
