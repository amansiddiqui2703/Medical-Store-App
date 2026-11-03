import { json, PLANS, razorpay, requiredEnv } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    requiredEnv();
    const { storeName, plan } = req.body || {};
    const selected = PLANS[plan];
    if (typeof storeName !== 'string' || storeName.trim().length < 2 || storeName.trim().length > 100 || !selected) {
      return json(res, 400, { error: 'Enter a valid store name and subscription plan.' });
    }
    const basePaise = selected.baseRupees * 100;
    const gstPaise = Math.round(basePaise * 0.18);
    const order = await razorpay('orders', {
      method: 'POST',
      body: {
        amount: basePaise + gstPaise,
        currency: 'INR',
        receipt: `ms-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        notes: { store_name: storeName.trim(), plan, product: 'ms-medical-store' },
      },
    });
    return json(res, 200, {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      storeName: storeName.trim(),
      plan: selected.label,
      gstPaise,
    });
  } catch (error) {
    console.error('Billing order creation failed:', error.message);
    return json(res, 500, { error: 'Unable to create payment order. Check server configuration.' });
  }
}
