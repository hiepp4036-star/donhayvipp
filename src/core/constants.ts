/**
 * Constants for Free Fire Sensitivity Calculator OB54
 * Static data: Tier bases, Playstyles, NLP Rules
 */

import type { TierBase, PlaystyleMod, NLPRule } from './types';

/**
 * Tier Base Sensitivities
 * Key: tier code
 * b: [General, RedDot, 2X, 4X, Sniper]
 */
export const TIER_BASE: Record<string, TierBase> = {
  GM: { b: [132, 120, 128, 125, 85], label: 'Gaming Phone' },
  FN: { b: [140, 128, 136, 132, 91], label: 'Flagship 2025-2026' },
  FS: { b: [146, 134, 142, 138, 97], label: 'Flagship 2023-2024' },
  FO: { b: [154, 141, 149, 145, 105], label: 'Flagship 2019-2022' },
  UM: { b: [160, 147, 155, 151, 111], label: 'Cận cao cấp' },
  MD: { b: [167, 153, 161, 157, 117], label: 'Tầm trung' },
  BG: { b: [176, 162, 169, 165, 125], label: 'Phổ thông' },
  TP: { b: [120, 108, 116, 113, 78], label: 'Tablet cao cấp' },
  TL: { b: [132, 120, 128, 124, 88], label: 'Tablet phổ thông' },
  LG: { b: [182, 168, 175, 171, 132], label: 'Đời cũ' },
};

/**
 * Thứ tự tier để nhóm dropdown
 */
export const TIER_ORDER = ['FN', 'FS', 'FO', 'UM', 'MD', 'GM', 'BG', 'TP', 'TL', 'LG'] as const;

/**
 * Playstyle Modifiers
 * Mỗi phong cách điều chỉnh base sensitivity theo đặc thâm gameplay
 */
export const PLAYSTYLES: Record<string, PlaystyleMod> = {
  rusher: {
    look: -15,   // Nhìn xung quanh nhanh hơn
    dot: -8,     // Red dot nhanh hơn
    sc2: -5,     // 2X nhanh hơn
    sc4: -3,     // 4X nhanh hơn
    sc5: -2,     // Sniper nhanh hơn
    fire: 8,     // Nút bắn to hơn
    cam: 12,     // Camera tự do nhanh hơn
    desc: 'Rusher'
  },
  balanced: {
    look: 0,
    dot: 0,
    sc2: 0,
    sc4: 0,
    sc5: 0,
    fire: 0,
    cam: 0,
    desc: 'Cân bằng'
  },
  sniper: {
    look: 12,    // Nhìn xung quanh chậm hơn (ổn định)
    dot: 8,      // Red dot chậm hơn
    sc2: -6,     // 2X giảm nhẹ
    sc4: -10,    // 4X giảm nhiều
    sc5: -12,    // Sniper giảm rất nhiều (bắn tỉa chính xác)
    fire: -4,    // Nút bắn nhỏ hơn
    cam: -8,     // Camera chậm hơn
    desc: 'Sniper'
  }
};

/**
 * NLP Rules - Phân tích tiếng Việt ngữ cảnh game FPS
 * Mỗi category có weight (w) và danh sách từ khóa với trọng số (w)
 */
