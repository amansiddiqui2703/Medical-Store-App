# Refill Desk

Refill Desk is a single-device, local-first pharmacy workflow pilot from Automindz Digital Labs. It is currently being trialled with M.S. Medical Store, Una, Gujarat.

## What is included in this pilot

- Responsive web app and installable PWA shell.
- Customer and refill records.
- Medicine stock and batch tracking, including expiry visibility.
- Order workflow and batch-aware completed-sale flow.
- Udhaar balance and transaction history.
- Refill reminder drafts/logs (the app does **not** automatically send WhatsApp messages).
- JSON backup export and restore. Before restoring, the app downloads a safety backup of current records.
- Data is stored in the browser's local storage on one device/browser profile. There is no cloud database, multi-user login, or cross-device sync.

## Pilot price

The intended pilot price is **₹999 per month**. This is a proposed commercial price, not an active in-app checkout. Paid activation is disabled until a payment provider and server-side verification are implemented. Do not collect a payment by asking a customer to enter a transaction reference into the app.

## Important limitations

This is a pilot/prototype, not a certified pharmacy billing, accounting, or clinical system.

- Local browser data may be lost if site data is cleared, the browser profile is reset, or the device is lost/damaged. Export JSON backups frequently and keep copies separately.
- A JSON export is not automatically encrypted. Store backup files securely; they may contain sensitive customer information.
- The reminder workflow prepares drafts/logs only. No WhatsApp API connection or automatic message delivery is included.
- Receipts are operational receipts, not GST/tax invoices.
- The app does not provide pharmacist identity verification, user roles, audit-grade records, or regulatory compliance certification.
- Validate medicine stock, batch, expiry, customer balances, and totals before relying on any record.
- Do not store real prescription or sensitive patient data until a qualified privacy/security review and appropriate safeguards are completed.
- The current paid checkout is disabled. ₹999/month is not yet purchasable inside the app.

## Local development and checks

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm run dev`.
4. Run `npm run check` for type-checking, server tests and production build.

## Release checklist before taking live pharmacy data or subscription payments

- Test Android Chrome and desktop Chrome, install/update PWA, printing, refresh, offline and reconnect behavior.
- Test stock deduction, expired batches, insufficient stock, duplicate line items, repeat submission, cancellations and backup restore using disposable test data.
- Confirm data retention, deletion, backup protection and customer privacy notices.
- Have the pharmacy owner/accountant review applicable drug-sale, prescription, record-keeping, GST and invoice requirements.
- Add a payment provider with server-side payment verification, webhook signature checks, idempotency, refund handling and proper tax/accounting review before enabling paid activation.
- Add authentication, access controls, audit logs and a durable database before offering multi-user or multi-device operation.

## Suggested safe pilot

Demonstrate with demo data first. If a store wants to trial it, onboard one device, make a JSON backup before entering any data, and test the full workflow with non-sensitive test records. Do not represent unavailable features as included.
