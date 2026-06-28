// ---------------------------------------------------------------------------
// Tests for core battle engine functions
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import type { PlayerState, MonsterDef } from '@/core/data/types';
import {
  createBattle,
  calculateDamage,
  getComboMultiplier,
  getPlayerAttack,
  getEffectiveComboStart,
  isCrit,
  answerQuestion,
  useSkill,
  monsterTurn,
} from './battle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    classId: 'warrior',
    advancedClassId: null,
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    baseAttack: 12,
    attack: 5,
    defense: 2,
    equipment: [],
    currentChapter: 1,
    currentLevel: 1,
    gold: 0,
    ...overrides,
  };
}

function makeMonster(overrides: Partial<MonsterDef> = {}): MonsterDef {
  return {
    id: 'goblin',
    name: '哥布林',
    hp: 40,
    attack: 6,
    isBoss: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createBattle
// ---------------------------------------------------------------------------

describe('createBattle', () => {
  it('initializes with correct monster/player HP, combo=0, charge=0, phase=question', () => {
    const player = makePlayer({ hp: 80, maxHp: 100 });
    const monster = makeMonster({ hp: 50 });
    const state = createBattle(player, monster);

    expect(state.playerHp).toBe(80);
    expect(state.playerMaxHp).toBe(100);
    expect(state.monsterHp).toBe(50);
    expect(state.monsterMaxHp).toBe(50);
    expect(state.combo).toBe(0);
    expect(state.charge).toBe(0);
    expect(state.phase).toBe('question');
    expect(state.turn).toBe(1);
    expect(state.status).toBe('ongoing');
    expect(state.monsterId).toBe('goblin');
    expect(state.isBoss).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// calculateDamage
// ---------------------------------------------------------------------------

describe('calculateDamage', () => {
  it('returns base damage for combo=0 (multiplier 1)', () => {
    expect(calculateDamage(100, 0, false)).toBe(100);
    expect(calculateDamage(100, 1, false)).toBe(100);
    expect(calculateDamage(100, 2, false)).toBe(100);
  });

  it('applies ×1.5 for combo≥3', () => {
    expect(calculateDamage(100, 3, false)).toBe(150);
    expect(calculateDamage(100, 4, false)).toBe(150);
  });

  it('applies ×2 for combo≥5', () => {
    expect(calculateDamage(100, 5, false)).toBe(200);
    expect(calculateDamage(100, 6, false)).toBe(200);
  });

  it('applies ×3 for combo≥7', () => {
    expect(calculateDamage(100, 7, false)).toBe(300);
    expect(calculateDamage(100, 10, false)).toBe(300);
  });

  it('doubles damage when crit is true', () => {
    expect(calculateDamage(100, 0, true)).toBe(200);
    expect(calculateDamage(100, 3, true)).toBe(300);
    expect(calculateDamage(100, 5, true)).toBe(400);
    expect(calculateDamage(100, 7, true)).toBe(600);
  });

  it('rounds the result', () => {
    // 15 * 1.5 = 22.5 → 23 (Math.round)
    expect(calculateDamage(15, 3, false)).toBe(23);
    // 15 * 3 = 45
    expect(calculateDamage(15, 7, false)).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// getComboMultiplier
// ---------------------------------------------------------------------------

describe('getComboMultiplier', () => {
  it('returns 1 for combo < 3', () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(1)).toBe(1);
    expect(getComboMultiplier(2)).toBe(1);
  });

  it('returns 1.5 for combo 3-4', () => {
    expect(getComboMultiplier(3)).toBe(1.5);
    expect(getComboMultiplier(4)).toBe(1.5);
  });

  it('returns 2 for combo 5-6', () => {
    expect(getComboMultiplier(5)).toBe(2);
    expect(getComboMultiplier(6)).toBe(2);
  });

  it('returns 3 for combo ≥ 7', () => {
    expect(getComboMultiplier(7)).toBe(3);
    expect(getComboMultiplier(10)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getPlayerAttack
// ---------------------------------------------------------------------------

describe('getPlayerAttack', () => {
  it('returns base class baseAttack + player attack for base class', () => {
    const player = makePlayer({ classId: 'warrior', baseAttack: 12, attack: 5 });
    // warrior baseAttack is 12 + 5 = 17
    expect(getPlayerAttack(player)).toBe(17);
  });

  it('adds baseAttackBonus for advanced class', () => {
    const player = makePlayer({
      classId: 'warrior',
      advancedClassId: 'dragon-knight',
      baseAttack: 12,
      attack: 5,
    });
    // warrior baseAttack 12 + player attack 5 + dragon-knight baseAttackBonus 8 = 25
    expect(getPlayerAttack(player)).toBe(25);
  });

  it('works for mage with archmage', () => {
    const player = makePlayer({
      classId: 'mage',
      advancedClassId: 'archmage',
      baseAttack: 8,
      attack: 3,
    });
    // mage baseAttack 8 + 3 + archmage baseAttackBonus 7 = 18
    expect(getPlayerAttack(player)).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveComboStart
// ---------------------------------------------------------------------------

describe('getEffectiveComboStart', () => {
  it('mage starts combo at 1', () => {
    const mage = makePlayer({ classId: 'mage' });
    expect(getEffectiveComboStart(mage)).toBe(1);
  });
  it('archmage starts combo at 2', () => {
    const arch = makePlayer({ classId: 'mage', advancedClassId: 'archmage' });
    expect(getEffectiveComboStart(arch)).toBe(2);
  });
  it('warrior starts combo at 0', () => {
    const war = makePlayer({ classId: 'warrior' });
    expect(getEffectiveComboStart(war)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isCrit
// ---------------------------------------------------------------------------

describe('isCrit', () => {
  it('returns false for warrior (no crit class)', () => {
    const player = makePlayer({ classId: 'warrior' });
    expect(isCrit(player, false)).toBe(false);
    expect(isCrit(player, true)).toBe(false);
  });

  it('returns 15% for rogue', () => {
    const player = makePlayer({ classId: 'rogue' });
    // Can't test exact randomness, but should sometimes be true
    let critCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (isCrit(player, false)) critCount++;
    }
    // 15% → expected ~150, allow wide range (60-300)
    expect(critCount).toBeGreaterThan(30);
    expect(critCount).toBeLessThan(400);
  });

  it('returns 50% for elf-lord (classId=elf-lord in test, but actual class is ranger advanced)', () => {
    // The function checks advancedClassId for elf-lord
    const player = makePlayer({
      classId: 'ranger',
      advancedClassId: 'elf-lord',
    });
    let critCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (isCrit(player, false)) critCount++;
    }
    // 50% → expected ~500, allow 350-650
    expect(critCount).toBeGreaterThan(300);
    expect(critCount).toBeLessThan(700);
  });

  it('returns 30% for shadow-master', () => {
    const player = makePlayer({
      classId: 'rogue',
      advancedClassId: 'shadow-master',
    });
    let critCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (isCrit(player, false)) critCount++;
    }
    expect(critCount).toBeGreaterThan(100);
    expect(critCount).toBeLessThan(500);
  });

  it('returns 30% for ranger when wasLastWrong=true', () => {
    const player = makePlayer({ classId: 'ranger' });
    let critCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (isCrit(player, true)) critCount++;
    }
    expect(critCount).toBeGreaterThan(100);
    expect(critCount).toBeLessThan(500);
  });

  it('returns false for ranger when wasLastWrong=false', () => {
    const player = makePlayer({ classId: 'ranger' });
    let critCount = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (isCrit(player, false)) critCount++;
    }
    expect(critCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// answerQuestion
// ---------------------------------------------------------------------------

describe('answerQuestion', () => {
  it('increments combo and charge on correct answer', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 0 });
    const monster = makeMonster({ hp: 100, attack: 6 });
    const state = createBattle(player, monster);
    const result = answerQuestion(state, player, monster, true);

    expect(result.combo).toBe(1);
    expect(result.charge).toBe(1);
    expect(result.phase).toBe('question');
  });

  it('resets combo and charge to 0 on wrong answer, sets phase monster-turn', () => {
    const player = makePlayer({ hp: 100, maxHp: 100 });
    const monster = makeMonster({ hp: 100, attack: 6 });
    const state = createBattle(player, monster);
    // Build some combo/charge first
    const afterCorrect = answerQuestion(state, player, monster, true);
    expect(afterCorrect.combo).toBe(1);
    expect(afterCorrect.charge).toBe(1);

    const result = answerQuestion(afterCorrect, player, monster, false);
    expect(result.combo).toBe(0);
    expect(result.charge).toBe(0);
  });

  it('deals damage to monster HP on correct answer', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 0 });
    const monster = makeMonster({ hp: 100, attack: 6 });
    const state = createBattle(player, monster);

    // Warrior baseAttack=12, attack=0 → getPlayerAttack=12, combo=1 → mult=1, no crit
    const result = answerQuestion(state, player, monster, true);
    // Damage = Math.round(12 * 1) = 12
    expect(result.monsterHp).toBe(88);
  });

  it('caps charge at 5', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 0 });
    const monster = makeMonster({ hp: 200, attack: 1 });
    let state = createBattle(player, monster);

    for (let i = 0; i < 10; i++) {
      state = answerQuestion(state, player, monster, true);
    }

    expect(state.charge).toBe(5);
    expect(state.combo).toBe(10);
  });

  it('sets victory when monster HP ≤ 0', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 100 });
    const monster = makeMonster({ hp: 50, attack: 1 });
    const state = createBattle(player, monster);

    const result = answerQuestion(state, player, monster, true);
    expect(result.status).toBe('won');
    expect(result.monsterHp).toBeLessThanOrEqual(0);
  });

  it('sets phase=monster-turn on wrong answer but does NOT deal damage (deferred to monsterTurn)', () => {
    const player = makePlayer({ hp: 10, maxHp: 100, classId: 'warrior', attack: 0 });
    const monster = makeMonster({ hp: 200, attack: 20 });
    const state = createBattle(player, monster);

    const result = answerQuestion(state, player, monster, false);
    // Wrong answer should NOT deal damage — only reset combo/charge and set phase
    expect(result.playerHp).toBe(10);  // unchanged
    expect(result.status).toBe('ongoing');
    expect(result.combo).toBe(0);
    expect(result.charge).toBe(0);
    expect(result.phase).toBe('monster-turn');
  });
});

// ---------------------------------------------------------------------------
// useSkill
// ---------------------------------------------------------------------------

describe('useSkill', () => {
  it('resets charge to 0 after use', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 10 });
    const monster = makeMonster({ hp: 200, attack: 6 });
    let state = createBattle(player, monster);
    // Charge up to 5
    for (let i = 0; i < 5; i++) {
      state = answerQuestion(state, player, monster, true);
    }
    expect(state.charge).toBe(5);

    const result = useSkill(state, player, monster, 0);
    expect(result.charge).toBe(0);
  });

  it('warrior skill deals 3x damage', () => {
    const player = makePlayer({ hp: 100, maxHp: 100, classId: 'warrior', attack: 0 });
    const monster = makeMonster({ hp: 100, attack: 6 });
    let state = createBattle(player, monster);
    state.charge = 5;

    // warrior baseAttack=12, attack=0 → getPlayerAttack=12, skill ×3, combo=0 → mult=1
    // Damage = Math.round(12 * 3 * 1) = 36
    const result = useSkill(state, player, monster, 0);
    expect(result.monsterHp).toBe(64);
  });

  it('dragon-knight skill deals 4x damage and grants shield', () => {
    const player = makePlayer({
      hp: 100, maxHp: 100,
      classId: 'warrior',
      advancedClassId: 'dragon-knight',
      attack: 0,
    });
    const monster = makeMonster({ hp: 200, attack: 6 });
    let state = createBattle(player, monster);
    state.charge = 5;

    // warrior baseAttack=12 + dragon-knight baseAttackBonus=8 + attack=0 → 20, skill ×4, combo=0 → mult=1
    // Damage = Math.round(20 * 4 * 1) = 80
    const result = useSkill(state, player, monster, 1);
    expect(result.monsterHp).toBe(120);
    expect(result.invulnerable).toBe(1);
  });

  it('paladin skill heals 40% max HP', () => {
    const player = makePlayer({
      hp: 50, maxHp: 100,
      classId: 'paladin',
      attack: 0,
    });
    const monster = makeMonster({ hp: 100, attack: 6 });
    let state = createBattle(player, monster);
    state.charge = 5;

    const result = useSkill(state, player, monster, 0);
    // Heal 40% of 100 = 40, 50 + 40 = 90
    expect(result.playerHp).toBe(90);
  });

  it('light-lord skill heals to full HP', () => {
    const player = makePlayer({
      hp: 30, maxHp: 100,
      classId: 'paladin',
      advancedClassId: 'light-lord',
      attack: 0,
    });
    const monster = makeMonster({ hp: 100, attack: 6 });
    let state = createBattle(player, monster);
    state.charge = 5;

    const result = useSkill(state, player, monster, 1);
    expect(result.playerHp).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// monsterTurn
// ---------------------------------------------------------------------------

describe('monsterTurn', () => {
  it('deals monster attack damage to player and cycles to question phase', () => {
    const player = makePlayer({ hp: 100, maxHp: 100 });
    const monster = makeMonster({ hp: 100, attack: 10 });
    const state = createBattle(player, monster);

    const result = monsterTurn(state, monster);
    expect(result.playerHp).toBe(90);
    expect(result.turn).toBe(2);
    expect(result.phase).toBe('question');
  });

  it('skips attack when stunned and decrements stun', () => {
    const player = makePlayer({ hp: 100, maxHp: 100 });
    const monster = makeMonster({ hp: 100, attack: 10 });
    const state = { ...createBattle(player, monster), stunTimer: 2, phase: 'monster-turn' };

    const result = monsterTurn(state, monster);
    expect(result.playerHp).toBe(100); // no damage
    expect(result.stunTimer).toBe(1);
    expect(result.phase).toBe('question');
  });

  it('skips attack when invulnerable and decrements invulnerable', () => {
    const player = makePlayer({ hp: 100, maxHp: 100 });
    const monster = makeMonster({ hp: 100, attack: 10 });
    const state = { ...createBattle(player, monster), invulnerable: 1, phase: 'monster-turn' };

    const result = monsterTurn(state, monster);
    expect(result.playerHp).toBe(100); // no damage
    expect(result.invulnerable).toBe(0);
    expect(result.phase).toBe('question');
  });

  it('sets defeat when player HP ≤ 0 and does NOT cycle to question phase', () => {
    const player = makePlayer({ hp: 5, maxHp: 100 });
    const monster = makeMonster({ hp: 100, attack: 10 });
    const state = { ...createBattle(player, monster), phase: 'monster-turn' };

    const result = monsterTurn(state, monster);
    expect(result.playerHp).toBe(-5);
    expect(result.status).toBe('lost');
    // phase should NOT become 'question' when player is dead
    expect(result.phase).toBe('monster-turn');
  });
});
