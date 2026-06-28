// ---------------------------------------------------------------------------
// Sound Engine — native HTMLAudioElement, lazy-loaded
// ---------------------------------------------------------------------------
import type { ClassId } from '../data/types';

export type SoundEvent =
  | 'playerAttack' | 'enemyHit' | 'playerHit' | 'combo'
  | 'skill' | 'heal' | 'shield' | 'victory' | 'defeat' | 'bossChant'
  | 'click' | 'coin' | 'levelUp';

export class SoundEngine {
  private unlocked = false;

  private classSounds: Record<ClassId, { attack: string[]; hit: string[] }> = {
    warrior: { attack: ['/sounds/sfx/battle/heavy_swing_01.wav'], hit: ['/sounds/sfx/battle/sword_hit_01.wav'] },
    mage:    { attack: ['/sounds/sfx/battle/fireball_launch.wav'], hit: ['/sounds/sfx/battle/fireball_impact.wav'] },
    ranger:  { attack: ['/sounds/sfx/battle/bow_shoot.wav'],      hit: ['/sounds/sfx/battle/bow_hit.wav'] },
    paladin: { attack: ['/sounds/sfx/battle/sword_swing_01.wav'], hit: ['/sounds/sfx/battle/sword_hit_01.wav'] },
    rogue:   { attack: ['/sounds/sfx/battle/dagger_swing.wav'],   hit: ['/sounds/sfx/battle/dagger_hit.wav'] },
    druid:   { attack: ['/sounds/sfx/battle/ice_launch.wav'],     hit: ['/sounds/sfx/battle/ice_impact.wav'] },
  };

  private pools: Record<string, string[]> = {
    playerAttack: ['/sounds/sfx/battle/sword_swing_01.wav'],
    enemyHit:    ['/sounds/sfx/battle/sword_hit_01.wav'],
    playerHit:   ['/sounds/sfx/monster/beast_01.wav', '/sounds/sfx/monster/giant_01.wav', '/sounds/sfx/monster/ogre_01.wav'],
    combo:       ['/sounds/sfx/battle/heal_01.wav'],
    skill:       ['/sounds/sfx/battle/spell_01.wav'],
    heal:        ['/sounds/sfx/battle/heal_01.wav'],
    shield:      ['/sounds/sfx/battle/shield_01.wav'],
    victory:     ['/sounds/sfx/ui/victory/fanfare.mp3'],
    defeat:      ['/sounds/sfx/battle/swing_02.wav'],
    bossChant:   ['/sounds/sfx/battle/boss_chant.wav'],
    click:       ['/sounds/sfx/ui/click_01.wav', '/sounds/sfx/ui/click_02.wav'],
    coin:        ['/sounds/sfx/battle/coin_01.wav', '/sounds/sfx/battle/coin_02.wav'],
    levelUp:     ['/sounds/sfx/battle/heal_01.wav'],
  };

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
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

  play(event: SoundEvent, _opts?: { rate?: number; volume?: number }): void {
    const pool = this.pools[event];
    if (!pool || pool.length === 0) return;
    const src = this.pick(pool);

    try {
      const audio = new Audio(src);
      audio.volume = 1;
      audio.play().catch(() => {});
      // Victory fanfare: stop after 4.5s
      if (event === 'victory') {
        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 4500);
      }
    } catch { /* ignore */ }
  }

  playAttackSequence(): void {
    this.play('playerAttack');
    setTimeout(() => this.play('enemyHit'), 250);
  }

  testBeep(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* ignore */ }
  }
}

export const soundEngine = new SoundEngine();

// Unlock on first click
if (typeof document !== 'undefined') {
  const handler = () => { soundEngine.unlock(); document.removeEventListener('click', handler); };
  document.addEventListener('click', handler, { once: true });
}
