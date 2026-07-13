const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`SELECT category, COUNT(*) as count FROM internships WHERE is_active=1 AND is_duplicate=0 GROUP BY category ORDER BY count DESC`).all();
    const sources = db.prepare(`SELECT source, COUNT(*) as count FROM internships WHERE is_active=1 AND is_duplicate=0 GROUP BY source ORDER BY count DESC`).all();
    const companies = db.prepare(`SELECT company, COUNT(*) as count FROM internships WHERE is_active=1 AND is_duplicate=0 GROUP BY company ORDER BY count DESC LIMIT 20`).all();
    const lastScrape = db.prepare(`SELECT MAX(finished_at) as last_updated FROM scrape_log WHERE status='success'`).get();
    const total = db.prepare(`SELECT COUNT(*) as count FROM internships WHERE is_active=1 AND is_duplicate=0`).get();
    res.json({ total: total?.count || 0, categories, sources, companies, last_updated: lastScrape?.last_updated || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { q, category, company, salary_type, source_type, source, city, page = 1, limit = 20, sort = 'date_scraped', order = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const allowedSort = ['date_posted', 'date_scraped', 'company', 'title'];
    const sortCol = allowedSort.includes(sort) ? sort : 'date_scraped';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const conditions = ['is_active = 1', 'is_duplicate = 0'];
    const params = [];

    if (q) { conditions.push(`(title LIKE ? OR company LIKE ? OR description LIKE ?)`); const like = `%${q}%`; params.push(like, like, like); }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (company) { conditions.push('company LIKE ?'); params.push(`%${company}%`); }
    if (salary_type) { conditions.push('salary_type = ?'); params.push(salary_type); }
    if (source_type) { conditions.push('source_type = ?'); params.push(source_type); }
    if (source) { conditions.push('source = ?'); params.push(source); }
    if (city) { conditions.push('location LIKE ?'); params.push(`%${city}%`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM internships ${where}`).get(...params);
    const total = countRow?.total || 0;

    const rows = db.prepare(`
      SELECT i.*, a.status as app_status, a.id as app_id
      FROM internships i
      LEFT JOIN applications a ON a.internship_id = i.id
      ${where}
      ORDER BY i.${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    res.json({ data: rows, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT i.*, a.status as app_status, a.notes as app_notes, a.applied_date, a.id as app_id
      FROM internships i
      LEFT JOIN applications a ON a.internship_id = i.id
      WHERE i.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
