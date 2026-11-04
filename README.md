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

The proposed future paid plan is **₹999 / 30 days**, but paid subscriptions are currently unavailable and the app does not request or accept payment. Do not transfer money or advertise paid activation yet. A secure signed license issuer/verifier and server-side payment verification must be completed and tested before paid plans are enabled. The pilot does not generate a GST/tax invoice; confirm tax treatment with a qualified accountant before any commercial launch.

## Important limitations

This is a pilot/prototype, not a certified pharmacy billing, accounting, or clinical system.

- Local browser data may be lost if site data is cleared, the browser profile is reset, or the device is lost/damaged. Export JSON backups frequently and keep copies separately.
- A JSON export is not automatically encrypted. Store backup files securely; they may contain sensitive customer information.
- The reminder workflow prepares drafts/logs only. No WhatsApp API connection or automatic message delivery is included.
- Receipts are operational receipts, not GST/tax invoices.
- The app does not provide pharmacist identity verification, user roles, audit-grade records, or regulatory compliance certification.
- Validate medicine stock, batch, expiry, customer balances, and totals before relying on any record.
- Do not store real prescription or sensitive patient data until a qualified privacy/security review and appropriate safeguards are completed.
- Paid checkout and subscription activation are disabled. Do not collect payments for this build.

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
