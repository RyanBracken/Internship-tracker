require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/internships.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

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
    salary_type TEXT CHECK(salary_type IN ('paid', 'unpaid', 'not_stated')) DEFAULT 'not_stated',
    description TEXT,
    description_short TEXT,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    source_type TEXT CHECK(source_type IN ('job_board', 'direct')) DEFAULT 'job_board',
    category TEXT,
    tags TEXT,
    date_posted TEXT,
    date_scraped TEXT NOT NULL,
    date_expires TEXT,
    is_active INTEGER DEFAULT 1,
    is_duplicate INTEGER DEFAULT 0,
    fingerprint TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    internship_id TEXT NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('applied','interview','offer','rejected','saved')) DEFAULT 'saved',
    applied_date TEXT,
    notes TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scrape_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    count_added INTEGER DEFAULT 0,
    count_skipped INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company);
  CREATE INDEX IF NOT EXISTS idx_internships_category ON internships(category);
  CREATE INDEX IF NOT EXISTS idx_internships_active ON internships(is_active);
  CREATE INDEX IF NOT EXISTS idx_internships_date_posted ON internships(date_posted);
  CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
`);

console.log('Database migrated successfully at', DB_PATH);
db.close();
