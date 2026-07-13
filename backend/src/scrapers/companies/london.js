const cheerio = require('cheerio');
const { fetchHtml, randomDelay, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship } = require('../../utils/scrapeHelpers');

// London investment banks, PE, private debt, and consulting firms
const FIRMS = [
  // ── Bulge Bracket Investment Banks ──────────────────────────────
  {
    name: 'Goldman Sachs London',
    logo: 'https://logo.clearbit.com/goldmansachs.com',
    urls: ['https://higher.gs.com/roles?program=summer-internship&location=london'],
  },
  {
    name: 'Morgan Stanley London',
    logo: 'https://logo.clearbit.com/morganstanley.com',
    urls: ['https://www.morganstanley.com/people-opportunities/students-graduates/programs/internships/london'],
  },
  {
    name: 'JP Morgan London',
    logo: 'https://logo.clearbit.com/jpmorgan.com',
    urls: ['https://careers.jpmorgan.com/us/en/students/programs?search=internship&location=London'],
  },
  {
    name: 'Bank of America London',
    logo: 'https://logo.clearbit.com/bankofamerica.com',
    urls: ['https://campus.bankofamerica.com/opportunities.html?country=GBR&program=Summer+Analyst'],
  },
  {
    name: 'Citigroup London',
    logo: 'https://logo.clearbit.com/citi.com',
    urls: ['https://jobs.citi.com/search-jobs/Intern/London/287/1/2/2643743/51x50853/-0x12574/15/2'],
  },
  {
    name: 'Barclays London',
    logo: 'https://logo.clearbit.com/barclays.com',
    urls: ['https://search.jobs.barclays/search-jobs/intern/London/22545/1/2/2643743/51x50853/-0x12574/15/2'],
  },
  {
    name: 'Deutsche Bank London',
    logo: 'https://logo.clearbit.com/db.com',
    urls: ['https://careers.db.com/explore-the-bank/working-in-london/'],
  },
  {
    name: 'UBS London',
    logo: 'https://logo.clearbit.com/ubs.com',
    urls: ['https://www.ubs.com/global/en/careers/students.html?location=London'],
  },
  {
    name: 'Credit Suisse / UBS London',
    logo: 'https://logo.clearbit.com/ubs.com',
    urls: ['https://careers.ubs.com/search/?q=intern&location=London'],
  },
  {
    name: 'HSBC London',
    logo: 'https://logo.clearbit.com/hsbc.com',
    urls: ['https://www.hsbc.com/careers/students-and-graduates/student-opportunities?location=United+Kingdom'],
  },
  {
    name: 'BNP Paribas London',
    logo: 'https://logo.clearbit.com/bnpparibas.com',
    urls: ['https://group.bnpparibas/en/careers/job-offers?location=London&type=internship'],
  },
  {
    name: 'Societe Generale London',
    logo: 'https://logo.clearbit.com/societegenerale.com',
    urls: ['https://careers.societegenerale.com/en/offers?location=London&type=intern'],
  },
  {
    name: 'Credit Agricole London',
    logo: 'https://logo.clearbit.com/credit-agricole.com',
    urls: ['https://careers.credit-agricole.com/search/?q=intern&location=London'],
  },
  {
    name: 'Nomura London',
    logo: 'https://logo.clearbit.com/nomura.com',
    urls: ['https://nomuracampus.com/opportunities/?location=London&type=internship'],
  },
  {
    name: 'Mizuho London',
    logo: 'https://logo.clearbit.com/mizuho-sc.com',
    urls: ['https://www.mizuhoemea.com/careers/graduate-recruitment/'],
  },
  {
    name: 'MUFG London',
    logo: 'https://logo.clearbit.com/mufg.jp',
    urls: ['https://careers.mufgemea.com/en/early-careers/'],
  },
  {
    name: 'SMBC London',
    logo: 'https://logo.clearbit.com/smbcgroup.com',
    urls: ['https://www.smbcgroup.com/careers/emea/early-careers'],
  },
  {
    name: 'Santander London',
    logo: 'https://logo.clearbit.com/santander.co.uk',
    urls: ['https://jobs.santander.co.uk/search/?q=intern&location=London'],
  },
  {
    name: 'ING London',
    logo: 'https://logo.clearbit.com/ing.com',
    urls: ['https://www.ing.jobs/global/careers/vacancies.htm?q=intern&location=London'],
  },

  // ── Elite Boutiques ───────────────────────────────────────────────
  {
    name: 'Lazard London',
    logo: 'https://logo.clearbit.com/lazard.com',
    urls: ['https://www.lazard.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Rothschild & Co London',
    logo: 'https://logo.clearbit.com/rothschildandco.com',
    urls: ['https://www.rothschildandco.com/en/careers/vacancies/?location=London'],
  },
  {
    name: 'Evercore London',
    logo: 'https://logo.clearbit.com/evercore.com',
    urls: ['https://www.evercore.com/careers/open-positions/?location=London'],
  },
  {
    name: 'PJT Partners London',
    logo: 'https://logo.clearbit.com/pjtpartners.com',
    urls: ['https://www.pjtpartners.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Centerview Partners London',
    logo: 'https://logo.clearbit.com/centerviewpartners.com',
    urls: ['https://www.centerviewpartners.com/careers/'],
  },
  {
    name: 'Perella Weinberg Partners London',
    logo: 'https://logo.clearbit.com/pwpartners.com',
    urls: ['https://www.pwpartners.com/careers/open-positions/'],
  },
  {
    name: 'Moelis & Company London',
    logo: 'https://logo.clearbit.com/moelis.com',
    urls: ['https://www.moelis.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Houlihan Lokey London',
    logo: 'https://logo.clearbit.com/hl.com',
    urls: ['https://www.hl.com/careers/job-search?location=London'],
  },
  {
    name: 'Jefferies London',
    logo: 'https://logo.clearbit.com/jefferies.com',
    urls: ['https://www.jefferies.com/careers/students/open-positions/?location=London'],
  },
  {
    name: 'Guggenheim Securities London',
    logo: 'https://logo.clearbit.com/guggenheimpartners.com',
    urls: ['https://www.guggenheimpartners.com/careers/open-positions?location=London'],
  },
  {
    name: 'Greenhill London',
    logo: 'https://logo.clearbit.com/greenhill.com',
    urls: ['https://www.greenhill.com/careers/open-positions/'],
  },
  {
    name: 'NM Rothschild London',
    logo: 'https://logo.clearbit.com/nmrothschild.com',
    urls: ['https://www.nmrothschild.com/careers/'],
  },
  {
    name: 'Duff & Phelps / Kroll London',
    logo: 'https://logo.clearbit.com/kroll.com',
    urls: ['https://www.kroll.com/en/careers/open-positions?location=London'],
  },

  // ── Mid-Market Banks ────────────────────────────────────────────
  {
    name: 'Macquarie London',
    logo: 'https://logo.clearbit.com/macquarie.com',
    urls: ['https://www.macquarie.com/careers/students/programmes/?location=London'],
  },
  {
    name: 'RBC Capital Markets London',
    logo: 'https://logo.clearbit.com/rbc.com',
    urls: ['https://jobs.rbc.com/ca/en/internship-jobs?location=London'],
  },
  {
    name: 'TD Securities London',
    logo: 'https://logo.clearbit.com/td.com',
    urls: ['https://jobs.td.com/en-CA/search-jobs/?location=London&keyword=intern'],
  },
  {
    name: 'BMO Capital Markets London',
    logo: 'https://logo.clearbit.com/bmo.com',
    urls: ['https://jobs.bmo.com/ca/en/search-results?keywords=intern&location=London'],
  },
  {
    name: 'Natixis London',
    logo: 'https://logo.clearbit.com/natixis.com',
    urls: ['https://careers.natixis.com/offre-de-emploi/recherche?q=intern&location=London'],
  },
  {
    name: 'Mediobanca London',
    logo: 'https://logo.clearbit.com/mediobanca.com',
    urls: ['https://careers.mediobanca.com/search/?q=intern&location=London'],
  },
  {
    name: 'UniCredit London',
    logo: 'https://logo.clearbit.com/unicredit.eu',
    urls: ['https://careers.unicredit.eu/search/?q=intern&location=London'],
  },
  {
    name: 'Standard Chartered London',
    logo: 'https://logo.clearbit.com/sc.com',
    urls: ['https://www.sc.com/en/careers/early-careers/?location=United+Kingdom'],
  },
  {
    name: 'Lloyds Banking Group',
    logo: 'https://logo.clearbit.com/lloydsbankinggroup.com',
    urls: ['https://www.lloydsbankinggroup.com/careers/early-careers/internships.html'],
  },
  {
    name: 'NatWest Group',
    logo: 'https://logo.clearbit.com/natwestgroup.com',
    urls: ['https://www.natwestgroup.com/careers/early-careers/internships.html'],
  },

  // ── Private Equity ────────────────────────────────────────────────
  {
    name: 'Blackstone London',
    logo: 'https://logo.clearbit.com/blackstone.com',
    urls: ['https://blackstone.com/careers/open-positions/?location=London&type=internship'],
  },
  {
    name: 'KKR London',
    logo: 'https://logo.clearbit.com/kkr.com',
    urls: ['https://www.kkr.com/careers/open-positions?location=London'],
  },
  {
    name: 'Carlyle London',
    logo: 'https://logo.clearbit.com/carlyle.com',
    urls: ['https://www.carlyle.com/careers/open-positions?location=London'],
  },
  {
    name: 'Apollo Global London',
    logo: 'https://logo.clearbit.com/apollo.com',
    urls: ['https://www.apollo.com/careers?location=London'],
  },
  {
    name: 'CVC Capital Partners',
    logo: 'https://logo.clearbit.com/cvc.com',
    urls: ['https://www.cvc.com/careers/open-positions/'],
  },
  {
    name: 'Permira',
    logo: 'https://logo.clearbit.com/permira.com',
    urls: ['https://www.permira.com/careers/open-positions/'],
  },
  {
    name: 'Apax Partners',
    logo: 'https://logo.clearbit.com/apax.com',
    urls: ['https://www.apax.com/careers/open-positions/'],
  },
  {
    name: 'BC Partners',
    logo: 'https://logo.clearbit.com/bcpartners.com',
    urls: ['https://www.bcpartners.com/careers/vacancies/'],
  },
  {
    name: 'Bridgepoint',
    logo: 'https://logo.clearbit.com/bridgepoint.eu',
    urls: ['https://www.bridgepoint.eu/careers/vacancies/'],
  },
  {
    name: 'Cinven',
    logo: 'https://logo.clearbit.com/cinven.com',
    urls: ['https://www.cinven.com/careers/vacancies/'],
  },
  {
    name: 'EQT London',
    logo: 'https://logo.clearbit.com/eqtgroup.com',
    urls: ['https://eqtgroup.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Advent International London',
    logo: 'https://logo.clearbit.com/adventinternational.com',
    urls: ['https://www.adventinternational.com/careers/open-positions/'],
  },
  {
    name: 'General Atlantic London',
    logo: 'https://logo.clearbit.com/generalatlantic.com',
    urls: ['https://www.generalatlantic.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Warburg Pincus London',
    logo: 'https://logo.clearbit.com/warburgpincus.com',
    urls: ['https://www.warburgpincus.com/careers/'],
  },
  {
    name: 'Bain Capital London',
    logo: 'https://logo.clearbit.com/baincapital.com',
    urls: ['https://www.baincapital.com/careers/open-positions?location=London'],
  },
  {
    name: 'TPG London',
    logo: 'https://logo.clearbit.com/tpg.com',
    urls: ['https://www.tpg.com/careers/open-positions?location=London'],
  },
  {
    name: 'Thoma Bravo London',
    logo: 'https://logo.clearbit.com/thomabravo.com',
    urls: ['https://www.thomabravo.com/careers/open-positions/'],
  },
  {
    name: 'Silver Lake London',
    logo: 'https://logo.clearbit.com/silverlake.com',
    urls: ['https://www.silverlake.com/careers/open-positions/'],
  },
  {
    name: 'Francisco Partners London',
    logo: 'https://logo.clearbit.com/franciscopartners.com',
    urls: ['https://www.franciscopartners.com/careers/'],
  },
  {
    name: 'PAI Partners',
    logo: 'https://logo.clearbit.com/paipartners.com',
    urls: ['https://www.paipartners.com/careers/vacancies/'],
  },
  {
    name: 'Terra Firma Capital Partners',
    logo: 'https://logo.clearbit.com/terrafirma.com',
    urls: ['https://www.terrafirma.com/careers/'],
  },
  {
    name: 'Montagu Private Equity',
    logo: 'https://logo.clearbit.com/montagu.com',
    urls: ['https://www.montagu.com/careers/vacancies/'],
  },
  {
    name: 'Hg Capital',
    logo: 'https://logo.clearbit.com/hgcapital.com',
    urls: ['https://www.hgcapital.com/careers/vacancies/'],
  },
  {
    name: 'Inflexion Private Equity',
    logo: 'https://logo.clearbit.com/inflexion.com',
    urls: ['https://www.inflexion.com/careers/vacancies/'],
  },
  {
    name: 'Graphite Capital',
    logo: 'https://logo.clearbit.com/graphitecapital.com',
    urls: ['https://www.graphitecapital.com/careers/'],
  },
  {
    name: 'Sovereign Capital',
    logo: 'https://logo.clearbit.com/sovereigncapital.co.uk',
    urls: ['https://www.sovereigncapital.co.uk/careers/'],
  },
  {
    name: 'Phoenix Equity Partners',
    logo: 'https://logo.clearbit.com/phoenixep.com',
    urls: ['https://www.phoenixep.com/careers/'],
  },
  {
    name: 'LDC (Lloyds Development Capital)',
    logo: 'https://logo.clearbit.com/ldc.co.uk',
    urls: ['https://www.ldc.co.uk/careers/vacancies/'],
  },
  {
    name: 'CBPE Capital',
    logo: 'https://logo.clearbit.com/cbpe.co.uk',
    urls: ['https://www.cbpe.co.uk/careers/'],
  },
  {
    name: 'August Equity',
    logo: 'https://logo.clearbit.com/augustequity.com',
    urls: ['https://www.augustequity.com/about/careers/'],
  },
  {
    name: 'Livingbridge',
    logo: 'https://logo.clearbit.com/livingbridge.com',
    urls: ['https://www.livingbridge.com/careers/vacancies/'],
  },

  // ── Private Debt / Credit ─────────────────────────────────────────
  {
    name: 'Ares Management London',
    logo: 'https://logo.clearbit.com/aresmgmt.com',
    urls: ['https://www.aresmgmt.com/careers/open-positions?location=London'],
  },
  {
    name: 'Oaktree Capital London',
    logo: 'https://logo.clearbit.com/oaktreecapital.com',
    urls: ['https://www.oaktreecapital.com/careers/open-positions?location=London'],
  },
  {
    name: 'Intermediate Capital Group London',
    logo: 'https://logo.clearbit.com/icgam.com',
    urls: ['https://www.icgam.com/careers/vacancies/?location=London'],
  },
  {
    name: 'BlueBay Asset Management',
    logo: 'https://logo.clearbit.com/bluebay.com',
    urls: ['https://www.bluebay.com/careers/vacancies/'],
  },
  {
    name: 'Cheyne Capital London',
    logo: 'https://logo.clearbit.com/cheynegroup.com',
    urls: ['https://www.cheynegroup.com/careers/'],
  },
  {
    name: 'Hayfin Capital Management',
    logo: 'https://logo.clearbit.com/hayfin.com',
    urls: ['https://www.hayfin.com/careers/vacancies/'],
  },
  {
    name: 'Pemberton Asset Management',
    logo: 'https://logo.clearbit.com/pembertonasset.com',
    urls: ['https://www.pembertonasset.com/careers/'],
  },
  {
    name: 'Tikehau Capital London',
    logo: 'https://logo.clearbit.com/tikehaucapital.com',
    urls: ['https://careers.tikehaucapital.com/jobs?location=London'],
  },
  {
    name: 'Arcmont Asset Management',
    logo: 'https://logo.clearbit.com/arcmont.com',
    urls: ['https://www.arcmont.com/careers/'],
  },
  {
    name: 'Alcentra',
    logo: 'https://logo.clearbit.com/alcentra.com',
    urls: ['https://www.alcentra.com/careers/'],
  },
  {
    name: 'GSO / Blackstone Credit London',
    logo: 'https://logo.clearbit.com/blackstone.com',
    urls: ['https://blackstone.com/careers/open-positions/?location=London&division=Credit'],
  },
  {
    name: 'Man Group London',
    logo: 'https://logo.clearbit.com/man.com',
    urls: ['https://www.man.com/careers/open-positions?location=London'],
  },
  {
    name: 'Schroders London',
    logo: 'https://logo.clearbit.com/schroders.com',
    urls: ['https://careers.schroders.com/search/?q=intern&location=London'],
  },
  {
    name: 'Aviva Investors London',
    logo: 'https://logo.clearbit.com/avivainvestors.com',
    urls: ['https://careers.avivainvestors.com/search/?q=intern&location=London'],
  },
  {
    name: 'Legal & General Investment Management',
    logo: 'https://logo.clearbit.com/lgim.com',
    urls: ['https://careers.legalandgeneral.com/search/?q=intern&location=London'],
  },
  {
    name: 'Jupiter Asset Management',
    logo: 'https://logo.clearbit.com/jupiteram.com',
    urls: ['https://www.jupiteram.com/uk/en/about-us/careers/vacancies/'],
  },
  {
    name: 'Ninety One London',
    logo: 'https://logo.clearbit.com/ninetyone.com',
    urls: ['https://www.ninetyone.com/en/careers/vacancies?location=London'],
  },
  {
    name: 'Fidelity International London',
    logo: 'https://logo.clearbit.com/fidelityinternational.com',
    urls: ['https://jobs.fidelityinternational.com/search/?q=intern&location=London'],
  },
  {
    name: 'abrdn London',
    logo: 'https://logo.clearbit.com/abrdn.com',
    urls: ['https://careers.abrdn.com/search/?q=intern&location=London'],
  },

  // ── Management Consulting ─────────────────────────────────────────
  {
    name: 'McKinsey London',
    logo: 'https://logo.clearbit.com/mckinsey.com',
    urls: ['https://www.mckinsey.com/careers/search-jobs?location=London&type=intern'],
  },
  {
    name: 'Boston Consulting Group London',
    logo: 'https://logo.clearbit.com/bcg.com',
    urls: ['https://careers.bcg.com/search/?q=intern&location=London'],
  },
  {
    name: 'Bain & Company London',
    logo: 'https://logo.clearbit.com/bain.com',
    urls: ['https://www.bain.com/careers/find-a-role/?location=London&type=intern'],
  },
  {
    name: 'Deloitte London',
    logo: 'https://logo.clearbit.com/deloitte.com',
    urls: ['https://jobs2.deloitte.com/uk/en/search-results?keywords=intern&location=London'],
  },
  {
    name: 'PwC London',
    logo: 'https://logo.clearbit.com/pwc.co.uk',
    urls: ['https://www.pwc.co.uk/careers/student-jobs/finding-a-role.html'],
  },
  {
    name: 'KPMG London',
    logo: 'https://logo.clearbit.com/kpmg.co.uk',
    urls: ['https://www.kpmgcareers.co.uk/apprentices-graduates/programmes/'],
  },
  {
    name: 'EY London',
    logo: 'https://logo.clearbit.com/ey.com',
    urls: ['https://careers.ey.com/ey/search/?q=intern&location=London'],
  },
  {
    name: 'Accenture London',
    logo: 'https://logo.clearbit.com/accenture.com',
    urls: ['https://www.accenture.com/gb-en/careers/jobsearch?jk=intern&jl=London'],
  },
  {
    name: 'Oliver Wyman London',
    logo: 'https://logo.clearbit.com/oliverwyman.com',
    urls: ['https://www.oliverwyman.com/careers/jobs.html?location=London'],
  },
  {
    name: 'L.E.K. Consulting London',
    logo: 'https://logo.clearbit.com/lek.com',
    urls: ['https://www.lek.com/careers/open-positions?location=London'],
  },
  {
    name: 'A.T. Kearney London',
    logo: 'https://logo.clearbit.com/kearney.com',
    urls: ['https://www.kearney.com/careers/open-positions?location=London'],
  },
  {
    name: 'Roland Berger London',
    logo: 'https://logo.clearbit.com/rolandberger.com',
    urls: ['https://www.rolandberger.com/en/Career/Open-Positions/?country=United+Kingdom'],
  },
  {
    name: 'Strategy& (PwC) London',
    logo: 'https://logo.clearbit.com/strategyand.pwc.com',
    urls: ['https://www.strategyand.pwc.com/uk/en/careers/students.html'],
  },
  {
    name: 'FTI Consulting London',
    logo: 'https://logo.clearbit.com/fticonsulting.com',
    urls: ['https://www.fticonsulting.com/careers/job-openings?location=London'],
  },
  {
    name: 'AlixPartners London',
    logo: 'https://logo.clearbit.com/alixpartners.com',
    urls: ['https://www.alixpartners.com/careers/open-positions/?location=London'],
  },
  {
    name: 'Capgemini London',
    logo: 'https://logo.clearbit.com/capgemini.com',
    urls: ['https://www.capgemini.com/gb-en/careers/job-search/?job_type=Intern&location=London'],
  },
  {
    name: 'IBM Consulting London',
    logo: 'https://logo.clearbit.com/ibm.com',
    urls: ['https://www.ibm.com/uk-en/employment/students/'],
  },
  {
    name: 'Grant Thornton London',
    logo: 'https://logo.clearbit.com/grantthornton.co.uk',
    urls: ['https://www.grantthornton.co.uk/careers/student-and-graduate-programmes/'],
  },
  {
    name: 'Mazars London',
    logo: 'https://logo.clearbit.com/mazars.co.uk',
    urls: ['https://www.mazars.co.uk/Home/Careers/Current-opportunities'],
  },
  {
    name: 'RSM London',
    logo: 'https://logo.clearbit.com/rsmuk.com',
    urls: ['https://www.rsmuk.com/careers/student-opportunities'],
  },
  {
    name: 'BDO London',
    logo: 'https://logo.clearbit.com/bdo.co.uk',
    urls: ['https://www.bdo.co.uk/en-gb/careers/students'],
  },
  {
    name: 'Forvis Mazars London',
    logo: 'https://logo.clearbit.com/forvismazars.com',
    urls: ['https://www.forvismazars.com/gb/en/careers/current-vacancies'],
  },
  {
    name: 'Aon London',
    logo: 'https://logo.clearbit.com/aon.com',
    urls: ['https://careers.aon.com/search-jobs?keywords=intern&location=London'],
  },
  {
    name: 'Willis Towers Watson London',
    logo: 'https://logo.clearbit.com/wtwco.com',
    urls: ['https://careers.wtwco.com/search/?q=intern&location=London'],
  },
  {
    name: 'Mercer London',
    logo: 'https://logo.clearbit.com/mercer.com',
    urls: ['https://careers.mercer.com/search/?q=intern&location=London'],
  },
  {
    name: 'S&P Global London',
    logo: 'https://logo.clearbit.com/spglobal.com',
    urls: ['https://careers.spglobal.com/jobs?location=London&keywords=intern'],
  },
  {
    name: "Moody's London",
    logo: 'https://logo.clearbit.com/moodys.com',
    urls: ['https://careers.moodys.com/jobs?location=London&keywords=intern'],
  },
  {
    name: 'Fitch Ratings London',
    logo: 'https://logo.clearbit.com/fitchratings.com',
    urls: ['https://jobs.fitchgroup.com/search/?q=intern&location=London'],
  },
  {
    name: 'MSCI London',
    logo: 'https://logo.clearbit.com/msci.com',
    urls: ['https://careers.msci.com/search/?q=intern&location=London'],
  },
  {
    name: 'Bloomberg London',
    logo: 'https://logo.clearbit.com/bloomberg.com',
    urls: ['https://careers.bloomberg.com/job/search?el=student&loc=London'],
  },
  {
    name: 'Refinitiv / LSEG London',
    logo: 'https://logo.clearbit.com/lseg.com',
    urls: ['https://careers.lseg.com/search/?q=intern&location=London'],
  },
  {
    name: 'FactSet London',
    logo: 'https://logo.clearbit.com/factset.com',
    urls: ['https://careers.factset.com/search/?q=intern&location=London'],
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
          intern.location = intern.location || 'London, United Kingdom';
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
              location: location || 'London, United Kingdom',
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

module.exports = { scrape, name: 'London' };
