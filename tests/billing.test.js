import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.LICENSE_SIGNING_SECRET = 'test-license-signing-secret-at-least-32-characters';

const { issueLicense, verifyLicense, verifyCheckoutSignature } = await import('../api/_lib/billing.js');

test('license token is signed for the specific store and exact paid term', () => {
  const paidAt = Math.floor(Date.now() / 1000) - 30;
  const input = { storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'monthly', paymentId: 'pay_test_123', days: 30, paidAt };
  const token = issueLicense(input);
  const payload = verifyLicense(token);

  assert.equal(payload.store, input.storeName);
  assert.equal(payload.storeId, input.storeId);
  assert.equal(payload.plan, input.plan);
  assert.equal(payload.paymentId, input.paymentId);
  assert.equal(payload.iat, paidAt);
  assert.equal(payload.exp, paidAt + 30 * 86400);
});

test('re-verifying the same captured payment cannot extend the license', () => {
  const input = { storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'annual_vip', paymentId: 'pay_same_payment', days: 365, paidAt: 1790000000 };
  assert.equal(issueLicense(input), issueLicense(input));
});

test('tampered and expired license tokens are rejected', () => {
  const valid = issueLicense({
    storeName: 'M.S. Medical Store',
    storeId: 'store_1',
    plan: 'monthly',
    paymentId: 'pay_test_456',
    days: 30,
    paidAt: Math.floor(Date.now() / 1000),
  });
  assert.equal(verifyLicense(valid + 'x'), null);

  const expired = issueLicense({
    storeName: 'M.S. Medical Store',
    storeId: 'store_1',
    plan: 'monthly',
    paymentId: 'pay_old',
    days: 30,
    paidAt: Math.floor(Date.now() / 1000) - 31 * 86400,
  });
  assert.equal(verifyLicense(expired), null);
});

test('Razorpay checkout signature must match order and payment ids', () => {
  process.env.RAZORPAY_KEY_SECRET = 'razorpay-test-secret';
  const orderId = 'order_test_123';
  const paymentId = 'pay_test_123';
  const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest('hex');

  assert.equal(verifyCheckoutSignature(orderId, paymentId, signature), true);
  assert.equal(verifyCheckoutSignature(orderId, 'pay_other', signature), false);
});
