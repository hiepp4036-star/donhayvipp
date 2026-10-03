/**
 * Matrix Rain Background Component
 * Canvas-based animated matrix rain with rainbow colors
 */

interface MatrixRainOptions {
  container?: HTMLElement;
  chars?: string;
  fontSize?: number;
  colors?: string[];
  opacity?: number;
  speed?: number;
}

export class MatrixRain {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<MatrixRainOptions>;
  private columns: number = 0;
  private drops: number[] = [];
  private animationId: number | null = null;
  private running = false;
  private resizeHandler: () => void;

  constructor(options: MatrixRainOptions = {}) {
    this.options = {
      container: document.body,
      chars: 'アカサタナハマヤラワBENZ01234567890ΘΩΞΨβδφ',
      fontSize: 14,
      colors: [
        'rgba(255,51,51,',
        'rgba(255,140,26,',
        'rgba(255,215,0,',
        'rgba(0,230,77,',
        'rgba(26,140,255,',
        'rgba(102,102,255,',
        'rgba(204,51,255,'
      ],
      opacity: 0.06,
      speed: 50
    };

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'matrix-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 0;
      pointer-events: none;
      opacity: 0.15;
    `;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not supported');
    this.ctx = ctx;

    this.options.container?.appendChild(this.canvas);

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    this.resize();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.columns = Math.floor(this.canvas.width / this.options.fontSize);
    this.drops = Array(this.columns).fill(1);
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.animate();
  }

  public stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    if (!this.running) return;

    this.ctx.fillStyle = `rgba(11, 13, 16, ${this.options.opacity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${this.options.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const char = this.options.chars[Math.floor(Math.random() * this.options.chars.length)];
      const colorBase = this.options.colors[i % this.options.colors.length];
      const alpha = 0.15 + Math.random() * 0.15;

      this.ctx.fillStyle = colorBase + alpha + ')';
      this.ctx.fillText(char, i * this.options.fontSize, this.drops[i] * this.options.fontSize);

      if (this.drops[i] * this.options.fontSize > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  public setOpacity(opacity: number): void {
    this.options.opacity = Math.max(0, Math.min(1, opacity));
  }

  public setSpeed(speed: number): void {
    this.options.speed = Math.max(10, speed);
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resizeHandler);
    this.canvas.remove();
  }
}