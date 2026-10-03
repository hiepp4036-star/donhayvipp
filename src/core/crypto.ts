/**
 * Crypto Utilities for Free Fire Sensitivity Calculator OB54
 * FNV-1a Hash, Xorshift128 PRNG, HMAC-SHA256 for license keys
 */

// Use global crypto object (available in browsers & Vercel Edge)
const cryptoSubtle = typeof window !== 'undefined' ? window.crypto.subtle : 
                     (typeof globalThis !== 'undefined' ? globalThis.crypto.subtle : null);

/**
 * FNV-1a 32-bit Hash
 * Deterministic, fast, good distribution for seeding PRNG
 */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Xorshift128 PRNG
 * Deterministic pseudo-random generator from 4 uint32 seeds
 * Returns float in [0, 1)
 */
export function Xorshift128(seed: number): () => number {
  let s = [
    seed >>> 0,
    (seed * 2654435761) >>> 0,
    (seed * 2246822519) >>> 0,
    (seed * 3266489917) >>> 0
  ];

  // Ensure non-zero state
  if (!s[0] && !s[1] && !s[2] && !s[3]) s[0] = 1;

  return function (): number {
    let t = s[3];
    t ^= t << 11;
    t ^= t >>> 8;
    s[3] = s[2];
    s[2] = s[1];
    s[1] = s[0];
    t ^= s[0];
    t ^= s[0] >>> 19;
    s[0] = t;
    return (t >>> 0) / 4294967296;
  };
}

/**
 * Clamp value to range [min, max]
 */
export function cl(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Box-Muller transform for Gaussian distribution
 * Uses two uniform random values
 */
export function gaussian(rng: () => number): number {
  let u = 0, v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Seeded random integer in range [a, b]
 */
export function sR(rng: () => number, a: number, b: number): number {
  return Math.floor(rng() * (b - a + 1)) + a;
}

/**
 * Generate device fingerprint for license binding
 * Combines brand + model + optional hardware hints
 */
export function generateFingerprint(brandKey: string, modelKey: string, extra?: string): string {
  const base = `${brandKey}:${modelKey}${extra ? ':' + extra : ''}`;
  return fnv1a(base).toString(36).toUpperCase();
}

/**
 * HMAC-SHA256 for license key signing
 * Uses Web Crypto API (browser compatible)
 */
export async function hmacSha256(key: string, data: string): Promise<string> {
  if (!cryptoSubtle) throw new Error('Web Crypto API not available');
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);

  const cryptoKey = await cryptoSubtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await cryptoSubtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate license key
 * Format: BZ-OB54-{BRAND}-{MODEL}-{RANDOM8}-{EXPIRY_TS}-{HMAC16}
 */
export async function generateLicenseKey(
  brandKey: string,
  modelKey: string,
  expiryDays: number,
  maxUses: number,
  secretKey: string
): Promise<string> {
  const now = Date.now();
  const expiryTs = expiryDays > 0 ? now + expiryDays * 86400000 : 0;
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();

  const payload = `BZ-OB54-${brandKey.toUpperCase()}-${modelKey.toUpperCase()}-${randomPart}-${expiryTs}-${maxUses}`;
  const hmac = await hmacSha256(secretKey, payload);
  const hmacShort = hmac.substring(0, 16).toUpperCase();

  return `${payload}-${hmacShort}`;
}

/**
 * Validate license key
 * Verifies HMAC, expiry, and device binding
 */
export async function validateLicenseKey(
  key: string,
  brandKey: string,
  modelKey: string,
  secretKey: string
): Promise<{ valid: boolean; data?: any; error?: string }> {
  try {
    // Parse key format: BZ-OB54-BRAND-MODEL-RANDOM8-EXPIRY-MAXUSES-HMAC16
    const parts = key.split('-');
    if (parts.length !== 8 || parts[0] !== 'BZ' || parts[1] !== 'OB54') {
      return { valid: false, error: 'Định dạng key không hợp lệ' };
    }

    const [, , keyBrand, keyModel, , expiryStr, maxUsesStr, hmacProvided] = parts;
    const expiryTs = parseInt(expiryStr, 10);
    const maxUses = parseInt(maxUsesStr, 10);

    // Verify brand/model match
    if (keyBrand.toLowerCase() !== brandKey.toLowerCase()) {
      return { valid: false, error: 'Key không dành cho hãng máy này' };
    }
    if (keyModel.toLowerCase() !== modelKey.toLowerCase()) {
      return { valid: false, error: 'Key không dành cho dòng máy này' };
    }

    // Verify HMAC
    const payload = parts.slice(0, 7).join('-');
    const hmacExpected = (await hmacSha256(secretKey, payload)).substring(0, 16).toUpperCase();

    if (hmacProvided !== hmacExpected) {
      return { valid: false, error: 'Key không hợp lệ (chữ ký sai)' };
    }

    // Check expiry
    if (expiryTs > 0 && Date.now() > expiryTs) {
      return { valid: false, error: 'Key đã hết hạn' };
    }

    // Valid!
    return {
      valid: true,
      data: {
        brandKey: keyBrand.toLowerCase(),
        modelKey: keyModel.toLowerCase(),
        expiryDays: expiryTs > 0 ? Math.ceil((expiryTs - Date.now()) / 86400000) : 0,
        maxUses,
        createdAt: Date.now() - (expiryTs > 0 ? expiryTs - Date.now() : 0),
        key
      }
    };
  } catch (e) {
    return { valid: false, error: 'Lỗi xác thực key' };
  }
}

/**
 * Generate secure random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Simple hash for admin password verification (not for production secrets)
 * Uses SHA-256 via Web Crypto
 */
export async function hashPassword(password: string): Promise<string> {
  if (!cryptoSubtle) throw new Error('Web Crypto API not available');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await cryptoSubtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}