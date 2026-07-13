const cheerio = require('cheerio');
const { fetchHtml, randomDelay } = require('../../utils/scrapeHelpers');

const BASE = 'https://www.etrecruite.ie';

async function scrape() {
  const results = [];
  const searchTerms = ['finance', 'accounting', 'business', 'audit', 'consulting'];

  for (const term of searchTerms) {
    try {
      const url = `${BASE}/jobs/?q=${encodeURIComponent(term)}&location=Dublin&type=internship`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      $('[class*="job"], article, li').filter((_, el) => {
        return $(el).find('a[href*="/job"]').length > 0;
      }).each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
        const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
        const href = $el.find('a').first().attr('href');
        const description = $el.find('p').first().text().trim();
        const location = $el.find('[class*="location"]').first().text().trim();

        if (title && href && (title.toLowerCase().includes('intern') || title.toLowerCase().includes('graduate'))) {
          results.push({
            title,
            company: company || 'Unknown',
            company_logo: null,
            location: location || 'Dublin, Ireland',
            start_date: null,
            duration: null,
            salary: null,
            salary_type: 'not_stated',
            description,
            description_short: description.slice(0, 200),
            url: href.startsWith('http') ? href : `${BASE}${href}`,
            source: 'ETRecruite',
            source_type: 'job_board',
            date_posted: null,
            date_expires: null,
          });
        }
      });

      await randomDelay(2000, 5000);
    } catch (err) {
      console.error('[ETRecruite] Error:', err.message);
    }
  }

  console.log(`[ETRecruite] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'ETRecruite' };
