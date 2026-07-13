# Dublin Finance & Business Internship Tracker

A full-stack web app that scrapes and aggregates internship listings for Dublin-based finance, accounting, business, and consulting roles — targeting 2027 and 2028 start dates.

## Features

- **Aggregates from 10+ sources**: LinkedIn, Indeed, Glassdoor, IrishJobs, GradIreland, RecruitIreland, ETRecruite, plus direct career pages for 25+ major Dublin employers
- **Direct company scrapers**: Bank of Ireland, AIB, Deloitte, PwC, KPMG, EY, Grant Thornton, BDO, Davy, Goodbody, State Street, Citi, JP Morgan, Goldman Sachs, Accenture, Capgemini, Stripe, Mastercard, Matheson, A&L Goodbody, ICON plc, CRH, Ryanair, and more
- **Smart filtering**: Discipline, salary, source type, company, keyword search
- **Application tracker**: Track status (Saved → Applied → Interview → Offer/Rejected), notes, applied date
- **Auto-deduplication**: Same role from multiple sources appears once
- **Scheduled scraping**: Runs daily at 03:00 Europe/Dublin via node-cron
- **Direct badge**: Listings sourced from company career pages get a "Direct" badge
- **Mobile responsive**: Works on all screen sizes
- **Dark mode**: System preference + manual toggle

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Scraping | Cheerio (static), Playwright (dynamic), JSON-LD extraction |
| Scheduler | node-cron |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server + cron scheduler
│   │   ├── db.js                 # SQLite connection
│   │   ├── migrate.js            # DB schema
│   │   ├── scraper-runner.js     # Orchestrates all scrapers + inserts to DB
│   │   ├── routes/
│   │   │   ├── internships.js    # GET /api/internships (with filters + pagination)
│   │   │   ├── applications.js   # CRUD /api/applications
│   │   │   └── scrape.js         # POST /api/scrape/trigger, GET /api/scrape/status
│   │   ├── scrapers/
│   │   │   ├── jobboards/        # LinkedIn, Indeed, Glassdoor, IrishJobs, GradIreland, RecruitIreland, ETRecruite
│   │   │   └── companies/        # BigFour (Deloitte/PwC/KPMG/EY/GT/BDO), Banks, Consulting firms
│   │   └── utils/
│   │       ├── categorise.js     # Finance/Accounting/Tax/Audit/etc. classifier
│   │       ├── dateFilter.js     # 2027/2028 start year filter
│   │       ├── dedup.js          # Fingerprint-based deduplication
│   │       └── scrapeHelpers.js  # fetchHtml, JSON-LD extraction, randomDelay
│   ├── data/                     # SQLite DB stored here (gitignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Browse.tsx        # Main internship feed with filters
│   │   │   ├── Applications.tsx  # Application pipeline tracker
│   │   │   └── ScraperStatus.tsx # Scraper control panel + logs
│   │   ├── components/
│   │   │   ├── layout/Navbar.tsx
│   │   │   ├── cards/InternshipCard.tsx
│   │   │   ├── cards/InternshipDetail.tsx
│   │   │   └── filters/FilterSidebar.tsx
│   │   ├── hooks/
│   │   │   ├── useInternships.ts
│   │   │   └── useStats.ts
│   │   ├── utils/
│   │   │   ├── api.ts            # Axios API client
│   │   │   └── format.ts         # Date formatting, category colours
│   │   └── types/index.ts
│   └── package.json
├── package.json                  # Root scripts
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
npm run install:all
# or manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env if needed (defaults work for local dev)

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Initialise the database

```bash
npm run migrate
# or: cd backend && node src/migrate.js
```

### 4. Run the app

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173

### 5. Run your first scrape

Either:
- Click **"Run scrape now"** on the Scraper Status page in the UI
- Or via CLI: `cd backend && node src/scraper-runner.js`

The initial scrape takes 10–30 minutes. Subsequent scheduled runs happen daily at 03:00 Dublin time.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | Environment |
| `DB_PATH` | `./data/internships.db` | SQLite database path |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `SCRAPER_PROXY_URL` | (empty) | Optional proxy for bypassing blocks |
| `RATE_LIMIT_MAX` | `200` | Max API requests per window |

## Deployment

### Backend (Railway / Render)

1. Push to GitHub
2. Create a new service pointing to the `backend/` folder
3. Set environment variables:
   - `PORT=3001`
   - `NODE_ENV=production`
   - `DB_PATH=/data/internships.db` (use a persistent disk/volume)
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
4. Start command: `node src/index.js`

**Important**: Railway and Render support persistent volumes — mount one at `/data` so the SQLite database survives redeploys.

### Frontend (Vercel)

1. Import the repo in Vercel, set root directory to `frontend/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
5. Update `vite.config.ts` to use `process.env.VITE_API_URL` for the proxy target in production, or configure `VITE_API_URL` as the axios base URL.

## Scraper Notes

- **robots.txt**: All scrapers check for and respect robots.txt conventions
- **Rate limiting**: Randomised 1.5–9 second delays between requests per scraper
- **JSON-LD first**: Where company career pages embed structured `JobPosting` data, that's used in preference to HTML parsing (more reliable)
- **Fallback chain**: JSON-LD → HTML selectors → RSS feed
- **Deduplication**: SHA-256 fingerprint of `normalised(title) | normalised(company)` — same role from different sources is inserted only once

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/internships` | List internships (supports `q`, `category`, `company`, `salary_type`, `source_type`, `sort`, `order`, `page`, `limit`) |
| GET | `/api/internships/stats` | Aggregate stats (counts by category, source, company) |
| GET | `/api/internships/:id` | Single internship detail |
| GET | `/api/applications` | List tracked applications |
| POST | `/api/applications` | Create/upsert application |
| PUT | `/api/applications/:id` | Update application status/notes |
| DELETE | `/api/applications/:id` | Remove application |
| POST | `/api/scrape/trigger` | Manually trigger scrape |
| GET | `/api/scrape/status` | Scrape status + recent logs |
| GET | `/api/health` | Health check |
