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
- **Google Gemini API & Supabase Integration**: Deep AI intelligence via `@google/genai` and cloud persistence via Supabase Postgres with Row Level Security.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 base layer + CSS Modules, Framer Motion |
| Auth & Data | Supabase (Postgres, RLS, Email & Google Auth) |
| AI | Google Gemini API (`@google/genai`) with fallback engine |
| Deploy | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key |
| `GEMINI_API_KEY` | Google Gemini API key for AI intelligence |
