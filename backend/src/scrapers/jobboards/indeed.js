const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  { q: 'finance intern', l: 'Dublin, Dublin' },
  { q: 'accounting intern', l: 'Dublin, Dublin' },
  { q: 'audit intern', l: 'Dublin, Dublin' },
  { q: 'business analyst intern', l: 'Dublin, Dublin' },
  { q: 'banking intern', l: 'Dublin, Dublin' },
  { q: 'tax intern', l: 'Dublin, Dublin' },
  { q: 'consulting intern', l: 'Dublin, Dublin' },
  { q: 'investment intern', l: 'Dublin, Dublin' },
  { q: 'graduate programme finance', l: 'Dublin, Dublin' },
];

async function scrape() {
  const results = [];

  for (const { q, l } of SEARCHES) {
    try {
      const url = `https://ie.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&jt=internship&radius=15`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      // JSON-LD
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      for (const job of jobs) {
        const intern = jsonLdToInternship(job, 'Indeed', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }

      // Fallback HTML
      if (jobs.length === 0) {
        $('div.jobsearch-SerpJobCard, div[class*="job_seen_beacon"], td.resultContent').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2.jobTitle span, a.jobtitle, span[title]').first().text().trim();
          const company = $el.find('span.companyName, .company').first().text().trim();
          const location = $el.find('div.companyLocation, .location').first().text().trim();
          const href = $el.find('a.jobtitle, h2.jobTitle a, a[data-jk]').first().attr('href');
          const salary = $el.find('div.salary-snippet, .metadata.salary').first().text().trim();
          const description = $el.find('.job-snippet').first().text().trim();
          const datePosted = $el.find('.date').first().text().trim();

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
              url: href.startsWith('http') ? href : `https://ie.indeed.com${href}`,
              source: 'Indeed',
              source_type: 'job_board',
              date_posted: datePosted || null,
              date_expires: null,
            });
          }
        });
      }

      await randomDelay(3000, 8000);
    } catch (err) {
      console.error(`[Indeed] Error for "${q}":`, err.message);
    }
  }

  console.log(`[Indeed] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Indeed' };
