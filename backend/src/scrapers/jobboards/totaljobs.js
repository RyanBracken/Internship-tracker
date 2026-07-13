const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  'https://www.totaljobs.com/jobs/finance-internship/in-london',
  'https://www.totaljobs.com/jobs/banking-internship/in-london',
  'https://www.totaljobs.com/jobs/accounting-internship/in-london',
  'https://www.totaljobs.com/jobs/consulting-internship/in-london',
  'https://www.totaljobs.com/jobs/investment-internship/in-london',
  'https://www.totaljobs.com/jobs/finance-internship/in-dublin',
  'https://www.totaljobs.com/jobs/audit-internship/in-london',
  'https://www.totaljobs.com/jobs/tax-internship/in-london',
];

async function scrape() {
  const results = [];
  for (const url of SEARCHES) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobs) {
        const intern = jsonLdToInternship(job, 'Totaljobs', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('article[class*="job"], [class*="job-card"], [data-testid="job-item"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.totaljobs.com${href}`, source: 'Totaljobs', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Totaljobs] Error: ${err.message}`);
    }
  }
  console.log(`[Totaljobs] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Totaljobs' };
