# M.S. Medical Store — Mobile app and subscription deployment

## Data storage decision: local only

- Pharmacy operational data (medicine inventory, batches, customers, sales, invoices, Udhaar, settings and reports) stays in the browser on the phone.
- The existing app currently uses browser localStorage. A future IndexedDB migration is recommended for larger datasets, but do it with a tested migration and backup path.
- No Supabase, Firebase, hosted pharmacy database, or cloud sync is used by this design.
- Clearing browser/site data, losing the phone, or uninstalling a browser can erase local records. Export backups regularly and store a copy somewhere safe.

## Why a tiny server is still used for paid subscriptions

Razorpay's secret key must never be placed in a mobile/browser app. The three small Vercel API routes below only create payment orders, verify captured payments directly with Razorpay, issue a signed license token, and check that token. They do not store or receive customer, medicine, invoice, prescription, inventory or Udhaar records.

### Environment variables (Vercel server-side only)

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `LICENSE_SIGNING_SECRET` — random secret of at least 32 characters

Never put either secret in a `VITE_*` variable or frontend source code.

## API routes

- `POST /api/billing/order`: body `{ "storeName": "M.S. Medical Store", "plan": "monthly|annual_vip|enterprise" }`. Returns Razorpay Checkout order details.
- `POST /api/billing/verify`: body with Razorpay Checkout's `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. Server checks signature, fetches the order and payment from Razorpay, checks captured status, exact amount, currency, product and store/plan notes, then issues a signed license token.
- `POST /api/license/verify`: body `{ "licenseToken": "..." }`. Checks signature and expiry.

The subscription modal now calls the order endpoint, opens Razorpay Checkout, verifies the returned payment server-side, and stores the signed license token locally. The app revalidates saved tokens at startup when online; an invalid token marks the store license expired. Temporary network failures preserve the last locally stored state. A token saved in local storage is not itself proof of payment.

## Plans

- Pro Monthly: ₹999 + 18% GST (if applicable; confirm with accountant)
- Annual VIP: ₹9,999 + 18% GST (if applicable; confirm with accountant)
- Enterprise: ₹24,999 + 18% GST (if applicable; confirm with accountant)

Confirm applicable GST treatment and invoice requirements with a qualified accountant before live billing.

## Remaining release work

This branch includes the subscription checkout integration but is not a finished production release. Before launch:
- Add server-side entitlement enforcement for paid-only features and define a documented offline grace-period policy.
- Add subscription status/expiry UI and a tested renewal/refund/support workflow.
- Test checkout in Razorpay test mode, including payment failure, cancellation, duplicate callbacks, renewal and expired-license scenarios.
- Add IndexedDB migration from existing localStorage without losing current store records.
- Harden app lock, backup/restore, data validation, and audit history for local operations.
- Test Android Chrome installation, small screens, print/share receipt, payment failures, double-submit, renewals, expired licenses, browser storage clearing and phone-loss restore.
- Configure Razorpay KYC, settlement bank account, live credentials and webhook reconciliation before live sales.
- Verify pharmacy, prescription, invoice, GST, privacy and record-retention requirements with qualified professionals.

Do not use the app as the only record for live medicine sales until operational workflows and recovery have been validated with the pharmacy owner.
