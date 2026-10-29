# Medical Store App

Medical-store management app for M.S. Medical Store, Una, Gujarat, with a future multi-store SaaS goal.

## Current status — not yet production-ready

The current UI is a React + Vite application. The existing app persistence in `src/services/storage.ts` uses browser `localStorage` and `src/data/seedData.ts` contains fictional demo data. The Supabase migration in `supabase/migrations/` is an initial database foundation; the UI is **not yet wired to Supabase**, and transactional checkout, stock deduction, invoice numbering, GST validation, role-based screens, backup/restore and end-to-end tests still need implementation.

**Do not use this version for live medicine billing or real customer/patient data.** Use only a test store and fictional data until the launch gates in `docs/PRODUCTION_READINESS.md` pass.

## Planned free-first setup

- Frontend: Vite/React.
- Data and sign-in: Supabase Auth + PostgreSQL with row-level security (RLS).
- Each store's business data is scoped by `store_id`.
- Use a separate test project first. Free hosting/database plans can pause or have usage/storage limits; they are not an uptime or backup guarantee.

## Setup

1. Create a Supabase project at https://supabase.com/.
2. Open the SQL Editor and apply `supabase/migrations/202610290001_initial_schema.sql` to a **new test project only**. Review and test the migration before using it anywhere with real data.
3. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (or Supabase publishable key)
4. Install dependencies with `npm install`, then run `npm run lint` and `npm run build`.
5. Authentication and the UI's data layer must be connected and tested before a real store can use it.

## Secret handling

- A Supabase publishable/anon key is designed for browser use only when RLS and grants are correct.
- Never share or commit a Supabase secret/service-role key, database password, GitHub token, WhatsApp access token or payment secret.
- Do not put privileged secrets in `VITE_*` variables; Vite embeds those values into browser assets.
- Do not paste API keys or passwords into chat. If a secret was exposed, rotate it.

## Useful files

- `supabase/migrations/202610290001_initial_schema.sql` — initial multi-tenant database schema and policies.
- `docs/PRODUCTION_READINESS.md` — audit findings and launch gates.
