# Meridian Guide — Production University Admissions Platform

Built by team **Flaxyss**, **Meridian Guide** is a full-featured, localized university admissions platform designed for high school students.

## Features & Modules

- **Trilingual Native Localization (EN / KZ / RU)**: Full UI, onboarding, and mentor response localization across English, Kazakh, and Russian.
- **Major-Specific Extracurricular Recommender**: Activity recommendation engine targeting gaps in CS, AI, Economics, Business, Medicine, and Engineering with 1-Click Add to Roadmap.
- **Deadline Calendar & Smart Notifications**: Interactive calendar tracking application cutoffs, standard exams (SAT, IELTS, TOEFL, ACT), and scholarship windows with proactive alerts.
- **AI Video Interview Simulator**: Live camera & microphone mock interview module with real-time speech cadence (WPM), audio clarity, and stress/nervousness detection, evaluated by Google Gemini API.
- **Financial & Legal Document Sorting Wizard**: Automated Document Vault workspace sorting files into Family Income, Tax, Health Insurance, Bank Statements, and Passports with compliance status badges.
- **Chance Boost Diploma Upload Modal**: Gamified celebration popup when uploading certificates/diplomas with multi-color confetti and dynamic admission probability boost.
- **True Cost Calculator (Expanded)**: Out-of-pocket financial forecasting for tuition, housing, health insurance, visa fees, air travel, and living expenses with multi-currency support ($ USD, ₸ KZT, € EUR, £ GBP) and animated SVG breakdown charts.
- **Pomodoro Focus Timer & Apple Fitness Progress Rings**: Floating focus timer tied directly to roadmap tasks and concentric SVG activity rings for tasks, focus hours, and milestones.
- **AI Psychologist & Burnout Eco-Mode**: Empathetic CBT-grounded counseling in the AI Mentor alongside a global Eco-Mode toggle that mutes contrast, reduces stress, and provides box breathing guidance.
- **OpenAI, Gemini & Supabase Integration**: AI guidance with OpenAI and optional Gemini fallback, plus cloud persistence via Supabase Postgres with Row Level Security.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 base layer + CSS Modules, Framer Motion |
| Auth and data | Supabase (email and Google auth, Postgres with row-level security) |
| AI | OpenAI (`OPENAI_API_KEY`, `OPENAI_MODEL`, default `gpt-5.4-mini`) for the mentor, search, diagnostics, document import, interview feedback, activity ideas and essay help; Gemini is an optional fallback |
| University directory | 10,000+ universities from an open dataset or your own API, seeded into Supabase |
| ML | Python + scikit-learn logistic regression, exported to JSON and scored in TypeScript |
| Deploy | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs without any keys:

- **No Supabase keys** → accounts run in local demo mode and state is saved in the browser.
- **No working AI key** → the mentor, search and diagnostics fall back to deterministic rule-based logic, and the UI labels them as rule-based.
- **Empty `university_directory` table** → the directory API reads the open dataset live and caches it in memory.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Enables real accounts and cloud sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used by the seeding script; never expose it to the browser |
| `GEMINI_API_KEY` | Optional Google Gemini fallback for AI modules |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Enables AI mentor, natural-language search, diagnostic narratives and document import |
| `UNIVERSITIES_SOURCE_URL`, `UNIVERSITIES_SOURCE_NAME`, `UNIVERSITIES_API_KEY` | Optional custom university API (Bearer auth, array or paginated `data`/`results` + `next`) |

### Supabase

1. Create a project and run the files in `supabase/migrations/` in order in the SQL editor.
2. Enable the Email and Google providers under Authentication.
3. Add `https://<your-domain>/auth/callback` as a redirect URL.

## University directory (10,000+)

```bash
npm run seed:universities
```

The script fetches every page from the source, normalises and de-duplicates records, and upserts them into `university_directory` in batches of 500. `GET /api/universities?q=&country=&page=` serves paginated results (database first, live dataset as fallback); the Universities page renders them with debounced search, a country filter and infinite scroll.

## AI features

| Endpoint | What it does |
| --- | --- |
| `POST /api/mentor` | Streams mentor replies grounded in the student's computed context |
| `POST /api/search` | Turns a natural-language query (any language) into structured filters |
| `POST /api/diagnostics` | Writes a short portfolio review from computed diagnostics |
| `POST /api/ai/import` | Reads a transcript, test report, certificate or CV (PDF, image, TXT), extracts scores and activities, and sorts activities by level |

## Admission model

`ml/train_admission_model.py` trains a logistic regression and writes coefficients, 40 bootstrap refits and evaluation metrics to `src/lib/engine/admission-model.json`. The app scores that model in `src/lib/engine/prediction.ts` and reports ranges from the bootstrap spread, widened for missing or unverified inputs.

```bash
python3 -m venv ml/.venv
ml/.venv/bin/pip install -r ml/requirements.txt
ml/.venv/bin/python ml/train_admission_model.py
```

**The current model is trained on simulated applicants.** It works as a transparent prototype, not a calibrated predictor. Because of that, confidence is capped at "medium". Replace the simulator with real, consented outcome data before you rely on the numbers.

## Data transparency

Every institutional value (tuition, acceptance rate, English minimums, deadlines, aid policy, scholarships) is a `Sourced<T>` that carries `source_name`, `source_url`, `last_verified`, `confidence` and a status:

- `reported`: taken from the institution's published figures
- `needs_verification`: plausible but not yet confirmed. The UI flags it.
- `unavailable`: the UI shows "Information unavailable" instead of guessing

`last_verified` is `null` for all seed data because no one has run a verification pass yet. Before a public launch, check each value against its source URL and set the date.

The UI labels each type of content separately: institutional data, ML estimates, AI explanations and rule-based guidance.

## Project layout

```
src/app/                 routes (landing, auth, onboarding, app pages, API routes)
src/components/          UI primitives, layout shell, onboarding, university, mentor
src/lib/data/            universities, scholarships, professors with source metadata
src/lib/engine/          diagnostics, prediction, matching, search, roadmap, notifications
src/lib/ai/              OpenAI and Gemini clients, student context builder, rule-based mentor
src/lib/store/           client state, persistence, derived selectors
src/lib/supabase/        auth and sync
supabase/schema.sql      relational schema with RLS
ml/                      model training
```

## Deploying to Vercel

Import the repository and add the environment variables above. No other configuration is needed.
