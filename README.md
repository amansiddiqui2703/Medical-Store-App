# M.S. Medical Store App

Medical-store management prototype for M.S. Medical Store, Una, Gujarat. The goal is one online workspace that can be opened on Android and Windows, with data shared across devices.

## Current status — prototype, not production-ready

- React + Vite responsive web app; PWA install metadata has been added for phone/desktop installation.
- Supabase Auth sign-up/sign-in gate is scaffolded.
- The current dashboard still stores business records in browser `localStorage`. Shared business-data sync is **not implemented yet**.
- Existing `src/data/seedData.ts` contains fictional demo data. After login, use only the clearly marked prototype preview.
- The initial SQL migration is a starting point, not a validated production database. Checkout, stock deduction, invoice numbering, GST validation, role-based access, sync/conflict handling, backup/restore, and end-to-end tests remain incomplete.

**Do not use this version for live medicine billing or real patient/customer data.** This project must pass the launch gates in `docs/PRODUCTION_READINESS.md` before a real store uses it.

## Planned free-first architecture

- Frontend: React + Vite, responsive PWA for Android and Windows browsers.
- Authentication and shared database: Supabase Auth + PostgreSQL with row-level security (RLS).
- Each store's records must be scoped to its authenticated store membership.
- Offline billing is intentionally out of scope for the current version.
- Free plans can have quotas, pauses, and backup/uptime limitations; free hosting is not a guarantee.

## Setup

1. Create a Supabase project at https://supabase.com/.
2. Review the SQL migration and apply it only to a **new test project**.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or publishable key).
4. Run `npm install`, `npm run lint`, and `npm run build`.
5. The auth gate should appear once configured. Do not treat a successful login as proof that dashboard data sync is connected.

## Install on phone / Windows

After the app is deployed to an HTTPS URL, open it in Chrome on Android or Windows and use the browser's **Install app** / **Add to Home screen** option if offered. The current service worker is network-only; it does not cache business data or provide offline billing.

## Secret handling

- A publishable/anon key is meant for browser use only when RLS and database grants are correct.
- Never put a service-role/secret key in `VITE_*` variables; Vite embeds them into browser assets.
- Never share or commit a database password, service-role key, GitHub token, WhatsApp token, or payment secret. Rotate any secret that was exposed.

## Key files

- `src/AuthGate.tsx` — authentication/setup gate and explicit demo-preview warning.
- `src/lib/supabase.ts` — browser client bootstrap.
- `public/manifest.webmanifest` — install metadata.
- `public/sw.js` — network-only service worker (no offline data cache).
- `supabase/migrations/202610290001_initial_schema.sql` — initial schema foundation.
- `docs/PRODUCTION_READINESS.md` — audit and launch gates.
