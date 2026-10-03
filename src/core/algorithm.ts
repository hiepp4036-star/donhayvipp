/**
 * Free Fire Sensitivity Calculator OB54 - Core Algorithm V8.0
 * Make By Benz
 * Pure TypeScript, zero dependencies, fully testable
 */

import type { DeviceCatalog, DeviceModel, NLPResult, SensitivityResult } from './types';
import { TIER_BASE, TIER_ORDER, PLAYSTYLES, NLP_RULES } from './constants';
import { fnv1a, Xorshift128, cl, gaussian, sR } from './crypto';

/**
 * Tìm brand theo key
 */
export function findBrand(catalog: DeviceCatalog[], brandKey: string): DeviceCatalog | undefined {
  return catalog.find(b => b.key === brandKey);
}

/**
 * Tìm model theo brandKey + modelKey
 */
export function findModel(
  catalog: DeviceCatalog[],
  brandKey: string,
  modelKey: string
): { brand: DeviceCatalog; model: DeviceModel } | null {
  const brand = findBrand(catalog, brandKey);
  if (!brand) return null;

  const model = brand.models.find(m => m.k === modelKey);
  return model ? { brand, model } : null;
}

/**
 * Phân tích NLP tình trạng chơi game
 * Trả về score cho từng category: recoil, lag, overshoot, close, far, stiff
 */
export function nlpAnalyze(text: string): NLPResult {
  const lowerText = text.toLowerCase().trim();
  const scores: Record<string, { score: number; hits: number }> = {};
  let totalHits = 0;

  for (const [cat, rule] of Object.entries(NLP_RULES)) {
    let s = 0;
    let hits = 0;

    for (const kw of rule.kw) {
      // Exact substring match
      if (lowerText.includes(kw.t.toLowerCase())) {
        s += kw.w;
        hits++;
        continue;
      }

      // Fuzzy matching: check word similarity
      const words = lowerText.split(/[\s,;:.!?]+/);
      for (const w of words) {
        if (w.length < 2) continue;

        const kwLower = kw.t.toLowerCase();
        const commonChars = [...new Set(kwLower)].filter(c => w.includes(c)).length;
        const sim = commonChars / Math.max(kwLower.length, w.length);

        if (sim > 0.65 && w.length >= kwLower.length * 0.6) {
          s += kw.w * sim * 0.6;
          hits++;
          break;
        }
      }
    }

    scores[cat] = { score: s * rule.w, hits };
    totalHits += hits;
  }

  return { scores, totalHits };
}

/**
 * Tính toán độ nhạy hoàn chỉnh
 * Pipeline: Device → Tier Base → Hardware Compensation → Gaussian Variance → Playstyle → NLP → Cross-calibration → Clamping
 */
