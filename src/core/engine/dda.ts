import type { DDAModifiers } from '../data/types';

/**
 * Stealth Dynamic Difficulty Adjustment controller.
 * Completely invisible to the player — no UI indicators.
 * Adjusts monster stats, word difficulty, time limits, and rewards
 * based on player performance streaks.
 */
export class DDAController {
  private state: {
    mistakeStreak: number;
    correctStreak: number;
    protectionLevel: number;
    challengeMode: boolean;
    currentModifiers: DDAModifiers;
  };

  private static BASE: DDAModifiers = {
    monsterHpMul: 1, monsterAtkMul: 1, timeBonus: 0,
    easyWordBias: 0, hardWordBias: 0,
    forceEasyWord: false, forceTutor: false, extraShield: 0,
    rewardGoldMul: 1, rewardXpMul: 1, dropRarityBonus: 0, challengeMode: false,
  };

  private static PROTECTION_TIERS = [
    { threshold: 5, mods: { monsterHpMul: 0.85, monsterAtkMul: 0.80, timeBonus: 2, easyWordBias: 0.25 } },
    { threshold: 8, mods: { monsterHpMul: 0.65, monsterAtkMul: 0.60, timeBonus: 4, forceEasyWord: true, extraShield: 1 } },
    { threshold: 10, mods: { monsterHpMul: 0.30, monsterAtkMul: 0.20, timeBonus: 6, forceEasyWord: true, extraShield: 2, forceTutor: true } },
  ];

  private static CHALLENGE_TIERS = [
    { threshold: 15, mods: { monsterHpMul: 1.15, monsterAtkMul: 1.10, timeBonus: -2, rewardGoldMul: 1.3, dropRarityBonus: 1, challengeMode: true } },
    { threshold: 25, mods: { monsterHpMul: 1.30, monsterAtkMul: 1.20, timeBonus: -3, rewardGoldMul: 1.5, dropRarityBonus: 2, challengeMode: true } },
  ];

  constructor(initialState?: { mistakeStreak: number; correctStreak: number }) {
    this.state = {
      mistakeStreak: initialState?.mistakeStreak ?? 0,
      correctStreak: initialState?.correctStreak ?? 0,
      protectionLevel: 0,
      challengeMode: false,
      currentModifiers: { ...DDAController.BASE },
    };
  }

  onAnswerCorrect(): void {
    this.state.mistakeStreak = Math.max(0, this.state.mistakeStreak - 2);
    this.state.correctStreak++;
    this.recalculate();
  }

  onAnswerWrong(): void {
    this.state.correctStreak = Math.max(0, this.state.correctStreak - 5);
    this.state.mistakeStreak++;
    this.recalculate();
  }

  private recalculate(): void {
    let mods = { ...DDAController.BASE };
    let protectionLevel = 0;

    for (const tier of DDAController.PROTECTION_TIERS) {
      if (this.state.mistakeStreak >= tier.threshold) {
        mods = { ...mods, ...tier.mods };
        protectionLevel = DDAController.PROTECTION_TIERS.indexOf(tier);
      } else break;
    }

    if (protectionLevel === 0) {
      for (const tier of DDAController.CHALLENGE_TIERS) {
        if (this.state.correctStreak >= tier.threshold) {
          mods = { ...mods, ...tier.mods };
        } else break;
      }
    }

    this.state.currentModifiers = mods;
    this.state.protectionLevel = protectionLevel;
    this.state.challengeMode = mods.challengeMode === true;
  }

  // ---- Public query methods ----

  getModifiers(): DDAModifiers { return { ...this.state.currentModifiers }; }
  
  getState() { return { ...this.state }; }

  applyToMonster(baseHp: number, baseAtk: number): { hp: number; atk: number } {
    const m = this.state.currentModifiers;
    return {
      hp: Math.floor(baseHp * m.monsterHpMul),
      atk: Math.floor(baseAtk * m.monsterAtkMul),
    };
  }

  applyToTimeLimit(baseTime: number): number {
    return baseTime + this.state.currentModifiers.timeBonus * 1000;
  }

  getWordBias(): { easy: number; hard: number } {
    const m = this.state.currentModifiers;
    return { easy: m.easyWordBias, hard: m.hardWordBias };
  }

  shouldForceEasyWord(): boolean {
    return this.state.currentModifiers.forceEasyWord;
  }

  shouldForceTutor(): boolean {
    return this.state.currentModifiers.forceTutor;
  }

  getExtraShield(): number {
    return this.state.currentModifiers.extraShield;
  }

  getSettlementMultipliers(): { gold: number; xp: number; rarity: number } {
    const m = this.state.currentModifiers;
    return { gold: m.rewardGoldMul, xp: m.rewardXpMul, rarity: m.dropRarityBonus };
  }

  reset(): void {
    this.state = {
      mistakeStreak: 0, correctStreak: 0,
      protectionLevel: 0, challengeMode: false,
      currentModifiers: { ...DDAController.BASE },
    };
  }
}
