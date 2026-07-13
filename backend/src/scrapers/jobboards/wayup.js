const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Bright Network - UK graduate network job board
const SEARCHES = [
  'https://www.brightnetwork.co.uk/search/?q=finance+internship&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=banking+internship&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=consulting+internship&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=investment+internship&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=accounting+internship&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=finance+internship&location=Dublin&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=private+equity&location=London&job_type=internship',
  'https://www.brightnetwork.co.uk/search/?q=audit+internship&location=London&job_type=internship',
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
        const intern = jsonLdToInternship(job, 'Bright Network', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], [class*="opportunity"], article, [class*="vacancy"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.brightnetwork.co.uk${href}`, source: 'Bright Network', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Bright Network] Error: ${err.message}`);
    }
  }
  console.log(`[Bright Network] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Bright Network' };
