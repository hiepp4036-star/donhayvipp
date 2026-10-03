/**
 * Sound Engine Component
 * Web Audio API based sound effects for UI interactions
 */

interface SoundEngineOptions {
  enabled?: boolean;
  volume?: number;
}

export class SoundEngine {
  private audioContext: AudioContext | null = null;
  private options: Required<SoundEngineOptions>;
  private enabled: boolean;

  constructor(options: SoundEngineOptions = {}) {
    this.options = {
      enabled: true,
      volume: 0.3
    };

    this.enabled = this.options.enabled;

    const init = () => {
      this.ensureContext();
      document.removeEventListener('click', init);
      document.removeEventListener('keydown', init);
    };
    document.addEventListener('click', init, { once: true });
    document.addEventListener('keydown', init, { once: true });
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        this.enabled = false;
      }
    }

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private createOscillator(type: OscillatorType, frequency: number, gain: number, duration: number): void {
    if (!this.enabled || !this.audioContext) return;

    try {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(gain * this.options.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + duration);
    } catch {
      // Silently fail
    }
  }

  public playClick(): void {
    this.ensureContext();
    this.createOscillator('sine', 800, 0.15, 0.08);
  }

  public playHover(): void {
    this.ensureContext();
    this.createOscillator('sine', 1200, 0.04, 0.05);
  }

  public playSuccess(): void {
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator('sine', freq, 0.12, 0.2);
      }, i * 100);
    });
  }

  public playError(): void {
    this.ensureContext();
    this.createOscillator('square', 200, 0.1, 0.15);
    setTimeout(() => this.createOscillator('square', 150, 0.08, 0.1), 50);
  }

  public playComplete(): void {
    this.ensureContext();
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77];
    scale.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator('sine', freq, 0.08, 0.18);
      }, i * 60);
    });
  }

  public play(frequency: number, type: OscillatorType = 'sine', duration: number = 0.1, gain: number = 0.1): void {
    this.ensureContext();
    this.createOscillator(type, frequency, gain, duration);
  }

  public setVolume(volume: number): void {
    this.options.volume = Math.max(0, Math.min(1, volume));
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled && this.options.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

let soundEngineInstance: SoundEngine | null = null;

export function getSoundEngine(options?: SoundEngineOptions): SoundEngine {
  if (!soundEngineInstance) {
    soundEngineInstance = new SoundEngine(options);
  }
  return soundEngineInstance;
}