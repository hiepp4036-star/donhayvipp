/**
 * Free Fire Sensitivity Calculator OB54 - Main App Entry
 * Initializes all components, handles state management, routing
 */

import type { DeviceCatalog, SensitivityResult, FormData, AppConfig } from './core/types';
import { computeSensitivity } from './core/algorithm';
import { getConfig, saveConfig, getLastDevice, saveLastDevice, addToHistory } from './core/storage';
import { initI18n, t } from './core/i18n';
import { DeviceSelector } from './components/DeviceSelector.ts';
import { SensitivityForm } from './components/SensitivityForm.ts';
import { ResultPanel } from './components/ResultPanel.ts';
import { LicenseGate } from './components/LicenseGate.ts';
import { AdminKeygen } from './components/AdminKeygen.ts';
import { AdminDashboard } from './components/AdminDashboard.ts';
import { MatrixRain } from './components/MatrixRain.ts';
import { getSoundEngine } from './components/SoundEngine.ts';
import { toast } from './components/ui/Toast.ts';
import { initSentryBrowser, addBreadcrumb } from './lib/sentry.ts';
import { trackEvent } from './lib/redis.ts';

import deviceCatalog from './assets/data/device-catalog.json';

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'ff-ob54-benz-secret-key-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

type ViewState = 'license' | 'form' | 'loading' | 'result';

class App {
  private state: ViewState = 'license';
  private currentResult: SensitivityResult | null = null;
  private currentFormData: FormData | null = null;

  // Components
  private deviceSelector!: DeviceSelector;
  private sensitivityForm!: SensitivityForm;
  private resultPanel!: ResultPanel;
  private licenseGate!: LicenseGate;
  private adminKeygen!: AdminKeygen;
  private adminDashboard!: AdminDashboard;
  private matrixRain!: MatrixRain;
  private soundEngine!: ReturnType<typeof getSoundEngine>;

  // DOM Elements
  private appEl!: HTMLElement;
  private viewLicense!: HTMLElement;
  private viewForm!: HTMLElement;
  private viewLoading!: HTMLElement;
  private viewResult!: HTMLElement;
  private adminSection!: HTMLElement;

  async init(): Promise<void> {
    // Initialize Sentry (browser)
    initSentryBrowser();
    addBreadcrumb('app', 'init', { version: process.env.npm_package_version });

    // Load config
    const config = getConfig();
    initI18n(config);

    // Apply theme
    this.applyTheme(config.theme);

    // Initialize sound engine
    this.soundEngine = getSoundEngine({ enabled: config.soundEnabled });

    // Initialize matrix rain
    this.matrixRain = new MatrixRain();
    this.matrixRain.start();

    // Reduce motion
    if (config.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
      this.matrixRain.stop();
    }

    // Build UI
    this.buildUI();

    // Track page view
    await trackEvent('page_view', { path: window.location.pathname });

    // Check for admin route
    if (window.location.pathname.includes('/admin')) {
      this.showAdmin();
      return;
    }

    // Load last device
    const lastDevice = getLastDevice();
    if (lastDevice) {
      this.deviceSelector.setBrand(lastDevice.brandKey);
      this.deviceSelector.setModel(lastDevice.modelKey);
    }

    // Start with license gate
    this.switchView('license');
  }

