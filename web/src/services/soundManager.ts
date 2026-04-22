type SoundType = 'eat' | 'die' | 'start';

interface SoundDef {
  frequency: number;
  duration: number;
  type: OscillatorType;
  sweep?: number;
}

const SOUNDS: Record<SoundType, SoundDef[]> = {
  eat: [{ frequency: 587, duration: 80, type: 'sine', sweep: 880 }],
  die: [
    { frequency: 300, duration: 150, type: 'sawtooth' },
    { frequency: 150, duration: 200, type: 'sawtooth' },
  ],
  start: [{ frequency: 440, duration: 100, type: 'sine', sweep: 660 }],
};

export class SoundManager {
  private ctx: AudioContext | null = null;
  private volume = 0.3;
  private muted = false;

  private getContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(type: SoundType) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const defs = SOUNDS[type];
      let time = ctx.currentTime;

      for (const def of defs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = def.type;
        osc.frequency.setValueAtTime(def.frequency, time);
        if (def.sweep) {
          osc.frequency.linearRampToValueAtTime(def.sweep, time + def.duration / 1000);
        }

        gain.gain.setValueAtTime(this.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + def.duration / 1000);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + def.duration / 1000);
        time += def.duration / 1000;
      }
    } catch {
      // Audio not supported
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.muted = this.volume === 0;
  }

  getVolume() {
    return this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundManager = new SoundManager();
