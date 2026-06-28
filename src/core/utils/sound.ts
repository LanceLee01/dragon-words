// ---------------------------------------------------------------------------
// Sound Engine — lightweight Audio API wrapper (no Howler dependency)
// ---------------------------------------------------------------------------
import type { ClassId } from '../data/types';

export type SoundEvent =
  | 'playerAttack' | 'enemyHit' | 'playerHit' | 'combo'
  | 'skill' | 'heal' | 'shield' | 'victory' | 'defeat' | 'bossChant'
  | 'click' | 'coin' | 'levelUp';

/**
 * Sound Engine — uses native HTMLAudioElement for instant playback.
 * No preload needed; browsers cache small WAV files automatically.
 */
export class SoundEngine {
  private unlocked = false;
  private pendingUnlock: (() => void)[] = [];

  /** Class-specific attack/hit sounds. */
  private classSounds: Record<ClassId, { attack: string[]; hit: string[] }> = {
    warrior: { attack: ['/sounds/sfx/battle/heavy_swing_01.wav'], hit: ['/sounds/sfx/battle/sword_hit_01.wav'] },
    mage:    { attack: ['/sounds/sfx/battle/fireball_launch.wav'], hit: ['/sounds/sfx/battle/fireball_impact.wav'] },
    ranger:  { attack: ['/sounds/sfx/battle/bow_shoot.wav'],      hit: ['/sounds/sfx/battle/bow_hit.wav'] },
    paladin: { attack: ['/sounds/sfx/battle/sword_swing_01.wav'], hit: ['/sounds/sfx/battle/sword_hit_01.wav'] },
    rogue:   { attack: ['/sounds/sfx/battle/dagger_swing.wav'],   hit: ['/sounds/sfx/battle/dagger_hit.wav'] },
    druid:   { attack: ['/sounds/sfx/battle/ice_launch.wav'],     hit: ['/sounds/sfx/battle/ice_impact.wav'] },
  };

  private attackPool: string[] = ['/sounds/sfx/battle/sword_swing_01.wav'];
  private hitPool: string[] = ['/sounds/sfx/battle/sword_hit_01.wav'];

  /** File pools per event. */
  private pools: Record<string, string[]> = {
    playerAttack: ['/sounds/sfx/battle/sword_swing_01.wav'],
    enemyHit:    ['/sounds/sfx/battle/sword_hit_01.wav'],
    playerHit:   ['/sounds/sfx/monster/beast_01.wav', '/sounds/sfx/monster/giant_01.wav', '/sounds/sfx/monster/ogre_01.wav'],
    combo:       ['/sounds/sfx/battle/heal_01.wav'],
    skill:       ['/sounds/sfx/battle/spell_01.wav'],
    heal:        ['/sounds/sfx/battle/heal_01.wav'],
    shield:      ['/sounds/sfx/battle/shield_01.wav'],
    victory:     ['/sounds/sfx/ui/victory/fanfare.mp3'], // stopped after 4.5s in play()
    defeat:      ['/sounds/sfx/battle/swing_02.wav'],
    bossChant:   ['/sounds/sfx/battle/boss_chant.wav'],
    click:       ['/sounds/sfx/ui/click_01.wav', '/sounds/sfx/ui/click_02.wav'],
    coin:        ['/sounds/sfx/battle/coin_01.wav', '/sounds/sfx/battle/coin_02.wav'],
    levelUp:     ['/sounds/sfx/battle/heal_01.wav'],
  };

  /** Unlock AudioContext on first user interaction. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    // Fire pending plays
    for (const fn of this.pendingUnlock) fn();
    this.pendingUnlock = [];
  }

  setClass(classId: ClassId | null): void {
    if (classId && this.classSounds[classId]) {
      this.pools.playerAttack = this.classSounds[classId].attack;
      this.pools.enemyHit = this.classSounds[classId].hit;
    }
  }

  private pick(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private _play(src: string, volume: number, rate: number): HTMLAudioElement | null {
    const audio = new Audio(src);
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.playbackRate = rate;
    audio.play().catch(() => {});
    return audio;
  }

  /** Track long sounds that need manual stopping */
  private longSounds: HTMLAudioElement[] = [];

  play(event: SoundEvent, opts?: { rate?: number; volume?: number }): void {
    const pool = this.pools[event];
    if (!pool || pool.length === 0) return;
    const src = this.pick(pool);
    const vol = opts?.volume ?? 1;
    const rate = opts?.rate ?? 1;

    if (!this.unlocked) {
      this.pendingUnlock.push(() => this._play(src, vol, rate));
      return;
    }
    const audio = this._play(src, vol, rate);

    // Victory fanfare: stop after 4.5 seconds
    if (event === 'victory' && audio) {
      this.longSounds.push(audio);
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 4500);
    }
  }

  playAttackSequence(): void {
    this.play('playerAttack');
    setTimeout(() => this.play('enemyHit'), 250);
  }
}

export const soundEngine = new SoundEngine();

/** Global click handler to unlock audio on first interaction. */
if (typeof document !== 'undefined') {
  const handler = () => { soundEngine.unlock(); document.removeEventListener('click', handler); };
  document.addEventListener('click', handler, { once: true });
}
