/**
 * Admin Key Generator Component
 * Generates license keys for specific device, exports CSV/JSON
 */

import type { GeneratedKey } from '../api/generate-keys';
import { generateLicenseKey, hashPassword, verifyPassword } from '../core/crypto';
import { createPrimaryButton, createSecondaryButton } from './ui/Button';
import { toast } from './ui/Toast';
import { t } from '../core/i18n';

interface AdminKeygenOptions {
  catalog: any[];
  secretKey: string;
  adminPasswordHash: string;
  onKeysGenerated?: (keys: GeneratedKey[]) => void;
}

export class AdminKeygen {
  private options: AdminKeygenOptions;
  private container: HTMLElement;
  private passwordInput!: HTMLInputElement;
  private brandSelect!: HTMLSelectElement;
  private modelSelect!: HTMLSelectElement;
  private expiryInput!: HTMLInputElement;
  private maxUsesInput!: HTMLInputElement;
  private countInput!: HTMLInputElement;
  private generateBtn!: ReturnType<typeof createPrimaryButton>;
  private resultContainer!: HTMLElement;
  private generatedKeys: GeneratedKey[] = [];
  private authenticated = false;

  constructor(options: AdminKeygenOptions) {
    this.options = options;
    this.container = this.createElement();
    this.bindEvents();
    this.populateBrands();
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-keygen';

    const authSection = document.createElement('div');
    authSection.className = 'admin-section admin-auth';
    authSection.id = 'auth-section';

    const authTitle = document.createElement('h2');
    authTitle.textContent = '🔐 Xác thực Admin';
    authSection.appendChild(authTitle);

    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group';

    const passwordLabel = document.createElement('label');
    passwordLabel.htmlFor = 'admin-password';
    passwordLabel.textContent = t('admin_password');
    passwordGroup.appendChild(passwordLabel);

    this.passwordInput = document.createElement('input');
    this.passwordInput.type = 'password';
    this.passwordInput.id = 'admin-password';
    this.passwordInput.className = 'form-input';
    this.passwordInput.placeholder = 'Nhập mật khẩu admin';
    passwordGroup.appendChild(this.passwordInput);

    const authBtn = createPrimaryButton(
      'Đăng nhập',
      () => this.handleAuth(),
      { fullWidth: true }
    );
    passwordGroup.appendChild(authBtn.getElement());

    authSection.appendChild(passwordGroup);
    wrapper.appendChild(authSection);

    const genSection = document.createElement('div');
    genSection.className = 'admin-section admin-generator';
    genSection.id = 'generator-section';
    genSection.style.display = 'none';

    const genTitle = document.createElement('h2');
    genTitle.textContent = '🔑 Tạo Key Kích Hoạt';
    genSection.appendChild(genTitle);

    const form = document.createElement('form');
    form.className = 'admin-form';
    genSection.appendChild(form);

    const brandGroup = this.createFormGroup('admin-brand', t('admin_brand'), 'select');
    this.brandSelect = brandGroup.querySelector('select')!;
    form.appendChild(brandGroup);

    const modelGroup = this.createFormGroup('admin-model', t('admin_model'), 'select');
    this.modelSelect = modelGroup.querySelector('select')!;
    this.modelSelect.disabled = true;
    form.appendChild(modelGroup);

    const row1 = document.createElement('div');
    row1.className = 'form-row';

    const expiryGroup = this.createFormGroup('admin-expiry', t('admin_expiry'), 'number');
    this.expiryInput = expiryGroup.querySelector('input')!;
    this.expiryInput.min = '0';
    this.expiryInput.value = '30';
    row1.appendChild(expiryGroup);

    const maxUsesGroup = this.createFormGroup('admin-maxuses', t('admin_max_uses'), 'number');
    this.maxUsesInput = maxUsesGroup.querySelector('input')!;
    this.maxUsesInput.min = '0';
    this.maxUsesInput.value = '0';
    row1.appendChild(maxUsesGroup);

    form.appendChild(row1);

    const countGroup = this.createFormGroup('admin-count', t('admin_count'), 'number');
    this.countInput = countGroup.querySelector('input')!;
    this.countInput.min = '1';
    this.countInput.max = '1000';
    this.countInput.value = '1';
    form.appendChild(countGroup);

    this.generateBtn = createPrimaryButton(
      t('admin_generate'),
      (e) => { e.preventDefault(); this.handleGenerate(); },
      { fullWidth: true, size: 'lg' }
    );
    form.appendChild(this.generateBtn.getElement());

    this.resultContainer = document.createElement('div');
    this.resultContainer.className = 'admin-result';
    this.resultContainer.style.display = 'none';
    genSection.appendChild(this.resultContainer);

    wrapper.appendChild(genSection);

    return wrapper;
  }

