# M.S. Medical Store App

A responsive medical-store management app being prepared for **M.S. Medical Store, Una, Gujarat**.

## No-cloud sync design (in progress)

- No Supabase, Firebase, or hosted cloud database is used by this sync layer.
- Each device keeps its working records in its own browser storage, so the phone can continue to be used while the Windows PC is off.
- A private sync server on the Windows PC stores a JSON snapshot on the PC's own disk.
- When the Windows PC/server is reachable again, the app checks for sync every 30 seconds and also retries when the browser comes online.
- If both devices changed since the last sync, the app refuses to overwrite either side and reports a conflict. Export backups and resolve this safely before trying again.
- The Windows PC must be on and reachable for remote sync to happen. While it is off, changes remain only on the device where they were entered.
- The private server is a prototype sync transport, not a fully validated medical-record database. Do not use this app as the sole record for real sales/patient data until the complete app is tested.

## Private server setup (Windows)

1. Install Node.js LTS and run `npm install` in this repository.
2. Create a long random sync secret (at least 24 characters). Keep it private.
3. In PowerShell, from the project folder, set the secret for the current terminal session and start the server:

   ```powershell
   $env:SYNC_TOKEN = "replace-this-with-a-long-random-secret"
   npm run sync-server
   ```

4. The server listens on port 8787 and writes its data to `data/medical-store-sync.json` on the Windows PC. Backups are created before later updates.
5. For remote access without a cloud database, connect both devices to a private network such as Tailscale. Prefer an HTTPS private URL/reverse proxy for the server; do not expose port 8787 directly to the public internet.
6. In the app, tap **Private Sync**, enter the private server URL and the same sync token. Keep the token private and do not share it with anyone.

## Important first pairing rules

- If the server is empty, the first configured device can initialize it with its local snapshot.
- If the server already contains data and the device also contains data, the app stops and asks for a backup/primary-device decision. It does not silently merge or overwrite existing records.
- A sync conflict means no data was overwritten. Export a backup from each device before resolving it.
- Browser local storage can be lost if browser data is cleared, the browser profile is removed, or the device fails. Maintain separate backups.

## Current app status — prototype, not production-ready

The repository contains a React + Vite responsive dashboard and installable PWA shell. Existing dashboard areas include customers, stock, orders, expiry, credit/udhaar, reminders and settings. Some areas still contain fictional demo data or simulated actions.

Before real shop use, the project still needs removal of all fictional records, verified billing and batch-wise stock deduction, invoice/receipt validation, backup/restore testing, device/build testing, stronger authentication and a reviewed conflict-resolution workflow.

**Do not use the current prototype as the sole record for real medicine sales or customer/patient information.**

## Run locally

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npm run dev` for development.
4. Run `npm run lint` and `npm run build` before deployment.

## Privacy

Sync data is written to the Windows PC's local disk; this does not use a cloud database. The private sync token is stored in the browser on each configured device, so protect the devices and never expose the server publicly.
