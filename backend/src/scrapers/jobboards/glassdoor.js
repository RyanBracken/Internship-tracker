const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  'finance intern dublin',
  'accounting intern dublin',
  'business intern dublin',
  'audit intern dublin',
  'consulting intern dublin',
];

async function scrape() {
  const results = [];

  for (const q of SEARCHES) {
    try {
      const url = `https://www.glassdoor.ie/Job/ireland-${encodeURIComponent(q.replace(/\s+/g, '-'))}-jobs-SRCH_IL.0,7_IN155_KO8,${8 + q.length}.htm`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobs) {
        const intern = jsonLdToInternship(job, 'Glassdoor', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }

      if (jobs.length === 0) {
        $('li[class*="JobsList"], article[class*="JobCard"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('[class*="job-title"], [class*="JobTitle"]').first().text().trim();
          const company = $el.find('[class*="employer-name"], [class*="EmployerName"]').first().text().trim();
          const location = $el.find('[class*="location"], [class*="Location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          const salary = $el.find('[class*="salary"], [class*="Salary"]').first().text().trim();

          if (title && href) {
            results.push({
              title,
              company: company || 'Unknown',
              company_logo: null,
              location: location || 'Dublin, Ireland',
              start_date: null,
              duration: null,
              salary: salary || null,
              salary_type: salary ? 'paid' : 'not_stated',
              description: '',
              description_short: '',
              url: href.startsWith('http') ? href : `https://www.glassdoor.ie${href}`,
              source: 'Glassdoor',
              source_type: 'job_board',
              date_posted: null,
              date_expires: null,
            });
          }
        });
      }

      await randomDelay(4000, 9000);
    } catch (err) {
      console.error(`[Glassdoor] Error for "${q}":`, err.message);
    }
  }

  console.log(`[Glassdoor] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Glassdoor' };
