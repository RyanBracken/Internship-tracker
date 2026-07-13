const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const FIRMS = [
  // ── Bulge Bracket / Major Banks ───────────────────────────────────
  { name: 'BNP Paribas Paris', logo: 'https://logo.clearbit.com/bnpparibas.com', urls: ['https://group.bnpparibas/en/careers/job-offers?location=Paris&type=internship'] },
  { name: 'Societe Generale Paris', logo: 'https://logo.clearbit.com/societegenerale.com', urls: ['https://careers.societegenerale.com/en/offers?location=Paris&type=intern'] },
  { name: 'Credit Agricole CIB Paris', logo: 'https://logo.clearbit.com/credit-agricole.com', urls: ['https://careers.credit-agricole.com/search/?q=intern&location=Paris'] },
  { name: 'Natixis Paris', logo: 'https://logo.clearbit.com/natixis.com', urls: ['https://careers.natixis.com/offre-de-emploi/recherche?q=intern&location=Paris'] },
  { name: 'Goldman Sachs Paris', logo: 'https://logo.clearbit.com/goldmansachs.com', urls: ['https://higher.gs.com/roles?program=summer-internship&location=paris'] },
  { name: 'JP Morgan Paris', logo: 'https://logo.clearbit.com/jpmorgan.com', urls: ['https://careers.jpmorgan.com/us/en/students/programs?search=internship&location=Paris'] },
  { name: 'Morgan Stanley Paris', logo: 'https://logo.clearbit.com/morganstanley.com', urls: ['https://www.morganstanley.com/people-opportunities/students-graduates/programs/internships/paris'] },
  { name: 'Deutsche Bank Paris', logo: 'https://logo.clearbit.com/db.com', urls: ['https://careers.db.com/search/?q=intern&location=Paris'] },
  { name: 'Citigroup Paris', logo: 'https://logo.clearbit.com/citi.com', urls: ['https://jobs.citi.com/search-jobs/Intern/Paris/287/1/2/2988507/48x85341/2x3488/15/2'] },
  { name: 'HSBC Paris', logo: 'https://logo.clearbit.com/hsbc.com', urls: ['https://www.hsbc.com/careers/students-and-graduates/student-opportunities?location=France'] },
  { name: 'Barclays Paris', logo: 'https://logo.clearbit.com/barclays.com', urls: ['https://search.jobs.barclays/search-jobs/intern/Paris/22545/1/2/2988507/48x85341/2x3488/15/2'] },
  { name: 'UBS Paris', logo: 'https://logo.clearbit.com/ubs.com', urls: ['https://careers.ubs.com/search/?q=intern&location=Paris'] },
  { name: 'UniCredit Paris', logo: 'https://logo.clearbit.com/unicredit.eu', urls: ['https://careers.unicredit.eu/search/?q=intern&location=Paris'] },
  { name: 'Santander Paris', logo: 'https://logo.clearbit.com/santander.fr', urls: ['https://www.santander.fr/fr/groupe/nous-rejoindre'] },

  // ── Elite Boutiques / Advisory ────────────────────────────────────
  { name: 'Lazard Paris', logo: 'https://logo.clearbit.com/lazard.com', urls: ['https://www.lazard.com/careers/open-positions/?location=Paris'] },
  { name: 'Rothschild & Co Paris', logo: 'https://logo.clearbit.com/rothschildandco.com', urls: ['https://www.rothschildandco.com/en/careers/vacancies/?location=Paris'] },
  { name: 'Mediobanca Paris', logo: 'https://logo.clearbit.com/mediobanca.com', urls: ['https://careers.mediobanca.com/search/?q=intern&location=Paris'] },
  { name: 'Houlihan Lokey Paris', logo: 'https://logo.clearbit.com/hl.com', urls: ['https://www.hl.com/careers/job-search?location=Paris'] },
  { name: 'Duff & Phelps / Kroll Paris', logo: 'https://logo.clearbit.com/kroll.com', urls: ['https://www.kroll.com/en/careers/open-positions?location=Paris'] },
  { name: 'Accuracy Paris', logo: 'https://logo.clearbit.com/accuracy.com', urls: ['https://careers.accuracy.com/search/?q=intern&location=Paris'] },
  { name: 'DC Advisory Paris', logo: 'https://logo.clearbit.com/dcadvisory.com', urls: ['https://www.dcadvisory.com/careers/vacancies/?location=Paris'] },
  { name: 'Lincoln International Paris', logo: 'https://logo.clearbit.com/lincolninternational.com', urls: ['https://www.lincolninternational.com/careers/open-positions/?location=Paris'] },
  { name: 'Alantra Paris', logo: 'https://logo.clearbit.com/alantra.com', urls: ['https://www.alantra.com/careers/open-positions?location=Paris'] },

  // ── Private Equity ────────────────────────────────────────────────
  { name: 'Ardian', logo: 'https://logo.clearbit.com/ardian.com', urls: ['https://www.ardian.com/careers/vacancies/'] },
  { name: 'PAI Partners Paris', logo: 'https://logo.clearbit.com/paipartners.com', urls: ['https://www.paipartners.com/careers/vacancies/'] },
  { name: 'Eurazeo', logo: 'https://logo.clearbit.com/eurazeo.com', urls: ['https://www.eurazeo.com/en/careers/vacancies/'] },
  { name: 'Astorg Partners', logo: 'https://logo.clearbit.com/astorg.com', urls: ['https://www.astorg.com/careers/'] },
  { name: 'IK Partners Paris', logo: 'https://logo.clearbit.com/ikpartners.com', urls: ['https://www.ikpartners.com/careers/vacancies/?location=Paris'] },
  { name: 'Apax Partners Paris', logo: 'https://logo.clearbit.com/apax.com', urls: ['https://www.apax.com/careers/open-positions/'] },
  { name: 'Blackstone Paris', logo: 'https://logo.clearbit.com/blackstone.com', urls: ['https://blackstone.com/careers/open-positions/?location=Paris'] },
  { name: 'KKR Paris', logo: 'https://logo.clearbit.com/kkr.com', urls: ['https://www.kkr.com/careers/open-positions?location=Paris'] },
  { name: 'Carlyle Paris', logo: 'https://logo.clearbit.com/carlyle.com', urls: ['https://www.carlyle.com/careers/open-positions?location=Paris'] },
  { name: 'Tikehau Capital Paris', logo: 'https://logo.clearbit.com/tikehaucapital.com', urls: ['https://careers.tikehaucapital.com/jobs?location=Paris'] },
  { name: 'Wendel', logo: 'https://logo.clearbit.com/wendelgroup.com', urls: ['https://www.wendelgroup.com/en/careers/vacancies/'] },
  { name: 'Idinvest / Eurazeo Growth', logo: 'https://logo.clearbit.com/eurazeo.com', urls: ['https://www.eurazeo.com/en/careers/'] },
  { name: 'Chequers Capital', logo: 'https://logo.clearbit.com/chequers-capital.com', urls: ['https://www.chequers-capital.com/careers/'] },
  { name: 'Naxicap Partners', logo: 'https://logo.clearbit.com/naxicap.fr', urls: ['https://www.naxicap.fr/en/careers/'] },
  { name: 'AXA Private Equity / Triago', logo: 'https://logo.clearbit.com/axa-im.com', urls: ['https://careers.axa-im.com/search/?q=intern&location=Paris'] },
  { name: 'Bpifrance Investissement', logo: 'https://logo.clearbit.com/bpifrance.fr', urls: ['https://www.bpifrance.fr/recrutement'] },

  // ── Private Debt / Asset Management ──────────────────────────────
  { name: 'Amundi Paris', logo: 'https://logo.clearbit.com/amundi.com', urls: ['https://jobs.amundi.com/search/?q=intern&location=Paris'] },
  { name: 'AXA Investment Managers Paris', logo: 'https://logo.clearbit.com/axa-im.com', urls: ['https://careers.axa-im.com/search/?q=intern&location=Paris'] },
  { name: 'Carmignac', logo: 'https://logo.clearbit.com/carmignac.com', urls: ['https://www.carmignac.com/fr_FR/fondation-carmignac/recrutement'] },
  { name: 'Comgest', logo: 'https://logo.clearbit.com/comgest.com', urls: ['https://www.comgest.com/en/who-we-are/careers/'] },
  { name: 'Natixis Investment Managers', logo: 'https://logo.clearbit.com/natixis-im.com', urls: ['https://careers.natixis.com/offre-de-emploi/recherche?q=intern&location=Paris&department=Asset+Management'] },
  { name: 'Ares Paris', logo: 'https://logo.clearbit.com/aresmgmt.com', urls: ['https://www.aresmgmt.com/careers/open-positions?location=Paris'] },
  { name: 'Hayfin Paris', logo: 'https://logo.clearbit.com/hayfin.com', urls: ['https://www.hayfin.com/careers/vacancies/?location=Paris'] },
  { name: 'Idinvest Partners', logo: 'https://logo.clearbit.com/idinvest.com', urls: ['https://www.idinvest.com/en/careers/'] },

  // ── Consulting ────────────────────────────────────────────────────
  { name: 'McKinsey Paris', logo: 'https://logo.clearbit.com/mckinsey.com', urls: ['https://www.mckinsey.com/careers/search-jobs?location=Paris&type=intern'] },
  { name: 'Boston Consulting Group Paris', logo: 'https://logo.clearbit.com/bcg.com', urls: ['https://careers.bcg.com/search/?q=intern&location=Paris'] },
  { name: 'Bain & Company Paris', logo: 'https://logo.clearbit.com/bain.com', urls: ['https://www.bain.com/careers/find-a-role/?location=Paris&type=intern'] },
  { name: 'Oliver Wyman Paris', logo: 'https://logo.clearbit.com/oliverwyman.com', urls: ['https://www.oliverwyman.com/careers/jobs.html?location=Paris'] },
  { name: 'Roland Berger Paris', logo: 'https://logo.clearbit.com/rolandberger.com', urls: ['https://www.rolandberger.com/en/Career/Open-Positions/?country=France'] },
  { name: 'A.T. Kearney Paris', logo: 'https://logo.clearbit.com/kearney.com', urls: ['https://www.kearney.com/careers/open-positions?location=Paris'] },
  { name: 'L.E.K. Consulting Paris', logo: 'https://logo.clearbit.com/lek.com', urls: ['https://www.lek.com/careers/open-positions?location=Paris'] },
  { name: 'Accenture Paris', logo: 'https://logo.clearbit.com/accenture.com', urls: ['https://www.accenture.com/fr-fr/careers/jobsearch?jk=intern&jl=Paris'] },
  { name: 'Deloitte Paris', logo: 'https://logo.clearbit.com/deloitte.fr', urls: ['https://jobs2.deloitte.com/fr/fr/search-results?keywords=intern&location=Paris'] },
  { name: 'PwC Paris', logo: 'https://logo.clearbit.com/pwc.fr', urls: ['https://jobs.pwc.fr/search/?q=intern&location=Paris'] },
  { name: 'KPMG Paris', logo: 'https://logo.clearbit.com/kpmg.fr', urls: ['https://www.kpmg-recrutement.fr/offres-d-emploi/'] },
  { name: 'EY Paris', logo: 'https://logo.clearbit.com/ey.com', urls: ['https://careers.ey.com/ey/search/?q=intern&location=Paris'] },
  { name: 'Mazars Paris', logo: 'https://logo.clearbit.com/mazars.fr', urls: ['https://www.mazars.fr/Accueil/Carrieres'] },
  { name: 'FTI Consulting Paris', logo: 'https://logo.clearbit.com/fticonsulting.com', urls: ['https://www.fticonsulting.com/careers/job-openings?location=Paris'] },
  { name: 'AlixPartners Paris', logo: 'https://logo.clearbit.com/alixpartners.com', urls: ['https://www.alixpartners.com/careers/open-positions/?location=Paris'] },
  { name: 'Capgemini Invent Paris', logo: 'https://logo.clearbit.com/capgemini.com', urls: ['https://www.capgemini.com/fr-fr/carrieres/recherche-offres/?job_type=Intern&location=Paris'] },
  { name: 'Sia Partners Paris', logo: 'https://logo.clearbit.com/sia-partners.com', urls: ['https://www.sia-partners.com/fr/carrieres/offres-emploi?q=intern&location=Paris'] },
  { name: 'Wavestone', logo: 'https://logo.clearbit.com/wavestone.com', urls: ['https://www.wavestone.com/fr/recrutement/nos-offres/'] },
  { name: 'Publicis Sapient Paris', logo: 'https://logo.clearbit.com/publicissapient.com', urls: ['https://careers.publicissapient.com/jobs?location=Paris&type=intern'] },
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
          intern.location = intern.location || 'Paris, France';
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
            results.push({ title, company: firm.name, company_logo: firm.logo, location: location || 'Paris, France', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description, description_short: description.slice(0, 200), url: href.startsWith('http') ? href : new URL(href, url).href, source: firm.name, source_type: 'direct', date_posted: null, date_expires: null });
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

module.exports = { scrape, name: 'Paris' };
