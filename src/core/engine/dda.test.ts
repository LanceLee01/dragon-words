import { describe, it, expect } from 'vitest';
import { DDAController } from './dda';

/**
 * Helpers to build up state through the public API (which triggers recalculate).
 * The constructor stores streaks but does NOT call recalculate(), so modifiers
 * remain at BASE until an answer is registered.
 */

/** Apply N correct answers. */
function answerCorrect(dda: DDAController, n = 1) {
  for (let i = 0; i < n; i++) dda.onAnswerCorrect();
}

/** Apply N wrong answers. */
function answerWrong(dda: DDAController, n = 1) {
  for (let i = 0; i < n; i++) dda.onAnswerWrong();
}

// ---------------------------------------------------------------------------
// 1. Initial state
// ---------------------------------------------------------------------------
describe('initial state', () => {
  it('starts with zero streaks, no protection, no challenge, base modifiers', () => {
    const dda = new DDAController();
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(0);
    expect(s.correctStreak).toBe(0);
    expect(s.protectionLevel).toBe(0);
    expect(s.challengeMode).toBe(false);
    expect(s.currentModifiers).toEqual({
      monsterHpMul: 1, monsterAtkMul: 1, timeBonus: 0,
      easyWordBias: 0, hardWordBias: 0,
      forceEasyWord: false, forceTutor: false, extraShield: 0,
      rewardGoldMul: 1, rewardXpMul: 1, dropRarityBonus: 0, challengeMode: false,
    });
  });

  it('accepts optional initial streaks in constructor but does NOT recalculate', () => {
    const dda = new DDAController({ mistakeStreak: 5, correctStreak: 15 });
    const s = dda.getState();
    // Streaks are stored …
    expect(s.mistakeStreak).toBe(5);
    expect(s.correctStreak).toBe(15);
    // … but modifiers are still BASE because recalculate() was never called
    expect(s.protectionLevel).toBe(0);
    expect(s.challengeMode).toBe(false);
    expect(s.currentModifiers.monsterHpMul).toBe(1);
  });

  it('defaults to zero when constructor receives undefined', () => {
    const dda = new DDAController(undefined);
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(0);
    expect(s.correctStreak).toBe(0);
  });

  it('getModifiers returns a copy (not a reference)', () => {
    const dda = new DDAController();
    const copy = dda.getModifiers();
    (copy as any).monsterHpMul = 999;
    expect(dda.getModifiers().monsterHpMul).toBe(1);
  });

  it('getState returns a snapshot (immutable copy)', () => {
    const dda = new DDAController();
    const state = dda.getState();
    (state as any).mistakeStreak = 999;
    expect(dda.getState().mistakeStreak).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. onAnswerCorrect
// ---------------------------------------------------------------------------
describe('onAnswerCorrect', () => {
  it('increments correctStreak by 1', () => {
    const dda = new DDAController();
    dda.onAnswerCorrect();
    expect(dda.getState().correctStreak).toBe(1);
  });

  it('decreases mistakeStreak by 2 (floor at 0)', () => {
    const dda = new DDAController({ mistakeStreak: 5, correctStreak: 0 });
    // Recalculate first: simulate a wrong answer to trigger it at m=5
    dda.onAnswerWrong(); // m:5+1=6, c:0→0; recalculate m=6 → tier 0
    expect(dda.getState().mistakeStreak).toBe(6);

    dda.onAnswerCorrect(); // m:6-2=4, c:0+1=1
    expect(dda.getState().mistakeStreak).toBe(4);

    dda.onAnswerCorrect(); // m:4-2=2
    dda.onAnswerCorrect(); // m:2-2=0
    expect(dda.getState().mistakeStreak).toBe(0);

    dda.onAnswerCorrect(); // m stays 0
    expect(dda.getState().mistakeStreak).toBe(0);
  });

  it('can reduce mistakeStreak from any value without going negative', () => {
    const dda = new DDAController({ mistakeStreak: 1, correctStreak: 0 });
    dda.onAnswerCorrect(); // m:1-2=-1→0
    expect(dda.getState().mistakeStreak).toBe(0);
  });

  it('triggers recalculate — protection can downgrade', () => {
    // Build up to protection tier 0 via sequence
    const dda = new DDAController();
    answerWrong(dda, 5); // m=5 → protection tier 0 active
    expect(dda.getState().protectionLevel).toBe(0); // indexOf first tier = 0

    // A correct answer reduces mistakeStreak below threshold → protection drops
    dda.onAnswerCorrect(); // m:5-2=3 < 5 → no protection
    expect(dda.getState().protectionLevel).toBe(0);
    expect(dda.getModifiers().monsterHpMul).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. onAnswerWrong
// ---------------------------------------------------------------------------
describe('onAnswerWrong', () => {
  it('increments mistakeStreak by 1', () => {
    const dda = new DDAController();
    dda.onAnswerWrong();
    expect(dda.getState().mistakeStreak).toBe(1);
  });

  it('decreases correctStreak by 5 (floor at 0)', () => {
    const dda = new DDAController({ mistakeStreak: 0, correctStreak: 12 });
    dda.onAnswerWrong(); // c:12-5=7, m:0+1=1
    expect(dda.getState().correctStreak).toBe(7);

    dda.onAnswerWrong(); // c:7-5=2
    expect(dda.getState().correctStreak).toBe(2);

    dda.onAnswerWrong(); // c:2-5=-3→0
    expect(dda.getState().correctStreak).toBe(0);

    dda.onAnswerWrong(); // stays 0
    expect(dda.getState().correctStreak).toBe(0);
  });

  it('triggers recalculate — protection activates at threshold', () => {
    const dda = new DDAController();
    answerWrong(dda, 5);
    expect(dda.getState().protectionLevel).toBe(0);
    expect(dda.getModifiers().monsterHpMul).toBe(0.85);
  });
});

// ---------------------------------------------------------------------------
// 4. Protection tiers
// ---------------------------------------------------------------------------
describe('protection tiers', () => {
  it('tier 0 — 5 mistakes: monsterHpMul 0.85, monsterAtkMul 0.80, timeBonus 2, easyBias 0.25', () => {
    const dda = new DDAController();
    answerWrong(dda, 5); // m=5
    const m = dda.getModifiers();
    expect(m.monsterHpMul).toBe(0.85);
    expect(m.monsterAtkMul).toBe(0.80);
    expect(m.timeBonus).toBe(2);
    expect(m.easyWordBias).toBe(0.25);
    expect(m.forceEasyWord).toBe(false);
    expect(m.forceTutor).toBe(false);
    expect(m.extraShield).toBe(0);
    expect(dda.getState().protectionLevel).toBe(0);
  });

  it('tier 1 — 8 mistakes: monsterHpMul 0.65, forceEasyWord, extraShield 1', () => {
    const dda = new DDAController();
    answerWrong(dda, 8); // m=8
    const m = dda.getModifiers();
    expect(m.monsterHpMul).toBe(0.65);
    expect(m.monsterAtkMul).toBe(0.60);
    expect(m.timeBonus).toBe(4);
    expect(m.easyWordBias).toBe(0.25);   // inherited from tier 0
    expect(m.forceEasyWord).toBe(true);
    expect(m.forceTutor).toBe(false);
    expect(m.extraShield).toBe(1);
    expect(dda.getState().protectionLevel).toBe(1);
  });

  it('tier 2 — 10 mistakes: monsterHpMul 0.30, forceEasyWord, forceTutor, extraShield 2', () => {
    const dda = new DDAController();
    answerWrong(dda, 10); // m=10
    const m = dda.getModifiers();
    expect(m.monsterHpMul).toBe(0.30);
    expect(m.monsterAtkMul).toBe(0.20);
    expect(m.timeBonus).toBe(6);
    expect(m.easyWordBias).toBe(0.25);
    expect(m.forceEasyWord).toBe(true);
    expect(m.forceTutor).toBe(true);
    expect(m.extraShield).toBe(2);
    expect(dda.getState().protectionLevel).toBe(2);
  });

  it('4 mistakes = no protection; 5 = tier 0', () => {
    const dda4 = new DDAController();
    answerWrong(dda4, 4);
    expect(dda4.getModifiers().monsterHpMul).toBe(1);
    expect(dda4.getState().protectionLevel).toBe(0);

    const dda5 = new DDAController();
    answerWrong(dda5, 5);
    expect(dda5.getModifiers().monsterHpMul).toBe(0.85);
    expect(dda5.getState().protectionLevel).toBe(0);
  });

  it('7 mistakes = tier 0; 8 = tier 1', () => {
    const dda7 = new DDAController();
    answerWrong(dda7, 7);
    expect(dda7.getModifiers().monsterHpMul).toBe(0.85);
    expect(dda7.getModifiers().forceEasyWord).toBe(false);

    const dda8 = new DDAController();
    answerWrong(dda8, 8);
    expect(dda8.getModifiers().monsterHpMul).toBe(0.65);
    expect(dda8.getModifiers().forceEasyWord).toBe(true);
  });

  it('9 mistakes = tier 1; 10 = tier 2', () => {
    const dda9 = new DDAController();
    answerWrong(dda9, 9);
    expect(dda9.getModifiers().monsterHpMul).toBe(0.65);
    expect(dda9.getModifiers().forceTutor).toBe(false);

    const dda10 = new DDAController();
    answerWrong(dda10, 10);
    expect(dda10.getModifiers().monsterHpMul).toBe(0.30);
    expect(dda10.getModifiers().forceTutor).toBe(true);
  });

  it('shouldForceEasyWord returns correct values per tier', () => {
    const d = () => new DDAController();
    expect(d().shouldForceEasyWord()).toBe(false);

    const d8 = d(); answerWrong(d8, 8);
    expect(d8.shouldForceEasyWord()).toBe(true);

    const d10 = d(); answerWrong(d10, 10);
    expect(d10.shouldForceEasyWord()).toBe(true);
  });

  it('shouldForceTutor returns true only at tier 2', () => {
    const d = () => new DDAController();
    expect(d().shouldForceTutor()).toBe(false);

    const d8 = d(); answerWrong(d8, 8);
    expect(d8.shouldForceTutor()).toBe(false);

    const d10 = d(); answerWrong(d10, 10);
    expect(d10.shouldForceTutor()).toBe(true);
  });

  it('getExtraShield returns correct shield values per tier', () => {
    const d = () => new DDAController();
    expect(d().getExtraShield()).toBe(0);

    const d5 = d(); answerWrong(d5, 5);
    expect(d5.getExtraShield()).toBe(0);

    const d8 = d(); answerWrong(d8, 8);
    expect(d8.getExtraShield()).toBe(1);

    const d10 = d(); answerWrong(d10, 10);
    expect(d10.getExtraShield()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 5. Challenge tiers
// ---------------------------------------------------------------------------
describe('challenge tiers', () => {
  it('tier 0 — 15 correct: goldMul 1.3, challengeMode true, harder monsters', () => {
    const dda = new DDAController();
    answerCorrect(dda, 15);
    const m = dda.getModifiers();
    expect(m.rewardGoldMul).toBe(1.3);
    expect(m.dropRarityBonus).toBe(1);
    expect(m.monsterHpMul).toBe(1.15);
    expect(m.monsterAtkMul).toBe(1.10);
    expect(m.timeBonus).toBe(-2);
    expect(m.challengeMode).toBe(true);
    expect(dda.getState().challengeMode).toBe(true);
  });

  it('tier 1 — 25 correct: goldMul 1.5, challengeMode true', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25);
    const m = dda.getModifiers();
    expect(m.rewardGoldMul).toBe(1.5);
    expect(m.dropRarityBonus).toBe(2);
    expect(m.monsterHpMul).toBe(1.30);
    expect(m.monsterAtkMul).toBe(1.20);
    expect(m.timeBonus).toBe(-3);
    expect(m.challengeMode).toBe(true);
    expect(dda.getState().challengeMode).toBe(true);
  });

  it('14 correct = base; 15 = tier 0', () => {
    const dda14 = new DDAController();
    answerCorrect(dda14, 14);
    expect(dda14.getModifiers().rewardGoldMul).toBe(1);
    expect(dda14.getState().challengeMode).toBe(false);

    const dda15 = new DDAController();
    answerCorrect(dda15, 15);
    expect(dda15.getModifiers().rewardGoldMul).toBe(1.3);
    expect(dda15.getState().challengeMode).toBe(true);
  });

  it('24 correct = tier 0; 25 = tier 1', () => {
    const dda24 = new DDAController();
    answerCorrect(dda24, 24);
    expect(dda24.getModifiers().rewardGoldMul).toBe(1.3);

    const dda25 = new DDAController();
    answerCorrect(dda25, 25);
    expect(dda25.getModifiers().rewardGoldMul).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// 6. Protection overrides challenge
// ---------------------------------------------------------------------------
describe('protection overrides challenge', () => {
  it('when mistakeStreak >= 5, challenge mode is NOT active even with high correctStreak', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25); // reach challenge tier 1
    expect(dda.getState().challengeMode).toBe(true);
    expect(dda.getState().protectionLevel).toBe(0);
    expect(dda.getModifiers().rewardGoldMul).toBe(1.5);

    // Now make mistakes — protection should take over
    answerWrong(dda, 5);  // c:25-25=0, m:5; recalculate: protection tier 0
    const s = dda.getState();
    expect(s.protectionLevel).toBe(0); // indexOf tier 0 = 0
    expect(s.challengeMode).toBe(false);
    const m = dda.getModifiers();
    expect(m.rewardGoldMul).toBe(1);   // base, not 1.5
    expect(m.dropRarityBonus).toBe(0);
    expect(m.monsterHpMul).toBe(0.85); // protection
  });

  it('when mistakeStreak drops below 5, challenge reactivates', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25);     // challenge tier 1 active
    answerWrong(dda, 5);         // protection overrides
    expect(dda.getState().challengeMode).toBe(false);

    // Two correct: m:5→3→1, each calling recalculate
    // After first correct: m:5-2=3, c:0+1=1 → m=3 < 5, c=1 < 15 → base
    // After second correct: m:3-2=1, c:1+1=2 → m=1 < 5, c=2 < 15 → base
    answerCorrect(dda, 2);
    expect(dda.getState().mistakeStreak).toBe(1);

    // Now we need 13 more correct answers to reach 15
    answerCorrect(dda, 13);
    expect(dda.getState().challengeMode).toBe(true);
    expect(dda.getModifiers().rewardGoldMul).toBe(1.3); // tier 0
  });

  it('at mistakeStreak 8 + high correctStreak, protection rules completely', () => {
    const dda = new DDAController();
    answerCorrect(dda, 30);     // would be challenge
    answerWrong(dda, 8);        // m=8 → protection tier 1 overrides
    const m = dda.getModifiers();
    expect(m.monsterHpMul).toBe(0.65);
    expect(m.monsterAtkMul).toBe(0.60);
    expect(m.forceEasyWord).toBe(true);
    expect(m.rewardGoldMul).toBe(1);
    expect(m.challengeMode).toBe(false);
    expect(dda.getState().challengeMode).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. applyToMonster
// ---------------------------------------------------------------------------
describe('applyToMonster', () => {
  it('returns floored hp/atk based on current monster multipliers', () => {
    const dda = new DDAController();
    expect(dda.applyToMonster(100, 50)).toEqual({ hp: 100, atk: 50 });
  });

  it('applies protection reduction', () => {
    const dda = new DDAController();
    answerWrong(dda, 10); // m=10 → tier 2: hp=0.30, atk=0.20
    expect(dda.applyToMonster(100, 50)).toEqual({ hp: 30, atk: 10 });
  });

  it('applies challenge increase', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25); // tier 1: hp=1.30, atk=1.20
    expect(dda.applyToMonster(100, 50)).toEqual({ hp: 130, atk: 60 });
  });

  it('floors the result (Math.floor)', () => {
    const dda = new DDAController();
    answerWrong(dda, 5); // m=5 → tier 0: hp=0.85, atk=0.80
    expect(dda.applyToMonster(33, 33)).toEqual({ hp: 28, atk: 26 });
    // 33 * 0.85 = 28.05 → floor → 28
    // 33 * 0.80 = 26.40 → floor → 26
  });

  it('works with zero base values', () => {
    const dda = new DDAController();
    expect(dda.applyToMonster(0, 0)).toEqual({ hp: 0, atk: 0 });
  });
});

// ---------------------------------------------------------------------------
// 8. applyToTimeLimit
// ---------------------------------------------------------------------------
describe('applyToTimeLimit', () => {
  it('returns base time unchanged when timeBonus is 0', () => {
    const dda = new DDAController();
    expect(dda.applyToTimeLimit(30)).toBe(30);
  });

  it('adds timeBonus * 1000 (protection extends time)', () => {
    const dda = new DDAController();
    answerWrong(dda, 5); // timeBonus = 2
    expect(dda.applyToTimeLimit(30)).toBe(30 + 2 * 1000); // 2030
  });

  it('negative timeBonus (challenge) reduces time', () => {
    const dda = new DDAController();
    answerCorrect(dda, 15); // timeBonus = -2
    expect(dda.applyToTimeLimit(30)).toBe(30 + (-2) * 1000); // -1970
  });

  it('works with zero base time', () => {
    const dda = new DDAController();
    answerWrong(dda, 10); // timeBonus = 6
    expect(dda.applyToTimeLimit(0)).toBe(6000);
  });
});

// ---------------------------------------------------------------------------
// 9. getWordBias
// ---------------------------------------------------------------------------
describe('getWordBias', () => {
  it('returns zero biases at base state', () => {
    const dda = new DDAController();
    expect(dda.getWordBias()).toEqual({ easy: 0, hard: 0 });
  });

  it('returns easy bias 0.25 from any protection tier', () => {
    const dda = new DDAController();
    answerWrong(dda, 5);  // tier 0: easyWordBias=0.25
    expect(dda.getWordBias()).toEqual({ easy: 0.25, hard: 0 });
  });

  it('returns zero biases in challenge mode (no bias in challenge tiers)', () => {
    const dda = new DDAController();
    answerCorrect(dda, 15);
    expect(dda.getWordBias()).toEqual({ easy: 0, hard: 0 });
  });
});

// ---------------------------------------------------------------------------
// 10. getSettlementMultipliers
// ---------------------------------------------------------------------------
describe('getSettlementMultipliers', () => {
  it('returns base multipliers at start', () => {
    const dda = new DDAController();
    expect(dda.getSettlementMultipliers()).toEqual({ gold: 1, xp: 1, rarity: 0 });
  });

  it('returns base multipliers during protection', () => {
    const dda = new DDAController();
    answerWrong(dda, 10);
    expect(dda.getSettlementMultipliers()).toEqual({ gold: 1, xp: 1, rarity: 0 });
  });

  it('returns bonus multipliers during challenge tier 0', () => {
    const dda = new DDAController();
    answerCorrect(dda, 15);
    expect(dda.getSettlementMultipliers()).toEqual({ gold: 1.3, xp: 1, rarity: 1 });
  });

  it('returns bonus multipliers during challenge tier 1', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25);
    expect(dda.getSettlementMultipliers()).toEqual({ gold: 1.5, xp: 1, rarity: 2 });
  });
});

// ---------------------------------------------------------------------------
// 11. reset
// ---------------------------------------------------------------------------
describe('reset', () => {
  it('returns to initial state after protection', () => {
    const dda = new DDAController();
    answerWrong(dda, 10);
    dda.reset();
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(0);
    expect(s.correctStreak).toBe(0);
    expect(s.protectionLevel).toBe(0);
    expect(s.challengeMode).toBe(false);
    expect(s.currentModifiers).toEqual({
      monsterHpMul: 1, monsterAtkMul: 1, timeBonus: 0,
      easyWordBias: 0, hardWordBias: 0,
      forceEasyWord: false, forceTutor: false, extraShield: 0,
      rewardGoldMul: 1, rewardXpMul: 1, dropRarityBonus: 0, challengeMode: false,
    });
  });

  it('returns to initial state after challenge', () => {
    const dda = new DDAController();
    answerCorrect(dda, 25);
    dda.reset();
    expect(dda.getState().correctStreak).toBe(0);
    expect(dda.getState().challengeMode).toBe(false);
    expect(dda.getModifiers().rewardGoldMul).toBe(1);
  });

  it('can be used multiple times', () => {
    const dda = new DDAController();
    answerWrong(dda, 10);
    dda.reset();
    answerCorrect(dda, 20);
    dda.reset();
    expect(dda.getState().mistakeStreak).toBe(0);
    expect(dda.getState().correctStreak).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 12. Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  it('alternating correct/wrong builds up then recovers', () => {
    const dda = new DDAController();
    // wrong → correct → wrong → correct → wrong
    dda.onAnswerWrong();   // m=1, c=0
    dda.onAnswerCorrect(); // m=0, c=1
    dda.onAnswerWrong();   // m=1, c=0
    dda.onAnswerCorrect(); // m=0, c=1
    dda.onAnswerWrong();   // m=1, c=0
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(1);
    expect(s.correctStreak).toBe(0);
    expect(s.protectionLevel).toBe(0);
  });

  it('very large correct streak does not overflow — capped at highest tier', () => {
    const dda = new DDAController();
    answerCorrect(dda, 1000);
    const m = dda.getModifiers();
    // Only up to tier 1 (threshold 25) exists
    expect(m.rewardGoldMul).toBe(1.5);
    expect(m.monsterHpMul).toBe(1.30);
  });

  it('very large mistake streak does not overflow — capped at highest tier', () => {
    const dda = new DDAController();
    answerWrong(dda, 100);
    const m = dda.getModifiers();
    // Only up to tier 2 (threshold 10) exists
    expect(m.monsterHpMul).toBe(0.30);
    expect(m.monsterAtkMul).toBe(0.20);
    expect(m.forceTutor).toBe(true);
    expect(m.extraShield).toBe(2);
    expect(dda.getState().protectionLevel).toBe(2);
  });

  it('onAnswerCorrect when both streaks 0 — mistake stays 0', () => {
    const dda = new DDAController();
    dda.onAnswerCorrect();
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(0);
    expect(s.correctStreak).toBe(1);
  });

  it('onAnswerWrong when both streaks 0 — correct stays 0', () => {
    const dda = new DDAController();
    dda.onAnswerWrong();
    const s = dda.getState();
    expect(s.mistakeStreak).toBe(1);
    expect(s.correctStreak).toBe(0);
  });

  it('correct streak cannot go negative after many wrong answers', () => {
    const dda = new DDAController({ mistakeStreak: 0, correctStreak: 2 });
    // Need to trigger recalculate first
    dda.onAnswerWrong(); // c:2-5=-3→0, m:1; recalculate runs
    expect(dda.getState().correctStreak).toBe(0);

    dda.onAnswerWrong(); // stays 0
    expect(dda.getState().correctStreak).toBe(0);
  });

  it('mistake streak cannot go negative after many correct answers', () => {
    const dda = new DDAController({ mistakeStreak: 1, correctStreak: 0 });
    dda.onAnswerWrong(); // m:2, c:0  (now recalculate is tied to m=2)
    dda.onAnswerCorrect(); // m:0, c:1
    dda.onAnswerCorrect(); // m stays 0
    expect(dda.getState().mistakeStreak).toBe(0);
  });

  it('protectionLevel uses indexOf — value equals matched tier index (0-based)', () => {
    const d = () => new DDAController();
    // Protection uses PROTECTION_TIERS.indexOf(tier), so the value is
    // the 0-based index of the highest matched tier.
    expect(d().getState().protectionLevel).toBe(0);

    const d5 = d(); answerWrong(d5, 5);
    expect(d5.getState().protectionLevel).toBe(0); // index of first tier

    const d8 = d(); answerWrong(d8, 8);
    expect(d8.getState().protectionLevel).toBe(1); // index of second tier

    const d10 = d(); answerWrong(d10, 10);
    expect(d10.getState().protectionLevel).toBe(2); // index of third tier
  });

  it('recalculate is idempotent — calling onAnswerCorrect twice does not double-apply', () => {
    const dda = new DDAController();
    dda.onAnswerCorrect(); // c=1
    const mods1 = dda.getModifiers();
    dda.onAnswerCorrect(); // c=2
    const mods2 = dda.getModifiers();
    // Both should be base — no change except correctStreak
    expect(mods1).toEqual(mods2);
    expect(dda.getState().correctStreak).toBe(2);
  });
});
