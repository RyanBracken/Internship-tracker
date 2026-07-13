const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  'https://www.milkround.com/jobs/finance-internships/?location=London',
  'https://www.milkround.com/jobs/banking-internships/?location=London',
  'https://www.milkround.com/jobs/accounting-internships/?location=London',
  'https://www.milkround.com/jobs/consulting-internships/?location=London',
  'https://www.milkround.com/jobs/investment-internships/?location=London',
  'https://www.milkround.com/jobs/finance-internships/?location=Dublin',
  'https://www.milkround.com/jobs/audit-internships/?location=London',
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
        const intern = jsonLdToInternship(job, 'Milkround', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], article, [class*="vacancy"], [class*="listing"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.milkround.com${href}`, source: 'Milkround', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Milkround] Error: ${err.message}`);
    }
  }
  console.log(`[Milkround] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Milkround' };
