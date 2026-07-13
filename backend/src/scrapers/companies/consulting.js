const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const FIRMS = [
  {
    name: 'Accenture Ireland',
    logo: 'https://logo.clearbit.com/accenture.com',
    urls: [
      'https://www.accenture.com/ie-en/careers/local/internship-programmes',
      'https://www.accenture.com/ie-en/careers/jobsearch?jk=intern&jl=Dublin',
    ],
  },
  {
    name: 'Capgemini Ireland',
    logo: 'https://logo.clearbit.com/capgemini.com',
    urls: [
      'https://www.capgemini.com/ie-en/careers/job-search/?job_type=Intern&location=Dublin',
    ],
  },
  {
    name: 'Mastercard',
    logo: 'https://logo.clearbit.com/mastercard.com',
    urls: [
      'https://careers.mastercard.com/us/en/search-results?keywords=intern&location=Dublin',
    ],
  },
  {
    name: 'Stripe',
    logo: 'https://logo.clearbit.com/stripe.com',
    urls: [
      'https://stripe.com/jobs/search?l=Dublin&r=intern',
    ],
  },
  {
    name: 'Matheson',
    logo: 'https://logo.clearbit.com/matheson.com',
    urls: [
      'https://www.matheson.com/careers/current-opportunities/',
      'https://www.matheson.com/careers/graduate-programme/',
    ],
  },
  {
    name: 'A&L Goodbody',
    logo: 'https://logo.clearbit.com/algoodbody.com',
    urls: [
      'https://www.algoodbody.com/careers/graduates/',
      'https://www.algoodbody.com/careers/current-opportunities/',
    ],
  },
  {
    name: 'ICON plc',
    logo: 'https://logo.clearbit.com/iconplc.com',
    urls: [
      'https://www.iconplc.com/careers/students/',
      'https://careers.iconplc.com/jobs?types=internship&location=Dublin',
    ],
  },
  {
    name: 'CRH',
    logo: 'https://logo.clearbit.com/crh.com',
    urls: [
      'https://www.crh.com/careers/early-careers/',
      'https://careers.crh.com/jobs?q=intern&location=Dublin',
    ],
  },
  {
    name: 'Ryanair',
    logo: 'https://logo.clearbit.com/ryanair.com',
    urls: [
      'https://careers.ryanair.com/search/?q=intern&location=Dublin',
    ],
  },
];

async function scrapeFirm(firm) {
  const results = [];

  for (const url of firm.urls) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      if (jobs.length > 0) {
        for (const job of jobs) {
          const intern = jsonLdToInternship(job, firm.name, 'direct');
          intern.company_logo = firm.logo;
          intern.description_short = (intern.description || '').slice(0, 200);
          results.push(intern);
        }
        break;
      }

      const selectors = [
        'li[class*="job"]', 'div[class*="job-card"]', 'article',
        '[class*="vacancy"]', '[class*="opportunity"]', '[class*="position"]',
      ];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
          const href = $el.find('a').first().attr('href');

          if (title && href) {
            const description = $el.find('p').first().text().trim();
            const location = $el.find('[class*="location"]').first().text().trim();
            results.push({
              title,
              company: firm.name,
              company_logo: firm.logo,
              location: location || 'Dublin, Ireland',
              start_date: null,
              duration: null,
              salary: null,
              salary_type: 'not_stated',
              description,
              description_short: description.slice(0, 200),
              url: href.startsWith('http') ? href : new URL(href, url).href,
              source: firm.name,
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
      console.error(`[${firm.name}] Error:`, err.message);
    }
  }

  return results;
}

async function scrape() {
  const all = [];
  for (const firm of FIRMS) {
    const results = await scrapeFirm(firm);
    console.log(`[${firm.name}] Found ${results.length} listings`);
    all.push(...results);
    await randomDelay(2000, 5000);
  }
  return all;
}

module.exports = { scrape, name: 'Consulting' };
