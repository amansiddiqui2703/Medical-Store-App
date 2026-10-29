# Production Readiness Workstream

## Current baseline (audited 29 Oct 2026)
- Frontend: React 19 + Vite 8 + TypeScript.
- The current persistence layer in `src/services/storage.ts` uses browser `localStorage` and initializes from `src/data/seedData.ts`.
- Seed data currently contains fictional stores, customer records, inventory and invoices. It must not be treated as real pharmacy data.
- The UI is primarily a refill/order/credit dashboard; full POS checkout, batch-aware stock deduction, GST invoice validation, secure multi-user authentication and server-side backups still need implementation and testing.
- A `GEMINI_API_KEY` is shown in `.env.example`; browser-exposed API keys must never be used for privileged operations.

## Target architecture
- Supabase Auth + PostgreSQL with Row Level Security for multi-store SaaS tenancy.
- All business records scoped by `store_id`; staff membership roles enforced in database policies.
- Transactional server-side checkout, FEFO batch selection, stock movement ledger, invoice snapshots and audit trail.
- No production use of demo seed data. New store onboarding must create a real tenant only after authenticated sign-up.
- Automated database backups/export and a documented restore drill before live billing.
- CI build/typecheck plus functional tests for invoice totals, tax rounding, expiry and concurrent stock updates.

## Initial migration
`supabase/migrations/202610290001_initial_schema.sql` creates a baseline tenant-aware schema and RLS policies. It is a foundation, not a complete checkout implementation. Review and test it in a new Supabase project before applying to production. Checkout must be implemented as a database transaction/RPC before using this schema for live sales.

## Launch gate
Do not use for real medicine billing until authentication, store isolation, checkout transactionality, invoice numbering, GST/tax configuration, backup/restore, staff permissions and printer workflow have passed tests using a non-production test store.
