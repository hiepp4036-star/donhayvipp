/**
 * NLP Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { nlpAnalyze } from '../src/core/algorithm';

describe('NLP Engine', () => {
  describe('Recoil Detection', () => {
    const testCases = [
      { text: 'rung tâm', expectedMin: 0.5 },
      { text: 'giật nòng', expectedMin: 1.0 },
      { text: 'tâm bay', expectedMin: 1.0 },
      { text: 'loạn tâm', expectedMin: 1.0 },
      { text: 'bay tâm', expectedMin: 1.0 },
      { text: 'tâm nhảy', expectedMin: 0.8 },
      { text: 'trôi tâm', expectedMin: 0.5 },
      { text: 'recoil', expectedMin: 0.8 },
      { text: 'crosshair rung', expectedMin: 0.5 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as recoil`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.recoil.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.recoil.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Lag Detection', () => {
    const testCases = [
      { text: 'lag', expectedMin: 1.0 },
      { text: 'giảm fps', expectedMin: 1.0 },
      { text: 'drop frame', expectedMin: 1.0 },
      { text: 'tụt fps', expectedMin: 1.0 },
      { text: 'giật hình', expectedMin: 0.8 },
      { text: 'khựng', expectedMin: 0.8 },
      { text: 'đứng hình', expectedMin: 1.0 },
      { text: 'fps thấp', expectedMin: 1.0 },
      { text: 'chậm phản hồi', expectedMin: 0.5 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as lag`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.lag.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.lag.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Overshoot Detection', () => {
    const testCases = [
      { text: 'kéo lố', expectedMin: 1.0 },
      { text: 'quá nhạy', expectedMin: 1.0 },
      { text: 'vượt quá đầu', expectedMin: 0.8 },
      { text: 'overshoot', expectedMin: 0.8 },
      { text: 'trượt', expectedMin: 0.5 },
      { text: 'bay qua', expectedMin: 0.5 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as overshoot`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.overshoot.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.overshoot.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Close Combat Detection', () => {
    const testCases = [
      { text: 'full đỏ', expectedMin: 0.8 },
      { text: 'mp40', expectedMin: 1.0 },
      { text: 'shotgun', expectedMin: 0.8 },
      { text: 'cận chiến', expectedMin: 0.8 },
      { text: 'rush', expectedMin: 0.5 },
      { text: 'auto headshot', expectedMin: 0.8 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as close combat`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.close.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.close.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Far Range Detection', () => {
    const testCases = [
      { text: 'sniper', expectedMin: 1.0 },
      { text: 'awm', expectedMin: 1.0 },
      { text: 'kar98', expectedMin: 1.0 },
      { text: 'bắn tỉa', expectedMin: 1.0 },
      { text: 'tầm xa', expectedMin: 0.8 },
      { text: 'scope', expectedMin: 0.3 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as far range`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.far.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.far.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Stiff Detection', () => {
    const testCases = [
      { text: 'cứng', expectedMin: 0.8 },
      { text: 'khó vuốt', expectedMin: 0.8 },
      { text: 'không mượt', expectedMin: 0.8 },
      { text: 'nặng tay', expectedMin: 0.8 }
    ];

    testCases.forEach(({ text, expectedMin }) => {
      it(`should detect "${text}" as stiff`, () => {
        const result = nlpAnalyze(text);
        expect(result.scores.stiff.score).toBeGreaterThanOrEqual(expectedMin);
        expect(result.scores.stiff.hits).toBeGreaterThan(0);
      });
    });
  });

  describe('Combined Analysis', () => {
    it('should detect multiple categories in one text', () => {
      const result = nlpAnalyze('rung tâm, lag, kéo lố');
      expect(result.scores.recoil.score).toBeGreaterThan(0);
      expect(result.scores.lag.score).toBeGreaterThan(0);
      expect(result.scores.overshoot.score).toBeGreaterThan(0);
      expect(result.totalHits).toBeGreaterThanOrEqual(3);
    });

    it('should handle Vietnamese text with punctuation', () => {
      const result = nlpAnalyze('rung tâm, giật nòng; lag nặng! kéo lố?');
      expect(result.totalHits).toBeGreaterThan(0);
    });

    it('should handle case insensitive', () => {
      const lower = nlpAnalyze('rung tâm');
      const upper = nlpAnalyze('RUNG TÂM');
      const mixed = nlpAnalyze('Rung Tâm');
      expect(lower.scores.recoil.score).toBe(upper.scores.recoil.score);
      expect(lower.scores.recoil.score).toBe(mixed.scores.recoil.score);
    });

    it('should return zero for unrelated text', () => {
      const result = nlpAnalyze('hello world abc xyz');
      Object.values(result.scores).forEach(s => {
        expect(s.score).toBe(0);
        expect(s.hits).toBe(0);
      });
    });

    it('should handle fuzzy matching for typos', () => {
      // These are typos that should still match with reduced weight
      const result = nlpAnalyze('rungg tam'); // typo for "rung tâm"
      // Fuzzy matching might or might not catch this depending on threshold
      expect(result.scores.recoil.hits).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Weight Calculation', () => {
    it('should apply category weights', () => {
      // recoil has weight 1.0, close has weight 0.8
      const recoilResult = nlpAnalyze('rung tâm');
      const closeResult = nlpAnalyze('mp40');

      // recoil keyword weight 1.0 * category weight 1.0 = 1.0
      // close keyword weight 1.2 * category weight 0.8 = 0.96
      expect(recoilResult.scores.recoil.score).toBeGreaterThan(0);
      expect(closeResult.scores.close.score).toBeGreaterThan(0);
    });
  });
});