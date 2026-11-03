import { authenticatedUser, json, PLANS, razorpay, requiredEnv, supabase } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    requiredEnv();
    const user = await authenticatedUser(req);
    if (!user?.id) return json(res, 401, { error: 'Sign in to continue.' });

    const { storeId, plan } = req.body || {};
    const selected = PLANS[plan];
    if (!storeId || !selected) return json(res, 400, { error: 'Choose a valid store and subscription plan.' });

    const stores = await supabase(`stores?id=eq.${encodeURIComponent(storeId)}&owner_id=eq.${encodeURIComponent(user.id)}&select=id,name&limit=1`);
    if (!stores?.length) return json(res, 404, { error: 'Store not found for this account.' });

    const gstPaise = Math.round(selected.baseRupees * 18);
    const amountPaise = selected.baseRupees * 100 + gstPaise;
    const order = await razorpay('orders', {
      method: 'POST',
      body: {
        amount: amountPaise,
        currency: 'INR',
        receipt: `ms-${String(storeId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 18)}-${Date.now()}`,
        notes: { store_id: storeId, user_id: user.id, plan },
      },
    });

    await supabase('billing_payments', {
      method: 'POST',
      body: {
        store_id: storeId,
        user_id: user.id,
        plan,
        amount_paise: amountPaise,
        currency: 'INR',
        razorpay_order_id: order.id,
        status: 'created',
      },
      prefer: 'return=minimal',
    });

    return json(res, 200, {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      storeName: stores[0].name,
      plan: selected.label,
      gstPaise,
    });
  } catch (error) {
    console.error('Billing order creation failed:', error.message);
    return json(res, 500, { error: 'Unable to create a payment order. Check server configuration and try again.' });
  }
}
