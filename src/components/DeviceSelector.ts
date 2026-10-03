/**
 * Device Selector Component
 * Cascading dropdowns: Brand → Model (grouped by tier)
 * Loads from device catalog JSON
 */

import type { DeviceCatalog } from '../core/types';
import { TIER_BASE, TIER_ORDER } from '../core/constants';
import { t } from '../core/i18n';

interface DeviceSelectorOptions {
  catalog: DeviceCatalog[];
  onBrandChange?: (brandKey: string) => void;
  onModelChange?: (brandKey: string, modelKey: string) => void;
  initialBrand?: string;
  initialModel?: string;
  disabled?: boolean;
}

export class DeviceSelector {
  private catalog: DeviceCatalog[];
  private options: DeviceSelectorOptions;
  private container: HTMLElement;
  private brandSelect!: HTMLSelectElement;
  private modelSelect!: HTMLSelectElement;
  private modelCount!: HTMLElement;

  constructor(options: DeviceSelectorOptions) {
    this.catalog = options.catalog;
    this.options = {
      disabled: false,
      ...options
    };
    this.container = this.createElement();
    this.bindEvents();
    this.populateBrands();

    if (this.options.initialBrand) {
      this.setBrand(this.options.initialBrand);
      if (this.options.initialModel) {
        setTimeout(() => this.setModel(this.options.initialModel!), 0);
      }
    }
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'device-selector';

    const brandGroup = document.createElement('div');
    brandGroup.className = 'form-group';

    const brandLabel = document.createElement('label');
    brandLabel.className = 'form-label';
    brandLabel.htmlFor = 'brand-select';
    brandLabel.textContent = t('brand_label');
    brandGroup.appendChild(brandLabel);

    this.brandSelect = document.createElement('select');
    this.brandSelect.id = 'brand-select';
    this.brandSelect.className = 'form-select';
    this.brandSelect.disabled = this.options.disabled;
    this.brandSelect.setAttribute('aria-label', t('brand_label'));
    brandGroup.appendChild(this.brandSelect);

    wrapper.appendChild(brandGroup);

    const modelGroup = document.createElement('div');
    modelGroup.className = 'form-group';

    const modelLabelRow = document.createElement('div');
    modelLabelRow.className = 'form-label-row';

    const modelLabel = document.createElement('label');
    modelLabel.className = 'form-label';
    modelLabel.htmlFor = 'model-select';
    modelLabel.textContent = t('model_label');
    modelLabelRow.appendChild(modelLabel);

    this.modelCount = document.createElement('span');
    this.modelCount.className = 'model-count';
    this.modelCount.setAttribute('aria-live', 'polite');
    modelLabelRow.appendChild(this.modelCount);

    modelGroup.appendChild(modelLabelRow);

    this.modelSelect = document.createElement('select');
    this.modelSelect.id = 'model-select';
    this.modelSelect.className = 'form-select';
    this.modelSelect.disabled = true;
    this.modelSelect.setAttribute('aria-label', t('model_label'));
    modelGroup.appendChild(this.modelSelect);

    wrapper.appendChild(modelGroup);

    return wrapper;
  }

  private bindEvents(): void {
    this.brandSelect.addEventListener('change', () => {
      const brandKey = this.brandSelect.value;
      this.populateModels(brandKey);
      this.options.onBrandChange?.(brandKey);
    });

    this.modelSelect.addEventListener('change', () => {
      const brandKey = this.brandSelect.value;
      const modelKey = this.modelSelect.value;
      if (modelKey) {
        this.options.onModelChange?.(brandKey, modelKey);
      }
    });
  }

  private populateBrands(): void {
    this.brandSelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = t('brand_placeholder');
    this.brandSelect.appendChild(placeholder);

    const iosGroup = document.createElement('optgroup');
    iosGroup.label = '📱 iOS (Apple)';
    const androidGroup = document.createElement('optgroup');
    androidGroup.label = '🤖 Android';

    for (const brand of this.catalog) {
      const option = document.createElement('option');
      option.value = brand.key;
      option.textContent = `${brand.name} (${brand.models.length} máy)`;
      (brand.os === 'iOS' ? iosGroup : androidGroup).appendChild(option);
    }

    this.brandSelect.appendChild(iosGroup);
    this.brandSelect.appendChild(androidGroup);
  }

  private populateModels(brandKey: string): void {
    this.modelSelect.innerHTML = '';
    this.modelCount.textContent = '';

    const brand = this.catalog.find(b => b.key === brandKey);

    if (!brand) {
      this.modelSelect.disabled = true;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = t('model_placeholder');
      this.modelSelect.appendChild(placeholder);
      return;
    }

    this.modelSelect.disabled = false;
    this.modelCount.textContent = t('model_count', { count: brand.models.length });

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = t('model_placeholder');
    this.modelSelect.appendChild(placeholder);

    const byTier: Record<string, any[]> = {};
    for (const model of brand.models) {
      (byTier[model.tier] = byTier[model.tier] || []).push(model);
    }

    for (const tier of TIER_ORDER) {
      if (!byTier[tier]) continue;

      const tierInfo = TIER_BASE[tier];
      const optgroup = document.createElement('optgroup');
      optgroup.label = tierInfo.label;

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

  public setBrand(brandKey: string): boolean {
    const brand = this.catalog.find(b => b.key === brandKey);
    if (!brand) return false;

    this.brandSelect.value = brandKey;
    this.populateModels(brandKey);
    this.options.onBrandChange?.(brandKey);
    return true;
  }

  public setModel(modelKey: string): boolean {
    const brandKey = this.brandSelect.value;
    const brand = this.catalog.find(b => b.key === brandKey);
    if (!brand) return false;

    const model = brand.models.find(m => m.k === modelKey);
    if (!model) return false;

    this.modelSelect.value = modelKey;
    this.options.onModelChange?.(brandKey, modelKey);
    return true;
  }

  public getBrandKey(): string {
    return this.brandSelect.value;
  }

  public getModelKey(): string {
    return this.modelSelect.value;
  }

  public setDisabled(disabled: boolean): void {
    this.brandSelect.disabled = disabled;
    this.modelSelect.disabled = disabled || !this.brandSelect.value;
    this.options.disabled = disabled;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}