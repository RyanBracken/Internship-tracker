require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');
const { fingerprint } = require('./utils/dedup');
const { categorise, isRelevant } = require('./utils/categorise');
const { isValidStartYear, isExpired } = require('./utils/dateFilter');

const scrapers = [
  require('./scrapers/jobboards/irishjobs'),
  require('./scrapers/jobboards/gradireland'),
  require('./scrapers/jobboards/recruitireland'),
  require('./scrapers/jobboards/etrecruite'),
  require('./scrapers/jobboards/indeed'),
  require('./scrapers/jobboards/linkedin'),
  require('./scrapers/jobboards/glassdoor'),
  require('./scrapers/companies/bigfour'),
  require('./scrapers/companies/banks'),
  require('./scrapers/companies/consulting'),
  require('./scrapers/companies/alternatives'),
  require('./scrapers/companies/london'),
  require('./scrapers/companies/paris'),
  require('./scrapers/companies/frankfurt'),
  require('./scrapers/companies/zurich'),
];

function shortDescription(desc) {
  if (!desc) return '';
  const clean = desc.replace(/\s+/g, ' ').trim();
  return clean.length > 300 ? clean.slice(0, 297) + '...' : clean;
}

function determineSalaryType(salary, title, description) {
  if (!salary) {
    const text = `${title} ${description || ''}`.toLowerCase();
    if (text.includes('unpaid') || text.includes('voluntary')) return 'unpaid';
    return 'not_stated';
  }
  const lower = salary.toLowerCase();
  if (lower.includes('unpaid') || lower === '0') return 'unpaid';
  return 'paid';
}

async function runScraper(scraper) {
  const db = getDb();
  const logResult = db.prepare(`INSERT INTO scrape_log (source, started_at, status) VALUES (?, ?, 'running')`).run(scraper.name, new Date().toISOString());
  const logId = logResult.lastInsertRowid;

  let added = 0, skipped = 0;

  try {
    const listings = await scraper.scrape();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO internships
        (id, title, company, company_logo, location, start_date, duration, salary, salary_type,
         description, description_short, url, source, source_type, category, tags,
         date_posted, date_scraped, date_expires, is_active, fingerprint)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const toInsert = [];

    for (const listing of listings) {
      const loc = (listing.location || '').toLowerCase();
      if (loc && !loc.includes('dublin') && !loc.includes('ireland') && !loc.includes('london') && !loc.includes('united kingdom') && !loc.includes(' uk') && !loc.includes('paris') && !loc.includes('france') && !loc.includes('frankfurt') && !loc.includes('germany') && !loc.includes('zurich') && !loc.includes('switzerland')) { skipped++; continue; }
      if (!isRelevant(listing.title, listing.description)) { skipped++; continue; }
      if (!isValidStartYear(listing.start_date)) { skipped++; continue; }
      if (isExpired(listing.date_expires)) { skipped++; continue; }

      const fp = fingerprint(listing);
      const category = categorise(listing.title, listing.description);
      const salaryType = listing.salary_type !== 'not_stated' ? listing.salary_type
        : determineSalaryType(listing.salary, listing.title, listing.description);

      toInsert.push([
        uuidv4(), listing.title, listing.company, listing.company_logo || null,
        listing.location || 'Dublin, Ireland', listing.start_date || null,
        listing.duration || null, listing.salary || null, salaryType,
        listing.description || null,
        listing.description_short || shortDescription(listing.description),
        listing.url, listing.source, listing.source_type || 'job_board',
        category, JSON.stringify([category]),
        listing.date_posted || null, now, listing.date_expires || null, 1, fp,
      ]);
    }

    // Use transaction wrapper
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        try { insertStmt.run(...item); added++; } catch { skipped++; }
      }
    });
    insertMany(toInsert);

    db.prepare(`UPDATE scrape_log SET finished_at=?, count_added=?, count_skipped=?, status='success' WHERE id=?`)
      .run(new Date().toISOString(), added, skipped, logId);

    console.log(`[${scraper.name}] Done: +${added} added, ${skipped} skipped`);
  } catch (err) {
    console.error(`[${scraper.name}] Fatal error:`, err.message);
    db.prepare(`UPDATE scrape_log SET finished_at=?, status='error', error=? WHERE id=?`)
      .run(new Date().toISOString(), err.message, logId);
  }

  return { added, skipped };
}

async function runAll() {
  console.log('Starting full scrape run at', new Date().toISOString());
  let totalAdded = 0, totalSkipped = 0;

  for (const scraper of scrapers) {
    const { added, skipped } = await runScraper(scraper);
    totalAdded += added;
    totalSkipped += skipped;
  }

  console.log(`\nScrape complete. Total: +${totalAdded} added, ${totalSkipped} filtered`);
}

if (require.main === module) {
  const { initDb } = require('./db');
  const { migrate } = require('./migrate');
  initDb().then(() => migrate()).then(() => runAll()).catch(console.error);
}

module.exports = { runAll, runScraper };
