const PUBLIC_KEY_SPKI = 'MCowBQYDK2VwAyEA26T1rxkkf+kTOo24ABPQpc4Y/yXnveUrHw7lhJrBpZ4=';

export interface OfflineLicensePayload {
  iss: string;
  plan: 'Monthly';
  days: 30;
  iat: number;
  exp: number;
  sub: string;
  utr: string;
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function toBase64Url(value: Uint8Array): string {
  let binary = '';
  value.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function storeBindingHash(store: { name: string; phone: string; licenseNumber: string }): Promise<string> {
  const canonical = [store.name, store.phone, store.licenseNumber]
    .map(value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' '))
    .join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return toBase64Url(new Uint8Array(digest));
}

export async function verifyOfflineLicense(
  token: string,
  store: { name: string; phone: string; licenseNumber: string }
): Promise<OfflineLicensePayload> {
  if (!token || token.length > 4096) throw new Error('Enter a valid license key.');
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('License key format is invalid.');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedHeader)));
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as OfflineLicensePayload;
  if (header.alg !== 'EdDSA' || header.typ !== 'JWT') throw new Error('Unsupported license key.');
  const publicKey = await crypto.subtle.importKey(
    'spki',
    Uint8Array.from(atob(PUBLIC_KEY_SPKI), char => char.charCodeAt(0)),
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  const valid = await crypto.subtle.verify(
    { name: 'Ed25519' },
    publicKey,
    fromBase64Url(encodedSignature),
    new TextEncoder().encode(encodedHeader + '.' + encodedPayload)
  );
  if (!valid) throw new Error('License signature is invalid. Contact Automindz support.');
  if (payload.iss !== 'Automindz Digital Labs' || payload.plan !== 'Monthly' || payload.days !== 30) {
    throw new Error('This license is not valid for the monthly plan.');
  }
  if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('This license key has expired.');
  }
  if (payload.exp - payload.iat > 31 * 24 * 60 * 60 || payload.iat > Math.floor(Date.now() / 1000) + 300) {
    throw new Error('License validity period is invalid.');
  }
  if (!payload.utr || payload.utr.length > 100) throw new Error('License is missing its payment reference.');
  const expectedBinding = await storeBindingHash(store);
  if (payload.sub !== expectedBinding) {
    throw new Error('This license key was issued for a different pharmacy profile. Check store name, phone and drug license number.');
  }
  return payload;
}
