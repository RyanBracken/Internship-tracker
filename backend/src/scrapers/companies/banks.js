const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const BANKS = [
  {
    name: 'Bank of Ireland',
    logo: 'https://logo.clearbit.com/bankofireland.com',
    urls: [
      'https://careers.bankofireland.com/jobs/?type=internship&location=Dublin',
      'https://careers.bankofireland.com/early-careers/',
    ],
  },
  {
    name: 'AIB',
    logo: 'https://logo.clearbit.com/aib.ie',
    urls: [
      'https://aib.ie/careers/students-graduates',
      'https://careers.aib.ie/search/?q=intern&location=Dublin',
    ],
  },
  {
    name: 'Davy',
    logo: 'https://logo.clearbit.com/davy.ie',
    urls: [
      'https://www.davy.ie/careers/graduates-and-interns/',
      'https://www.davy.ie/careers/job-search/?q=intern',
    ],
  },
  {
    name: 'Goodbody',
    logo: 'https://logo.clearbit.com/goodbody.ie',
    urls: [
      'https://www.goodbody.ie/careers/graduates/',
      'https://goodbody.ie/careers/vacancies/',
    ],
  },
  {
    name: 'Cantor Fitzgerald',
    logo: 'https://logo.clearbit.com/cantorfitzgerald.com',
    urls: [
      'https://www.cantorfitzgerald.ie/about-us/careers/',
    ],
  },
  {
    name: 'Fidelity International',
    logo: 'https://logo.clearbit.com/fidelityinternational.com',
    urls: [
      'https://jobs.fidelityinternational.com/search/?q=intern&location=Dublin',
    ],
  },
  {
    name: 'State Street',
    logo: 'https://logo.clearbit.com/statestreet.com',
    urls: [
      'https://careers.statestreet.com/jobs/search?jobLevel=Intern&location=Dublin',
    ],
  },
  {
    name: 'Northern Trust',
    logo: 'https://logo.clearbit.com/northerntrust.com',
    urls: [
      'https://careers.northerntrust.com/search/?q=intern&location=Dublin',
    ],
  },
  {
    name: 'Citi Ireland',
    logo: 'https://logo.clearbit.com/citi.com',
    urls: [
      'https://jobs.citi.com/search-jobs/Intern/Dublin/287/1/2/6693538/53x3331/-6x24933/15/2',
    ],
  },
  {
    name: 'JP Morgan Ireland',
    logo: 'https://logo.clearbit.com/jpmorgan.com',
    urls: [
      'https://careers.jpmorgan.com/us/en/students/programs?search=internship&location=Dublin',
    ],
  },
  {
    name: 'Goldman Sachs',
    logo: 'https://logo.clearbit.com/goldmansachs.com',
    urls: [
      'https://higher.gs.com/roles?program=summer-internship&location=dublin',
    ],
  },
];

async function scrapeBank(bank) {
  const results = [];

  for (const url of bank.urls) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      // JSON-LD first
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      if (jobs.length > 0) {
        for (const job of jobs) {
          const intern = jsonLdToInternship(job, bank.name, 'direct');
          intern.company_logo = bank.logo;
          intern.description_short = (intern.description || '').slice(0, 200);
          results.push(intern);
        }
        break;
      }

      // HTML fallback - generic approach
      const selectors = [
        'li[class*="job"]', 'div[class*="job-card"]', 'article[class*="job"]',
        '[class*="vacancy"]', '[class*="opportunity"]', 'tr[class*="job"]',
        '[class*="position"]', 'li[class*="opening"]',
      ];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const $el = $(el);
          const titleEl = $el.find('h2, h3, a[class*="title"], [class*="job-title"], [class*="position-title"]').first();
          const title = titleEl.text().trim();
          const href = $el.find('a').first().attr('href') || titleEl.closest('a').attr('href');

          if (title && href) {
            const description = $el.find('p, [class*="desc"], [class*="summary"]').first().text().trim();
            const location = $el.find('[class*="location"]').first().text().trim();
            const salary = $el.find('[class*="salary"], [class*="compensation"]').first().text().trim();

            results.push({
              title,
              company: bank.name,
              company_logo: bank.logo,
              location: location || 'Dublin, Ireland',
              start_date: null,
              duration: null,
              salary: salary || null,
              salary_type: salary ? 'paid' : 'not_stated',
              description,
              description_short: description.slice(0, 200),
              url: href.startsWith('http') ? href : new URL(href, url).href,
              source: bank.name,
              source_type: 'direct',
              date_posted: null,
              date_expires: null,
            });
          }
        });
        if (results.length > 0) break;
      }

      await randomDelay(2000, 5000);
    } catch (err) {
      console.error(`[${bank.name}] Error:`, err.message);
    }
  }

  return results;
}

async function scrape() {
  const all = [];
  for (const bank of BANKS) {
    const results = await scrapeBank(bank);
    console.log(`[${bank.name}] Found ${results.length} listings`);
    all.push(...results);
    await randomDelay(3000, 7000);
  }
  return all;
}

module.exports = { scrape, name: 'Banks' };
