const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

let scrapeRunning = false;
let lastRunResult = null;

router.post('/trigger', async (req, res) => {
  if (scrapeRunning) return res.status(409).json({ error: 'Scrape already running' });
  scrapeRunning = true;
  res.json({ message: 'Scrape started', running: true });
  try {
    const { runAll } = require('../scraper-runner');
    await runAll();
    lastRunResult = { success: true, at: new Date().toISOString() };
  } catch (err) {
    lastRunResult = { success: false, error: err.message, at: new Date().toISOString() };
  } finally {
    scrapeRunning = false;
  }
});

router.get('/status', (req, res) => {
  try {
    const db = getDb();
    const recentLogs = db.prepare(`SELECT * FROM scrape_log ORDER BY started_at DESC LIMIT 20`).all();
    res.json({ running: scrapeRunning, last_result: lastRunResult, logs: recentLogs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
