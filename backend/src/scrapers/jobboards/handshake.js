const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Handshake - major student/internship platform used by top universities
const SEARCHES = [
  'https://app.joinhandshake.co.uk/postings?page=1&per_page=25&sort_direction=desc&sort_column=default&job_type_names[]=Internship&category_names[]=Finance&location=London',
  'https://app.joinhandshake.co.uk/postings?page=1&per_page=25&sort_direction=desc&sort_column=default&job_type_names[]=Internship&category_names[]=Consulting&location=London',
  'https://app.joinhandshake.co.uk/postings?page=1&per_page=25&sort_direction=desc&sort_column=default&job_type_names[]=Internship&category_names[]=Banking&location=London',
  'https://app.joinhandshake.co.uk/postings?page=1&per_page=25&sort_direction=desc&sort_column=default&job_type_names[]=Internship&category_names[]=Finance&location=Dublin',
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
        const intern = jsonLdToInternship(job, 'Handshake', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="posting"], [class*="job"], article').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || '', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://app.joinhandshake.co.uk${href}`, source: 'Handshake', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Handshake] Error: ${err.message}`);
    }
  }
  console.log(`[Handshake] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Handshake' };
