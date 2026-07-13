const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const SEARCHES = [
  { url: 'https://www.monster.co.uk/jobs/search?q=finance+internship&where=London&jt=internship', location: 'London, United Kingdom', source: 'monster.co.uk' },
  { url: 'https://www.monster.co.uk/jobs/search?q=banking+internship&where=London&jt=internship', location: 'London, United Kingdom', source: 'monster.co.uk' },
  { url: 'https://www.monster.co.uk/jobs/search?q=consulting+internship&where=London&jt=internship', location: 'London, United Kingdom', source: 'monster.co.uk' },
  { url: 'https://www.monster.co.uk/jobs/search?q=finance+internship&where=Dublin&jt=internship', location: 'Dublin, Ireland', source: 'monster.co.uk' },
  { url: 'https://www.monster.fr/emploi/recherche?q=finance+stage&where=Paris', location: 'Paris, France', source: 'monster.fr' },
  { url: 'https://www.monster.de/jobs/suche?q=Finance+Praktikum&where=Frankfurt', location: 'Frankfurt, Germany', source: 'monster.de' },
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
        const intern = jsonLdToInternship(job, 'Monster', 'job_board');
        intern.description_short = (intern.description || '').slice(0, 200);
        results.push(intern);
      }
      if (jobs.length === 0) {
        $('[class*="job-cardstyle"], section[class*="card"], [class*="job_result"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="name"]').first().text().trim();
          const loc = $el.find('[class*="location"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            results.push({ title, company: company || 'Unknown', company_logo: null, location: loc || location, start_date: null, duration: null, salary: null, salary_type: 'not_stated', description: '', description_short: '', url: href.startsWith('http') ? href : `https://www.monster.co.uk${href}`, source: 'Monster', source_type: 'job_board', date_posted: null, date_expires: null });
          }
        });
      }
      await randomDelay(3000, 7000);
    } catch (err) {
      console.error(`[Monster] Error: ${err.message}`);
    }
  }
  console.log(`[Monster] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'Monster' };
