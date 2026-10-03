/**
 * Admin Dashboard Component
 * Real-time analytics, key management, charts
 * Features: SSE live updates, Chart.js visualizations, responsive layout
 */

import { createPrimaryButton, createSecondaryButton } from './ui/Button';
import { toast } from './ui/Toast';
import { t } from '../core/i18n';

interface AdminDashboardOptions {
  onRefresh?: () => void;
}

interface AnalyticsData {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByHour: Record<string, number>;
  topDevices: Array<{ brand: string; model: string; count: number }>;
  licenseValidations: { success: number; failed: number };
  period: string;
  timestamp: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export class AdminDashboard {
  private options: AdminDashboardOptions;
  private container: HTMLElement;
  private eventSource: EventSource | null = null;
  private refreshInterval: number | null = null;
  private isVisible = false;

  constructor(options: AdminDashboardOptions = {}) {
    this.options = options;
    this.container = this.createElement();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-dashboard';
    wrapper.innerHTML = this.getTemplate();
    return wrapper;
  }

  private getTemplate(): string {
    return `
      <div class="admin-dashboard__header">
        <div class="admin-dashboard__title-row">
          <h1 class="admin-dashboard__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </h1>
          <span class="admin-dashboard__subtitle">Real-time Analytics & Key Management</span>
        </div>
        <div class="admin-dashboard__actions">
          <span class="admin-dashboard__status" id="connection-status">
            <span class="status-indicator"></span>
            <span>Connecting...</span>
          </span>
          <button class="btn btn--secondary btn--sm" id="refresh-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div class="admin-dashboard__stats" id="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Total Events (24h)</span>
            <span class="stat-card__value" id="stat-total-events">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">License Validations ✓</span>
            <span class="stat-card__value" id="stat-license-success">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--error">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">License Failures ✗</span>
            <span class="stat-card__value" id="stat-license-failed">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"></rect>
              <path d="M8 21h8"></path>
              <path d="M12 17v4"></path>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Top Devices</span>
            <span class="stat-card__value" id="stat-top-devices">—</span>
          </div>
        </div>
      </div>

      <div class="admin-dashboard__charts">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <h3 class="chart-card__title">Events Timeline (24h)</h3>
            <div class="chart-card__controls">
              <select class="chart-period-select" id="period-select">
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24" selected>24 Hours</option>
                <option value="168">7 Days</option>
              </select>
            </div>
          </div>
          <div class="chart-card__canvas-wrapper">
            <canvas id="chart-events-timeline" height="200"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">Events by Type</h3>
          </div>
          <div class="chart-card__canvas-wrapper">
            <canvas id="chart-events-type" height="200"></canvas>
          </div>
        </div>
      </div>

      <div class="admin-dashboard__tables">
        <div class="table-card">
          <div class="table-card__header">
            <h3 class="table-card__title">Top Devices</h3>
          </div>
          <div class="table-card__content">
            <table class="admin-table" id="table-top-devices">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Events</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div class="table-card">
          <div class="table-card__header">
            <h3 class="table-card__title">License Validations</h3>
          </div>
          <div class="table-card__content">
            <div class="license-stats">
              <div class="license-stat license-stat--success">
                <span class="license-stat__label">Successful</span>
                <span class="license-stat__value" id="license-success">—</span>
              </div>
              <div class="license-stat license-stat--error">
                <span class="license-stat__label">Failed</span>
                <span class="license-stat__value" id="license-failed">—</span>
              </div>
              <div class="license-stat license-stat--info">
                <span class="license-stat__label">Success Rate</span>
                <span class="license-stat__value" id="license-rate">—</span>
              </div>
            </div>
            <div class="license-stats__chart">
              <canvas id="chart-license-ratio" height="120"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-dashboard__section">
        <div class="admin-dashboard__section-header">
          <h2 class="admin-dashboard__section-title">Key Generator</h2>
        </div>
        <div id="keygen-container"></div>
      </div>
    `;
  }

  private bindEvents(): void {
    const refreshBtn = this.container.querySelector('#refresh-btn') as HTMLButtonElement;
    const periodSelect = this.container.querySelector('#period-select') as HTMLSelectElement;

    refreshBtn?.addEventListener('click', () => this.refresh());
    periodSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.fetchAnalytics(parseInt(target.value, 10));
    });

    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) this.refresh();
    });
  }

  public init(): void {
    this.connectSSE();
    this.startAutoRefresh();
    this.refresh();
  }

  private connectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource('/api/admin-metrics/stream');

    this.eventSource.onopen = () => {
      this.updateConnectionStatus('connected', 'Live');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.updateDashboard(data);
      } catch (err) {
        console.error('[AdminDashboard] SSE parse error:', err);
      }
    };

    this.eventSource.onerror = () => {
      this.updateConnectionStatus('disconnected', 'Reconnecting...');
      setTimeout(() => this.connectSSE(), 5000);
    };
  }

  private startAutoRefresh(): void {
    this.refreshInterval = window.setInterval(() => {
      if (this.isVisible) this.refresh();
    }, 60000);
  }

  public async refresh(): Promise<void> {
    try {
      const period = (this.container.querySelector('#period-select') as HTMLSelectElement)?.value || '24';
      await this.fetchAnalytics(parseInt(period, 10));
    } catch (err) {
      console.error('[AdminDashboard] Refresh failed:', err);
    }
  }

  private async fetchAnalytics(hours: number): Promise<void> {
    try {
      const response = await fetch(`/api/admin-metrics?hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success) {
        this.updateDashboard(result.data);
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch analytics failed:', err);
      this.updateConnectionStatus('error', 'Failed to load');
    }
  }

  private updateDashboard(data: any): void {
    this.updateConnectionStatus('connected', 'Live');

    this.updateStat('total-events', data.totalEvents.toLocaleString());
    this.updateStat('license-success', data.licenseValidations.success.toLocaleString());
    this.updateStat('license-failed', data.licenseValidations.failed.toLocaleString());
    this.updateStat('top-devices', data.topDevices.length.toString());

    const totalLicense = data.licenseValidations.success + data.licenseValidations.failed;
    const rate = totalLicense > 0
      ? ((data.licenseValidations.success / totalLicense) * 100).toFixed(1)
      : '0.0';
    this.updateStat('license-success', data.licenseValidations.success.toLocaleString());
    this.updateStat('license-failed', data.licenseValidations.failed.toLocaleString());
    this.updateStat('license-rate', `${rate}%`);

    this.updateTimelineChart(data.eventsByHour);
    this.updateTypeChart(data.eventsByType);
    this.updateLicenseChart(data.licenseValidations.success, data.licenseValidations.failed);
    this.updateTopDevicesTable(data.topDevices);
  }

  private updateStat(id: string, value: string): void {
    const el = this.container.querySelector(`#stat-${id}`) ||
               this.container.querySelector(`#${id}`);
    if (el) {
      el.textContent = value;
      el.classList.add('stat-card__value--updated');
      setTimeout(() => el.classList.remove('stat-card__value--updated'), 500);
    }
  }

  private updateTimelineChart(eventsByHour: Record<string, number>): void {
    const canvas = this.container.querySelector('#chart-events-timeline') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 23; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 3600000);
      const key = date.toISOString().slice(0, 13);
      labels.push(date.getHours().toString().padStart(2, '0') + ':00');
      data.push(eventsByHour[key] || 0);
    }

    this.drawLineChart(ctx, canvas, {
      labels,
      datasets: [{
        label: 'Events',
        data,
        borderColor: '#00e64d',
        backgroundColor: 'rgba(0, 230, 77, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }]
    }, { min: 0 });
  }

  private updateTypeChart(eventsByType: Record<string, number>): void {
    const canvas = this.container.querySelector('#chart-events-type') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const entries = Object.entries(eventsByType).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => v);

    const colors = [
      '#ff3333', '#ff8c1a', '#ffd700', '#00e64d',
      '#1a8cff', '#6666ff', '#cc33ff', '#ff6b8a'
    ];

    this.drawDoughnutChart(ctx, canvas, {
      labels,
      datasets: [{
        label: 'Events by Type',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0
      }]
    });
  }

  private updateLicenseChart(success: number, failed: number): void {
    const canvas = this.container.querySelector('#chart-license-ratio') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const total = success + failed;

    if (total === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    this.drawDoughnutChart(ctx, canvas, {
      labels: ['Success', 'Failed'],
      datasets: [{
        label: 'License Validations',
        data: [success, failed],
        backgroundColor: ['#00e64d', '#ef4444'],
        borderWidth: 0
      }]
    }, { cutout: '70%' });
  }

  private updateTopDevicesTable(devices: Array<{ brand: string; model: string; count: number }>): void {
    const tbody = this.container.querySelector('#table-top-devices tbody');
    if (!tbody) return;

    const totalEvents = devices.reduce((sum, d) => sum + d.count, 0);

    tbody.innerHTML = devices.slice(0, 10).map((device, index) => {
      const share = totalEvents > 0 ? ((device.count / totalEvents) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td class="rank">${index + 1}</td>
          <td>${device.brand}</td>
          <td>${device.model}</td>
          <td>${device.count.toLocaleString()}</td>
          <td>${share}%</td>
        </tr>
      `;
    }).join('');
  }

  private drawLineChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean; tension: number; borderWidth: number }> },
    options: { min?: number; max?: number } = {}
  ): void {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const data = chartData.datasets[0].data;
    const labels = chartData.labels;
    const maxValue = Math.max(...data, options.max || 0);
    const minValue = Math.min(...data, options.min || 0);
    const range = maxValue - minValue || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#8a8d97';
    ctx.font = '10px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = maxValue - (range / 4) * i;
      const y = padding.top + (chartHeight / 4) * i + 4;
      ctx.fillText(Math.round(value).toLocaleString(), padding.left - 8, y);
    }

    ctx.textAlign = 'center';
    const stepX = chartWidth / (labels.length - 1);
    labels.forEach((label, i) => {
      const x = padding.left + i * stepX;
      ctx.fillText(label, x, height - padding.bottom + 18);
    });

    const dataset = chartData.datasets[0];
    if (dataset.fill) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, dataset.backgroundColor);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      data.forEach((value, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
        if (i === 0) ctx.lineTo(x, y);
        else {
          const prevX = padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, padding.top + chartHeight - ((data[i - 1] - minValue) / range) * chartHeight, x, y);
        }
      });
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = dataset.borderColor;
    ctx.lineWidth = dataset.borderWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    data.forEach((value, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = padding.left + ((i - 1) / (data.length - 1)) * chartWidth;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, padding.top + chartHeight - ((data[i - 1] - minValue) / range) * chartHeight, x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = dataset.borderColor;
    data.forEach((value, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawDoughnutChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: { labels: string[]; datasets: Array<{ label: string; data: number[]; backgroundColor: string | string[]; borderWidth: number }> },
    options: { cutout?: string } = {}
  ): void {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight || 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const cutout = options.cutout ? parseInt(options.cutout) / 100 * radius : radius * 0.6;

    const data = chartData.datasets[0].data;
    const colors = chartData.datasets[0].backgroundColor;
    const total = data.reduce((a, b) => a + b, 0);

    let currentAngle = -Math.PI / 2;

    data.forEach((value, i) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const color = Array.isArray(colors) ? colors[i] : colors;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      if (cutout > 0) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, cutout, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = '#0b0d10';
        ctx.fill();
      }

      currentAngle += sliceAngle;
    });
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting' | 'error', text: string): void {
    const statusEl = this.container.querySelector('#connection-status');
    if (!statusEl) return;

    statusEl.className = `admin-dashboard__status admin-dashboard__status--${status}`;
    statusEl.innerHTML = `
      <span class="status-indicator"></span>
      <span>${text}</span>
    `;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.container.remove();
  }
}