require('dotenv').config();
const { initDb } = require('./db');

async function migrate() {
  const db = await initDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS internships (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      company_logo TEXT,
      location TEXT NOT NULL,
      start_date TEXT,
      duration TEXT,
      salary TEXT,
      salary_type TEXT DEFAULT 'not_stated',
      description TEXT,
      description_short TEXT,
      url TEXT NOT NULL,
      source TEXT NOT NULL,
      source_type TEXT DEFAULT 'job_board',
      category TEXT,
      tags TEXT,
      date_posted TEXT,
      date_scraped TEXT NOT NULL,
      date_expires TEXT,
      is_active INTEGER DEFAULT 1,
      is_duplicate INTEGER DEFAULT 0,
      fingerprint TEXT UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      internship_id TEXT NOT NULL,
      status TEXT DEFAULT 'saved',
      applied_date TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      count_added INTEGER DEFAULT 0,
      count_skipped INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      error TEXT
    )
  `);

  console.log('Database migrated successfully at', process.env.DB_PATH || './data/internships.db');
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };
