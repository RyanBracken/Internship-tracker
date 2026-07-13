const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const FIRMS = [
  // ── Major Banks ────────────────────────────────────────────────────
  { name: 'Deutsche Bank Frankfurt', logo: 'https://logo.clearbit.com/db.com', urls: ['https://careers.db.com/search/?q=intern&location=Frankfurt'] },
  { name: 'Commerzbank', logo: 'https://logo.clearbit.com/commerzbank.com', urls: ['https://karriere.commerzbank.com/search/?q=intern&location=Frankfurt'] },
  { name: 'DZ Bank', logo: 'https://logo.clearbit.com/dzbank.de', urls: ['https://www.dzbank.de/karriere/stellenangebote.html?q=praktikum'] },
  { name: 'Helaba', logo: 'https://logo.clearbit.com/helaba.de', urls: ['https://karriere.helaba.de/stellenangebote/?q=praktikum'] },
  { name: 'Landesbank Baden-Württemberg (LBBW)', logo: 'https://logo.clearbit.com/lbbw.de', urls: ['https://www.lbbw.de/karriere/stellenangebote.html'] },
  { name: 'BayernLB', logo: 'https://logo.clearbit.com/bayernlb.de', urls: ['https://www.bayernlb.de/karriere/stellenangebote.html'] },
  { name: 'KfW', logo: 'https://logo.clearbit.com/kfw.de', urls: ['https://www.kfw.de/karriere/Stellenangebote/'] },
  { name: 'Goldman Sachs Frankfurt', logo: 'https://logo.clearbit.com/goldmansachs.com', urls: ['https://higher.gs.com/roles?program=summer-internship&location=frankfurt'] },
  { name: 'JP Morgan Frankfurt', logo: 'https://logo.clearbit.com/jpmorgan.com', urls: ['https://careers.jpmorgan.com/us/en/students/programs?search=internship&location=Frankfurt'] },
  { name: 'Morgan Stanley Frankfurt', logo: 'https://logo.clearbit.com/morganstanley.com', urls: ['https://www.morganstanley.com/people-opportunities/students-graduates/programs/internships/frankfurt'] },
  { name: 'Citigroup Frankfurt', logo: 'https://logo.clearbit.com/citi.com', urls: ['https://jobs.citi.com/search-jobs/Intern/Frankfurt/287/1/2/2925177/50x11552/8x68401/15/2'] },
  { name: 'Barclays Frankfurt', logo: 'https://logo.clearbit.com/barclays.com', urls: ['https://search.jobs.barclays/search-jobs/intern/Frankfurt/22545/1/2/2925177/50x11552/8x68401/15/2'] },
  { name: 'UBS Frankfurt', logo: 'https://logo.clearbit.com/ubs.com', urls: ['https://careers.ubs.com/search/?q=intern&location=Frankfurt'] },
  { name: 'BNP Paribas Frankfurt', logo: 'https://logo.clearbit.com/bnpparibas.com', urls: ['https://group.bnpparibas/en/careers/job-offers?location=Frankfurt&type=internship'] },
  { name: 'UniCredit HypoVereinsbank', logo: 'https://logo.clearbit.com/unicredit.eu', urls: ['https://careers.unicredit.eu/search/?q=intern&location=Frankfurt'] },
  { name: 'Nomura Frankfurt', logo: 'https://logo.clearbit.com/nomura.com', urls: ['https://nomuracampus.com/opportunities/?location=Frankfurt'] },
  { name: 'Societe Generale Frankfurt', logo: 'https://logo.clearbit.com/societegenerale.com', urls: ['https://careers.societegenerale.com/en/offers?location=Frankfurt'] },
  { name: 'ING DiBa Frankfurt', logo: 'https://logo.clearbit.com/ing.de', urls: ['https://www.ing.jobs/germany/vacancies.htm?q=praktikum&location=Frankfurt'] },
  { name: 'Santander Germany Frankfurt', logo: 'https://logo.clearbit.com/santander.de', urls: ['https://jobs.santander.de/search/?q=intern&location=Frankfurt'] },

  // ── Boutique / Advisory ───────────────────────────────────────────
  { name: 'Lazard Frankfurt', logo: 'https://logo.clearbit.com/lazard.com', urls: ['https://www.lazard.com/careers/open-positions/?location=Frankfurt'] },
  { name: 'Rothschild & Co Frankfurt', logo: 'https://logo.clearbit.com/rothschildandco.com', urls: ['https://www.rothschildandco.com/en/careers/vacancies/?location=Frankfurt'] },
  { name: 'Houlihan Lokey Frankfurt', logo: 'https://logo.clearbit.com/hl.com', urls: ['https://www.hl.com/careers/job-search?location=Frankfurt'] },
  { name: 'DC Advisory Frankfurt', logo: 'https://logo.clearbit.com/dcadvisory.com', urls: ['https://www.dcadvisory.com/careers/vacancies/?location=Frankfurt'] },
  { name: 'Lincoln International Frankfurt', logo: 'https://logo.clearbit.com/lincolninternational.com', urls: ['https://www.lincolninternational.com/careers/open-positions/?location=Frankfurt'] },
  { name: 'Alantra Frankfurt', logo: 'https://logo.clearbit.com/alantra.com', urls: ['https://www.alantra.com/careers/open-positions?location=Frankfurt'] },
  { name: 'Duff & Phelps / Kroll Frankfurt', logo: 'https://logo.clearbit.com/kroll.com', urls: ['https://www.kroll.com/en/careers/open-positions?location=Frankfurt'] },
  { name: 'FTI Consulting Frankfurt', logo: 'https://logo.clearbit.com/fticonsulting.com', urls: ['https://www.fticonsulting.com/careers/job-openings?location=Frankfurt'] },

  // ── Private Equity ────────────────────────────────────────────────
  { name: 'Blackstone Frankfurt', logo: 'https://logo.clearbit.com/blackstone.com', urls: ['https://blackstone.com/careers/open-positions/?location=Frankfurt'] },
  { name: 'KKR Frankfurt', logo: 'https://logo.clearbit.com/kkr.com', urls: ['https://www.kkr.com/careers/open-positions?location=Frankfurt'] },
  { name: 'Carlyle Frankfurt', logo: 'https://logo.clearbit.com/carlyle.com', urls: ['https://www.carlyle.com/careers/open-positions?location=Frankfurt'] },
  { name: 'EQT Frankfurt', logo: 'https://logo.clearbit.com/eqtgroup.com', urls: ['https://eqtgroup.com/careers/open-positions/?location=Frankfurt'] },
  { name: 'Advent International Frankfurt', logo: 'https://logo.clearbit.com/adventinternational.com', urls: ['https://www.adventinternational.com/careers/open-positions/?location=Frankfurt'] },
  { name: 'Triton Partners', logo: 'https://logo.clearbit.com/triton.com', urls: ['https://www.triton-partners.com/careers/vacancies/'] },
  { name: 'IK Partners Frankfurt', logo: 'https://logo.clearbit.com/ikpartners.com', urls: ['https://www.ikpartners.com/careers/vacancies/?location=Frankfurt'] },
  { name: 'Waterland Private Equity', logo: 'https://logo.clearbit.com/waterland.eu', urls: ['https://www.waterland.eu/careers/vacancies/?location=Germany'] },
  { name: 'Equistone Partners Europe Frankfurt', logo: 'https://logo.clearbit.com/equistone.eu', urls: ['https://www.equistone.eu/careers/vacancies/?location=Frankfurt'] },
  { name: 'capiton AG', logo: 'https://logo.clearbit.com/capiton.de', urls: ['https://www.capiton.de/karriere/'] },
  { name: 'DBAG (Deutsche Beteiligungs AG)', logo: 'https://logo.clearbit.com/dbag.de', urls: ['https://www.dbag.de/karriere/stellenangebote/'] },
  { name: 'Auctus Capital Partners', logo: 'https://logo.clearbit.com/auctus.de', urls: ['https://www.auctus.de/karriere/'] },
  { name: 'Steadfast Capital', logo: 'https://logo.clearbit.com/steadfast.de', urls: ['https://www.steadfast.de/karriere/'] },
  { name: 'One Peak Partners', logo: 'https://logo.clearbit.com/onepeakpartners.com', urls: ['https://www.onepeakpartners.com/careers/'] },

  // ── Asset Management / Private Debt ───────────────────────────────
  { name: 'DWS Group', logo: 'https://logo.clearbit.com/dws.com', urls: ['https://careers.dws.com/search/?q=intern&location=Frankfurt'] },
  { name: 'Union Investment', logo: 'https://logo.clearbit.com/union-investment.de', urls: ['https://karriere.union-investment.de/stellenangebote/?q=praktikum'] },
  { name: 'DekaBank', logo: 'https://logo.clearbit.com/deka.de', urls: ['https://karriere.deka.de/stellenangebote/?q=praktikum'] },
  { name: 'Allianz Global Investors Frankfurt', logo: 'https://logo.clearbit.com/allianzgi.com', urls: ['https://careers.allianzgi.com/search/?q=intern&location=Frankfurt'] },
  { name: 'Ares Frankfurt', logo: 'https://logo.clearbit.com/aresmgmt.com', urls: ['https://www.aresmgmt.com/careers/open-positions?location=Frankfurt'] },
  { name: 'Tikehau Capital Frankfurt', logo: 'https://logo.clearbit.com/tikehaucapital.com', urls: ['https://careers.tikehaucapital.com/jobs?location=Frankfurt'] },
  { name: 'Intermediate Capital Group Frankfurt', logo: 'https://logo.clearbit.com/icgam.com', urls: ['https://www.icgam.com/careers/vacancies/?location=Frankfurt'] },

  // ── Consulting ────────────────────────────────────────────────────
  { name: 'McKinsey Frankfurt', logo: 'https://logo.clearbit.com/mckinsey.com', urls: ['https://www.mckinsey.com/careers/search-jobs?location=Frankfurt&type=intern'] },
  { name: 'Boston Consulting Group Frankfurt', logo: 'https://logo.clearbit.com/bcg.com', urls: ['https://careers.bcg.com/search/?q=intern&location=Frankfurt'] },
  { name: 'Bain & Company Frankfurt', logo: 'https://logo.clearbit.com/bain.com', urls: ['https://www.bain.com/careers/find-a-role/?location=Frankfurt&type=intern'] },
  { name: 'Roland Berger Frankfurt', logo: 'https://logo.clearbit.com/rolandberger.com', urls: ['https://www.rolandberger.com/en/Career/Open-Positions/?country=Germany'] },
  { name: 'Oliver Wyman Frankfurt', logo: 'https://logo.clearbit.com/oliverwyman.com', urls: ['https://www.oliverwyman.com/careers/jobs.html?location=Frankfurt'] },
  { name: 'A.T. Kearney Frankfurt', logo: 'https://logo.clearbit.com/kearney.com', urls: ['https://www.kearney.com/careers/open-positions?location=Frankfurt'] },
  { name: 'Deloitte Frankfurt', logo: 'https://logo.clearbit.com/deloitte.de', urls: ['https://jobs2.deloitte.com/de/de/search-results?keywords=intern&location=Frankfurt'] },
  { name: 'PwC Germany Frankfurt', logo: 'https://logo.clearbit.com/pwc.de', urls: ['https://jobs.pwc.de/search/?q=intern&location=Frankfurt'] },
  { name: 'KPMG Germany Frankfurt', logo: 'https://logo.clearbit.com/kpmg.de', urls: ['https://www.kpmg.com/de/de/home/karriere/stellenangebote.html'] },
  { name: 'EY Frankfurt', logo: 'https://logo.clearbit.com/ey.com', urls: ['https://careers.ey.com/ey/search/?q=intern&location=Frankfurt'] },
  { name: 'Accenture Frankfurt', logo: 'https://logo.clearbit.com/accenture.com', urls: ['https://www.accenture.com/de-de/careers/jobsearch?jk=intern&jl=Frankfurt'] },
  { name: 'Horváth & Partners', logo: 'https://logo.clearbit.com/horvath-partners.com', urls: ['https://www.horvath-partners.com/de/karriere/offene-stellen/'] },
  { name: 'zeb Consulting', logo: 'https://logo.clearbit.com/zeb.eu', urls: ['https://www.zeb.eu/karriere/offene-stellen/'] },
  { name: 'Capco Frankfurt', logo: 'https://logo.clearbit.com/capco.com', urls: ['https://www.capco.com/careers/open-positions?location=Frankfurt'] },
  { name: 'Aon Germany Frankfurt', logo: 'https://logo.clearbit.com/aon.de', urls: ['https://careers.aon.com/search-jobs?keywords=intern&location=Frankfurt'] },
  { name: 'Willis Towers Watson Frankfurt', logo: 'https://logo.clearbit.com/wtwco.com', urls: ['https://careers.wtwco.com/search/?q=intern&location=Frankfurt'] },
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
          intern.location = intern.location || 'Frankfurt, Germany';
          intern.description_short = (intern.description || '').slice(0, 200);
          results.push(intern);
        }
        break;
      }
      const selectors = ['li[class*="job"]', 'div[class*="job-card"]', 'article', '[class*="vacancy"]', '[class*="opportunity"]', '[class*="position"]', '[class*="career"]'];
      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, h4, [class*="title"]').first().text().trim();
          const href = $el.find('a').first().attr('href');
          if (title && href) {
            const description = $el.find('p').first().text().trim();
            const location = $el.find('[class*="location"]').first().text().trim();
            results.push({ title, company: firm.name, company_logo: firm.logo, location: location || 'Frankfurt, Germany', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description, description_short: description.slice(0, 200), url: href.startsWith('http') ? href : new URL(href, url).href, source: firm.name, source_type: 'direct', date_posted: null, date_expires: null });
          }
        });
        if (results.length > 0) break;
      }
      await randomDelay(2000, 5000);
    } catch (err) {
      console.error(`[${firm.name}] Error: ${err.message}`);
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
    await randomDelay(1500, 4000);
  }
  return all;
}

module.exports = { scrape, name: 'Frankfurt' };
