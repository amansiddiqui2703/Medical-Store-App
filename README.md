# M.S. Medical Store App

A responsive medical-store management app being prepared for **M.S. Medical Store, Una, Gujarat**.

## Current status

This repository is a **development prototype, not production-ready for live pharmacy records**. The latest development branch includes structured batch billing, local backups, an optional private sync prototype, and automated type-check/server tests/frontend build. A passing CI run is useful evidence, but it does not replace real device, security, privacy, accounting, or pharmacy workflow testing.

## Features in the prototype

- Responsive React + Vite dashboard and installable PWA shell.
- Customer records, medicine batches, orders, expiry tracking, credit/udhaar, reminder logs and backup/restore UI.
- Fresh customer, stock, order and payment lists start empty; the app must not seed fake patient, medicine, sale or payment records.
- The Create Bill flow requires actual in-stock, unexpired batches, validates quantities/prices, and deducts the selected batches when a sale is completed.
- Receipts show saved batch-wise sale lines and offer browser print/save-PDF.
- Reminder actions currently prepare/log drafts only; they do not send WhatsApp messages automatically.
- Paid subscription checkout is disabled until a real payment provider, server-side verification, webhook signature validation, refunds, and tax/accounting workflow are implemented.

## Local development

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm run dev` for development.
4. Run `npm run check` to type-check, test the sync server, and build the frontend.

## Optional private sync server (prototype only)

The sync service stores a JSON snapshot on the Windows PC. It is **not** a durable multi-user database and does not provide user accounts, role permissions, full conflict merging, or a tested recovery guarantee.

1. Install Node.js LTS and run `npm install` in this repository.
2. Create a long random secret of at least 24 characters. Keep it private.
3. In PowerShell, from the project folder:

   ```powershell
   $env:SYNC_TOKEN = "replace-this-with-a-long-random-secret"
   npm run sync-server
   ```

4. By default, the server binds to `127.0.0.1` only. This secure default means only the Windows PC itself can connect.
5. For another device, do **not** expose port 8787 to the public internet. Configure a specific trusted private-interface address using `SYNC_HOST`, restrict it with the Windows firewall, and use a private network plus HTTPS for remote access. Configure `SYNC_ALLOWED_ORIGINS` to the exact app origin(s). A private network or token alone is not a substitute for a complete security review.
6. In the app, tap **Private Sync**, enter the private server URL and the same sync token. Keep the token private.

### Pairing and backups

- If the server is empty, the first configured device can initialize it with its local snapshot.
- If both the server and device contain data, the app stops and asks for a backup/primary-device decision. It does not silently merge or overwrite records.
- A sync conflict means no data was overwritten. Export a backup from each device before resolving it.
- Browser local storage can be lost if browser data is cleared, the browser profile is removed, or the device fails.
- Verify backup restoration on a separate device and keep a second encrypted copy somewhere separate from the PC.

## Production release gate — required before live use

Do **not** use this prototype as the sole record for real medicine sales, inventory, accounting, or customer/patient information until all relevant items below are completed and verified:

- Replace browser localStorage and JSON snapshot sync with a durable, access-controlled database and tested migration/recovery plan for any multi-user or multi-device production deployment.
- Implement strong authentication, least-privilege roles, audit trails, session/token rotation, and secure secret handling.
- Test the full sale workflow with disposable test data: expired batches, insufficient stock, duplicate lines, repeated submit/double-click, cancelled orders, refresh, and backup restore.
- Test Windows and Android browsers, PWA installation, printing, offline/reconnect behavior, and device-loss recovery hands-on.
- Review privacy notice, data minimization, prescription-file handling, retention/deletion, backup encryption, and incident response before storing real patient data.
- Have the pharmacy owner/accountant verify applicable drug-sale, prescription, record-keeping, GST and invoice requirements. This app does not certify legal compliance.
- Add dependency lockfile and run dependency/security scans; review and fix findings.
- If offering subscriptions, implement a real payment provider with server-side payment verification, webhook signature validation, idempotency, refunds, and appropriate accounting/tax processes. Never mark a plan paid based on a user-entered transaction reference.

## Known limitations

- Browser storage is not a secure multi-user database. Data can be lost when browser data is cleared or the device fails.
- Private sync is a prototype transport; it has no user roles, robust conflict merge, or proven disaster recovery.
- The receipt is not a GST/tax invoice. The subscription invoice screen is only a draft preview and does not establish payment or tax compliance.
- No real payment gateway is connected. Paid subscription plans cannot be activated from the checkout screen.
- No WhatsApp messages are sent by the reminder simulator.
- Prescription and customer data require privacy, security, retention, and backup review before real use.

**Recommended first use:** test with disposable data on one device, export backups frequently, and have the pharmacy owner validate every operational and legal requirement before relying on it for live sales.
