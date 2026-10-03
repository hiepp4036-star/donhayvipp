/**
 * Storage Utilities - localStorage wrapper with type safety
 * Handles: license cache, user preferences, history, device memory
 */

import type { AppConfig, FormData, SensitivityResult, LicenseKeyData } from './types';

const STORAGE_KEYS = {
  CONFIG: 'ff_ob54_config',
  LICENSE_CACHE: 'ff_ob54_license_cache',
  HISTORY: 'ff_ob54_history',
  LAST_DEVICE: 'ff_ob54_last_device',
  DISMISSED_NOTICES: 'ff_ob54_dismissed'
} as const;

const DEFAULT_CONFIG: AppConfig = {
  theme: 'dark',
  language: 'vi',
  soundEnabled: true,
  reducedMotion: false
};

const MAX_HISTORY = 20;
const LICENSE_CACHE_DAYS = 30;

/**
 * Safe JSON parse with fallback
 */
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Get app config
 */
export function getConfig(): AppConfig {
  return safeParse(localStorage.getItem(STORAGE_KEYS.CONFIG), DEFAULT_CONFIG);
}

/**
 * Save app config (partial update)
 */
export function saveConfig(partial: Partial<AppConfig>): AppConfig {
  const current = getConfig();
  const updated = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
  return updated;
}

/**
 * Get license cache for device
 */
export function getLicenseCache(brandKey: string, modelKey: string): LicenseKeyData | null {
  const cacheKey = `${brandKey}:${modelKey}`;
  const allCache = safeParse<Record<string, LicenseKeyData & { cachedAt: number }>>(
    localStorage.getItem(STORAGE_KEYS.LICENSE_CACHE),
    {}
  );

  const entry = allCache[cacheKey];
  if (!entry) return null;

  // Check if cache expired (30 days)
  const ageDays = (Date.now() - entry.cachedAt) / 86400000;
  if (ageDays > LICENSE_CACHE_DAYS) {
    delete allCache[cacheKey];
    localStorage.setItem(STORAGE_KEYS.LICENSE_CACHE, JSON.stringify(allCache));
    return null;
  }

  return entry;
}

/**
 * Save license cache for device
 */
export function saveLicenseCache(brandKey: string, modelKey: string, data: LicenseKeyData): void {
  const cacheKey = `${brandKey}:${modelKey}`;
  const allCache = safeParse<Record<string, LicenseKeyData & { cachedAt: number }>>(
    localStorage.getItem(STORAGE_KEYS.LICENSE_CACHE),
    {}
  );

  allCache[cacheKey] = { ...data, cachedAt: Date.now() };
  localStorage.setItem(STORAGE_KEYS.LICENSE_CACHE, JSON.stringify(allCache));
}

/**
 * Clear license cache for device (on logout/invalidate)
 */
export function clearLicenseCache(brandKey: string, modelKey: string): void {
  const cacheKey = `${brandKey}:${modelKey}`;
  const allCache = safeParse<Record<string, LicenseKeyData & { cachedAt: number }>>(
    localStorage.getItem(STORAGE_KEYS.LICENSE_CACHE),
    {}
  );
  delete allCache[cacheKey];
  localStorage.setItem(STORAGE_KEYS.LICENSE_CACHE, JSON.stringify(allCache));
}

/**
 * Get calculation history
 */
export function getHistory(): (FormData & SensitivityResult & { timestamp: number })[] {
  return safeParse(localStorage.getItem(STORAGE_KEYS.HISTORY), []);
}

/**
 * Add to history
 */
export function addToHistory(form: FormData, result: SensitivityResult): void {
  const history = getHistory();
  const entry = {
    ...form,
    ...result,
    timestamp: Date.now()
  };

  // Remove duplicates (same device + playstyle)
  const filtered = history.filter(
    h => !(h.brandKey === form.brandKey && h.modelKey === form.modelKey && h.playstyle === form.playstyle)
  );

  filtered.unshift(entry);
  if (filtered.length > MAX_HISTORY) filtered.length = MAX_HISTORY;

  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
}

/**
 * Clear history
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

/**
 * Get last used device
 */
export function getLastDevice(): { brandKey: string; modelKey: string } | null {
  return safeParse(localStorage.getItem(STORAGE_KEYS.LAST_DEVICE), null);
}

/**
 * Save last used device
 */
export function saveLastDevice(brandKey: string, modelKey: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_DEVICE, JSON.stringify({ brandKey, modelKey }));
}

/**
 * Notice dismissal tracking
 */
export function isNoticeDismissed(noticeId: string): boolean {
  const dismissed = safeParse<string[]>(localStorage.getItem(STORAGE_KEYS.DISMISSED_NOTICES), []);
  return dismissed.includes(noticeId);
}

export function dismissNotice(noticeId: string): void {
  const dismissed = safeParse<string[]>(localStorage.getItem(STORAGE_KEYS.DISMISSED_NOTICES), []);
  if (!dismissed.includes(noticeId)) {
    dismissed.push(noticeId);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_NOTICES, JSON.stringify(dismissed));
  }
}

/**
 * Export all user data (for backup)
 */
export function exportUserData(): string {
  return JSON.stringify({
    config: getConfig(),
    history: getHistory(),
    lastDevice: getLastDevice(),
    licenseCache: safeParse(localStorage.getItem(STORAGE_KEYS.LICENSE_CACHE), {}),
    exportedAt: Date.now()
  }, null, 2);
}

/**
 * Import user data (from backup)
 */
export function importUserData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
    if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    if (data.lastDevice) localStorage.setItem(STORAGE_KEYS.LAST_DEVICE, JSON.stringify(data.lastDevice));
    if (data.licenseCache) localStorage.setItem(STORAGE_KEYS.LICENSE_CACHE, JSON.stringify(data.licenseCache));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all app data (factory reset)
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}