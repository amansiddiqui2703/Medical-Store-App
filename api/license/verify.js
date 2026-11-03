import { json, requiredEnv, verifyLicense } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    requiredEnv();
    const payload = verifyLicense(req.body?.licenseToken);
    if (!payload) return json(res, 403, { valid: false, error: 'License is invalid or expired.' });
    return json(res, 200, {
      valid: true,
      storeName: payload.store,
      storeId: payload.storeId,
      plan: payload.plan,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    console.error('License check failed:', error.message);
    return json(res, 500, { valid: false, error: 'License service is temporarily unavailable.' });
  }
}
