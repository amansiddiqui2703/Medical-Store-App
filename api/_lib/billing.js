import crypto from 'node:crypto';

export const PLANS = {
  monthly: { label: 'Pro Monthly', baseRupees: 999, days: 30 },
  annual_vip: { label: 'Annual VIP', baseRupees: 9999, days: 365 },
  enterprise: { label: 'Enterprise', baseRupees: 24999, days: 365 },
};

export function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

export function issueLicense({ storeName, storeId, plan, paymentId, days, paidAt }) {
  const issuedAt = Number.isInteger(paidAt) && paidAt > 0 ? paidAt : Math.floor(Date.now() / 1000);
  const payload = { iss: 'ms-medical-store', store: storeName, storeId, plan, paymentId, iat: issuedAt, exp: issuedAt + days * 86400 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.LICENSE_SIGNING_SECRET).update(encoded).digest('base64url');
  return encoded + '.' + signature;
}

export function verifyLicense(token) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', process.env.LICENSE_SIGNING_SECRET).update(parts[0]).digest();
  let actual;
  try { actual = Buffer.from(parts[1], 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (payload.iss !== 'ms-medical-store' || !payload.store || !payload.storeId || !PLANS[payload.plan] || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}