  private buildUI(): void {
    this.appEl = document.createElement('div');
    this.appEl.className = 'app';
    this.appEl.id = 'app';
    document.body.appendChild(this.appEl);

    // Rainbow gradient SVG defs
    const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgDefs.style.cssText = 'position:absolute;width:0;height:0';
    svgDefs.innerHTML = `
      <defs>
        <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff3333" />
          <stop offset="16%" stop-color="#ff8c1a" />
          <stop offset="33%" stop-color="#ffd700" />
          <stop offset="50%" stop-color="#00e64d" />
          <stop offset="66%" stop-color="#1a8cff" />
          <stop offset="83%" stop-color="#6666ff" />
          <stop offset="100%" stop-color="#cc33ff" />
        </linearGradient>
      </defs>
    `;
    document.body.appendChild(svgDefs);

    // Shell
    const shell = document.createElement('div');
    shell.className = 'shell';
    this.appEl.appendChild(shell);

    const panel = document.createElement('div');
    panel.className = 'panel';
    shell.appendChild(panel);

    // Header
    const header = document.createElement('div');
    header.className = 'hd';
    header.innerHTML = `
      <div class="hd-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="url(#rainbowGrad)" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="8" opacity=".35" />
          <circle cx="12" cy="12" r="2" />
          <line x1="12" y1="2" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="2" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="22" y2="12" />
        </svg>
      </div>
      <div class="hd-info">
        <h1>${t('app_title')}</h1>
        <p>${t('app_subtitle')}</p>
      </div>
      <div class="hd-badge">OB54</div>
    `;
    panel.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.className = 'ct';
    panel.appendChild(content);

    // License View
    this.viewLicense = document.createElement('div');
    this.viewLicense.id = 'view-license';
    this.viewLicense.className = 'view';
    content.appendChild(this.viewLicense);

    // Form View
    this.viewForm = document.createElement('div');
    this.viewForm.id = 'view-form';
    this.viewForm.className = 'view hide';
    content.appendChild(this.viewForm);

    // Loading View
    this.viewLoading = document.createElement('div');
    this.viewLoading.id = 'view-loading';
    this.viewLoading.className = 'view hide';
    this.viewLoading.innerHTML = `
      <div class="clo">
        <div class="clo-vis">
          <div class="clo-ring"></div>
          <div class="clo-ring"></div>
          <div class="clo-core"></div>
        </div>
        <p class="clo-title">${t('loading_title')}</p>
        <div class="clo-bar"><div class="clo-fill" id="loading-fill"></div></div>
        <p class="clo-step" id="loading-step">${t('loading_steps')[0]}</p>
      </div>
    `;
    content.appendChild(this.viewLoading);

    // Result View
    this.viewResult = document.createElement('div');
    this.viewResult.id = 'view-result';
    this.viewResult.className = 'view hide';
    content.appendChild(this.viewResult);

    // Admin Section (hidden by default)
    this.adminSection = document.createElement('div');
    this.adminSection.id = 'admin-section';
    this.adminSection.style.display = 'none';
    shell.appendChild(this.adminSection);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'ft';
    footer.textContent = t('footer');
    panel.appendChild(footer);

    // Initialize components
    this.initComponents();
  }

  private initComponents(): void {
    // Device Selector
    this.deviceSelector = new DeviceSelector({
      catalog: deviceCatalog as DeviceCatalog[],
      onBrandChange: (brandKey: string) => this.onBrandChange(brandKey),
      onModelChange: (brandKey: string, modelKey: string) => this.onModelChange(brandKey, modelKey),
      initialBrand: getLastDevice()?.brandKey,
      initialModel: getLastDevice()?.modelKey
    });
    this.viewForm.appendChild(this.deviceSelector.getElement());

    // Sensitivity Form
    this.sensitivityForm = new SensitivityForm({
      onSubmit: (data: FormData) => this.handleSubmit(data),
      onIssueChange: (_text: string, _count: number) => this.onIssueChange(_text, _count)
    });
    this.viewForm.appendChild(this.sensitivityForm.getElement());

    // License Gate
    this.licenseGate = new LicenseGate({
      brandKey: this.deviceSelector.getBrandKey() || 'samsung',
      modelKey: this.deviceSelector.getModelKey() || 's24u',
      secretKey: SECRET_KEY,
      onValid: (data: any) => this.onLicenseValid(data),
      onBypass: () => this.onLicenseBypass()
    });
    this.viewLicense.appendChild(this.licenseGate.getElement());

    // Admin Keygen
    this.adminKeygen = new AdminKeygen({
      catalog: deviceCatalog as DeviceCatalog[],
      secretKey: SECRET_KEY,
      adminPasswordHash: ADMIN_PASSWORD_HASH,
      onKeysGenerated: (_keys: any) => console.log('Keys generated:', _keys.length)
    });
    this.adminSection.appendChild(this.adminKeygen.getElement());

    // Admin Dashboard
    this.adminDashboard = new AdminDashboard({
      onRefresh: () => this.adminDashboard?.refresh()
    });
    this.adminSection.appendChild(this.adminDashboard.getElement());
  }

