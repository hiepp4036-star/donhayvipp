/**
 * Result Panel Component
 * Displays sensitivity results with animated gauges, fire button, recalculate button
 */

import type { SensitivityResult } from '../core/types';
import { createPrimaryButton, createSecondaryButton } from './ui/Button';
import { createGaugesFromResult, createFireGauge } from './ui/Gauge';
import { t } from '../core/i18n';

interface ResultPanelOptions {
  result: SensitivityResult;
  onRecalculate: () => void;
  onShare?: (result: SensitivityResult) => void;
  onExportImage?: (result: SensitivityResult) => void;
  animate?: boolean;
}

export class ResultPanel {
  private options: ResultPanelOptions;
  private container: HTMLElement;
  private gauges: ReturnType<typeof createGaugesFromResult> = [];
  private fireGauge: HTMLElement | null = null;
  private recalcBtn!: ReturnType<typeof createPrimaryButton>;
  private shareBtn!: ReturnType<typeof createSecondaryButton>;
  private exportBtn!: ReturnType<typeof createSecondaryButton>;

  constructor(options: ResultPanelOptions) {
    this.options = {
      animate: true,
      ...options
    };
    this.container = this.createElement();

    if (this.options.animate) {
      this.animateIn();
    }
  }

  private createElement(): HTMLElement {
    const { result } = this.options;
    const wrapper = document.createElement('div');
    wrapper.className = 'result-panel';

    const header = document.createElement('div');
    header.className = 'result-panel__header';

    const badge = document.createElement('div');
    badge.className = 'result-badge';
    badge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>${t('result_title')}</span>
    `;
    header.appendChild(badge);

    const deviceInfo = document.createElement('p');
    deviceInfo.className = 'result-device';
    deviceInfo.innerHTML = t('result_device', { device: result.deviceName, os: result.os }) +
      `<br><span class="result-confidence">${t('result_confidence', { confidence: result.confidence })}</span>`;
    header.appendChild(deviceInfo);

    if (result.analysisLines.length > 0) {
      const analysis = document.createElement('div');
      analysis.className = 'result-analysis';
      analysis.innerHTML = `<strong>${t('result_analysis', { lines: '' })}</strong> ${result.analysisLines.join(' · ')}`;
      header.appendChild(analysis);
    }

    wrapper.appendChild(header);

    const gaugesContainer = document.createElement('div');
    gaugesContainer.className = 'gauges-container';
    gaugesContainer.id = 'gauges-container';

    this.gauges = createGaugesFromResult({
      s1: result.s1, s2: result.s2, s3: result.s3, s4: result.s4, s5: result.s5,
      cam: result.cam, fire: result.fire
    });

    this.gauges.forEach(gauge => {
      gaugesContainer.appendChild(gauge.getElement());
    });

    wrapper.appendChild(gaugesContainer);

    this.fireGauge = createFireGauge(result.fire);
    wrapper.appendChild(this.fireGauge);

    const note = document.createElement('p');
    note.className = 'result-note';
    note.innerHTML = 'Thông số được tối ưu riêng theo phần cứng thiết bị · Chuẩn OB54<br>bởi thuật toán Supper V8 — Make By Benz';
    wrapper.appendChild(note);

    const actions = document.createElement('div');
    actions.className = 'result-actions';

    this.recalcBtn = createPrimaryButton(
      t('recalculate_btn'),
      () => this.options.onRecalculate(),
      { fullWidth: true, size: 'lg' }
    );
    actions.appendChild(this.recalcBtn.getElement());

    const secondaryActions = document.createElement('div');
    secondaryActions.className = 'result-secondary-actions';

    this.shareBtn = createSecondaryButton(
      '🔗 Chia sẻ',
      () => this.options.onShare?.(result),
      { size: 'sm' }
    );
    secondaryActions.appendChild(this.shareBtn.getElement());

    this.exportBtn = createSecondaryButton(
      '📸 Xuất ảnh',
      () => this.options.onExportImage?.(result),
      { size: 'sm' }
    );
    secondaryActions.appendChild(this.exportBtn.getElement());

    actions.appendChild(secondaryActions);
    wrapper.appendChild(actions);

    return wrapper;
  }

  private animateIn(): void {
    this.gauges.forEach((gauge, index) => {
      setTimeout(() => gauge.animateIn(), index * 80 + 100);
    });

    if (this.fireGauge) {
      this.fireGauge.style.opacity = '0';
      this.fireGauge.style.transform = 'translateY(10px)';
      setTimeout(() => {
        this.fireGauge!.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        this.fireGauge!.style.opacity = '1';
        this.fireGauge!.style.transform = 'translateY(0)';
      }, this.gauges.length * 80 + 200);
    }
  }

  public updateResult(result: SensitivityResult): void {
    const deviceInfo = this.container.querySelector('.result-device');
    if (deviceInfo) {
      deviceInfo.innerHTML = t('result_device', { device: result.deviceName, os: result.os }) +
        `<br><span class="result-confidence">${t('result_confidence', { confidence: result.confidence })}</span>`;
    }

    const analysis = this.container.querySelector('.result-analysis');
    if (analysis && result.analysisLines.length > 0) {
      analysis.innerHTML = `<strong>${t('result_analysis', { lines: '' })}</strong> ${result.analysisLines.join(' · ')}`;
    }

    const newGaugeData = [
      { value: result.s1, max: 200 },
      { value: result.s2, max: 200 },
      { value: result.s3, max: 200 },
      { value: result.s4, max: 200 },
      { value: result.s5, max: 180 },
      { value: result.cam, max: 100 }
    ];

    this.gauges.forEach((gauge, index) => {
      gauge.updateValue(newGaugeData[index].value, newGaugeData[index].max);
    });

    if (this.fireGauge) {
      const valueEl = this.fireGauge.querySelector('.fire-gauge__value');
      if (valueEl) valueEl.textContent = `${result.fire}%`;
    }

    this.options.result = result;
  }

  public setLoading(loading: boolean): void {
    this.recalcBtn.setLoading(loading);
    this.shareBtn.setDisabled(loading);
    this.exportBtn.setDisabled(loading);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.recalcBtn.destroy();
    this.shareBtn.destroy();
    this.exportBtn.destroy();
    this.gauges.forEach(g => g.destroy());
    this.container.remove();
  }
}