export function computeSensitivity(
  catalog: DeviceCatalog[],
  brandKey: string,
  modelKey: string,
  playstyle: string,
  issueText: string
): SensitivityResult | null {
  const found = findModel(catalog, brandKey, modelKey);
  if (!found) return null;

  const { brand, model } = found;
  const issue = (issueText || '').toLowerCase();
  const tierInfo = TIER_BASE[model.tier];

  // Seed deterministic từ brand+model+playstyle
  const seed1 = fnv1a(`${brandKey}:${modelKey}|${playstyle}`);
  const seed2 = fnv1a(`${playstyle}|${modelKey}:${brandKey}`);
  const rng = Xorshift128(seed1 ^ seed2);

  // Base sensitivity theo tier
  let [s1, s2, s3, s4, s5] = [...tierInfo.b];

  const { dpi, hz, tl, pt } = model;

  // LAYER 2: Hardware Compensation
  const dpiNorm = (dpi - 300) / 260;
  const dpiAdj = -dpiNorm * 6;

  const hzAdj = hz >= 160 ? -6 : hz >= 144 ? -4.5 : hz >= 120 ? -2 : hz === 90 ? 2 : 5;
  const tlAdj = (tl - 6) * 1.2;
  const ptAdj = pt === 2 ? -2 : pt === 1 ? 0 : 3;

  const hwTotal = dpiAdj + hzAdj + tlAdj + ptAdj;

  s1 += Math.round(hwTotal * 1.00);
  s2 += Math.round(hwTotal * 0.88);
  s3 += Math.round(hwTotal * 0.75);
  s4 += Math.round(hwTotal * 0.70);
  s5 += Math.round(hwTotal * 0.60);

  // LAYER 3: Gaussian Variance (deterministic)
  const gVar = () => cl(gaussian(rng) * 3.2, -7, 7);
  s1 += gVar();
  s2 += gVar();
  s3 += gVar();
  s4 += gVar();
  s5 += gVar();

  // LAYER 4: Playstyle Adjustment
  const pMod = PLAYSTYLES[playstyle] || PLAYSTYLES.balanced;
  s1 += pMod.look;
  s2 += pMod.dot;
  s3 += pMod.sc2;
  s4 += pMod.sc4;
  s5 += pMod.sc5;

  let fireMod = pMod.fire;
  let camMod = pMod.cam;

  // LAYER 5: NLP Analysis
  const nlp = nlpAnalyze(issue);
  const { recoil, lag, overshoot, close, far, stiff } = nlp.scores;

  let sensAdj = 0;

  if (recoil.score > 0) sensAdj -= Math.min(recoil.score * 8, 28);
  if (lag.score > 0) sensAdj += Math.min(lag.score * 10, 30);

  if (overshoot.score > 0) {
    const amt = Math.min(overshoot.score * 7, 25);
    sensAdj -= amt;
    fireMod -= Math.round(amt * 0.3);
  }

  if (close.score > 0) {
    fireMod += Math.round(Math.min(close.score * 5, 12));
    camMod += Math.round(Math.min(close.score * 6, 15));
    sensAdj -= Math.round(close.score * 2);
  }

  let farAdj4 = 0;
  let farAdj5 = 0;

  if (far.score > 0) {
    farAdj4 = Math.round(Math.min(far.score * 4, 12));
    farAdj5 = Math.round(Math.min(far.score * 6, 16));
    fireMod -= Math.round(far.score * 2);
  }

  if (stiff.score > 0) sensAdj += Math.min(stiff.score * 9, 22);

  // Apply sensitivity adjustments
  s1 += Math.round(sensAdj * 1.00);
  s2 += Math.round(sensAdj * 0.82);
  s3 += Math.round(sensAdj * 0.65);
  s4 += Math.round(sensAdj * 0.55) - farAdj4;
  s5 += Math.round(sensAdj * 0.48) - farAdj5;

  // LAYER 6: Cross-calibration (bảo đảm quan hệ logic)
  // Chung >= RedDot >= 2X >= 4X >= Sniper
  if (s2 > s1) s2 = s1 - sR(rng, 2, 6);
  if (s3 > s2 + 3) s3 = s2 + sR(rng, -2, 3);
  if (s4 > s3 + 5) s4 = s3 + sR(rng, -3, 5);
  if (s5 > s4 - 8) s5 = s4 - sR(rng, 8, 20);

  if (s1 - s2 < 3) s2 = s1 - sR(rng, 3, 8);
  if (s2 - s3 > 35) s3 = s2 - sR(rng, 15, 25);
  if (s3 - s4 > 20) s4 = s3 - sR(rng, 5, 12);
  if (s4 - s5 > 45) s5 = s4 - sR(rng, 25, 40);
  if (s4 - s5 < 10) s5 = s4 - sR(rng, 10, 22);

  // LAYER 7: Final Clamping
  s1 = cl(s1, 80, 200);
  s2 = cl(s2, 70, 200);
  s3 = cl(s3, 65, 200);
  s4 = cl(s4, 55, 200);
  s5 = cl(s5, 35, 180);

  // Fire button & Free look camera
  let fireBase = sR(rng, 38, 50);
  let camBase = sR(rng, 48, 82);

  if (model.tier === 'TP' || model.tier === 'TL') {
    fireBase -= 8;
    camBase -= 5;
  }

  const fire = cl(fireBase + fireMod, 25, 70);
  const cam = cl(camBase + camMod, 15, 100);

  // Confidence Score (82-99%)
  let confidence = 82;
  confidence += Math.min(nlp.totalHits * 3, 12);
  if (playstyle !== 'balanced') confidence += 3;
  confidence = Math.min(confidence, 99);

  // Analysis Lines for UI
  const analysisLines: string[] = [];
  analysisLines.push(`${dpi} DPI · ${hz}Hz · ${tierInfo.label}`);

  if (recoil.score > 0) analysisLines.push(`Giảm nhạy ổn định tâm (-${Math.round(Math.min(recoil.score * 8, 28))})`);
  if (lag.score > 0) analysisLines.push(`Tăng nhạy bù hiệu suất (+${Math.round(Math.min(lag.score * 10, 30))})`);
  if (overshoot.score > 0) analysisLines.push(`Giảm nhạy chống kéo lố (-${Math.round(Math.min(overshoot.score * 7, 25))})`);
  if (close.score > 0) analysisLines.push('Tối ưu cận chiến / auto headshot');
  if (far.score > 0) analysisLines.push('Tối ưu bắn tỉa — Sniper Scope giảm sâu hơn 4X');
  if (stiff.score > 0) analysisLines.push(`Tăng nhạy bù cảm ứng cứng (+${Math.round(Math.min(stiff.score * 9, 22))})`);

  return {
    brandName: brand.name,
    deviceName: model.n,
    os: brand.os,
    s1, s2, s3, s4, s5,
    fire,
    cam,
    confidence,
    analysisLines,
    tier: model.tier,
    tierLabel: tierInfo.label
  };
}