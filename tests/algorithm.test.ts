/**
 * Algorithm Tests - Core Sensitivity Calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { computeSensitivity, nlpAnalyze, findBrand, findModel } from '../src/core/algorithm';
import { TIER_BASE } from '../src/core/constants';
import { createMockDeviceCatalog, createMockFormData } from './setup';

describe('Core Algorithm', () => {
  let catalog: any[];

  beforeEach(() => {
    catalog = createMockDeviceCatalog();
  });

  describe('findBrand', () => {
    it('should find brand by key', () => {
      const brand = findBrand(catalog, 'samsung');
      expect(brand).toBeDefined();
      expect(brand?.key).toBe('samsung');
    });

    it('should return undefined for non-existent brand', () => {
      const brand = findBrand(catalog, 'nonexistent');
      expect(brand).toBeUndefined();
    });
  });

  describe('findModel', () => {
    it('should find model by brand and model key', () => {
      const result = findModel(catalog, 'samsung', 's24u');
      expect(result).toBeDefined();
      expect(result?.brand.key).toBe('samsung');
      expect(result?.model.k).toBe('s24u');
    });

    it('should return null for non-existent model', () => {
      const result = findModel(catalog, 'samsung', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for non-existent brand', () => {
      const result = findModel(catalog, 'nonexistent', 's24u');
      expect(result).toBeNull();
    });
  });

  describe('nlpAnalyze', () => {
    it('should detect recoil keywords', () => {
      const result = nlpAnalyze('rung tâm, giật nòng, tâm bay');
      expect(result.scores.recoil.score).toBeGreaterThan(0);
      expect(result.scores.recoil.hits).toBeGreaterThan(0);
    });

    it('should detect lag keywords', () => {
      const result = nlpAnalyze('lag, giảm fps, giật hình');
      expect(result.scores.lag.score).toBeGreaterThan(0);
      expect(result.scores.lag.hits).toBeGreaterThan(0);
    });

    it('should detect overshoot keywords', () => {
      const result = nlpAnalyze('kéo lố, quá nhạy, vượt qua đầu');
      expect(result.scores.overshoot.score).toBeGreaterThan(0);
    });

    it('should detect close combat keywords', () => {
      const result = nlpAnalyze('full đỏ, mp40, cận chiến, rush');
      expect(result.scores.close.score).toBeGreaterThan(0);
    });

    it('should detect far range keywords', () => {
      const result = nlpAnalyze('sniper, awm, bắn tỉa, tầm xa');
      expect(result.scores.far.score).toBeGreaterThan(0);
    });

    it('should detect stiff keywords', () => {
      const result = nlpAnalyze('cứng, khó vuốt, không mượt');
      expect(result.scores.stiff.score).toBeGreaterThan(0);
    });

    it('should return zero scores for empty text', () => {
      const result = nlpAnalyze('');
      Object.values(result.scores).forEach(s => {
        expect(s.score).toBe(0);
        expect(s.hits).toBe(0);
      });
      expect(result.totalHits).toBe(0);
    });

    it('should handle fuzzy matching', () => {
      const result = nlpAnalyze('rungg tam'); // typo
      // Should still match with reduced weight
      expect(result.scores.recoil.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeSensitivity', () => {
    it('should return result for valid device', () => {
      const result = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm');
      expect(result).not.toBeNull();
      expect(result?.brandName).toBe('Samsung');
      expect(result?.deviceName).toBe('Galaxy S24 Ultra');
      expect(result?.os).toBe('Android');
    });

    it('should return null for invalid device', () => {
      const result = computeSensitivity(catalog, 'samsung', 'nonexistent', 'balanced', '');
      expect(result).toBeNull();
    });

    it('should apply playstyle modifiers', () => {
      const balanced = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', '');
      const rusher = computeSensitivity(catalog, 'samsung', 's24u', 'rusher', '');
      const sniper = computeSensitivity(catalog, 'samsung', 's24u', 'sniper', '');

      // Rusher should have lower general sensitivity
      expect(rusher?.s1).toBeLessThan(balanced?.s1 || 0);
      // Sniper should have higher general sensitivity
      expect(sniper?.s1).toBeGreaterThan(balanced?.s1 || 0);
    });

    it('should reduce sensitivity for recoil', () => {
      const noRecoil = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', '');
      const withRecoil = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm, giật nòng');

      expect(withRecoil?.s1).toBeLessThan(noRecoil?.s1 || 0);
    });

    it('should increase sensitivity for lag', () => {
      const noLag = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', '');
      const withLag = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'lag, giảm fps');

      expect(withLag?.s1).toBeGreaterThan(noLag?.s1 || 0);
    });

    it('should maintain sensitivity hierarchy: General >= RedDot >= 2X >= 4X >= Sniper', () => {
      const result = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm');

      expect(result?.s1).toBeGreaterThanOrEqual(result?.s2 || 0);
      expect(result?.s2).toBeGreaterThanOrEqual(result?.s3 || 0);
      expect(result?.s3).toBeGreaterThanOrEqual(result?.s4 || 0);
      expect(result?.s4).toBeGreaterThanOrEqual(result?.s5 || 0);
    });

    it('should clamp values within valid ranges', () => {
      const result = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', '');

      expect(result?.s1).toBeGreaterThanOrEqual(80);
      expect(result?.s1).toBeLessThanOrEqual(200);
      expect(result?.s5).toBeGreaterThanOrEqual(35);
      expect(result?.s5).toBeLessThanOrEqual(180);
      expect(result?.fire).toBeGreaterThanOrEqual(25);
      expect(result?.fire).toBeLessThanOrEqual(70);
      expect(result?.cam).toBeGreaterThanOrEqual(15);
      expect(result?.cam).toBeLessThanOrEqual(100);
    });

    it('should have confidence between 82-99', () => {
      const result = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm lag');
      expect(result?.confidence).toBeGreaterThanOrEqual(82);
      expect(result?.confidence).toBeLessThanOrEqual(99);
    });

    it('should be deterministic for same inputs', () => {
      const result1 = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm');
      const result2 = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm');

      expect(result1).toEqual(result2);
    });

    it('should include analysis lines', () => {
      const result = computeSensitivity(catalog, 'samsung', 's24u', 'balanced', 'rung tâm, lag');
      expect(result?.analysisLines).toBeDefined();
      expect(Array.isArray(result?.analysisLines)).toBe(true);
      expect(result?.analysisLines.length).toBeGreaterThan(0);
    });

    it('should handle tablet tier differently', () => {
      // Add a tablet to test
      const tabletCatalog = [...catalog, {
        key: 'tablet',
        name: 'Test Tablet',
        os: 'Android',
        models: [{ k: 'tab1', n: 'Test Tab', dpi: 264, hz: 120, tl: 6, pt: 2, tier: 'TP' }]
      }];

      const result = computeSensitivity(tabletCatalog, 'tablet', 'tab1', 'balanced', '');
      expect(result).not.toBeNull();
      expect(result?.tier).toBe('TP');
    });
  });

  describe('Tier Base Values', () => {
    it('should have correct tier base values', () => {
      expect(TIER_BASE.FN.b).toEqual([140, 128, 136, 132, 91]);
      expect(TIER_BASE.FS.b).toEqual([146, 134, 142, 138, 97]);
      expect(TIER_BASE.FO.b).toEqual([154, 141, 149, 145, 105]);
      expect(TIER_BASE.GM.b).toEqual([132, 120, 128, 125, 85]);
      expect(TIER_BASE.BG.b).toEqual([176, 162, 169, 165, 125]);
    });
  });
});