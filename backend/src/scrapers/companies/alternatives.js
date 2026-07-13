const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// Dublin-based / Dublin-office PE, Private Debt, Credit, and boutique consulting firms
const FIRMS = [
  // ── Private Equity ──────────────────────────────────────────────
  {
    name: 'Carlyle Cardinal Ireland',
    logo: 'https://logo.clearbit.com/carlyle.com',
    urls: ['https://www.carlyle.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'Blackstone Dublin',
    logo: 'https://logo.clearbit.com/blackstone.com',
    urls: ['https://blackstone.com/careers/open-positions/?location=Dublin&type=internship'],
  },
  {
    name: 'KKR Dublin',
    logo: 'https://logo.clearbit.com/kkr.com',
    urls: ['https://www.kkr.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'Ardagh Group',
    logo: 'https://logo.clearbit.com/ardaghgroup.com',
    urls: ['https://www.ardaghgroup.com/careers/vacancies/?search=intern&location=Dublin'],
  },
  {
    name: 'Dalmore Capital',
    logo: 'https://logo.clearbit.com/dalmorecapital.com',
    urls: ['https://www.dalmorecapital.com/careers/'],
  },
  {
    name: 'Causeway Capital',
    logo: 'https://logo.clearbit.com/causewaycap.com',
    urls: ['https://www.causewaycap.com/careers/'],
  },
  {
    name: 'Renatus Capital Partners',
    logo: 'https://logo.clearbit.com/renatus.ie',
    urls: ['https://www.renatus.ie/careers/'],
  },
  {
    name: 'MML Capital Partners',
    logo: 'https://logo.clearbit.com/mmlcapital.com',
    urls: ['https://www.mmlcapital.com/careers/'],
  },
  {
    name: 'Gresham House',
    logo: 'https://logo.clearbit.com/greshamhouse.com',
    urls: ['https://greshamhouse.com/about/careers/'],
  },
  {
    name: 'Insight Partners Dublin',
    logo: 'https://logo.clearbit.com/insightpartners.com',
    urls: ['https://www.insightpartners.com/careers/?location=Dublin'],
  },
  {
    name: 'Perwyn',
    logo: 'https://logo.clearbit.com/perwyn.com',
    urls: ['https://www.perwyn.com/careers/'],
  },
  {
    name: 'Cardinal Capital Group',
    logo: 'https://logo.clearbit.com/cardinalcapital.ie',
    urls: ['https://www.cardinalcapital.ie/careers/'],
  },
  {
    name: 'Frontline Ventures',
    logo: 'https://logo.clearbit.com/frontline.vc',
    urls: ['https://www.frontline.vc/jobs/'],
  },
  {
    name: 'Act Venture Capital',
    logo: 'https://logo.clearbit.com/actventure.com',
    urls: ['https://www.actventure.com/jobs/'],
  },
  {
    name: 'Kernel Capital',
    logo: 'https://logo.clearbit.com/kernelcapital.ie',
    urls: ['https://www.kernelcapital.ie/jobs/'],
  },
  {
    name: 'Delta Partners',
    logo: 'https://logo.clearbit.com/delta.ie',
    urls: ['https://www.delta.ie/jobs/'],
  },
  {
    name: 'Elkstone',
    logo: 'https://logo.clearbit.com/elkstone.ie',
    urls: ['https://www.elkstone.ie/careers/'],
  },
  {
    name: 'Draper Esprit Dublin',
    logo: 'https://logo.clearbit.com/draperesprit.com',
    urls: ['https://www.localglobe.vc/jobs'],
  },

  // ── Private Debt / Credit ────────────────────────────────────────
  {
    name: 'Blackrock Dublin',
    logo: 'https://logo.clearbit.com/blackrock.com',
    urls: ['https://careers.blackrock.com/early-careers/?location=Dublin'],
  },
  {
    name: 'Intermediate Capital Group',
    logo: 'https://logo.clearbit.com/icgam.com',
    urls: ['https://www.icgam.com/careers/vacancies/?location=Dublin'],
  },
  {
    name: 'Oaktree Capital Dublin',
    logo: 'https://logo.clearbit.com/oaktreecapital.com',
    urls: ['https://www.oaktreecapital.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'Apollo Global Dublin',
    logo: 'https://logo.clearbit.com/apollo.com',
    urls: ['https://www.apollo.com/careers?location=Dublin'],
  },
  {
    name: 'Ares Management Dublin',
    logo: 'https://logo.clearbit.com/aresmgmt.com',
    urls: ['https://www.aresmgmt.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'Cheyne Capital',
    logo: 'https://logo.clearbit.com/cheynegroup.com',
    urls: ['https://www.cheynegroup.com/careers/'],
  },
  {
    name: 'Owl Rock Capital',
    logo: 'https://logo.clearbit.com/owlrock.com',
    urls: ['https://www.owlrock.com/careers/'],
  },
  {
    name: 'Barings Dublin',
    logo: 'https://logo.clearbit.com/barings.com',
    urls: ['https://jobs.barings.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Pimco Dublin',
    logo: 'https://logo.clearbit.com/pimco.com',
    urls: ['https://careers.pimco.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'M&G Investments Dublin',
    logo: 'https://logo.clearbit.com/mandg.com',
    urls: ['https://careers.mandg.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Invesco Dublin',
    logo: 'https://logo.clearbit.com/invesco.com',
    urls: ['https://careers.invesco.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Vanguard Dublin',
    logo: 'https://logo.clearbit.com/vanguard.com',
    urls: ['https://www.vanguardjobs.com/search-jobs?keywords=intern&location=Dublin'],
  },
  {
    name: 'Franklin Templeton Dublin',
    logo: 'https://logo.clearbit.com/franklintempleton.com',
    urls: ['https://jobs.franklintempleton.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Amundi Dublin',
    logo: 'https://logo.clearbit.com/amundi.com',
    urls: ['https://jobs.amundi.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'IFG Group',
    logo: 'https://logo.clearbit.com/ifggroup.ie',
    urls: ['https://www.ifggroup.ie/careers/'],
  },

  // ── Boutique / Independent Advisory ─────────────────────────────
  {
    name: 'Lazard Dublin',
    logo: 'https://logo.clearbit.com/lazard.com',
    urls: ['https://www.lazard.com/careers/open-positions/?location=Dublin'],
  },
  {
    name: 'Rothschild & Co Dublin',
    logo: 'https://logo.clearbit.com/rothschildandco.com',
    urls: ['https://www.rothschildandco.com/en/careers/vacancies/?location=Dublin'],
  },
  {
    name: 'Houlihan Lokey Dublin',
    logo: 'https://logo.clearbit.com/hl.com',
    urls: ['https://www.hl.com/careers/job-search?location=Dublin'],
  },
  {
    name: 'Duff & Phelps Dublin',
    logo: 'https://logo.clearbit.com/kroll.com',
    urls: ['https://www.kroll.com/en/careers/open-positions?location=Dublin'],
  },
  {
    name: 'FTI Consulting Dublin',
    logo: 'https://logo.clearbit.com/fticonsulting.com',
    urls: ['https://www.fticonsulting.com/careers/job-openings?location=Dublin'],
  },
  {
    name: 'AlixPartners Dublin',
    logo: 'https://logo.clearbit.com/alixpartners.com',
    urls: ['https://www.alixpartners.com/careers/open-positions/?location=Dublin'],
  },
  {
    name: 'Oliver Wyman Dublin',
    logo: 'https://logo.clearbit.com/oliverwyman.com',
    urls: ['https://www.oliverwyman.com/careers/jobs.html?location=Dublin'],
  },
  {
    name: 'L.E.K. Consulting Dublin',
    logo: 'https://logo.clearbit.com/lek.com',
    urls: ['https://www.lek.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'A.T. Kearney Dublin',
    logo: 'https://logo.clearbit.com/kearney.com',
    urls: ['https://www.kearney.com/careers/open-positions?location=Dublin'],
  },
  {
    name: 'Roland Berger Dublin',
    logo: 'https://logo.clearbit.com/rolandberger.com',
    urls: ['https://www.rolandberger.com/en/Career/Open-Positions/?country=Ireland'],
  },
  {
    name: 'Arthur D. Little Dublin',
    logo: 'https://logo.clearbit.com/adlittle.com',
    urls: ['https://www.adlittle.com/en/careers/open-positions'],
  },
  {
    name: 'Mazars Ireland',
    logo: 'https://logo.clearbit.com/mazars.ie',
    urls: [
      'https://www.mazars.ie/Home/Careers/Current-opportunities',
      'https://www.mazars.ie/Home/Careers/Students',
    ],
  },
  {
    name: 'Crowe Ireland',
    logo: 'https://logo.clearbit.com/crowe.ie',
    urls: [
      'https://www.crowe.com/ie/careers/current-opportunities',
      'https://www.crowe.com/ie/careers/students',
    ],
  },
  {
    name: 'RSM Ireland',
    logo: 'https://logo.clearbit.com/rsmireland.ie',
    urls: [
      'https://rsmireland.ie/careers/vacancies/',
      'https://rsmireland.ie/careers/graduates/',
    ],
  },
  {
    name: 'Baker Tilly Ireland',
    logo: 'https://logo.clearbit.com/bakertilly.ie',
    urls: ['https://www.bakertillyireland.ie/careers/'],
  },
  {
    name: 'Forvis Mazars Ireland',
    logo: 'https://logo.clearbit.com/forvismazars.com',
    urls: ['https://www.forvismazars.com/ie/en/careers/current-vacancies'],
  },
  {
    name: 'Clearwater Capital',
    logo: 'https://logo.clearbit.com/clearwatercapital.ie',
    urls: ['https://www.clearwatercapital.ie/careers/'],
  },
  {
    name: 'Elevate Capital',
    logo: 'https://logo.clearbit.com/elevatecapital.ie',
    urls: ['https://www.elevatecapital.ie/careers/'],
  },
  {
    name: 'Investec Dublin',
    logo: 'https://logo.clearbit.com/investec.com',
    urls: ['https://www.investec.com/en_ie/welcome-to-investec/careers.html'],
  },
  {
    name: 'Deutsche Bank Dublin',
    logo: 'https://logo.clearbit.com/db.com',
    urls: ['https://careers.db.com/explore-the-bank/careers-in-ireland/'],
  },
  {
    name: 'BNP Paribas Dublin',
    logo: 'https://logo.clearbit.com/bnpparibas.com',
    urls: ['https://group.bnpparibas/en/careers/job-offers?location=Dublin&type=internship'],
  },
  {
    name: 'Societe Generale Dublin',
    logo: 'https://logo.clearbit.com/societegenerale.com',
    urls: ['https://careers.societegenerale.com/en/offers?location=Dublin&type=intern'],
  },
  {
    name: 'Barclays Dublin',
    logo: 'https://logo.clearbit.com/barclays.com',
    urls: ['https://search.jobs.barclays/search-jobs/intern/Dublin/22545/1/2/6693538/53x3331/-6x24933/15/2'],
  },
  {
    name: 'HSBC Dublin',
    logo: 'https://logo.clearbit.com/hsbc.com',
    urls: ['https://www.hsbc.com/careers/students-and-graduates/student-opportunities?location=Ireland'],
  },
  {
    name: 'Morgan Stanley Dublin',
    logo: 'https://logo.clearbit.com/morganstanley.com',
    urls: ['https://www.morganstanley.com/people-opportunities/students-graduates/programs/internships/dublin'],
  },
  {
    name: 'Mercer Ireland',
    logo: 'https://logo.clearbit.com/mercer.com',
    urls: ['https://careers.mercer.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Willis Towers Watson Dublin',
    logo: 'https://logo.clearbit.com/wtwco.com',
    urls: ['https://careers.wtwco.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Aon Ireland',
    logo: 'https://logo.clearbit.com/aon.com',
    urls: ['https://careers.aon.com/search-jobs?keywords=intern&location=Dublin'],
  },
  {
    name: 'Irish Life',
    logo: 'https://logo.clearbit.com/irishlife.ie',
    urls: ['https://www.irishlife.ie/about/careers/'],
  },
  {
    name: 'Zurich Insurance Dublin',
    logo: 'https://logo.clearbit.com/zurich.ie',
    urls: ['https://www.zurich.ie/about-zurich/careers/job-search/?q=intern&location=Dublin'],
  },
  {
    name: 'Aviva Ireland',
    logo: 'https://logo.clearbit.com/aviva.ie',
    urls: ['https://careers.aviva.io/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Standard Life Dublin',
    logo: 'https://logo.clearbit.com/standardlife.com',
    urls: ['https://jobs.standardlife.com/search/?q=intern&location=Dublin'],
  },
  {
    name: 'Pramerica / Prudential Dublin',
    logo: 'https://logo.clearbit.com/prudential.com',
    urls: ['https://jobs.prudential.com/search-jobs?keywords=intern&location=Dublin'],
  },
  {
    name: 'KBRA Analytics Dublin',
    logo: 'https://logo.clearbit.com/kbra.com',
    urls: ['https://www.kbra.com/careers/'],
  },
  {
    name: 'Fitch Ratings Dublin',
    logo: 'https://logo.clearbit.com/fitchratings.com',
    urls: ['https://jobs.fitchgroup.com/search/?q=intern&location=Dublin'],
  },
  {
    name: "Moody's Dublin",
    logo: 'https://logo.clearbit.com/moodys.com',
    urls: ['https://careers.moodys.com/jobs?location=Dublin&keywords=intern'],
  },
  {
    name: 'S&P Global Dublin',
    logo: 'https://logo.clearbit.com/spglobal.com',
    urls: ['https://careers.spglobal.com/jobs?location=Dublin&keywords=intern'],
  },
  {
    name: 'Deloitte Corporate Finance',
    logo: 'https://logo.clearbit.com/deloitte.ie',
    urls: ['https://jobs2.deloitte.com/ie/en/search-results?keywords=intern&location=Dublin'],
  },
  {
    name: 'Grant Thornton Corporate Finance',
    logo: 'https://logo.clearbit.com/grantthornton.ie',
    urls: ['https://www.grantthornton.ie/careers/vacancies/?q=intern'],
  },
  {
    name: 'William Fry',
    logo: 'https://logo.clearbit.com/williamfry.com',
    urls: ['https://www.williamfry.com/careers/vacancies/'],
  },
  {
    name: 'McCann FitzGerald',
    logo: 'https://logo.clearbit.com/mccannfitzgerald.com',
    urls: ['https://www.mccannfitzgerald.com/careers/vacancies/'],
  },
  {
    name: 'Mason Hayes & Curran',
    logo: 'https://logo.clearbit.com/mhc.ie',
    urls: ['https://www.mhc.ie/careers/vacancies/'],
  },
  {
    name: 'Dillon Eustace',
    logo: 'https://logo.clearbit.com/dilloneustace.com',
    urls: ['https://www.dilloneustace.com/careers/vacancies/'],
  },
  {
    name: 'Arthur Cox',
    logo: 'https://logo.clearbit.com/arthurcox.com',
    urls: ['https://www.arthurcox.com/careers/vacancies/'],
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
        'tr[class*="job"]', 'li[class*="opening"]', '[class*="career"]',
      ];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const $el = $(el);
          const title = $el.find('h2, h3, h4, [class*="title"]').first().text().trim();
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

module.exports = { scrape, name: 'Alternatives & Boutiques' };
