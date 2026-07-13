require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');
const { fingerprint } = require('./utils/dedup');
const { categorise, isRelevant } = require('./utils/categorise');
const { isValidStartYear, isExpired } = require('./utils/dateFilter');

// Job board scrapers
const scrapers = [
  require('./scrapers/jobboards/irishjobs'),
  require('./scrapers/jobboards/gradireland'),
  require('./scrapers/jobboards/recruitireland'),
  require('./scrapers/jobboards/etrecruite'),
  require('./scrapers/jobboards/indeed'),
  require('./scrapers/jobboards/linkedin'),
  require('./scrapers/jobboards/glassdoor'),
  // Company direct scrapers
  require('./scrapers/companies/bigfour'),
  require('./scrapers/companies/banks'),
  require('./scrapers/companies/consulting'),
];

function shortDescription(desc) {
  if (!desc) return '';
  const clean = desc.replace(/\s+/g, ' ').trim();
  return clean.length > 300 ? clean.slice(0, 297) + '...' : clean;
}

function determineSalaryType(salary, title, description) {
  if (!salary) {
    const text = `${title} ${description || ''}`.toLowerCase();
    if (text.includes('unpaid') || text.includes('no salary') || text.includes('voluntary')) return 'unpaid';
    return 'not_stated';
  }
  const lower = salary.toLowerCase();
  if (lower.includes('unpaid') || lower === '0' || lower === '€0') return 'unpaid';
  return 'paid';
}

async function runScraper(scraper) {
  const db = getDb();
  const logId = db.prepare(`
    INSERT INTO scrape_log (source, started_at, status) VALUES (?, ?, 'running')
  `).run(scraper.name, new Date().toISOString()).lastInsertRowid;

  let added = 0, skipped = 0;

  try {
    const listings = await scraper.scrape();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO internships
        (id, title, company, company_logo, location, start_date, duration, salary, salary_type,
         description, description_short, url, source, source_type, category, tags,
         date_posted, date_scraped, date_expires, is_active, fingerprint)
      VALUES
        (@id, @title, @company, @company_logo, @location, @start_date, @duration, @salary, @salary_type,
         @description, @description_short, @url, @source, @source_type, @category, @tags,
         @date_posted, @date_scraped, @date_expires, @is_active, @fingerprint)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
    });

    const toInsert = [];

    for (const listing of listings) {
      // Filter: must be Dublin area
      const loc = (listing.location || '').toLowerCase();
      if (!loc.includes('dublin') && !loc.includes('ireland') && loc !== '') {
        skipped++;
        continue;
      }

      // Filter: relevance to finance/business
      if (!isRelevant(listing.title, listing.description)) {
        skipped++;
        continue;
      }

      // Filter: start date
      if (!isValidStartYear(listing.start_date)) {
        skipped++;
        continue;
      }

      // Filter: not expired
      if (isExpired(listing.date_expires)) {
        skipped++;
        continue;
      }

      const fp = fingerprint(listing);
      const category = categorise(listing.title, listing.description);
      const salaryType = listing.salary_type !== 'not_stated' ? listing.salary_type
        : determineSalaryType(listing.salary, listing.title, listing.description);

      toInsert.push({
        id: uuidv4(),
        title: listing.title,
        company: listing.company,
        company_logo: listing.company_logo || null,
        location: listing.location || 'Dublin, Ireland',
        start_date: listing.start_date || null,
        duration: listing.duration || null,
        salary: listing.salary || null,
        salary_type: salaryType,
        description: listing.description || null,
        description_short: listing.description_short || shortDescription(listing.description),
        url: listing.url,
        source: listing.source,
        source_type: listing.source_type || 'job_board',
        category,
        tags: JSON.stringify([category]),
        date_posted: listing.date_posted || null,
        date_scraped: now,
        date_expires: listing.date_expires || null,
        is_active: 1,
        fingerprint: fp,
      });
    }

    insertMany(toInsert);
    added = toInsert.length;
    skipped += listings.length - toInsert.length;

    db.prepare(`
      UPDATE scrape_log SET finished_at=?, count_added=?, count_skipped=?, status='success'
      WHERE id=?
    `).run(new Date().toISOString(), added, skipped, logId);

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

  // Mark expired listings inactive
  const db = getDb();
  const expired = db.prepare(`
    UPDATE internships SET is_active=0
    WHERE date_expires IS NOT NULL AND date_expires < ? AND is_active=1
  `).run(new Date().toISOString());

  console.log(`\nScrape complete. Total: +${totalAdded} added, ${totalSkipped} filtered, ${expired.changes} expired`);
}

if (require.main === module) {
  // Initialise DB first
  require('./migrate');
  runAll().catch(console.error);
}

module.exports = { runAll, runScraper };
