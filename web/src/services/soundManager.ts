type SoundType = 'eat' | 'eat_apple' | 'eat_berry' | 'eat_nut' | 'eat_mushroom' | 'eat_cactus' | 'eat_chili' | 'die' | 'start' | 'zone_unlock';

interface SoundDef {
  frequency: number;
  duration: number;
  type: OscillatorType;
  sweep?: number;
}

const SOUNDS: Record<SoundType, SoundDef[]> = {
  eat: [{ frequency: 587, duration: 80, type: 'sine', sweep: 880 }],
  eat_apple: [{ frequency: 523, duration: 60, type: 'sine', sweep: 784 }],
  eat_berry: [
    { frequency: 659, duration: 50, type: 'sine', sweep: 880 },
    { frequency: 784, duration: 50, type: 'sine', sweep: 1047 },
  ],
  eat_nut: [{ frequency: 220, duration: 120, type: 'triangle', sweep: 330 }],
  eat_mushroom: [
    { frequency: 880, duration: 80, type: 'sine', sweep: 1200 },
    { frequency: 1100, duration: 80, type: 'sine', sweep: 600 },
  ],
  eat_cactus: [{ frequency: 1200, duration: 40, type: 'square', sweep: 200 }],
  eat_chili: [
    { frequency: 400, duration: 60, type: 'sawtooth', sweep: 800 },
    { frequency: 600, duration: 60, type: 'sawtooth', sweep: 1200 },
  ],
  die: [
    { frequency: 300, duration: 150, type: 'sawtooth' },
    { frequency: 150, duration: 200, type: 'sawtooth' },
  ],
  start: [{ frequency: 440, duration: 100, type: 'sine', sweep: 660 }],
  zone_unlock: [
    { frequency: 523, duration: 100, type: 'sine', sweep: 659 },
    { frequency: 659, duration: 100, type: 'sine', sweep: 784 },
    { frequency: 784, duration: 150, type: 'sine', sweep: 1047 },
  ],
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

  play(type: SoundType, foodType?: string) {
    if (this.muted) return;
    const soundType: SoundType = foodType ? (`eat_${foodType}` as SoundType) : type;
    const defs = SOUNDS[soundType] ?? SOUNDS[type];
    try {
      const ctx = this.getContext();
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
