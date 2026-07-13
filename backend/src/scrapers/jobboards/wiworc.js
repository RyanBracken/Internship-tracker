const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Welcome to the Jungle - major European job board (strong in France/Europe)
const SEARCHES = [
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=GB&query=finance+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&query=finance+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=IE&query=finance+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=DE&query=finance+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=CH&query=finance+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=GB&query=banking+intern',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&query=banque+stage',
  'https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&query=private+equity+stage',
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
        const intern = jsonLdToInternship(job, 'Welcome to the Jungle', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], article, [data-testid*="job"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || '', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.welcometothejungle.com${href}`, source: 'Welcome to the Jungle', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Welcome to the Jungle] Error: ${err.message}`);
    }
  }
  console.log(`[Welcome to the Jungle] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Welcome to the Jungle' };
