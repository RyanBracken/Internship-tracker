const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// APEC - French executive job board; HelloWork - major French job board
const SEARCHES = [
  { url: 'https://cadres.apec.fr/offres-emploi-cadres/stage/finance-economie.html?motsCles=stage+finance&lieu=75', location: 'Paris, France', source: 'APEC' },
  { url: 'https://cadres.apec.fr/offres-emploi-cadres/stage/banque-assurance-finance.html?lieu=75', location: 'Paris, France', source: 'APEC' },
  { url: 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=stage+finance&l=Paris+%2875%29', location: 'Paris, France', source: 'HelloWork' },
  { url: 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=stage+banque&l=Paris+%2875%29', location: 'Paris, France', source: 'HelloWork' },
  { url: 'https://www.hellowork.com/fr-fr/emploi/recherche.html?k=stage+consulting&l=Paris+%2875%29', location: 'Paris, France', source: 'HelloWork' },
  { url: 'https://www.cadremploi.fr/emploi/liste_offres.html?s=stage&k=finance&l=Paris&distance=10', location: 'Paris, France', source: 'Cadremploi' },
  { url: 'https://www.cadremploi.fr/emploi/liste_offres.html?s=stage&k=banque&l=Paris&distance=10', location: 'Paris, France', source: 'Cadremploi' },
  { url: 'https://www.cadremploi.fr/emploi/liste_offres.html?s=stage&k=consulting&l=Paris&distance=10', location: 'Paris, France', source: 'Cadremploi' },
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
        $('[class*="job"], article, [class*="offre"], [class*="annonce"]').each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"], [class*="titre"]').first().text().trim();
          const company = $el.find('[class*="company"], [class*="entreprise"]').first().text().trim();
          const loc = $el.find('[class*="location"], [class*="lieu"]').first().text().trim();
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
  console.log(`[French job boards] Found ${results.length} listings`);
  return results;
}

module.exports = { scrape, name: 'French Job Boards' };
