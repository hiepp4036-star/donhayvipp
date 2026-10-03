/**
 * Type Definitions for Free Fire Sensitivity Calculator OB54
 */

export interface DeviceModel {
  k: string;      // model key
  n: string;      // display name
  dpi: number;    // DPI
  hz: number;     // refresh rate
  tl: number;     // touch latency (ms)
  pt: number;     // panel type: 0=LCD, 1=OLED, 2=LTPO
  tier: string;   // tier key
}

export interface DeviceCatalog {
  key: string;           // brand key
  name: string;          // brand display name
  os: 'iOS' | 'Android';
  models: DeviceModel[];
}

export interface TierBase {
  b: number[];           // base sensitivities [general, redDot, 2x, 4x, sniper]
  label: string;         // tier display name
}

export interface PlaystyleMod {
  look: number;          // General
  dot: number;           // Red Dot
  sc2: number;           // 2X Scope
  sc4: number;           // 4X Scope
  sc5: number;           // Sniper Scope
  fire: number;          // Fire button size
  cam: number;           // Free look camera
  desc: string;          // description
}

export interface NLPKeyword {
  t: string;             // keyword text
  w: number;             // weight
}

export interface NLPRule {
  w: number;             // category weight
  kw: NLPKeyword[];      // keywords
}

export interface NLPScores {
  recoil: { score: number; hits: number };
  lag: { score: number; hits: number };
  overshoot: { score: number; hits: number };
  close: { score: number; hits: number };
  far: { score: number; hits: number };
  stiff: { score: number; hits: number };
}

export interface NLPResult {
  scores: NLPScores;
  totalHits: number;
}

export interface SensitivityResult {
  brandName: string;
  deviceName: string;
  os: string;
  s1: number;            // General
  s2: number;            // Red Dot
  s3: number;            // 2X Scope
  s4: number;            // 4X Scope
  s5: number;            // Sniper Scope
  fire: number;          // Fire button size (%)
  cam: number;           // Free look camera (%)
  confidence: number;    // 82-99%
  analysisLines: string[];
  tier: string;
  tierLabel: string;
}

// License Key Types
export interface LicenseKeyData {
  brandKey: string;
  modelKey: string;
  expiryDays: number;    // 0 = lifetime
  maxUses: number;       // 0 = unlimited
  createdAt: number;
  key: string;           // full formatted key
}

export interface ValidationResult {
  valid: boolean;
  data?: LicenseKeyData;
  error?: string;
  remainingDays?: number;
  remainingUses?: number;
}

// UI State Types
export type ViewState = 'license' | 'form' | 'loading' | 'result';

export interface FormData {
  brandKey: string;
  modelKey: string;
  playstyle: 'rusher' | 'balanced' | 'sniper';
  issueText: string;
}

export interface AppConfig {
  theme: 'dark' | 'light' | 'auto';
  language: 'vi' | 'en';
  soundEnabled: boolean;
  reducedMotion: boolean;
  lastUsedDevice?: { brandKey: string; modelKey: string };
}

// API Types
export interface ValidateKeyRequest {
  key: string;
  brandKey: string;
  modelKey: string;
  fingerprint?: string;
}

export interface ValidateKeyResponse {
  valid: boolean;
  data?: LicenseKeyData;
  error?: string;
}

export interface GenerateKeyRequest {
  brandKey: string;
  modelKey: string;
  expiryDays: number;
  maxUses: number;
  count: number;
  adminPassword: string;
}

export interface GenerateKeyResponse {
  keys: LicenseKeyData[];
  error?: string;
}