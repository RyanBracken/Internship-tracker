const cheerio = require('cheerio');
const { fetchHtml, randomDelay } = require('../../utils/scrapeHelpers');

const BASE = 'https://www.irishjobs.ie';
const SEARCH_TERMS = ['finance internship', 'accounting internship', 'business internship', 'banking internship', 'audit internship', 'tax internship', 'consulting internship', 'investment internship'];

async function scrape() {
  const results = [];

  for (const term of SEARCH_TERMS) {
    try {
      const url = `${BASE}/Jobs/${encodeURIComponent(term.replace(/\s+/g,'-'))}/in-Dublin?radius=20&jobType=internship`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      $('li.job').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2.job-title a, .job-title').text().trim();
        const company = $el.find('.company-name, .recruiter').text().trim();
        const location = $el.find('.location').text().trim();
        const href = $el.find('h2.job-title a, .job-title a').attr('href');
        const datePosted = $el.find('.date-posted, time').attr('datetime') || $el.find('.date-posted').text().trim();
        const salary = $el.find('.salary').text().trim();
        const description = $el.find('.summary, .job-description').text().trim();

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
            description,
            description_short: description.slice(0, 200),
            url: href.startsWith('http') ? href : `${BASE}${href}`,
            source: 'IrishJobs',
            source_type: 'job_board',
            date_posted: datePosted || null,
            date_expires: null,
          });
        }
      });

      await randomDelay(2000, 5000);
    } catch (err) {
      console.error(`[IrishJobs] Error for "${term}":`, err.message);
    }
  }

  console.log(`[IrishJobs] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'IrishJobs' };
