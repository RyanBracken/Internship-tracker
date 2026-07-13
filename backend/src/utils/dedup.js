const crypto = require('crypto');

const STOP_WORDS = new Set(['internship','intern','graduate','programme','program','dublin','ireland','the','and','or','for','in','at','of','a','an']);

function normalise(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .sort()
    .join(' ');
}

function fingerprint(internship) {
  const key = `${normalise(internship.title)}|${normalise(internship.company)}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

module.exports = { fingerprint, normalise };
