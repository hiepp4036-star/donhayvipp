/**
 * Gauge Component - Animated Progress Bar for Sensitivity Display
 * Supports: animated fill, rainbow gradient, value display, label
 */

interface GaugeOptions {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: 'rainbow' | 'green' | 'orange' | 'red' | 'blue';
  animate?: boolean;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export class Gauge {
  private element: HTMLElement;
  private options: GaugeOptions;
  private fillElement: HTMLElement | null = null;
  private valueElement: HTMLElement | null = null;
  private animated = false;

  constructor(options: GaugeOptions) {
    this.options = {
      unit: '',
      color: 'rainbow',
      animate: true,
      delay: 0,
      size: 'md',
      ...options
    };
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const { label, value, max, unit, color, size } = this.options;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const wrapper = document.createElement('div');
    wrapper.className = `gauge gauge--${size}`;

    const topRow = document.createElement('div');
    topRow.className = 'gauge__top';

    const labelEl = document.createElement('span');
    labelEl.className = 'gauge__label';
    labelEl.textContent = label;
    topRow.appendChild(labelEl);

    this.valueElement = document.createElement('span');
    this.valueElement.className = `gauge__value gauge__value--${color}`;
    this.valueElement.textContent = `${value}${unit ? ' ' + unit : ''}`;
    topRow.appendChild(this.valueElement);

    wrapper.appendChild(topRow);

    const bar = document.createElement('div');
    bar.className = 'gauge__bar';

    this.fillElement = document.createElement('div');
    this.fillElement.className = `gauge__fill gauge__fill--${color}`;
    this.fillElement.style.width = this.options.animate ? '0%' : `${percentage}%`;
    bar.appendChild(this.fillElement);

    wrapper.appendChild(bar);

    return wrapper;
  }

  public animateIn(): void {
    if (!this.fillElement || this.animated || !this.options.animate) return;

    const { value, max } = this.options;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    this.animated = true;

    setTimeout(() => {
      if (this.fillElement) {
        this.fillElement.style.transition = 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
        this.fillElement.style.width = `${percentage}%`;
      }
    }, this.options.delay ?? 0);
  }

  public updateValue(value: number, max?: number): void {
    const newMax = max ?? this.options.max;
    const percentage = Math.min(100, Math.max(0, (value / newMax) * 100));

    this.options.value = value;
    if (max) this.options.max = max;

    if (this.fillElement) {
      this.fillElement.style.width = `${percentage}%`;
    }

    if (this.valueElement) {
      this.valueElement.textContent = `${value}${this.options.unit ? ' ' + this.options.unit : ''}`;
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}

export function createGaugesFromResult(result: {
  s1: number; s2: number; s3: number; s4: number; s5: number;
  cam: number; fire: number;
}): Gauge[] {
  const gaugeData = [
    { label: 'Nhìn xung quanh (General)', value: result.s1, max: 200 },
    { label: 'Red Dot', value: result.s2, max: 200 },
    { label: 'Ống ngắm 2X', value: result.s3, max: 200 },
    { label: 'Ống ngắm 4X', value: result.s4, max: 200 },
    { label: 'Ống ngắm Sniper (AWM)', value: result.s5, max: 180 },
    { label: 'Camera tự do (Free Look)', value: result.cam, max: 100, unit: '%' }
  ];

  return gaugeData.map((data, index) => new Gauge({
    ...data,
    delay: index * 80,
    color: 'rainbow'
  }));
}

export function createFireGauge(fireValue: number): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'fire-gauge';

  const label = document.createElement('span');
  label.className = 'fire-gauge__label';
  label.textContent = 'Nút bắn (Size)';
  wrapper.appendChild(label);

  const value = document.createElement('span');
  value.className = 'fire-gauge__value';
  value.textContent = `${fireValue}%`;
  wrapper.appendChild(value);

  return wrapper;
}