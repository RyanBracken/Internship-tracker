const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// StepStone - dominant job board in Germany, Belgium, Netherlands
const SEARCHES = [
  { url: 'https://www.stepstone.de/jobs/Finance-Praktikant/in-Frankfurt.html', location: 'Frankfurt, Germany' },
  { url: 'https://www.stepstone.de/jobs/Banking-Praktikant/in-Frankfurt.html', location: 'Frankfurt, Germany' },
  { url: 'https://www.stepstone.de/jobs/Consulting-Praktikant/in-Frankfurt.html', location: 'Frankfurt, Germany' },
  { url: 'https://www.stepstone.de/jobs/Investment-Praktikant/in-Frankfurt.html', location: 'Frankfurt, Germany' },
  { url: 'https://www.stepstone.de/jobs/Audit-Praktikant/in-Frankfurt.html', location: 'Frankfurt, Germany' },
  { url: 'https://www.stepstone.de/jobs/Finance-Praktikant/in-München.html', location: 'Munich, Germany' },
  { url: 'https://www.stepstone.de/jobs/Finance-Praktikant/in-Berlin.html', location: 'Berlin, Germany' },
];

async function scrape() {
  const results = [];
  for (const { url, location } of SEARCHES) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobs) {
        const intern = jsonLdToInternship(job, 'StepStone', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job"], article[class*="listing"], [data-testid*="job"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const loc = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: loc || location, start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.stepstone.de${href}`, source: 'StepStone', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[StepStone] Error: ${err.message}`);
    }
  }
  console.log(`[StepStone] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'StepStone' };
