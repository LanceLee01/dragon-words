// ---------------------------------------------------------------------------
// Sound Engine — Web Audio API (oscillator-based, no audio files needed)
// ---------------------------------------------------------------------------
import type { ClassId } from '../data/types';

export type SoundEvent =
  | 'playerAttack' | 'enemyHit' | 'playerHit' | 'combo'
  | 'skill' | 'heal' | 'shield' | 'victory' | 'defeat' | 'bossChant'
  | 'click' | 'coin' | 'levelUp';

/**
 * Generates game sounds using Web Audio API oscillators and noise.
 * No audio files required — works everywhere AudioContext is supported.
 */
export class SoundEngine {
  private unlocked = false;

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
  }

  setClass(_classId: ClassId | null): void {
    // Sounds are class-agnostic with the oscillator approach
  }

  /** Play a note (frequency in Hz, duration in seconds). */
  private tone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      // Close context after sound finishes
      setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
    } catch { /* ignore */ }
  }

  /** White noise burst for impact sounds. */
  private noise(duration: number, volume = 0.1): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
    } catch { /* ignore */ }
  }

  /** Rising arpeggio for combo/powerup. */
  private arpeggio(base: number, steps: number, duration: number): void {
    for (let i = 0; i < steps; i++) {
      const delay = (duration / steps) * i;
      setTimeout(() => this.tone(base * Math.pow(1.2, i), 0.08, 'square', 0.12), delay * 1000);
    }
  }

  play(event: SoundEvent, _opts?: { rate?: number; volume?: number }): void {
    switch (event) {
      case 'playerAttack':
        this.noise(0.15, 0.12);
        this.tone(220, 0.1, 'sawtooth', 0.1);
        break;
      case 'enemyHit':
        this.noise(0.1, 0.15);
        this.tone(180, 0.08, 'square', 0.12);
        break;
      case 'playerHit':
        this.tone(120, 0.3, 'sawtooth', 0.15);
        this.tone(80, 0.25, 'square', 0.1);
        break;
      case 'combo':
        this.arpeggio(300, 5, 0.3);
        break;
      case 'skill':
        this.tone(440, 0.15, 'sine', 0.12);
        setTimeout(() => this.tone(660, 0.15, 'sine', 0.12), 100);
        setTimeout(() => this.tone(880, 0.2, 'sine', 0.15), 200);
        break;
      case 'heal':
        this.tone(523, 0.15, 'sine', 0.12);
        setTimeout(() => this.tone(659, 0.15, 'sine', 0.12), 120);
        setTimeout(() => this.tone(784, 0.2, 'sine', 0.12), 240);
        break;
      case 'shield':
        this.tone(300, 0.3, 'sine', 0.1);
        break;
      case 'victory':
        this.tone(523, 0.2, 'square', 0.12);
        setTimeout(() => this.tone(659, 0.2, 'square', 0.12), 200);
        setTimeout(() => this.tone(784, 0.2, 'square', 0.12), 400);
        setTimeout(() => this.tone(1047, 0.4, 'square', 0.15), 600);
        break;
      case 'defeat':
        this.tone(300, 0.3, 'sawtooth', 0.1);
        setTimeout(() => this.tone(200, 0.4, 'sawtooth', 0.1), 300);
        break;
      case 'bossChant':
        this.tone(100, 0.5, 'sawtooth', 0.08);
        break;
      case 'click':
        this.tone(800, 0.04, 'square', 0.06);
        break;
      case 'coin':
        this.tone(1200, 0.06, 'sine', 0.1);
        setTimeout(() => this.tone(1500, 0.08, 'sine', 0.1), 60);
        break;
      case 'levelUp':
        this.arpeggio(400, 8, 0.5);
        break;
    }
  }

  playAttackSequence(): void {
    this.play('playerAttack');
    setTimeout(() => this.play('enemyHit'), 200);
  }

  testBeep(): void {
    this.tone(880, 0.15, 'sine', 0.3);
  }
}

export const soundEngine = new SoundEngine();

// Unlock on first click
if (typeof document !== 'undefined') {
  const handler = () => { soundEngine.unlock(); document.removeEventListener('click', handler); };
  document.addEventListener('click', handler, { once: true });
}