  private switchView(view: ViewState): void {
    this.state = view;

    [this.viewLicense, this.viewForm, this.viewLoading, this.viewResult].forEach(v => v.classList.add('hide'));
    this.adminSection.style.display = 'none';

    switch (view) {
      case 'license':
        this.viewLicense.classList.remove('hide');
        break;
      case 'form':
        this.viewForm.classList.remove('hide');
        break;
      case 'loading':
        this.viewLoading.classList.remove('hide');
        this.animateLoading();
        break;
      case 'result':
        this.viewResult.classList.remove('hide');
        break;
    }
  }

  private animateLoading(): void {
    const steps = t('loading_steps');
    const fillEl = document.getElementById('loading-fill');
    const stepEl = document.getElementById('loading-step');

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        if (stepEl) stepEl.textContent = steps[i];
        if (fillEl) fillEl.style.width = `${((i + 1) / steps.length) * 100}%`;
        i++;
      } else {
        clearInterval(interval);
      }
    }, 350);
  }

  private async onBrandChange(brandKey: string): Promise<void> {
    this.licenseGate.setDevice(brandKey, this.deviceSelector.getModelKey() || '');
  }

  private async onModelChange(brandKey: string, modelKey: string): Promise<void> {
    this.licenseGate.setDevice(brandKey, modelKey);
    saveLastDevice(brandKey, modelKey);
  }

  private onIssueChange(_text: string, _count: number): void {
    // Char counter handled by form component
  }

  private onLicenseValid(data: any): void {
    this.switchView('form');
  }

  private onLicenseBypass(): void {
    this.switchView('form');
  }

  private async handleSubmit(formData: FormData): Promise<void> {
    // Validation
    if (!formData.brandKey || !formData.modelKey || !formData.playstyle || !formData.issueText.trim()) {
      toast.error(t('error_fill_all'));
      this.soundEngine.playError();
      return;
    }

    this.currentFormData = formData;
    this.soundEngine.playClick();
    this.switchView('loading');

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1800));

    // Compute sensitivity
    const result = computeSensitivity(
      deviceCatalog as DeviceCatalog[],
      formData.brandKey,
      formData.modelKey,
      formData.playstyle,
      formData.issueText
    );

    if (!result) {
      toast.error(t('error_not_found'));
      this.soundEngine.playError();
      this.switchView('form');
      return;
    }

    this.currentResult = result;
    this.soundEngine.playComplete();

    // Create result panel
    this.resultPanel = new ResultPanel({
      result,
      onRecalculate: () => this.handleRecalculate(),
      onShare: (r) => this.shareResult(r),
      onExportImage: (r) => this.exportResultImage(r),
      animate: true
    });
    this.viewResult.innerHTML = '';
    this.viewResult.appendChild(this.resultPanel.getElement());

    // Save to history
    addToHistory(formData, result);

    this.switchView('result');
  }

  private handleRecalculate(): void {
    this.soundEngine.playClick();
    if (this.currentFormData) {
      this.handleSubmit(this.currentFormData);
    }
  }

  private shareResult(result: SensitivityResult): void {
    const text = `${result.deviceName} - OB54 Sensitivity
General: ${result.s1}
Red Dot: ${result.s2}
2X: ${result.s3}
4X: ${result.s4}
Sniper: ${result.s5}
Fire: ${result.fire}%
Camera: ${result.cam}%
Confidence: ${result.confidence}%`;

    if (navigator.share) {
      navigator.share({ title: 'Free Fire Sensitivity', text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Đã copy kết quả');
      }).catch(() => {
        toast.error('Không thể copy');
      });
    }
  }

  private exportResultImage(result: SensitivityResult): void {
    // Create canvas with result visualization
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${result.deviceName} - OB54 Sensitivity`, canvas.width / 2, 60);

    // Gauges
    const gauges = [
      { label: 'General', value: result.s1, max: 200 },
      { label: 'Red Dot', value: result.s2, max: 200 },
      { label: '2X Scope', value: result.s3, max: 200 },
      { label: '4X Scope', value: result.s4, max: 200 },
      { label: 'Sniper', value: result.s5, max: 180 },
      { label: 'Camera', value: result.cam, max: 100, unit: '%' }
    ];

    gauges.forEach((g, i) => {
      const y = 130 + i * 130;
      ctx.font = '18px sans-serif';
      ctx.fillText(`${g.label}: ${g.value}${g.unit || ''}`, canvas.width / 2, y - 10);

      // Bar
      const barWidth = 600;
      const barHeight = 30;
      const x = (canvas.width - barWidth) / 2;
      const pct = Math.min(1, g.value / g.max);

      ctx.fillStyle = '#1f242e';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Rainbow gradient
      const grad = ctx.createLinearGradient(x, y, x + barWidth, y);
      grad.addColorStop(0, '#ff3333');
      grad.addColorStop(0.16, '#ff8c1a');
      grad.addColorStop(0.33, '#ffd700');
      grad.addColorStop(0.5, '#00e64d');
      grad.addColorStop(0.66, '#1a8cff');
      grad.addColorStop(0.83, '#6666ff');
      grad.addColorStop(1, '#cc33ff');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth * pct, barHeight);
    });

    // Footer
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#8a8d97';
    ctx.fillText('Make By Benz · Free Fire OB54', canvas.width / 2, canvas.height - 30);

    // Download
    const link = document.createElement('a');
    link.download = `ff-sensitivity-${result.deviceName.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success('Đã tải ảnh kết quả');
  }

  private showAdmin(): void {
    this.viewLicense.style.display = 'none';
    this.viewForm.style.display = 'none';
    this.viewLoading.style.display = 'none';
    this.viewResult.style.display = 'none';
    this.adminSection.style.display = 'block';

    document.title = 'Admin Dashboard · Free Fire OB54';

    // Track admin access
    void trackEvent('admin_access', { path: window.location.pathname });
  }

  private applyTheme(theme: AppConfig['theme']): void {
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }

  // Public API for external access
  public toggleSound(): void {
    const config = getConfig();
    const newEnabled = !config.soundEnabled;
    saveConfig({ soundEnabled: newEnabled });
    this.soundEngine.setEnabled(newEnabled);
    toast.info(newEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt');
  }

  public toggleTheme(): void {
    const config = getConfig();
    const themes: AppConfig['theme'][] = ['dark', 'light', 'auto'];
    const currentIndex = themes.indexOf(config.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    saveConfig({ theme: nextTheme });
    this.applyTheme(nextTheme);
    toast.info(`Giao diện: ${nextTheme === 'dark' ? 'Tối' : nextTheme === 'light' ? 'Sáng' : 'Tự động'}`);
  }

  public destroy(): void {
    this.matrixRain.destroy();
    this.soundEngine.destroy();
    this.deviceSelector.destroy();
    this.sensitivityForm.destroy();
    this.licenseGate.destroy();
    this.resultPanel?.destroy();
    this.adminKeygen.destroy();
    this.adminDashboard?.destroy();
    this.appEl.remove();
  }
}

// Initialize app when DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();

  // Expose for debugging
  (window as any).ffApp = app;
});

// PWA Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}