export const NLP_RULES: Record<string, NLPRule> = {
  recoil: {
    w: 1.0,
    kw: [
      { t: 'rung', w: 1.0 },
      { t: 'giật', w: 1.2 },
      { t: 'lệch', w: 0.9 },
      { t: 'lung tung', w: 1.1 },
      { t: 'bay tâm', w: 1.3 },
      { t: 'trôi', w: 0.8 },
      { t: 'không ổn định', w: 1.0 },
      { t: 'tâm nhảy', w: 1.1 },
      { t: 'nảy', w: 0.9 },
      { t: 'tâm bay', w: 1.2 },
      { t: 'loạn tâm', w: 1.3 },
      { t: 'nòng súng', w: 0.7 },
      { t: 'tán đạn', w: 0.8 },
      { t: 'đạn bay', w: 0.7 },
      { t: 'tâm chữ thập', w: 0.6 },
      { t: 'crosshair', w: 0.6 },
      { t: 'recoil', w: 1.0 },
      { t: 'tung tâm', w: 1.1 },
      { t: 'giật nòng', w: 1.1 }
    ]
  },
  lag: {
    w: 1.0,
    kw: [
      { t: 'nặng', w: 1.0 },
      { t: 'lag', w: 1.2 },
      { t: 'chậm', w: 0.9 },
      { t: 'kẹt', w: 1.0 },
      { t: 'đơ', w: 1.1 },
      { t: 'giảm fps', w: 1.3 },
      { t: 'drop frame', w: 1.3 },
      { t: 'frame drop', w: 1.3 },
      { t: 'giật hình', w: 1.1 },
      { t: 'khựng', w: 1.0 },
      { t: 'đứng hình', w: 1.2 },
      { t: 'fps thấp', w: 1.2 },
      { t: 'tụt fps', w: 1.3 },
      { t: 'render chậm', w: 0.8 },
      { t: 'ping cao', w: 0.5 },
      { t: 'mạng yếu', w: 0.3 },
      { t: 'delay', w: 0.8 },
      { t: 'trì hoãn', w: 0.7 },
      { t: 'chậm phản hồi', w: 0.9 },
      { t: 'rớt fps', w: 1.2 },
      { t: 'giật lag', w: 1.2 }
    ]
  },
  overshoot: {
    w: 1.0,
    kw: [
      { t: 'hố', w: 1.0 },
      { t: 'vượt', w: 1.0 },
      { t: 'qua đầu', w: 1.1 },
      { t: 'quá nhanh', w: 1.2 },
      { t: 'quá nhạy', w: 1.3 },
      { t: 'kéo lố', w: 1.2 },
      { t: 'trượt', w: 0.8 },
      { t: 'lướt qua', w: 0.9 },
      { t: 'overshoot', w: 1.0 },
      { t: 'quá tay', w: 1.0 },
      { t: 'bay qua', w: 0.9 },
      { t: 'nhạy quá', w: 1.3 },
      { t: 'kéo quá', w: 1.1 },
      { t: 'vuốt lố', w: 1.1 },
      { t: 'quá mức', w: 1.0 },
      { t: 'lố tâm', w: 1.2 }
    ]
  },
  close: {
    w: 0.8,
    kw: [
      { t: 'full đỏ', w: 1.0 },
      { t: 'cận', w: 1.0 },
      { t: 'gần', w: 0.8 },
      { t: 'mp40', w: 1.2 },
      { t: 'shotgun', w: 1.1 },
      { t: 'mp5', w: 1.1 },
      { t: 'thompson', w: 1.0 },
      { t: 'ump', w: 1.0 },
      { t: 'smg', w: 1.0 },
      { t: 'vector', w: 1.1 },
      { t: 'mac10', w: 1.1 },
      { t: 'cận chiến', w: 1.2 },
      { t: 'rush', w: 0.9 },
      { t: 'm1014', w: 1.0 },
      { t: 'm1887', w: 1.1 },
      { t: 'đánh gần', w: 1.0 },
      { t: 'close range', w: 0.8 },
      { t: 'm79', w: 0.7 },
      { t: 'lựu đạn', w: 0.3 },
      { t: 'auto headshot', w: 1.1 },
      { t: 'húc mặt', w: 0.9 },
      { t: 'auto ghim đầu', w: 1.1 }
    ]
  },
  far: {
    w: 0.8,
    kw: [
      { t: 'xa', w: 0.8 },
      { t: 'tầm trung', w: 0.9 },
      { t: 'sniper', w: 1.2 },
      { t: 'svd', w: 1.1 },
      { t: 'awm', w: 1.3 },
      { t: 'kar98', w: 1.2 },
      { t: 'bắn tỉa', w: 1.2 },
      { t: 'm82b', w: 1.3 },
      { t: 'm14', w: 1.0 },
      { t: 'sks', w: 1.0 },
      { t: 'ak', w: 0.7 },
      { t: 'm4', w: 0.6 },
      { t: 'ar', w: 0.6 },
      { t: 'groza', w: 0.7 },
      { t: 'woodpecker', w: 0.8 },
      { t: 'ac80', w: 0.8 },
      { t: 'tầm xa', w: 1.1 },
      { t: 'long range', w: 0.8 },
      { t: 'scope', w: 0.5 },
      { t: 'ống ngắm sniper', w: 1.0 },
      { t: 'giữ điểm', w: 0.6 }
    ]
  },
  stiff: {
    w: 0.9,
    kw: [
      { t: 'cứng', w: 1.0 },
      { t: 'khó vuốt', w: 1.1 },
      { t: 'không mượt', w: 1.0 },
      { t: 'không trượt', w: 0.9 },
      { t: 'nặng tay', w: 1.1 },
      { t: 'chậm phản hồi', w: 0.8 },
      { t: 'ì', w: 0.7 },
      { t: 'đờ', w: 0.8 },
      { t: 'stiff', w: 0.8 },
      { t: 'khó kéo', w: 1.0 },
      { t: 'khó điều khiển', w: 0.9 },
      { t: 'cùi', w: 0.5 }
    ]
  }
};

/**
 * Rainbow colors for UI
 */
export const RAINBOW_COLORS = [
  '#ff3333',  // red
  '#ff8c1a',  // orange
  '#ffd700',  // yellow
  '#00e64d',  // green
  '#1a8cff',  // blue
  '#6666ff',  // indigo
  '#cc33ff'   // violet
] as const;

/**
 * App metadata
 */
export const APP_META = {
  name: 'Free Fire Sensitivity OB54',
  version: '8.0.0',
  author: 'Benz',
  description: 'Tính toán độ nhạy Free Fire chuẩn OB54 theo thiết bị thực tế',
  repoUrl: 'https://github.com/benz/ff-sensitivity-ob54'
} as const;