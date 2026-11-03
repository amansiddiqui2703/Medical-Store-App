import { issueLicense, json, PLANS, razorpay, requiredEnv, verifyCheckoutSignature } from '../_lib/billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    requiredEnv();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!orderId || !paymentId || !signature || !verifyCheckoutSignature(orderId, paymentId, signature)) {
      return json(res, 400, { error: 'Payment signature verification failed.' });
    }

    const [payment, order] = await Promise.all([
      razorpay(`payments/${encodeURIComponent(paymentId)}`),
      razorpay(`orders/${encodeURIComponent(orderId)}`),
    ]);
    const plan = order.notes?.plan;
    const selected = PLANS[plan];
    const expectedAmount = selected ? selected.baseRupees * 100 + Math.round(selected.baseRupees * 18) : -1;
    if (
      payment.order_id !== orderId ||
      payment.status !== 'captured' ||
      payment.currency !== 'INR' ||
      payment.amount !== expectedAmount ||
      order.notes?.product !== 'ms-medical-store' ||
      typeof order.notes?.store_name !== 'string' ||
      !order.notes.store_name.trim() ||
      typeof order.notes.store_id !== 'string' || !order.notes.store_id.trim() ||
      !Number.isInteger(payment.created_at) || payment.created_at <= 0 || payment.created_at > Math.floor(Date.now() / 1000) + 300
    ) {
      return json(res, 409, { error: 'Payment is not captured for the expected order and amount. No license was issued.' });
    }

    const licenseToken = issueLicense({
      storeName: order.notes.store_name,
      storeId: order.notes.store_id,
      plan,
      paymentId,
      days: selected.days,
      paidAt: payment.created_at,
    });
    return json(res, 200, {
      ok: true,
      licenseToken,
      storeName: order.notes.store_name,
      plan,
      expiresAt: new Date((Math.floor(Date.now() / 1000) + selected.days * 86400) * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Payment verification failed:', error.message);
    return json(res, 500, { error: 'Payment could not be confirmed. Contact support with your payment ID; do not pay again until checked.' });
  }
}
