# M.S. Medical Store — SaaS billing foundation

This branch adds a server-side Razorpay order and payment-verification foundation plus a Supabase tenant/billing schema. It is **not a complete production SaaS release** and does not replace app authentication or migrate the current localStorage business screens.

## Architecture

- Mobile-first web app: existing React/Vite PWA.
- Identity and tenant database: Supabase Auth + PostgreSQL.
- Billing: Razorpay Checkout order creation and server-side signature + captured-payment verification.
- Subscription activation: database RPC, restricted to Supabase service role.
- No Razorpay secret or Supabase service-role key may be exposed to browser code.

## Deployment prerequisites

1. Create a Supabase project and enable email authentication.
2. Apply `supabase/migrations/202611030001_saas_billing_core.sql`.
3. Deploy the app to Vercel (the `api/` routes are Vercel Node functions).
4. Add these Vercel server-side environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; never prefix with VITE_)
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET` (server only)
5. Configure Razorpay account KYC, settlement bank account, business details, tax settings and live keys before taking real payments. Use test keys first.
6. Confirm the deployed endpoints are `/api/billing/order` and `/api/billing/verify`.

## API contract

Both endpoints require a Supabase access token in `Authorization: Bearer <access-token>`.

- `POST /api/billing/order` body: `{ "storeId": "<Supabase UUID>", "plan": "monthly|annual_vip|enterprise" }`. Returns Razorpay order details and public key ID.
- `POST /api/billing/verify` body: Razorpay Checkout response fields `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. The server validates the HMAC, fetches the payment directly from Razorpay, checks captured status/currency/amount, and invokes an idempotent database RPC.

Plan prices are ₹999/month, ₹9,999/year and ₹24,999/year **before 18% GST**. Confirm tax applicability and invoice treatment with a qualified accountant before enabling live checkout.

## Mandatory integration work before public launch

The existing application still stores its operational data in browser localStorage and currently has no Supabase sign-in/store onboarding flow. The current store IDs are local string IDs, while this schema deliberately uses UUIDs. Before enabling subscriptions in the app UI:

- Implement Supabase sign-up/sign-in, password reset, session refresh and sign-out.
- Replace local-only store onboarding with authenticated rows in `public.stores`; never trust a store ID supplied by the browser without checking ownership.
- Migrate inventory, batches, customers, invoices, sales, payments, credit ledger and audit events to tenant-scoped PostgreSQL tables with RLS.
- Implement atomic server-side sale checkout, batch-level stock deduction, invoice numbering, idempotency and audit trail.
- Wire the subscription UI to the two billing endpoints and load entitlement state from `store_subscriptions`; do not activate a plan based on a typed UPI reference.
- Add webhook handling with a configured Razorpay webhook secret, refund/cancellation handling, reconciliation and subscription-expiry enforcement.
- Test authorization boundaries, replay/double-submit, payment failure, delayed capture, refund, GST rounding and cross-tenant access.

## Release warning

Do not use the existing localStorage data store as the sole source of truth for multiple customers or as a public SaaS database. Do not collect live patient/prescription data or rely on the app for regulated medicine billing until authentication, tenant isolation, transactional billing, backups/restore, privacy review, accounting/legal validation and real Android-device testing have passed.
