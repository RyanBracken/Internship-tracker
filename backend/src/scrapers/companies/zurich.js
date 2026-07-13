const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

const FIRMS = [
  // ── Major Banks ────────────────────────────────────────────────────
  { name: 'UBS Zurich', logo: 'https://logo.clearbit.com/ubs.com', urls: ['https://careers.ubs.com/search/?q=intern&location=Zurich'] },
  { name: 'Credit Suisse Zurich', logo: 'https://logo.clearbit.com/ubs.com', urls: ['https://careers.ubs.com/search/?q=intern&location=Zurich'] },
  { name: 'Julius Baer', logo: 'https://logo.clearbit.com/juliusbaer.com', urls: ['https://careers.juliusbaer.com/search/?q=intern&location=Zurich'] },
  { name: 'Pictet Group', logo: 'https://logo.clearbit.com/pictet.com', urls: ['https://www.pictet.com/ch/en/about-us/careers/open-positions.html'] },
  { name: 'Lombard Odier', logo: 'https://logo.clearbit.com/lombardodier.com', urls: ['https://www.lombardodier.com/en/careers/open-positions.html'] },
  { name: 'Vontobel', logo: 'https://logo.clearbit.com/vontobel.com', urls: ['https://careers.vontobel.com/search/?q=intern&location=Zurich'] },
  { name: 'EFG International', logo: 'https://logo.clearbit.com/efginternational.com', urls: ['https://careers.efginternational.com/search/?q=intern&location=Zurich'] },
  { name: 'Zuercher Kantonalbank (ZKB)', logo: 'https://logo.clearbit.com/zkb.ch', urls: ['https://www.zkb.ch/de/ueber-uns/karriere/offene-stellen.html'] },
  { name: 'Raiffeisen Switzerland', logo: 'https://logo.clearbit.com/raiffeisen.ch', urls: ['https://www.raiffeisen.ch/rch/de/ueber-uns/raiffeisen-gruppe/karriere.html'] },
  { name: 'Migros Bank', logo: 'https://logo.clearbit.com/migrosbank.ch', urls: ['https://www.migrosbank.ch/de/ueber-uns/karriere.html'] },
  { name: 'Goldman Sachs Zurich', logo: 'https://logo.clearbit.com/goldmansachs.com', urls: ['https://higher.gs.com/roles?program=summer-internship&location=zurich'] },
  { name: 'JP Morgan Zurich', logo: 'https://logo.clearbit.com/jpmorgan.com', urls: ['https://careers.jpmorgan.com/us/en/students/programs?search=internship&location=Zurich'] },
  { name: 'Morgan Stanley Zurich', logo: 'https://logo.clearbit.com/morganstanley.com', urls: ['https://www.morganstanley.com/people-opportunities/students-graduates/programs/internships/zurich'] },
  { name: 'Deutsche Bank Zurich', logo: 'https://logo.clearbit.com/db.com', urls: ['https://careers.db.com/search/?q=intern&location=Zurich'] },
  { name: 'Citigroup Zurich', logo: 'https://logo.clearbit.com/citi.com', urls: ['https://jobs.citi.com/search-jobs/Intern/Zurich/287/1/2/2657895/47x3769/8x54169/15/2'] },
  { name: 'Barclays Zurich', logo: 'https://logo.clearbit.com/barclays.com', urls: ['https://search.jobs.barclays/search-jobs/intern/Zurich/22545/1/2/2657895/47x3769/8x54169/15/2'] },
  { name: 'BNP Paribas Zurich', logo: 'https://logo.clearbit.com/bnpparibas.com', urls: ['https://group.bnpparibas/en/careers/job-offers?location=Zurich&type=internship'] },

  // ── Boutique / Advisory ───────────────────────────────────────────
  { name: 'Lazard Zurich', logo: 'https://logo.clearbit.com/lazard.com', urls: ['https://www.lazard.com/careers/open-positions/?location=Zurich'] },
  { name: 'Rothschild & Co Zurich', logo: 'https://logo.clearbit.com/rothschildandco.com', urls: ['https://www.rothschildandco.com/en/careers/vacancies/?location=Zurich'] },
  { name: 'Houlihan Lokey Zurich', logo: 'https://logo.clearbit.com/hl.com', urls: ['https://www.hl.com/careers/job-search?location=Zurich'] },
  { name: 'Duff & Phelps / Kroll Zurich', logo: 'https://logo.clearbit.com/kroll.com', urls: ['https://www.kroll.com/en/careers/open-positions?location=Zurich'] },
  { name: 'Alantra Zurich', logo: 'https://logo.clearbit.com/alantra.com', urls: ['https://www.alantra.com/careers/open-positions?location=Zurich'] },
  { name: 'IFBC Zurich', logo: 'https://logo.clearbit.com/ifbc.ch', urls: ['https://www.ifbc.ch/karriere/'] },
  { name: 'BSL Management Consultants', logo: 'https://logo.clearbit.com/bslmc.com', urls: ['https://www.bslmc.com/careers/'] },

  // ── Private Equity ────────────────────────────────────────────────
  { name: 'Partners Group', logo: 'https://logo.clearbit.com/partnersgroup.com', urls: ['https://www.partnersgroup.com/careers/open-positions/?location=Zurich'] },
  { name: 'Capvis Equity Partners', logo: 'https://logo.clearbit.com/capvis.com', urls: ['https://www.capvis.com/careers/vacancies/'] },
  { name: 'Adveq / Schroders Capital', logo: 'https://logo.clearbit.com/schroders.com', urls: ['https://careers.schroders.com/search/?q=intern&location=Zurich'] },
  { name: 'Ardian Zurich', logo: 'https://logo.clearbit.com/ardian.com', urls: ['https://www.ardian.com/careers/vacancies/?location=Zurich'] },
  { name: 'KKR Zurich', logo: 'https://logo.clearbit.com/kkr.com', urls: ['https://www.kkr.com/careers/open-positions?location=Zurich'] },
  { name: 'Blackstone Zurich', logo: 'https://logo.clearbit.com/blackstone.com', urls: ['https://blackstone.com/careers/open-positions/?location=Zurich'] },
  { name: 'Carlyle Zurich', logo: 'https://logo.clearbit.com/carlyle.com', urls: ['https://www.carlyle.com/careers/open-positions?location=Zurich'] },
  { name: 'Investindustrial', logo: 'https://logo.clearbit.com/investindustrial.com', urls: ['https://www.investindustrial.com/careers/vacancies/'] },
  { name: 'Zurmont Madison', logo: 'https://logo.clearbit.com/zurmontmadison.com', urls: ['https://www.zurmontmadison.com/career/'] },
  { name: 'BVK (Bayerische Versorgungskammer) Zurich PE', logo: 'https://logo.clearbit.com/partnersgroup.com', urls: ['https://www.partnersgroup.com/careers/'] },

  // ── Asset Management / Private Debt ───────────────────────────────
  { name: 'Swiss Re Zurich', logo: 'https://logo.clearbit.com/swissre.com', urls: ['https://careers.swissre.com/search/?q=intern&location=Zurich'] },
  { name: 'Zurich Insurance Group', logo: 'https://logo.clearbit.com/zurich.com', urls: ['https://www.zurich.com/en/careers/job-search?q=intern&location=Zurich'] },
  { name: 'AXA Schweiz', logo: 'https://logo.clearbit.com/axa.ch', urls: ['https://careers.axa.ch/search/?q=intern&location=Zurich'] },
  { name: 'GAM Investments', logo: 'https://logo.clearbit.com/gam.com', urls: ['https://www.gam.com/en/careers/vacancies?location=Zurich'] },
  { name: 'Man Group Zurich', logo: 'https://logo.clearbit.com/man.com', urls: ['https://www.man.com/careers/open-positions?location=Zurich'] },
  { name: 'LGT Capital Partners', logo: 'https://logo.clearbit.com/lgt.com', urls: ['https://www.lgt.com/en/careers/vacancies/?location=Zurich'] },
  { name: 'Baloise Asset Management', logo: 'https://logo.clearbit.com/baloise.com', urls: ['https://careers.baloise.com/search/?q=intern&location=Zurich'] },
  { name: 'Swiss Life Asset Managers', logo: 'https://logo.clearbit.com/swisslife.ch', urls: ['https://careers.swisslife.ch/search/?q=intern&location=Zurich'] },
  { name: 'Invesco Zurich', logo: 'https://logo.clearbit.com/invesco.com', urls: ['https://careers.invesco.com/search/?q=intern&location=Zurich'] },
  { name: 'Ares Zurich', logo: 'https://logo.clearbit.com/aresmgmt.com', urls: ['https://www.aresmgmt.com/careers/open-positions?location=Zurich'] },
  { name: 'BlueBay Zurich', logo: 'https://logo.clearbit.com/bluebay.com', urls: ['https://www.bluebay.com/careers/vacancies/?location=Zurich'] },
  { name: 'Hayfin Zurich', logo: 'https://logo.clearbit.com/hayfin.com', urls: ['https://www.hayfin.com/careers/vacancies/?location=Zurich'] },

  // ── Consulting ────────────────────────────────────────────────────
  { name: 'McKinsey Zurich', logo: 'https://logo.clearbit.com/mckinsey.com', urls: ['https://www.mckinsey.com/careers/search-jobs?location=Zurich&type=intern'] },
  { name: 'Boston Consulting Group Zurich', logo: 'https://logo.clearbit.com/bcg.com', urls: ['https://careers.bcg.com/search/?q=intern&location=Zurich'] },
  { name: 'Bain & Company Zurich', logo: 'https://logo.clearbit.com/bain.com', urls: ['https://www.bain.com/careers/find-a-role/?location=Zurich&type=intern'] },
  { name: 'Oliver Wyman Zurich', logo: 'https://logo.clearbit.com/oliverwyman.com', urls: ['https://www.oliverwyman.com/careers/jobs.html?location=Zurich'] },
  { name: 'Roland Berger Zurich', logo: 'https://logo.clearbit.com/rolandberger.com', urls: ['https://www.rolandberger.com/en/Career/Open-Positions/?country=Switzerland'] },
  { name: 'A.T. Kearney Zurich', logo: 'https://logo.clearbit.com/kearney.com', urls: ['https://www.kearney.com/careers/open-positions?location=Zurich'] },
  { name: 'Accenture Zurich', logo: 'https://logo.clearbit.com/accenture.com', urls: ['https://www.accenture.com/ch-en/careers/jobsearch?jk=intern&jl=Zurich'] },
  { name: 'Deloitte Zurich', logo: 'https://logo.clearbit.com/deloitte.ch', urls: ['https://jobs2.deloitte.com/ch/de/search-results?keywords=intern&location=Zurich'] },
  { name: 'PwC Zurich', logo: 'https://logo.clearbit.com/pwc.ch', urls: ['https://jobs.pwc.ch/search/?q=intern&location=Zurich'] },
  { name: 'KPMG Zurich', logo: 'https://logo.clearbit.com/kpmg.ch', urls: ['https://home.kpmg/ch/de/home/karriere/stellenangebote.html'] },
  { name: 'EY Zurich', logo: 'https://logo.clearbit.com/ey.com', urls: ['https://careers.ey.com/ey/search/?q=intern&location=Zurich'] },
  { name: 'Mazars Zurich', logo: 'https://logo.clearbit.com/mazars.ch', urls: ['https://www.mazars.ch/Home/Karriere'] },
  { name: 'BDO Zurich', logo: 'https://logo.clearbit.com/bdo.ch', urls: ['https://www.bdo.ch/de/karriere/offene-stellen'] },
  { name: 'Capco Zurich', logo: 'https://logo.clearbit.com/capco.com', urls: ['https://www.capco.com/careers/open-positions?location=Zurich'] },
  { name: 'FTI Consulting Zurich', logo: 'https://logo.clearbit.com/fticonsulting.com', urls: ['https://www.fticonsulting.com/careers/job-openings?location=Zurich'] },
  { name: 'Aon Switzerland', logo: 'https://logo.clearbit.com/aon.ch', urls: ['https://careers.aon.com/search-jobs?keywords=intern&location=Zurich'] },
  { name: 'Willis Towers Watson Zurich', logo: 'https://logo.clearbit.com/wtwco.com', urls: ['https://careers.wtwco.com/search/?q=intern&location=Zurich'] },
  { name: 'Mercer Zurich', logo: 'https://logo.clearbit.com/mercer.com', urls: ['https://careers.mercer.com/search/?q=intern&location=Zurich'] },
  { name: 'Zanders Zurich', logo: 'https://logo.clearbit.com/zanders.eu', urls: ['https://zanders.eu/en/careers/vacancies/?location=Zurich'] },
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
          intern.location = intern.location || 'Zurich, Switzerland';
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
            results.push({ title, company: firm.name, company_logo: firm.logo, location: location || 'Zurich, Switzerland', start_date: null, duration: null, salary: null, salary_type: 'not_stated', description, description_short: description.slice(0, 200), url: href.startsWith('http') ? href : new URL(href, url).href, source: firm.name, source_type: 'direct', date_posted: null, date_expires: null });
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

module.exports = { scrape, name: 'Zurich' };
