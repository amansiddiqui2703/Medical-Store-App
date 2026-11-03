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

export function requiredEnv() {
  const missing = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'LICENSE_SIGNING_SECRET']
    .filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing server environment: ${missing.join(', ')}`);
  if (process.env.LICENSE_SIGNING_SECRET.length < 32) throw new Error('LICENSE_SIGNING_SECRET must be at least 32 characters.');
}

export async function razorpay(path, { method = 'GET', body } = {}) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.description || 'Payment provider request failed');
  return data;
}

export function verifyCheckoutSignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueLicense({ storeName, storeId, plan, paymentId, days, paidAt }) {
  const issuedAt = Number.isInteger(paidAt) && paidAt > 0 ? paidAt : Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'ms-medical-store',
    store: storeName,
    storeId,
    plan,
    paymentId,
    iat: issuedAt,
    exp: issuedAt + days * 86400,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.LICENSE_SIGNING_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
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
