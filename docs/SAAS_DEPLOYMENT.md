# M.S. Medical Store — mobile app and manual subscription deployment

## Pharmacy data
- Pharmacy operational data stays in browser storage on the phone. No hosted pharmacy database or cloud sync is used.
- Current storage is localStorage. Export backups regularly; clearing browser data or losing the phone can erase records.
- IndexedDB migration and Android recovery testing remain release work.

## Subscription payments: manual UPI only
No Razorpay or other payment gateway is used. The customer pays Automindz using its configured UPI ID. Staff/admin independently checks the transaction in the receiving bank/UPI app. A screenshot is not proof. After confirming the UTR and amount, an authorized admin issues a signed license. The store enters its UTR and activation code in the subscription screen.

### Vercel environment variables
- `LICENSE_SIGNING_SECRET`: random server-only secret, at least 32 characters.
- `SUBSCRIPTION_ADMIN_SECRET`: separate server-only admin secret, at least 32 characters.
- `VITE_SUBSCRIPTION_UPI_ID`: public business UPI ID used to open the payment app.

These variables are configured for Preview and Production in the linked Vercel project. Vercel sensitive values are write-only in the dashboard/API; keep the admin secret in a password manager and rotate it if it is not known to the operator. Never expose either server secret in a `VITE_*` variable or frontend source. A new deployment is required after changing environment variables because the public `VITE_*` value is embedded at build time.

## Admin approval endpoint
After manually confirming the payment in the bank/UPI app, call `POST /api/billing/manual-approve` with header `x-admin-secret: YOUR_SUBSCRIPTION_ADMIN_SECRET` and JSON body:
`{ "storeName": "M.S. Medical Store", "storeId": "exact-local-store-id", "plan": "monthly", "utr": "verified-bank-UTR" }`
Allowed plans: `monthly`, `annual_vip`, `enterprise`. The response contains a signed `licenseToken`; send it privately to the store owner. Do not share the admin secret. The endpoint does not store payment records, so keep your own accounting/UTR register and never approve the same payment twice.

`POST /api/license/verify` verifies a signed token. Only the token, store ID and plan are used for license validation; pharmacy customer, medicine, invoice, prescription and inventory data are not sent.

## Prices shown in the app
- Pro Monthly: ₹999 + estimated 18% GST
- Annual VIP: ₹9,999 + estimated 18% GST
- Enterprise: ₹24,999 + estimated 18% GST

Confirm applicable GST treatment and invoice requirements with a qualified accountant. The displayed 18% is an estimate, not tax advice.

## Not yet production-certified
This change removes Razorpay checkout and implements manual UPI plus signed admin-issued licenses. It does not by itself make the app production-certified. Still required: verify a fresh deployment with the configured variables, test payment and license issuance end-to-end, migrate localStorage safely to IndexedDB, test Android Chrome and backup/restore on the actual phone, enforce paid feature entitlements, and review pharmacy/prescription/privacy/GST obligations. Do not use this app as the sole statutory pharmacy record until those checks are complete.
