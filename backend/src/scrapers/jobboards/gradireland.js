const cheerio = require('cheerio');
const { fetchHtml, randomDelay } = require('../../utils/scrapeHelpers');

const BASE = 'https://gradireland.com';

async function scrape() {
  const results = [];

  const urls = [
    `${BASE}/jobs?opportunity_type=internship&category=accounting-finance&location=dublin`,
    `${BASE}/jobs?opportunity_type=internship&category=banking-financial-services&location=dublin`,
    `${BASE}/jobs?opportunity_type=internship&category=business-commerce&location=dublin`,
    `${BASE}/jobs?opportunity_type=internship&category=consulting-strategy&location=dublin`,
    `${BASE}/jobs?opportunity_type=internship&category=economics&location=dublin`,
  ];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      $('article.job-listing, .job-card, li[class*="job"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, .job-title, [class*="title"]').first().text().trim();
        const company = $el.find('.company, .employer, [class*="company"]').first().text().trim();
        const location = $el.find('.location, [class*="location"]').first().text().trim();
        const href = $el.find('a').first().attr('href');
        const datePosted = $el.find('time, .date, [class*="date"]').first().attr('datetime') || null;
        const description = $el.find('p, .summary, [class*="desc"]').first().text().trim();

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
            description,
            description_short: description.slice(0, 200),
            url: href.startsWith('http') ? href : `${BASE}${href}`,
            source: 'GradIreland',
            source_type: 'job_board',
            date_posted: datePosted,
            date_expires: null,
          });
        }
      });

      await randomDelay(2000, 5000);
    } catch (err) {
      console.error('[GradIreland] Error:', err.message);
    }
  }

  console.log(`[GradIreland] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'GradIreland' };
