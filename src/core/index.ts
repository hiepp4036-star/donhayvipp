/**
 * Core Module Exports
 * Free Fire Sensitivity Calculator OB54 - Core Logic
 */

// Types
export * from './types';

// Constants
export { TIER_BASE, TIER_ORDER, PLAYSTYLES, NLP_RULES, RAINBOW_COLORS, APP_META } from './constants';

// Algorithm
export { findBrand, findModel, nlpAnalyze, computeSensitivity } from './algorithm';

// Crypto
export {
  fnv1a,
  Xorshift128,
  cl,
  lerp,
  gaussian,
  sR,
  generateFingerprint,
  hmacSha256,
  generateLicenseKey,
  validateLicenseKey,
  generateRandomString,
  hashPassword,
  verifyPassword
} from './crypto';

// Storage
export {
  getConfig,
  saveConfig,
  getLicenseCache,
  saveLicenseCache,
  clearLicenseCache,
  getHistory,
  addToHistory,
  clearHistory,
  getLastDevice,
  saveLastDevice,
  isNoticeDismissed,
  dismissNotice,
  exportUserData,
  importUserData,
  clearAllData
} from './storage';

// i18n
export { initI18n, getLocale, setLocale, t, tArray, getAllTranslations } from './i18n';