// ---------------------------------------------------------------------------
// Sound Engine — Howler.js wrapper for battle & UI audio
// ---------------------------------------------------------------------------
import { Howl } from 'howler';
import type { ClassId } from '../data/types';

/** Every sound event the game can fire. */
export type SoundEvent =
  // Battle
  | 'playerAttack'
  | 'enemyHit'
  | 'playerHit'
  | 'combo'
  | 'skill'
  | 'heal'
  | 'shield'
  | 'victory'
  | 'defeat'
  | 'bossChant'
  // UI
  | 'click'
  | 'coin'
  | 'levelUp';

interface SoundPool {
  [key: string]: Howl[];
}

/**
 * Sound Engine — singleton wrapper around Howler.js.
 *
 * Manages lazy-loaded sound pools for each game event.
 * Call {@link preload} once at app start to load the default pool.
 */
export class SoundEngine {
  private pools: SoundPool = {};
  private loaded = false;

  /** Map sound events to one or more file paths. */
  private soundMap: Record<SoundEvent, { files: string[]; volume?: number; rate?: number }> = {
    // --- Battle: class-specific attack sounds ---
    playerAttack: { files: ['/sounds/sfx/battle/sword_swing_01.wav'] },            // replaced at runtime per class
    enemyHit:    { files: ['/sounds/sfx/battle/sword_hit_01.wav'] },                // replaced at runtime per class
    playerHit:   { files: [
      '/sounds/sfx/monster/beast_01.wav',
      '/sounds/sfx/monster/giant_01.wav',
      '/sounds/sfx/monster/ogre_01.wav',
    ]},
    combo:       { files: ['/sounds/sfx/battle/heal_01.wav'], volume: 0.6 },
    skill:       { files: ['/sounds/sfx/battle/spell_01.wav'] },
    heal:        { files: ['/sounds/sfx/battle/heal_01.wav'] },
    shield:      { files: ['/sounds/sfx/battle/shield_01.wav'] },
    victory:     { files: ['/sounds/sfx/ui/victory/fanfare.mp3'], volume: 0.7 },
    defeat:      { files: ['/sounds/sfx/battle/swing_02.wav', '/sounds/sfx/battle/spell_01.wav'] },
    bossChant:   { files: ['/sounds/sfx/battle/boss_chant.wav'], volume: 0.5 },
    // --- UI ---
    click:       { files: [
      '/sounds/sfx/ui/click_01.wav',
      '/sounds/sfx/ui/click_02.wav',
    ], volume: 0.5 },
    coin:        { files: [
      '/sounds/sfx/battle/coin_01.wav',
      '/sounds/sfx/battle/coin_02.wav',
    ], volume: 0.6 },
    levelUp:     { files: ['/sounds/sfx/battle/heal_01.wav'] },
  };

  /** Class-specific sound overrides. */
  private classSounds: Record<ClassId, { attack: string[]; hit: string[] }> = {
    warrior: {
      attack: ['/sounds/sfx/battle/heavy_swing_01.wav', '/sounds/sfx/battle/sword_swing_02.wav'],
      hit:    ['/sounds/sfx/battle/sword_hit_01.wav'],
    },
    mage: {
      attack: ['/sounds/sfx/battle/fireball_launch.wav'],
      hit:    ['/sounds/sfx/battle/fireball_impact.wav'],
    },
    ranger: {
      attack: ['/sounds/sfx/battle/bow_shoot.wav'],
      hit:    ['/sounds/sfx/battle/bow_hit.wav'],
    },
    paladin: {
      attack: ['/sounds/sfx/battle/sword_swing_01.wav'],
      hit:    ['/sounds/sfx/battle/sword_hit_01.wav'],
    },
    rogue: {
      attack: ['/sounds/sfx/battle/dagger_swing.wav'],
      hit:    ['/sounds/sfx/battle/dagger_hit.wav'],
    },
    druid: {
      attack: ['/sounds/sfx/battle/ice_launch.wav'],
      hit:    ['/sounds/sfx/battle/ice_impact.wav'],
    },
  };

  private currentClass: ClassId | null = null;

  /** Whether the engine has been preloaded. */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Set the player's current class, updating attack/hit sounds.
   */
  setClass(classId: ClassId | null): void {
    this.currentClass = classId;
    if (classId && this.classSounds[classId]) {
      this.soundMap.playerAttack = { files: this.classSounds[classId].attack };
      this.soundMap.enemyHit = { files: this.classSounds[classId].hit };
    }
  }

  /**
   * Preload all sound files into Howler pools.
   * Call once at app startup (e.g. in App.tsx useEffect).
   */
  preload(): Promise<void> {
    if (this.loaded) return Promise.resolve();

    const events = Object.keys(this.soundMap) as SoundEvent[];
    const promises: Promise<void>[] = [];

    for (const event of events) {
      const { files, volume = 1, rate = 1 } = this.soundMap[event];
      this.pools[event] = files.map((src) => {
        const howl = new Howl({
          src: [src],
          volume,
          rate,
          preload: true,
        });
        // Wrap the 'load' event
        promises.push(new Promise<void>((resolve) => {
          if (howl.state() === 'loaded') {
            resolve();
          } else {
            howl.once('load', () => resolve());
            howl.once('loaderror', () => resolve()); // don't block on missing files
          }
        }));
        return howl;
      });
    }

    return Promise.all(promises).then(() => { this.loaded = true; });
  }

  /**
   * Play a sound event.
   * @param event  The sound event to play.
   * @param opts   Optional: rate override, volume override.
   */
  play(event: SoundEvent, opts?: { rate?: number; volume?: number }): void {
    const pool = this.pools[event];
    if (!pool || pool.length === 0) return;

    // Pick a random variant from the pool
    const idx = Math.floor(Math.random() * pool.length);
    const howl = pool[idx];

    howl.rate(opts?.rate ?? 1);
    howl.volume(opts?.volume ?? howl.volume());
    howl.play();
  }

  /**
   * Play class-appropriate attack + hit sounds in sequence.
   * Used when a correct answer deals damage.
   */
  playAttackSequence(): void {
    const attackDelay = 100; // ms
    const hitDelay = 400;    // ms
    this.play('playerAttack');
    setTimeout(() => this.play('enemyHit'), hitDelay);
  }
}

/** Singleton instance */
export const soundEngine = new SoundEngine();
