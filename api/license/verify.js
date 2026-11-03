import { json, verifyLicense } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    if (!process.env.LICENSE_SIGNING_SECRET || process.env.LICENSE_SIGNING_SECRET.length < 32) {
      return json(res, 503, { valid: false, error: 'License service is not configured.' });
    }
    const payload = verifyLicense(req.body?.licenseToken);
    if (!payload) return json(res, 403, { valid: false, error: 'License is invalid or expired.' });
    return json(res, 200, { valid: true, storeName: payload.store, storeId: payload.storeId, plan: payload.plan, expiresAt: new Date(payload.exp * 1000).toISOString() });
  } catch {
    return json(res, 500, { valid: false, error: 'License service is temporarily unavailable.' });
  }
}