const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// CV-Library - major UK job board
const SEARCHES = [
  'https://www.cv-library.co.uk/search-jobs?q=finance+internship&geo=London&distance=10&type=internship',
  'https://www.cv-library.co.uk/search-jobs?q=banking+internship&geo=London&distance=10',
  'https://www.cv-library.co.uk/search-jobs?q=accounting+internship&geo=London&distance=10',
  'https://www.cv-library.co.uk/search-jobs?q=investment+internship&geo=London&distance=10',
  'https://www.cv-library.co.uk/search-jobs?q=finance+internship&geo=Dublin&distance=20',
  'https://www.cv-library.co.uk/search-jobs?q=consulting+internship&geo=London&distance=10',
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
        const intern = jsonLdToInternship(job, 'CV-Library', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], article, [class*="listing"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.cv-library.co.uk${href}`, source: 'CV-Library', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[CV-Library] Error: ${err.message}`);
    }
  }
  console.log(`[CV-Library] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'CV-Library' };
