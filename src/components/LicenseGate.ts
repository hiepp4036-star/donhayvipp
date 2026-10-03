/**
 * License Gate Component
 * Key input, validation, device binding, cache management
 */

import type { LicenseKeyData } from '../core/types';
import { validateLicenseKey, generateFingerprint } from '../core/crypto';
import { getLicenseCache, saveLicenseCache, clearLicenseCache } from '../core/storage';
import { createPrimaryButton, createSecondaryButton } from './ui/Button';
import { toast } from './ui/Toast';
import { t } from '../core/i18n';

interface LicenseGateOptions {
  brandKey: string;
  modelKey: string;
  secretKey: string;
  onValid: (data: LicenseKeyData) => void;
  onBypass?: () => void;
  cachedData?: LicenseKeyData | null;
}

export class LicenseGate {
  private options: LicenseGateOptions;
  private container: HTMLElement;
  private keyInput!: HTMLInputElement;
  private verifyBtn!: ReturnType<typeof createPrimaryButton>;
  private bypassBtn!: ReturnType<typeof createSecondaryButton> | null;
  private statusEl!: HTMLElement;
  private validated = false;

  constructor(options: LicenseGateOptions) {
    this.options = options;
    this.container = this.createElement();
    this.bindEvents();
    this.checkCache();
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'license-gate';

    const card = document.createElement('div');
    card.className = 'license-card';
    wrapper.appendChild(card);

    const icon = document.createElement('div');
    icon.className = 'license-icon';
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
    card.appendChild(icon);

    const title = document.createElement('h2');
    title.className = 'license-title';
    title.textContent = t('license_title');
    card.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'license-subtitle';
    subtitle.textContent = t('license_subtitle');
    card.appendChild(subtitle);

    const deviceInfo = document.createElement('div');
    deviceInfo.className = 'license-device-info';
    deviceInfo.textContent = `Thiết bị: ${this.options.brandKey.toUpperCase()} / ${this.options.modelKey.toUpperCase()}`;
    card.appendChild(deviceInfo);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'license-input-group';

    this.keyInput = document.createElement('input');
    this.keyInput.type = 'text';
    this.keyInput.id = 'license-key';
    this.keyInput.className = 'license-key-input';
    this.keyInput.placeholder = t('license_placeholder');
    this.keyInput.setAttribute('aria-label', t('license_placeholder'));
    this.keyInput.autocomplete = 'off';
    this.keyInput.spellcheck = false;
    inputGroup.appendChild(this.keyInput);

    const hint = document.createElement('span');
    hint.className = 'license-hint';
    hint.textContent = 'Định dạng: BZ-OB54-HÃNG-MODEL-XXXX-XXXX-XXXX';
    inputGroup.appendChild(hint);

    card.appendChild(inputGroup);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'license-status';
    this.statusEl.setAttribute('aria-live', 'polite');
    card.appendChild(this.statusEl);

    this.verifyBtn = createPrimaryButton(
      t('license_verify'),
      () => this.handleVerify(),
      { fullWidth: true, size: 'lg' }
    );
    card.appendChild(this.verifyBtn.getElement());

    if (this.options.onBypass) {
      this.bypassBtn = createSecondaryButton(
        'Chế độ dev (bỏ qua)',
        () => this.options.onBypass!(),
        { fullWidth: true, size: 'sm' }
      );
      this.bypassBtn.getElement().classList.add('license-bypass-btn');
      card.appendChild(this.bypassBtn.getElement());
    }

    const contact = document.createElement('p');
    contact.className = 'license-contact';
    contact.innerHTML = `<a href="#" id="contact-admin">${t('license_contact_admin')}</a>`;
    card.appendChild(contact);

    contact.querySelector('a')?.addEventListener('click', (e) => {
      e.preventDefault();
      toast.info('Liên hệ: benz@example.com hoặc Discord: benz#1234');
    });

    return wrapper;
  }

