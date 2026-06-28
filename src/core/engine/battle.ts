// ---------------------------------------------------------------------------
// Core Battle Engine — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { PlayerState, MonsterDef, BattleState } from '@/core/data/types';
import { BASE_CLASSES, ADVANCED_CLASSES } from '@/core/data/classes';


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map combo count to damage multiplier.
 * combo ≥ 1 → 1,  ≥ 3 → 1.5,  ≥ 5 → 2,  ≥ 7 → 3
 */
export function getComboMultiplier(combo: number): number {
  if (combo >= 7) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

/**
 * Calculate raw damage from base attack, combo, crit and skill flag.
 * combo multiplier (see getComboMultiplier) × 2 if crit → Math.round.
 */
export function calculateDamage(
  baseAttack: number,
  combo: number,
  isCrit: boolean,
): number {
  let damage = baseAttack * getComboMultiplier(combo);
  if (isCrit) damage *= 2;
  return Math.round(damage);
}

/**
 * Get the player's effective attack value.
 * Base class baseAttack + player.attack + advanced class baseAttackBonus (if any).
 */
export function getPlayerAttack(player: PlayerState): number {
  const base = BASE_CLASSES[player.classId]?.baseAttack ?? 0;
  const bonus = player.advancedClassId
    ? (ADVANCED_CLASSES[player.advancedClassId]?.baseAttackBonus ?? 0)
    : 0;
  return base + player.attack + bonus;
}

/**
 * Effective combo start value.
 * archmage → 2, mage → 1, otherwise 0.
 */
export function getEffectiveComboStart(player: PlayerState): number {
  if (player.advancedClassId === 'archmage') return 2;
  if (player.classId === 'mage') return 1;
  return 0;
}

/**
 * Check whether the player's attack crits.
 * - shadow-master: 30 %
 * - elf-lord: 50 %
 * - rogue: 15 %
 * - ranger + wasLastWrong: 30 %
 * - otherwise false
 */
export function isCrit(player: PlayerState, wasLastWrong: boolean): boolean {
  const advId = player.advancedClassId;
  if (advId === 'shadow-master') return Math.random() < 0.3;
  if (advId === 'elf-lord') return Math.random() < 0.5;
  if (player.classId === 'rogue') return Math.random() < 0.15;
  if (player.classId === 'ranger' && wasLastWrong) return Math.random() < 0.3;
  return false;
}

// ---------------------------------------------------------------------------
// Battle lifecycle
// ---------------------------------------------------------------------------

/**
 * Create a new battle state.
 */
export function createBattle(
  player: PlayerState,
  monster: MonsterDef,
): BattleState {
  return {
    playerHp: player.hp,
    playerMaxHp: player.maxHp,
    monsterId: monster.id,
    monsterHp: monster.hp,
    monsterMaxHp: monster.hp,
    turn: 1,
    charge: 0,
    combo: 0,
    phase: 'question',
    stunTimer: 0,
    invulnerable: 0,
    isBoss: monster.isBoss,
    status: 'ongoing',
    playerEffects: [],
    monsterEffects: [],
  };
}

// ---------------------------------------------------------------------------
// Player action: answer a question
// ---------------------------------------------------------------------------

/**
 * Process the player answering a question.
 * - Correct → combo++, charge++ (max 5), deal damage, check victory.
 * - Wrong → combo=0, charge=0, monster counter-attacks, check defeat.
 */
export function answerQuestion(
  battle: BattleState,
  player: PlayerState,
  monster: MonsterDef,
  correct: boolean,
  wasLastWrong = false,
): BattleState {
  const next = { ...battle };

  if (correct) {
    next.combo += 1;
    next.charge = Math.min(next.charge + 1, 5);

    const attack = getPlayerAttack(player);
    const crit = isCrit(player, wasLastWrong);
    const damage = calculateDamage(attack, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);

    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
  } else {
    next.combo = 0;
    next.charge = 0;
    next.phase = 'monster-turn';
  }

  return next;
}

// ---------------------------------------------------------------------------
// Player action: use a skill
// ---------------------------------------------------------------------------

/**
 * Apply a class skill (skillIndex 0 = base, 1 = advanced).
 * Always resets charge to 0.
 */
export function useSkill(
  battle: BattleState,
  player: PlayerState,
  monster: MonsterDef,
  skillIndex: 0 | 1,
): BattleState {
  const next = { ...battle };
  next.charge = 0;

  const classDef = BASE_CLASSES[player.classId];
  const advDef = player.advancedClassId
    ? ADVANCED_CLASSES[player.advancedClassId]
    : null;

  // Determine which skill to use: index 1 requires advanced class
  const isAdvanced = skillIndex === 1 && advDef !== null;

  // ----- Non-damage skills (heal-only) handled first -----
  if (isAdvanced && advDef!.id === 'light-lord') {
    // Full heal
    next.playerHp = next.playerMaxHp;
    return next;
  }

  if (!isAdvanced && classDef.id === 'paladin') {
    // Heal 40 %
    const heal = Math.round(next.playerMaxHp * 0.4);
    next.playerHp = Math.min(next.playerHp + heal, next.playerMaxHp);
    return next;
  }

  if (!isAdvanced && classDef.id === 'rogue') {
    // Instakill if monster HP < 50 %, else ×2.5
    if (next.monsterHp < Math.round(next.monsterMaxHp / 2)) {
      next.status = 'won';
      return next;
    }
    // ×2.5 damage
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 2.5, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (isAdvanced && advDef!.id === 'shadow-master') {
    // Instakill if monster HP < 50 % (mark + kill), else ×2.5
    if (next.monsterHp < Math.round(next.monsterMaxHp / 2)) {
      next.status = 'won';
      return next;
    }
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 2.5, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  // ----- Damage skills -----
  if (isAdvanced && advDef!.id === 'dragon-knight') {
    // ×4 + shield 1 turn
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 4, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.invulnerable = 1;
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (!isAdvanced && classDef.id === 'warrior') {
    // ×3 damage
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 3, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (isAdvanced && advDef!.id === 'archmage') {
    // ×3 + freeze 3 turns
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 3, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.stunTimer = 3;
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (!isAdvanced && classDef.id === 'mage') {
    // ×2 + stun 1 turn
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 2, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.stunTimer = 1;
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (isAdvanced && advDef!.id === 'elf-lord') {
    // 5 hits + dodge
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const hitDmg = calculateDamage(attack, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - hitDmg * 5);
    next.invulnerable = 1;
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (!isAdvanced && classDef.id === 'ranger') {
    // 3 hits
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const hitDmg = calculateDamage(attack, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - hitDmg * 3);
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (!isAdvanced && classDef.id === 'druid') {
    // ×2 + stun 2 turns
    const attack = getPlayerAttack(player);
    const crit = isCrit(player, false);
    const damage = calculateDamage(attack * 2, next.combo, crit);
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.stunTimer = 2;
    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
    return next;
  }

  if (isAdvanced && advDef!.id === 'nature-spirit') {
    // 3-turn DoT, no upfront damage
    // Apply effect for 3 turns
    next.monsterEffects = [...next.monsterEffects.filter(e => e !== 'dot3'), 'dot3'];
    // Also has revive component — mark it
    next.playerEffects = [...next.playerEffects.filter(e => e !== 'revive'), 'revive'];
    return next;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Monster turn
// ---------------------------------------------------------------------------

/**
 * Process the monster's turn.
 * - If stunned: decrement stun, skip attack.
 * - If invulnerable: decrement invuln, skip attack.
 * - Otherwise: deal monster.attack damage to player, check defeat.
 */
export function monsterTurn(
  battle: BattleState,
  monster: MonsterDef,
): BattleState {
  const next = { ...battle };

  // Check stun
  if (next.stunTimer > 0) {
    next.stunTimer -= 1;
    next.turn += 1;
    next.phase = 'question';
    return next;
  }

  // Check invulnerable (player shield/dodge)
  if (next.invulnerable > 0) {
    next.invulnerable -= 1;
    next.turn += 1;
    next.phase = 'question';
    return next;
  }

  // Normal attack
  next.playerHp = Math.max(0, next.playerHp - monster.attack);
  next.turn += 1;

  if (next.playerHp <= 0) {
    next.status = 'lost';
  } else {
    next.phase = 'question';
  }

  return next;
}
