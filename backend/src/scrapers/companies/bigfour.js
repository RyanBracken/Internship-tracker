const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const COMPANIES = [
  {
    name: 'Deloitte',
    logo: 'https://logo.clearbit.com/deloitte.com',
    url: 'https://www2.deloitte.com/ie/en/pages/careers/articles/ireland-student-internships.html',
    searchUrl: 'https://apply.deloitte.com/careers/SearchJobs/?3_59_3=2038&3_59_3=2038&JobCategoryMultiSelectField=Finance&prefilters=none&CloudSearchLocation=country%3AIreland&CloudSearchValue=Dublin',
    selectors: {
      items: 'li.opportunity, [class*="job-listing"], article',
      title: 'h3, h2, [class*="title"]',
      link: 'a',
    }
  },
  {
    name: 'PwC Ireland',
    logo: 'https://logo.clearbit.com/pwc.com',
    url: 'https://www.pwc.ie/careers/students.html',
    searchUrl: 'https://www.pwc.ie/careers/search-jobs.html?query=intern&location=Dublin',
    selectors: {
      items: '[class*="vacancy"], [class*="job-card"], li[class*="job"]',
      title: 'h2, h3, [class*="title"]',
      link: 'a',
    }
  },
  {
    name: 'KPMG Ireland',
    logo: 'https://logo.clearbit.com/kpmg.com',
    url: 'https://home.kpmg/ie/en/home/careers/students-graduates.html',
    searchUrl: 'https://kpmg.taleo.net/careersection/kpmg_ireland_campus/jobsearch.ftl?lang=en',
    selectors: {
      items: 'tr.listrow, [class*="job-row"], [class*="opportunity"]',
      title: 'a[class*="title"], [class*="position"]',
      link: 'a',
    }
  },
  {
    name: 'EY Ireland',
    logo: 'https://logo.clearbit.com/ey.com',
    url: 'https://www.ey.com/en_ie/careers/students',
    searchUrl: 'https://eyglobal.yello.co/job_boards/internships-ireland',
    selectors: {
      items: '[class*="job"], article, li',
      title: 'h2, h3, [class*="title"]',
      link: 'a',
    }
  },
  {
    name: 'Grant Thornton Ireland',
    logo: 'https://logo.clearbit.com/grantthornton.ie',
    url: 'https://www.grantthornton.ie/careers/students/',
    searchUrl: 'https://www.grantthornton.ie/careers/vacancies/?type=internship',
    selectors: {
      items: '[class*="vacancy"], article, li[class*="job"]',
      title: 'h2, h3, [class*="title"]',
      link: 'a',
    }
  },
  {
    name: 'BDO Ireland',
    logo: 'https://logo.clearbit.com/bdo.ie',
    url: 'https://www.bdo.ie/en-gb/careers/students-graduates',
    searchUrl: 'https://www.bdo.ie/en-gb/careers/current-vacancies',
    selectors: {
      items: '[class*="job"], article',
      title: 'h2, h3, [class*="title"]',
      link: 'a',
    }
  },
];

async function scrapeCompany(company) {
  const results = [];

  for (const urlToScrape of [company.searchUrl, company.url]) {
    if (!urlToScrape) continue;
    try {
      const html = await fetchHtml(urlToScrape);
      const $ = cheerio.load(html);

      // Try JSON-LD first
      const jsonLds = extractJsonLd(html);
      const jobs = extractJobPostingsFromJsonLd(jsonLds);
      if (jobs.length > 0) {
        for (const job of jobs) {
          const intern = jsonLdToInternship(job, company.name, 'direct');
          intern.company_logo = company.logo;
          intern.description_short = (intern.description || '').slice(0, 200);
          results.push(intern);
        }
        return results;
      }

      // HTML fallback
      $(company.selectors.items).each((_, el) => {
        const $el = $(el);
        const title = $el.find(company.selectors.title).first().text().trim();
        const href = $el.find(company.selectors.link).first().attr('href');

        if (title && href && (
          title.toLowerCase().includes('intern') ||
          title.toLowerCase().includes('graduate') ||
          title.toLowerCase().includes('placement') ||
          title.toLowerCase().includes('trainee')
        )) {
          const description = $el.find('p').first().text().trim();
          results.push({
            title,
            company: company.name,
            company_logo: company.logo,
            location: 'Dublin, Ireland',
            start_date: null,
            duration: null,
            salary: null,
            salary_type: 'not_stated',
            description,
            description_short: description.slice(0, 200),
            url: href.startsWith('http') ? href : new URL(href, urlToScrape).href,
            source: company.name,
            source_type: 'direct',
            date_posted: null,
            date_expires: null,
          });
        }
      });

      if (results.length > 0) return results;
      await randomDelay(2000, 5000);
    } catch (err) {
      console.error(`[${company.name}] Error scraping ${urlToScrape}:`, err.message);
    }
  }

  return results;
}

async function scrape() {
  const all = [];
  for (const company of COMPANIES) {
    const results = await scrapeCompany(company);
    console.log(`[${company.name}] Found ${results.length} listings`);
    all.push(...results);
    await randomDelay(3000, 6000);
  }
  return all;
}

module.exports = { scrape, name: 'BigFour' };