  private createFormGroup(id: string, label: string, type: 'select' | 'number' | 'text'): HTMLElement {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    group.appendChild(labelEl);

    let input: HTMLElement;
    if (type === 'select') {
      input = document.createElement('select');
    } else {
      input = document.createElement('input');
      (input as HTMLInputElement).type = type;
    }
    input.id = id;
    input.className = type === 'select' ? 'form-select' : 'form-input';
    group.appendChild(input);

    return group;
  }

  private bindEvents(): void {
    this.brandSelect.addEventListener('change', () => this.populateModels());
    this.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleAuth();
    });
  }

  private populateBrands(): void {
    this.brandSelect.innerHTML = '<option value="" disabled selected>' + t('brand_placeholder') + '</option>';

    const iosGroup = document.createElement('optgroup');
    iosGroup.label = '📱 iOS (Apple)';
    const androidGroup = document.createElement('optgroup');
    androidGroup.label = '🤖 Android';

    for (const brand of this.options.catalog) {
      const option = document.createElement('option');
      option.value = brand.key;
      option.textContent = `${brand.name} (${brand.models.length} máy)`;
      (brand.os === 'iOS' ? iosGroup : androidGroup).appendChild(option);
    }

    this.brandSelect.appendChild(iosGroup);
    this.brandSelect.appendChild(androidGroup);
  }

  private populateModels(): void {
    const brandKey = this.brandSelect.value;
    this.modelSelect.innerHTML = '<option value="" disabled selected>' + t('model_placeholder') + '</option>';

    const brand = this.options.catalog.find(b => b.key === brandKey);
    if (!brand) {
      this.modelSelect.disabled = true;
      return;
    }

    this.modelSelect.disabled = false;

    const byTier: Record<string, any[]> = {};
    for (const model of brand.models) {
      (byTier[model.tier] = byTier[model.tier] || []).push(model);
    }

    const { TIER_ORDER, TIER_BASE } = require('../core/constants');
    for (const tier of TIER_ORDER) {
      if (!byTier[tier]) continue;
      const optgroup = document.createElement('optgroup');
      optgroup.label = TIER_BASE[tier].label;
      byTier[tier].sort((a, b) => a.n.localeCompare(b.n));
      for (const model of byTier[tier]) {
        const option = document.createElement('option');
        option.value = model.k;
        option.textContent = model.n;
        optgroup.appendChild(option);
      }
      this.modelSelect.appendChild(optgroup);
    }
  }

  private async handleAuth(): Promise<void> {
    const password = this.passwordInput.value;
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    const { verifyPassword } = require('../core/crypto');
    const isValid = await verifyPassword(password, this.options.adminPasswordHash);

    if (isValid) {
      this.authenticated = true;
      document.getElementById('auth-section')!.style.display = 'none';
      document.getElementById('generator-section')!.style.display = 'block';
      toast.success('Đăng nhập thành công');
    } else {
      toast.error('Mật khẩu sai');
      this.passwordInput.value = '';
    }
  }

  private async handleGenerate(): Promise<void> {
    if (!this.authenticated) return;

    const brandKey = this.brandSelect.value;
    const modelKey = this.modelSelect.value;
    const expiryDays = parseInt(this.expiryInput.value) || 0;
    const maxUses = parseInt(this.maxUsesInput.value) || 0;
    const count = Math.min(parseInt(this.countInput.value) || 1, 1000);

    if (!brandKey || !modelKey) {
      toast.error(t('error_fill_all'));
      return;
    }

    this.generateBtn.setLoading(true);
    this.resultContainer.style.display = 'none';
    this.resultContainer.innerHTML = '';

    try {
      this.generatedKeys = [];

      for (let i = 0; i < count; i++) {
        const key = await generateLicenseKey(brandKey, modelKey, expiryDays, maxUses, this.options.secretKey);
        this.generatedKeys.push({
          brandKey,
          modelKey,
          expiryDays,
          maxUses,
          createdAt: Date.now(),
          key
        });
      }

      this.renderResults();
      this.resultContainer.style.display = 'block';
      toast.success(t('admin_success', { count: this.generatedKeys.length }));

      this.options.onKeysGenerated?.(this.generatedKeys);
    } catch (err) {
      toast.error(t('admin_error', { error: String(err) }));
    } finally {
      this.generateBtn.setLoading(false);
    }
  }

  private renderResults(): void {
    const { keys } = this;

    const header = document.createElement('div');
    header.className = 'admin-result-header';
    header.innerHTML = `<h3>${t('admin_result', { count: keys.length })}</h3>`;
    this.resultContainer.appendChild(header);

    const actions = document.createElement('div');
    actions.className = 'admin-result-actions';

    const copyBtn = createSecondaryButton(
      t('admin_copy_all'),
      () => this.copyAllKeys(),
      { size: 'sm' }
    );
    actions.appendChild(copyBtn.getElement());

    const csvBtn = createSecondaryButton(
      t('admin_download_csv'),
      () => this.downloadCSV(),
      { size: 'sm' }
    );
    actions.appendChild(csvBtn.getElement());

    const jsonBtn = createSecondaryButton(
      t('admin_download_json'),
      () => this.downloadJSON(),
      { size: 'sm' }
    );
    actions.appendChild(jsonBtn.getElement());

    this.resultContainer.appendChild(actions);

    const list = document.createElement('div');
    list.className = 'admin-keys-list';

    keys.forEach((keyData) => {
      const item = document.createElement('div');
      item.className = 'admin-key-item';

      const code = document.createElement('code');
      code.textContent = keyData.key;
      item.appendChild(code);

      const copyItemBtn = createSecondaryButton(
        'Copy',
        () => this.copySingleKey(keyData.key),
        { size: 'sm', variant: 'ghost' }
      );
      item.appendChild(copyItemBtn.getElement());

      list.appendChild(item);
    });

    this.resultContainer.appendChild(list);
  }

  private copyAllKeys(): void {
    const text = this.generatedKeys.map(k => k.key).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã copy ${this.generatedKeys.length} key`);
    }).catch(() => {
      toast.error('Không thể copy');
    });
  }

  private copySingleKey(key: string): void {
    navigator.clipboard.writeText(key).then(() => {
      toast.success('Đã copy key');
    }).catch(() => {
      toast.error('Không thể copy');
    });
  }

  private downloadCSV(): void {
    const headers = ['Key', 'Brand', 'Model', 'ExpiryDays', 'MaxUses', 'CreatedAt'];
    const rows = this.generatedKeys.map(k => [
      k.key, k.brandKey, k.modelKey, k.expiryDays, k.maxUses, new Date(k.createdAt).toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csv, 'license-keys.csv', 'text/csv');
  }

  private downloadJSON(): void {
    const json = JSON.stringify(this.generatedKeys, null, 2);
    this.downloadFile(json, 'license-keys.json', 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã tải ${filename}`);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.generateBtn.destroy();
    this.container.remove();
  }
}