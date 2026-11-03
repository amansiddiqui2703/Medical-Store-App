import test from 'node:test';
import assert from 'node:assert/strict';

process.env.LICENSE_SIGNING_SECRET = 'test-license-signing-secret-at-least-32-characters';
const { issueLicense, verifyLicense } = await import('../api/_lib/billing.js');

test('license is signed for a specific store and paid term', () => {
  const paidAt = Math.floor(Date.now() / 1000) - 30;
  const input = { storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'monthly', paymentId: 'UPI-UTR-123456', days: 30, paidAt };
  const payload = verifyLicense(issueLicense(input));
  assert.equal(payload.store, input.storeName);
  assert.equal(payload.storeId, input.storeId);
  assert.equal(payload.plan, input.plan);
  assert.equal(payload.paymentId, input.paymentId);
  assert.equal(payload.exp, paidAt + 30 * 86400);
});

test('same verified payment inputs produce the same license expiry', () => {
  const input = { storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'annual_vip', paymentId: 'UPI-UTR-123', days: 365, paidAt: 1790000000 };
  assert.equal(issueLicense(input), issueLicense(input));
});

test('tampered and expired license tokens are rejected', () => {
  const valid = issueLicense({ storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'monthly', paymentId: 'UPI-1', days: 30, paidAt: Math.floor(Date.now() / 1000) });
  assert.equal(verifyLicense(valid + 'x'), null);
  const expired = issueLicense({ storeName: 'M.S. Medical Store', storeId: 'store_1', plan: 'monthly', paymentId: 'UPI-OLD', days: 30, paidAt: Math.floor(Date.now() / 1000) - 31 * 86400 });
  assert.equal(verifyLicense(expired), null);
});
