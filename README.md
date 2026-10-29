# M.S. Medical Store App

A responsive medical-store management app being prepared for **M.S. Medical Store, Una, Gujarat**.

## Storage decision

- **No Supabase, Firebase, or cloud database.**
- The current app stores records in browser-local storage on the device/browser where it is used.
- The same app can be installed/opened on Windows and Android using the same deployed HTTPS app.
- **Important:** local data is separate on each device. A sale entered on the Windows PC will not automatically appear on the phone unless a future device-to-device transfer/sync feature is implemented.
- Back up records before clearing browser data or reinstalling the browser/app.

## Current status — prototype, not production-ready

The repository currently contains a React + Vite responsive dashboard and installable PWA shell. Existing dashboard areas include customers, stock, orders, expiry, credit/udhaar, reminders and settings. Some areas contain demo/sample data and simulated actions. This is not yet a verified live-billing system.

Before real shop use, the project still needs a verified billing flow, batch-wise stock deduction, invoice/receipt validation, local backup/restore, removal of fictional demo records, error handling and build/device testing.

**Do not use the current prototype as the sole record for real medicine sales or customer/patient information until those checks are completed.**

## Run locally

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm run dev` for development.
4. Run `npm run lint` and `npm run build` before deployment.

## Install on Windows and Android

Deploy the built app to an HTTPS host, then open that same app URL in Chrome on Windows and Android. Use **Install app** / **Add to Home screen** where available.

This shares the same application interface, **not the local records** between devices. Cloud sync is intentionally not part of this build. A later no-cloud option could transfer data using an exported backup file or a local-network transfer service.

## Privacy and backups

Do not put API secrets in frontend environment variables. Export and store backups somewhere safe; local browser storage can be lost if site data is cleared, the browser profile is removed, or the device fails.
