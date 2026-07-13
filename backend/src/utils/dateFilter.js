const VALID_YEARS = [2026, 2027, 2028];

function parseStartYear(startDate) {
  if (!startDate) return null;
  const yearMatch = startDate.match(/\b(202[5-9]|203\d)\b/);
  if (yearMatch) return parseInt(yearMatch[0]);
  return null;
}

function isValidStartYear(startDate) {
  if (!startDate) return true; // keep if no date — will be reviewed
  const year = parseStartYear(startDate);
  if (!year) return true; // can't parse — keep it
  return VALID_YEARS.includes(year);
}

function isExpired(dateExpires) {
  if (!dateExpires) return false;
  return new Date(dateExpires) < new Date();
}

module.exports = { isValidStartYear, isExpired, parseStartYear };
