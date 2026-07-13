const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Efinancialcareers - premier finance job board covering all major cities
const SEARCHES = [
  'https://www.efinancialcareers.com/search?q=finance+intern&location=London&type=Internship',
  'https://www.efinancialcareers.com/search?q=investment+banking+intern&location=London&type=Internship',
  'https://www.efinancialcareers.com/search?q=finance+intern&location=Dublin&type=Internship',
  'https://www.efinancialcareers.com/search?q=finance+intern&location=Paris&type=Internship',
  'https://www.efinancialcareers.com/search?q=finance+intern&location=Frankfurt&type=Internship',
  'https://www.efinancialcareers.com/search?q=finance+intern&location=Zurich&type=Internship',
  'https://www.efinancialcareers.com/search?q=private+equity+intern&location=London&type=Internship',
  'https://www.efinancialcareers.com/search?q=asset+management+intern&location=London&type=Internship',
  'https://www.efinancialcareers.com/search?q=risk+intern&location=London&type=Internship',
  'https://www.efinancialcareers.com/search?q=audit+intern&location=London&type=Internship',
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
        const intern = jsonLdToInternship(job, 'eFinancialCareers', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job-card"], [class*="jobCard"], article[class*="job"], [data-testid*="job"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="employer"]').first().text().trim();
          const location = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: location || 'London, United Kingdom', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.efinancialcareers.com${href}`, source: 'eFinancialCareers', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[eFinancialCareers] Error: ${err.message}`);
    }
  }
  console.log(`[eFinancialCareers] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'eFinancialCareers' };
