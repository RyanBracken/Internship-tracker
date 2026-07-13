const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// LinkedIn public job search (no auth required for public listings)
const SEARCHES = [
  'finance+intern+dublin+ireland',
  'accounting+intern+dublin+ireland',
  'business+analyst+intern+dublin',
  'audit+intern+dublin+ireland',
  'banking+intern+dublin+ireland',
  'consulting+intern+dublin+ireland',
  'tax+intern+dublin+ireland',
  'investment+intern+dublin+ireland',
];

async function scrape() {
  const results = [];

  for (const q of SEARCHES) {
    try {
      // LinkedIn public job search endpoint
      const url = `https://www.linkedin.com/jobs/search/?keywords=${q}&location=Dublin%2C+Ireland&f_JT=I&f_TPR=r604800`;
      const html = await fetchHtml(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Cache-Control': 'no-cache',
        }
      });

      const $ = cheerio.load(html);

      // Try JSON-LD first
      const jsonLds = extractJsonLd(html);
      const jobPostings = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobPostings) {
        const intern = jsonLdToInternship(job, 'LinkedIn', 'job_board');
        if (intern.title) {
          intern.description_short = (intern.description || '').slice(0, 200);
          results.push(intern);
        }
      }

      // Fallback: HTML scraping
      if (jobPostings.length === 0) {
        $('div.base-card, li.jobs-search__results-list > div').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h3.base-search-card__title, .job-result-card__title').text().trim();
          const company = $el.find('h4.base-search-card__subtitle, .job-result-card__company-name').text().trim();
          const location = $el.find('span.job-search-card__location').text().trim();
          const href = $el.find('a.base-card__full-link, a[data-tracking-control-name="public_jobs_jserp-result_search-card"]').attr('href');
          const datePosted = $el.find('time').attr('datetime');

          if (title && href) {
            results.push({
              title,
              company: company || 'Unknown',
              company_logo: null,
              location: location || 'Dublin, Ireland',
              start_date: null,
              duration: null,
              salary: null,
              salary_type: 'not_stated',
              description: '',
              description_short: '',
              url: href.split('?')[0],
              source: 'LinkedIn',
              source_type: 'job_board',
              date_posted: datePosted || null,
              date_expires: null,
            });
          }
        });
      }

      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[LinkedIn] Error for "${q}":`, err.message);
    }
  }

  console.log(`[LinkedIn] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'LinkedIn' };
