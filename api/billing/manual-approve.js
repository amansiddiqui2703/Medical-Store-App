import crypto from 'node:crypto';
import { issueLicense, json, PLANS } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const configured = process.env.SUBSCRIPTION_ADMIN_SECRET || '';
  const supplied = String(req.headers['x-admin-secret'] || '');
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  if (configured.length < 32 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return json(res, 401, { error: 'Admin authorization failed.' });
  }
  if (!process.env.LICENSE_SIGNING_SECRET || process.env.LICENSE_SIGNING_SECRET.length < 32) {
    return json(res, 503, { error: 'License signing is not configured.' });
  }
  const { storeName, storeId, plan, utr } = req.body || {};
  const selected = PLANS[plan];
  if (typeof storeName !== 'string' || storeName.trim().length < 2 || storeName.length > 100 ||
      typeof storeId !== 'string' || !storeId.trim() || storeId.length > 128 ||
      typeof utr !== 'string' || utr.trim().length < 6 || utr.length > 100 || !selected) {
    return json(res, 400, { error: 'Valid store details, plan and payment UTR are required.' });
  }
  const licenseToken = issueLicense({
    storeName: storeName.trim(), storeId: storeId.trim(), plan, paymentId: utr.trim(),
    days: selected.days, paidAt: Math.floor(Date.now() / 1000),
  });
  return json(res, 200, {
    ok: true, storeId: storeId.trim(), plan,
    expiresAt: new Date((Math.floor(Date.now() / 1000) + selected.days * 86400) * 1000).toISOString(),
    licenseToken,
  });
}
