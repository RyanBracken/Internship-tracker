const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min = 2000, max = 6000) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function fetchHtml(url, options = {}) {
  await randomDelay(1500, 4000);
  const response = await axios.get(url, {
    headers: {
      'User-Agent': randomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers,
    },
    timeout: 15000,
    ...options,
  });
  return response.data;
}

function extractJsonLd(html) {
  const matches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  const results = [];
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1]);
      if (Array.isArray(data)) results.push(...data);
      else results.push(data);
    } catch {}
  }
  return results;
}

function extractJobPostingsFromJsonLd(jsonLdArray) {
  const jobs = [];
  for (const item of jsonLdArray) {
    if (item['@type'] === 'JobPosting') jobs.push(item);
    if (item['@graph']) {
      for (const g of item['@graph']) {
        if (g['@type'] === 'JobPosting') jobs.push(g);
      }
    }
  }
  return jobs;
}

function jsonLdToInternship(job, source, sourceType = 'direct') {
  const loc = job.jobLocation;
  const location = typeof loc === 'string' ? loc
    : loc?.address?.addressLocality || loc?.address?.addressRegion || 'Dublin, Ireland';

  const salary = job.baseSalary;
  let salaryText = null;
  let salaryType = 'not_stated';
  if (salary) {
    salaryType = 'paid';
    const val = salary.value;
    if (val?.minValue && val?.maxValue) {
      salaryText = `€${val.minValue.toLocaleString()} – €${val.maxValue.toLocaleString()} ${val.unitText || ''}`.trim();
    } else if (val?.value) {
      salaryText = `€${val.value.toLocaleString()} ${val.unitText || ''}`.trim();
    }
  }

  return {
    title: job.title || job.name,
    company: job.hiringOrganization?.name || source,
    company_logo: job.hiringOrganization?.logo || null,
    location,
    start_date: job.jobStartDate || null,
    duration: null,
    salary: salaryText,
    salary_type: salaryType,
    description: job.description,
    url: job.url || job['@id'],
    source,
    source_type: sourceType,
    date_posted: job.datePosted || null,
    date_expires: job.validThrough || null,
  };
}

module.exports = { fetchHtml, extractJsonLd, extractJobPostingsFromJsonLd, jsonLdToInternship, randomDelay, randomUserAgent };
