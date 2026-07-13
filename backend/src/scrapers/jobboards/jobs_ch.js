const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// jobs.ch and jobup.ch - dominant Swiss job boards
const SEARCHES = [
  { url: 'https://www.jobs.ch/en/vacancies/?term=finance+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobs.ch' },
  { url: 'https://www.jobs.ch/en/vacancies/?term=banking+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobs.ch' },
  { url: 'https://www.jobs.ch/en/vacancies/?term=consulting+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobs.ch' },
  { url: 'https://www.jobs.ch/en/vacancies/?term=investment+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobs.ch' },
  { url: 'https://www.jobs.ch/en/vacancies/?term=accounting+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobs.ch' },
  { url: 'https://www.jobup.ch/en/jobs/detail/recherche/?term=finance+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobup.ch' },
  { url: 'https://www.jobup.ch/en/jobs/detail/recherche/?term=banking+intern&location=Zurich', location: 'Zurich, Switzerland', source: 'jobup.ch' },
  { url: 'https://www.jobscout24.ch/en/jobs/finance/?city=Zurich', location: 'Zurich, Switzerland', source: 'jobscout24' },
];

async function scrape() {
  const results = [];
  for (const { url, location, source } of SEARCHES) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobs) {
        const intern = jsonLdToInternship(job, source, 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], article, [class*="vacancy"], [class*="listing"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const loc = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            const base = url.split('/').slice(0, 3).join('/');
            results.push({ title, company: company || 'Unknown', company_logo: null, location: loc || location, start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `${base}${href}`, source, source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[${source}] Error: ${err.message}`);
    }
  }
  console.log(`[Swiss job boards] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Swiss Job Boards' };
