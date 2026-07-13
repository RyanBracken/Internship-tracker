const CATEGORIES = {
  'Finance': ['finance','financial','treasury','investment','asset management','fund','portfolio','wealth','capital markets','equity','derivatives','forex','trading','risk','quantitative'],
  'Accounting': ['accounting','accountant','bookkeeping','accounts payable','accounts receivable','management accounts','financial reporting','ifrs','gaap'],
  'Tax': ['tax','vat','corporation tax','transfer pricing','indirect tax','direct tax','stamp duty','r&d tax'],
  'Audit': ['audit','assurance','internal audit','external audit','statutory audit','sox','sarbanes'],
  'Banking & Investment': ['banking','bank','investment banking','corporate banking','retail banking','private banking','credit','lending','mortgage','capital'],
  'Economics': ['economics','economist','economic','macro','micro','econometrics','research analyst','market research','economic analysis'],
  'Business & Strategy': ['business','strategy','operations','management','project management','business analyst','corporate','commercial','sales','marketing','business development','supply chain','logistics','procurement'],
  'Consulting': ['consulting','consultant','advisory','management consulting','strategy consulting','transformation','change management'],
];

const ALL_FINANCE_KEYWORDS = [
  'finance','financial','accounting','accountant','tax','audit','banking','bank',
  'investment','economics','economist','consulting','consultant','advisory','treasury',
  'fund','portfolio','wealth','equity','trading','risk','assurance','business',
  'strategy','operations','commercial','analyst','credit','insurance','actuarial',
  'compliance','regulatory','governance','esg','sustainability','corporate',
];

function categorise(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => text.includes(k))) return cat;
  }
  return 'Business & Strategy';
}

function isRelevant(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  return ALL_FINANCE_KEYWORDS.some(k => text.includes(k));
}

module.exports = { categorise, isRelevant, CATEGORIES };
