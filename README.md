# LOCUS — University Navigator

Personal university discovery and admissions guidance for high school students. Built for LOCUS Startup Hackathon 2026, Case 2.

A student completes an eight-step diagnostic profile and gets:

- **Portfolio diagnostics** across seven dimensions, with plain-language explanations
- **Dream / Target / Safety recommendations** with match scores, financial fit, "why it fits" and "main gap"
- **Admission estimates** as ranges with confidence, positive and negative factors, and stated assumptions
- **Natural-language catalog search** that turns a sentence into editable filters
- **University profiles, side-by-side comparison, scholarship matching and professor discovery**
- **A gamified roadmap** with levels, XP and locked tasks, plus one clearly highlighted next action
- **An application workspace** per university, a context-aware AI mentor, and low-noise notifications

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 base layer + CSS Modules, Framer Motion |
| Auth and data | Supabase (email and Google auth, Postgres with row-level security) |
| AI | Claude (`claude-opus-5`) via `@anthropic-ai/sdk` for the mentor, search parsing and diagnostic narrative |
| ML | Python + scikit-learn logistic regression, exported to JSON and scored in TypeScript |
| Deploy | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs without any keys:

- **No Supabase keys** → accounts run in local demo mode and state is saved in the browser.
- **No Anthropic key** → the mentor, search and diagnostics fall back to deterministic rule-based logic, and the UI labels them as rule-based.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enables real accounts and cloud sync |
| `ANTHROPIC_API_KEY` | Enables Claude for the mentor, natural-language search and diagnostic narratives |

### Supabase

1. Create a project and run `supabase/schema.sql` in the SQL editor.
2. Enable the Email and Google providers under Authentication.
3. Add `https://<your-domain>/auth/callback` as a redirect URL.

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
src/lib/ai/              Claude client, student context builder, rule-based mentor
src/lib/store/           client state, persistence, derived selectors
src/lib/supabase/        auth and sync
supabase/schema.sql      relational schema with RLS
ml/                      model training
```

## Deploying to Vercel

Import the repository and add the environment variables above. No other configuration is needed.
