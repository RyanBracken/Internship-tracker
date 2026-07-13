const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = `
      SELECT a.*, i.title, i.company, i.company_logo, i.location, i.salary,
             i.start_date, i.duration, i.url, i.source, i.source_type, i.category,
             i.description_short, i.date_posted
      FROM applications a
      JOIN internships i ON i.id = a.internship_id
    `;
    const params = [];
    if (status) { query += ' WHERE a.status = ?'; params.push(status); }
    query += ' ORDER BY a.updated_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { internship_id, status = 'saved', notes, applied_date } = req.body;
    if (!internship_id) return res.status(400).json({ error: 'internship_id required' });

    const existing = db.prepare('SELECT id FROM applications WHERE internship_id = ?').get(internship_id);
    if (existing) {
      db.prepare(`UPDATE applications SET status=?, notes=?, applied_date=?, updated_at=? WHERE id=?`)
        .run(status, notes || null, applied_date || null, new Date().toISOString(), existing.id);
      return res.json({ id: existing.id, updated: true });
    }

    const id = uuidv4();
    db.prepare(`INSERT INTO applications (id, internship_id, status, notes, applied_date, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, internship_id, status, notes || null, applied_date || null, new Date().toISOString());
    res.status(201).json({ id, created: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { status, notes, applied_date } = req.body;
    const result = db.prepare(`UPDATE applications SET status=?, notes=?, applied_date=?, updated_at=? WHERE id=?`)
      .run(status, notes ?? null, applied_date ?? null, new Date().toISOString(), req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM applications WHERE id=?').run(req.params.id);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
