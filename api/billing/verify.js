import {
  authenticatedUser, json, razorpay, requiredEnv, supabase, verifyCheckoutSignature,
} from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    requiredEnv();
    const user = await authenticatedUser(req);
    if (!user?.id) return json(res, 401, { error: 'Sign in to continue.' });

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!orderId || !paymentId || !signature || !verifyCheckoutSignature(orderId, paymentId, signature)) {
      return json(res, 400, { error: 'Payment signature verification failed.' });
    }

    const rows = await supabase(
      `billing_payments?razorpay_order_id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,store_id,plan,amount_paise,status&limit=1`,
    );
    const paymentRecord = rows?.[0];
    if (!paymentRecord) return json(res, 404, { error: 'Payment order not found for this account.' });
    if (paymentRecord.status === 'applied') return json(res, 200, { ok: true, status: 'active' });

    const providerPayment = await razorpay(`payments/${encodeURIComponent(paymentId)}`);
    if (
      providerPayment.order_id !== orderId ||
      providerPayment.status !== 'captured' ||
      providerPayment.currency !== 'INR' ||
      providerPayment.amount !== paymentRecord.amount_paise
    ) {
      return json(res, 409, { error: 'Payment is not captured for the expected amount. Subscription was not activated.' });
    }

    await supabase(
      `billing_payments?id=eq.${encodeURIComponent(paymentRecord.id)}&user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: 'PATCH',
        body: { razorpay_payment_id: paymentId, status: 'verified', verified_at: new Date().toISOString() },
        prefer: 'return=minimal',
      },
    );
    const result = await supabase('rpc/apply_verified_subscription', {
      method: 'POST',
      body: { p_order_id: orderId, p_payment_id: paymentId },
    });
    return json(res, 200, result || { ok: true, status: 'active' });
  } catch (error) {
    console.error('Payment verification failed:', error.message);
    return json(res, 500, { error: 'Payment received status could not be confirmed. Contact support with your Razorpay payment ID; do not pay again until checked.' });
  }
}
