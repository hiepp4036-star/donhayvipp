/**
 * i18n System - Vietnamese / English
 * Simple key-value translation with interpolation support
 */

import type { AppConfig } from './types';

type Locale = 'vi' | 'en';
type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = {
  vi: {
    // App
    app_title: 'Free Fire Sensitivity OB54',
    app_subtitle: 'Tính toán độ nhạy chuẩn OB54 · Make By Benz',
    app_version: 'Phiên bản {version}',

    // License Gate
    license_title: 'Kích hoạt bản quyền',
    license_subtitle: 'Nhập key để sử dụng tính năng tính toán độ nhạy',
    license_placeholder: 'BZ-OB54-XXXX-XXXX-XXXX-XXXX-XXXX',
    license_verify: 'Xác thực',
    license_verifying: 'Đang xác thực...',
    license_invalid: 'Key không hợp lệ hoặc đã hết hạn',
    license_device_mismatch: 'Key không khớp với thiết bị đã chọn',
    license_success: 'Kích hoạt thành công!',
    license_cached: 'Đã ghi nhớ key cho thiết bị này ({days} ngày)',
    license_enter_manually: 'Nhập key thủ công',
    license_contact_admin: 'Liên hệ admin để lấy key',

    // Form
    form_title: 'Thiết lập thông số · OB54',
    brand_label: 'Hãng máy',
    brand_placeholder: 'Chọn hãng máy...',
    model_label: 'Dòng máy / Model',
    model_placeholder: 'Chọn dòng máy...',
    model_count: '({count} máy)',
    playstyle_label: 'Phong cách chơi',
    playstyle_rusher: 'Rusher — Áp sát, giao tranh gần',
    playstyle_balanced: 'Cân bằng — Đa dụng',
    playstyle_sniper: 'Sniper — Giữ điểm, bắn xa',
    issue_label: 'Tình trạng khi chơi',
    issue_placeholder: 'Rung tâm, lag, kéo lố đầu, vuốt nặng, hay bắn xa/gần...',
    issue_counter: '{current}/200',
    submit_btn: 'Trích Xuất',

    // Loading
    loading_title: 'Đang phân tích...',
    loading_steps: [
      'Khởi tạo...',
      'Tra cứu thiết bị...',
      'Phân tích DPI/Hz...',
      'Bù trừ cảm ứng...',
      'Tối ưu chuẩn OB54...'
    ],

    // Results
    result_title: 'ĐÃ TỐI ƯU',
    result_device: '{device} · {os}',
    result_confidence: 'Chuẩn OB54 · Độ tin cậy: {confidence}%',
    result_analysis: 'Phân tích: {lines}',
    gauge_general: 'Nhìn xung quanh (General)',
    gauge_reddot: 'Red Dot',
    gauge_2x: 'Ống ngắm 2X',
    gauge_4x: 'Ống ngắm 4X',
    gauge_sniper: 'Ống ngắm Sniper (AWM)',
    gauge_camera: 'Camera tự do (Free Look)',
    fire_button: 'Nút bắn (Size)',
    recalculate_btn: 'Tính Toán Lại',

    // Footer
    footer: '© 2026 · MAKE BY BENZ',

    // Admin Keygen
    admin_title: 'Key Generator — Admin Only',
    admin_password: 'Mật khẩu admin',
    admin_brand: 'Hãng máy',
    admin_model: 'Dòng máy',
    admin_expiry: 'Hết hạn (ngày, 0=vĩnh viễn)',
    admin_max_uses: 'Số lần dùng tối đa (0=không giới hạn)',
    admin_count: 'Số lượng key',
    admin_generate: 'Tạo Key',
    admin_generating: 'Đang tạo...',
    admin_result: 'Kết quả ({count} key)',
    admin_copy_all: 'Copy tất cả',
    admin_download_csv: 'Tải CSV',
    admin_download_json: 'Tải JSON',
    admin_error: 'Lỗi: {error}',
    admin_success: 'Đã tạo {count} key thành công',

    // Settings
    settings_title: 'Cài đặt',
    settings_theme: 'Giao diện',
    settings_theme_dark: 'Tối',
    settings_theme_light: 'Sáng',
    settings_theme_auto: 'Tự động (Hệ thống)',
    settings_language: 'Ngôn ngữ',
    settings_sound: 'Âm thanh tương tác',
    settings_reduced_motion: 'Giảm chuyển động',
    settings_export: 'Xuất dữ liệu',
    settings_import: 'Nhập dữ liệu',
    settings_clear: 'Xóa toàn bộ dữ liệu',
    settings_clear_confirm: 'Bạn có chắc? Hành động này không thể hoàn tác.',

    // Toasts/Alerts
    error_fill_all: 'Vui lòng chọn hãng máy, dòng máy, phong cách và mô tả tình trạng.',
    error_not_found: 'Không tìm thấy thiết bị đã chọn, vui lòng chọn lại.',
    error_generic: 'Đã có lỗi xảy ra, vui lòng thử lại.',

    // PWA
    pwa_install: 'Cài đặt ứng dụng',
    pwa_offline: 'Đang hoạt động ngoại tuyến',
    pwa_update: 'Có phiên bản mới, tải lại để cập nhật'
  },

  en: {
    // App
    app_title: 'Free Fire Sensitivity OB54',
    app_subtitle: 'OB54 Sensitivity Calculator · Make By Benz',
    app_version: 'Version {version}',

    // License Gate
    license_title: 'License Activation',
    license_subtitle: 'Enter key to use sensitivity calculator',
    license_placeholder: 'BZ-OB54-XXXX-XXXX-XXXX-XXXX-XXXX',
    license_verify: 'Verify',
    license_verifying: 'Verifying...',
    license_invalid: 'Invalid or expired key',
    license_device_mismatch: 'Key does not match selected device',
    license_success: 'Activation successful!',
    license_cached: 'Key cached for this device ({days} days)',
    license_enter_manually: 'Enter key manually',
    license_contact_admin: 'Contact admin for key',

    // Form
    form_title: 'Setup Parameters · OB54',
    brand_label: 'Brand',
    brand_placeholder: 'Select brand...',
    model_label: 'Model',
    model_placeholder: 'Select model...',
    model_count: '({count} models)',
    playstyle_label: 'Playstyle',
    playstyle_rusher: 'Rusher — Close combat, aggressive',
    playstyle_balanced: 'Balanced — Versatile',
    playstyle_sniper: 'Sniper — Hold angle, long range',
    issue_label: 'Current Issues',
    issue_placeholder: 'Shaky aim, lag, overshoot, heavy swipe, long/short range...',
    issue_counter: '{current}/200',
    submit_btn: 'Calculate',

    // Loading
    loading_title: 'Analyzing...',
    loading_steps: [
      'Initializing...',
      'Looking up device...',
      'Analyzing DPI/Hz...',
      'Touch compensation...',
      'Optimizing for OB54...'
    ],

    // Results
    result_title: 'OPTIMIZED',
    result_device: '{device} · {os}',
    result_confidence: 'OB54 Standard · Confidence: {confidence}%',
    result_analysis: 'Analysis: {lines}',
    gauge_general: 'General (Look)',
    gauge_reddot: 'Red Dot',
    gauge_2x: '2X Scope',
    gauge_4x: '4X Scope',
    gauge_sniper: 'Sniper Scope (AWM)',
    gauge_camera: 'Free Look Camera',
    fire_button: 'Fire Button (Size)',
    recalculate_btn: 'Recalculate',

    // Footer
    footer: '© 2026 · MAKE BY BENZ',

    // Admin Keygen
    admin_title: 'Key Generator — Admin Only',
    admin_password: 'Admin Password',
    admin_brand: 'Brand',
    admin_model: 'Model',
    admin_expiry: 'Expiry (days, 0=lifetime)',
    admin_max_uses: 'Max Uses (0=unlimited)',
    admin_count: 'Key Count',
    admin_generate: 'Generate Keys',
    admin_generating: 'Generating...',
    admin_result: 'Results ({count} keys)',
    admin_copy_all: 'Copy All',
    admin_download_csv: 'Download CSV',
    admin_download_json: 'Download JSON',
    admin_error: 'Error: {error}',
    admin_success: 'Generated {count} keys successfully',

    // Settings
    settings_title: 'Settings',
    settings_theme: 'Theme',
    settings_theme_dark: 'Dark',
    settings_theme_light: 'Light',
    settings_theme_auto: 'Auto (System)',
    settings_language: 'Language',
    settings_sound: 'Interaction Sounds',
    settings_reduced_motion: 'Reduced Motion',
    settings_export: 'Export Data',
    settings_import: 'Import Data',
    settings_clear: 'Clear All Data',
    settings_clear_confirm: 'Are you sure? This action cannot be undone.',

    // Toasts/Alerts
    error_fill_all: 'Please select brand, model, playstyle, and describe your issues.',
    error_not_found: 'Selected device not found, please try again.',
    error_generic: 'An error occurred, please try again.',

    // PWA
    pwa_install: 'Install App',
    pwa_offline: 'Working offline',
    pwa_update: 'New version available, reload to update'
  }
};

let currentLocale: Locale = 'vi';

/**
 * Initialize i18n from config
 */
export function initI18n(config: AppConfig): void {
  currentLocale = config.language;
  document.documentElement.lang = currentLocale;
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Set locale and persist
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  document.documentElement.lang = locale;
}

/**
 * Translate key with optional interpolation
 * Supports {var} placeholder replacement
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] || translations.vi;
  let str = dict[key] || translations.vi[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return str;
}

/**
 * Translate array of keys
 */
export function tArray(keys: string[]): string[] {
  return keys.map(k => t(k));
}

/**
 * Get all translations for current locale (for admin/debug)
 */
export function getAllTranslations(): TranslationMap {
  return { ...translations[currentLocale] };
}