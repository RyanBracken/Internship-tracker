const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Targetjobs - major UK graduate job board
const SEARCHES = [
  'https://targetjobs.co.uk/jobs/search?keywords=finance+intern&location=London',
  'https://targetjobs.co.uk/jobs/search?keywords=banking+internship&location=London',
  'https://targetjobs.co.uk/jobs/search?keywords=accounting+internship&location=London',
  'https://targetjobs.co.uk/jobs/search?keywords=consulting+internship&location=London',
  'https://targetjobs.co.uk/jobs/search?keywords=investment+internship&location=London',
  'https://targetjobs.co.uk/jobs/search?keywords=finance+intern&location=Dublin',
  'https://targetjobs.co.uk/jobs/search?keywords=audit+internship&location=London',
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
        const intern = jsonLdToInternship(job, 'Targetjobs', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job-card"], article, [class*="vacancy"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://targetjobs.co.uk${href}`, source: 'Targetjobs', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Targetjobs] Error: ${err.message}`);
    }
  }
  console.log(`[Targetjobs] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Targetjobs' };
