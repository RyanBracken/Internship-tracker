const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  'https://www.reed.co.uk/jobs/finance-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/banking-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/accounting-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/investment-banking-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/consulting-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/audit-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/tax-internship-jobs-in-london',
  'https://www.reed.co.uk/jobs/finance-graduate-jobs-in-london',
  'https://www.reed.co.uk/jobs/finance-internship-jobs-in-ireland',
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
        const intern = jsonLdToInternship(job, 'Reed', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('article[class*="job"], [class*="job-result"], [data-qa="job-card"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const salary = $el.find('[class*="salary"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: salary || null, salary_type: salary ? 'paid' : 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.reed.co.uk${href}`, source: 'Reed', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Reed] Error: ${err.message}`);
    }
  }
  console.log(`[Reed] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Reed' };
