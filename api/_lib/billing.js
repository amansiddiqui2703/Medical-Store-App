import crypto from 'node:crypto';

export const PLANS = {
  monthly: { label: 'Pro Monthly', baseRupees: 999, days: 30 },
  annual_vip: { label: 'Annual VIP', baseRupees: 9999, days: 365 },
  enterprise: { label: 'Enterprise', baseRupees: 24999, days: 365 },
};

export function json(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

export function requiredEnv() {
  const names = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Server configuration missing: ${missing.join(', ')}`);
}

export async function authenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function supabase(path, { method = 'GET', body, prefer } = {}) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database request failed (${response.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
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
