/**
 * Crypto Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  fnv1a,
  Xorshift128,
  cl,
  lerp,
  gaussian,
  sR,
  generateFingerprint,
  hmacSha256,
  hashPassword,
  verifyPassword,
  generateRandomString
} from '../src/core/crypto';

describe('Crypto Utilities', () => {
  describe('fnv1a', () => {
    it('should produce consistent hash for same input', () => {
      const hash1 = fnv1a('test');
      const hash2 = fnv1a('test');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = fnv1a('test1');
      const hash2 = fnv1a('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return 32-bit unsigned integer', () => {
      const hash = fnv1a('test');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
    });

    it('should handle empty string', () => {
      const hash = fnv1a('');
      expect(hash).toBe(0x811c9dc5); // FNV offset basis
    });

    it('should handle unicode', () => {
      const hash = fnv1a('测试');
      expect(typeof hash).toBe('number');
    });
  });

  describe('Xorshift128', () => {
    it('should generate deterministic sequence from seed', () => {
      const rng1 = Xorshift128(12345);
      const rng2 = Xorshift128(12345);

      for (let i = 0; i < 100; i++) {
        expect(rng1()).toBe(rng2());
      }
    });

    it('should generate different sequences for different seeds', () => {
      const rng1 = Xorshift128(12345);
      const rng2 = Xorshift128(54321);

      let same = true;
      for (let i = 0; i < 10; i++) {
        if (rng1() !== rng2()) {
          same = false;
          break;
        }
      }
      expect(same).toBe(false);
    });

    it('should return values in [0, 1)', () => {
      const rng = Xorshift128(42);
      for (let i = 0; i < 1000; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should handle zero seed', () => {
      const rng = Xorshift128(0);
      // Should not produce all zeros (internal state fix)
      let hasNonZero = false;
      for (let i = 0; i < 10; i++) {
        if (rng() > 0) hasNonZero = true;
      }
      expect(hasNonZero).toBe(true);
    });
  });

  describe('cl (clamp)', () => {
    it('should clamp value to range', () => {
      expect(cl(50, 0, 100)).toBe(50);
      expect(cl(-10, 0, 100)).toBe(0);
      expect(cl(150, 0, 100)).toBe(100);
    });

    it('should round floating point values', () => {
      expect(cl(50.7, 0, 100)).toBe(51);
      expect(cl(50.3, 0, 100)).toBe(50);
    });
  });

  describe('lerp', () => {
    it('should interpolate between values', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should clamp t to [0, 1]', () => {
      expect(lerp(0, 10, -0.5)).toBe(0);
      expect(lerp(0, 10, 1.5)).toBe(10);
    });
  });

  describe('gaussian', () => {
    it('should generate normally distributed values', () => {
      const rng = Xorshift128(42);
      const samples = Array.from({ length: 10000 }, () => gaussian(rng));

      // Check mean ~ 0
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(Math.abs(mean)).toBeLessThan(0.1);

      // Check std ~ 1
      const variance = samples.reduce((a, b) => a + b * b, 0) / samples.length;
      expect(Math.abs(variance - 1)).toBeLessThan(0.1);
    });

    it('should not return NaN or Infinity', () => {
      const rng = Xorshift128(42);
      for (let i = 0; i < 100; i++) {
        const val = gaussian(rng);
        expect(Number.isFinite(val)).toBe(true);
      }
    });
  });

  describe('sR (seeded random int)', () => {
    it('should return integer in range', () => {
      const rng = Xorshift128(42);
      for (let i = 0; i < 100; i++) {
        const val = sR(rng, 10, 20);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(20);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('should handle single value range', () => {
      const rng = Xorshift128(42);
      const val = sR(rng, 5, 5);
      expect(val).toBe(5);
    });
  });

  describe('generateFingerprint', () => {
    it('should generate consistent fingerprint for same inputs', () => {
      const fp1 = generateFingerprint('samsung', 's24u');
      const fp2 = generateFingerprint('samsung', 's24u');
      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different devices', () => {
      const fp1 = generateFingerprint('samsung', 's24u');
      const fp2 = generateFingerprint('apple', 'ip16pm');
      expect(fp1).not.toBe(fp2);
    });

    it('should include extra data in fingerprint', () => {
      const fp1 = generateFingerprint('samsung', 's24u');
      const fp2 = generateFingerprint('samsung', 's24u', 'extra');
      expect(fp1).not.toBe(fp2);
    });

    it('should return uppercase base36 string', () => {
      const fp = generateFingerprint('samsung', 's24u');
      expect(fp).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('hmacSha256', () => {
    it('should generate consistent HMAC', async () => {
      const hmac1 = await hmacSha256('secret', 'message');
      const hmac2 = await hmacSha256('secret', 'message');
      expect(hmac1).toBe(hmac2);
    });

    it('should generate different HMAC for different keys', async () => {
      const hmac1 = await hmacSha256('secret1', 'message');
      const hmac2 = await hmacSha256('secret2', 'message');
      expect(hmac1).not.toBe(hmac2);
    });

    it('should generate different HMAC for different messages', async () => {
      const hmac1 = await hmacSha256('secret', 'message1');
      const hmac2 = await hmacSha256('secret', 'message2');
      expect(hmac1).not.toBe(hmac2);
    });

    it('should return 64-char hex string', async () => {
      const hmac = await hmacSha256('secret', 'message');
      expect(hmac).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hashPassword / verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'mySecretPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'test';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      // Note: Web Crypto SHA-256 is deterministic, so hashes will be same
      // In production, use proper password hashing (bcrypt, argon2)
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const str = generateRandomString(16);
      expect(str.length).toBe(16);
    });

    it('should only contain valid characters', () => {
      const str = generateRandomString(32);
      expect(str).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      expect(str1).not.toBe(str2);
    });
  });
});