  private bindEvents(): void {
    this.keyInput.addEventListener('input', () => {
      let value = this.keyInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (value.startsWith('BZOB54')) {
        value = 'BZ-OB54-' + value.substring(6).match(/.{1,4}/g)?.join('-') || value.substring(6);
      }
      this.keyInput.value = value;
      this.clearStatus();
    });

    this.keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleVerify();
      }
    });

    this.keyInput.addEventListener('paste', () => {
      setTimeout(() => {
        this.keyInput.dispatchEvent(new Event('input'));
      }, 0);
    });
  }

  private async checkCache(): Promise<void> {
    const cached = getLicenseCache(this.options.brandKey, this.options.modelKey);
    if (cached) {
      const validation = await validateLicenseKey(
        cached.key,
        this.options.brandKey,
        this.options.modelKey,
        this.options.secretKey
      );

      if (validation.valid) {
        this.showCachedSuccess(cached);
        this.validated = true;
        this.options.onValid(cached);
        return;
      } else {
        clearLicenseCache(this.options.brandKey, this.options.modelKey);
      }
    }
  }

  private showCachedSuccess(data: LicenseKeyData): void {
    const daysLeft = data.expiryDays || '∞';
    this.setStatus(t('license_cached', { days: daysLeft }), 'success');
    this.keyInput.value = data.key;
    this.keyInput.disabled = true;
    this.verifyBtn.setDisabled(true);
    this.bypassBtn?.setDisabled(true);
  }

  private async handleVerify(): Promise<void> {
    const key = this.keyInput.value.trim();

    if (!key) {
      this.setStatus('Vui lòng nhập key', 'error');
      this.keyInput.focus();
      return;
    }

    if (!key.startsWith('BZ-OB54-')) {
      this.setStatus('Định dạng key không đúng (phải bắt đầu bằng BZ-OB54-)', 'error');
      return;
    }

    this.verifyBtn.setLoading(true);
    this.setStatus(t('license_verifying'), 'info');

    try {
      const validation = await validateLicenseKey(
        key,
        this.options.brandKey,
        this.options.modelKey,
        this.options.secretKey
      );

      if (validation.valid && validation.data) {
        this.setStatus(t('license_success'), 'success');
        toast.success(t('license_success'));

        saveLicenseCache(this.options.brandKey, this.options.modelKey, validation.data);

        this.validated = true;
        this.keyInput.disabled = true;
        this.verifyBtn.setDisabled(true);
        this.bypassBtn?.setDisabled(true);

        setTimeout(() => {
          this.options.onValid(validation.data!);
        }, 500);
      } else {
        this.setStatus(validation.error || t('license_invalid'), 'error');
        toast.error(validation.error || t('license_invalid'));
      }
    } catch (err) {
      this.setStatus(t('error_generic'), 'error');
      toast.error(t('error_generic'));
    } finally {
      this.verifyBtn.setLoading(false);
    }
  }

  private setStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusEl.textContent = message;
    this.statusEl.className = `license-status license-status--${type}`;
  }

  private clearStatus(): void {
    this.statusEl.textContent = '';
    this.statusEl.className = 'license-status';
  }

  public setDevice(brandKey: string, modelKey: string): void {
    this.options.brandKey = brandKey;
    this.options.modelKey = modelKey;

    const deviceInfo = this.container.querySelector('.license-device-info');
    if (deviceInfo) {
      deviceInfo.textContent = `Thiết bị: ${brandKey.toUpperCase()} / ${modelKey.toUpperCase()}`;
    }

    this.reset();
    this.checkCache();
  }

  public reset(): void {
    this.validated = false;
    this.keyInput.value = '';
    this.keyInput.disabled = false;
    this.verifyBtn.setDisabled(false);
    this.bypassBtn?.setDisabled(false);
    this.clearStatus();
  }

  public isValidated(): boolean {
    return this.validated;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.verifyBtn.destroy();
    this.bypassBtn?.destroy();
    this.container.remove();
  }
}