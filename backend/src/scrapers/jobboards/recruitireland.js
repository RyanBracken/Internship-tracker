const cheerio = require('cheerio');
const { fetchHtml, randomDelay } = require('../../utils/scrapeHelpers');

const BASE = 'https://www.recruitireland.com';

async function scrape() {
  const results = [];
  const searchTerms = ['finance intern', 'accounting intern', 'business intern', 'banking intern', 'audit intern', 'consulting intern'];

  for (const term of searchTerms) {
    try {
      const url = `${BASE}/jobs?q=${encodeURIComponent(term)}&l=Dublin&employment_type=internship`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      $('[class*="job-item"], [class*="JobResult"], article.result').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
        const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
        const location = $el.find('[class*="location"]').first().text().trim();
        const href = $el.find('a').first().attr('href');
        const datePosted = $el.find('time, [class*="date"]').first().attr('datetime') || null;
        const salary = $el.find('[class*="salary"]').first().text().trim();
        const description = $el.find('p, [class*="desc"], [class*="summary"]').first().text().trim();

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
            source: 'RecruitIreland',
            source_type: 'job_board',
            date_posted: datePosted,
            date_expires: null,
          });
        }
      });

      await randomDelay(2000, 5000);
    } catch (err) {
      console.error('[RecruitIreland] Error:', err.message);
    }
  }

  console.log(`[RecruitIreland] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'RecruitIreland' };
