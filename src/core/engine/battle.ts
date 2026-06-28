// ---------------------------------------------------------------------------
// Core Battle Engine — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { PlayerState, MonsterDef, BattleState, SkillDef } from '@/core/data/types';
import { BASE_CLASSES, ADVANCED_CLASSES } from '@/core/data/classes';
import { EQUIPMENT } from '@/core/data/equipment';


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
 * Base class baseAttack + player.attack + advanced class baseAttackBonus
 * + all equipped items' attack bonuses.
 */
export function getPlayerAttack(player: PlayerState): number {
  const base = BASE_CLASSES[player.classId]?.baseAttack ?? 0;
  const bonus = player.advancedClassId
    ? (ADVANCED_CLASSES[player.advancedClassId]?.baseAttackBonus ?? 0)
    : 0;
  const equippedIds = [
    player.equippedWeaponId,
    player.equippedArmorId,
    player.equippedAccessoryId,
  ].filter((id): id is string => id !== null);
  const eqAtk = equippedIds.reduce((sum, id) => {
    const item = EQUIPMENT.find((e) => e.id === id);
    return sum + (item?.attack ?? 0);
  }, 0);
  return base + player.attack + bonus + eqAtk;
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

/**
 * Pick a random skill from a weighted list.
 * Skills with higher weight are more likely to be chosen.
 */
export function pickRandomSkill(skills: SkillDef[]): SkillDef {
  const totalWeight = skills.reduce((sum, s) => sum + (s.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const skill of skills) {
    roll -= skill.weight ?? 1;
    if (roll <= 0) return skill;
  }
  return skills[skills.length - 1];
}

// ---------------------------------------------------------------------------
// Battle lifecycle
// ---------------------------------------------------------------------------

/**
 * Get the player's effective defense value.
 * player.defense + all equipped items' defense bonuses.
 */
export function getPlayerDefense(player: PlayerState): number {
  const equippedIds = [
    player.equippedWeaponId,
    player.equippedArmorId,
    player.equippedAccessoryId,
  ].filter((id): id is string => id !== null);
  const eqDef = equippedIds.reduce((sum, id) => {
    const item = EQUIPMENT.find((e) => e.id === id);
    return sum + (item?.defense ?? 0);
  }, 0);
  return (player.defense ?? 0) + eqDef;
}

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
    lastDamageDealt: 0,
    lastDamageTaken: 0,
    lastCrit: false,
    lastSkillName: '',
    lastMonsterSkillName: '',
    playerDefense: getPlayerDefense(player),
    log: [],
  };
}

// ---------------------------------------------------------------------------
// Player action: answer a question
// ---------------------------------------------------------------------------

/**
 * Process the player answering a question.
 * - Correct → deal class-specific damage, heal (paladin/druid), stun (mage), combo++
 * - Wrong → deal regular damage, combo=0, monster turn
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
    const base = getPlayerAttack(player);
    const crit = isCrit(player, wasLastWrong);
    next.lastCrit = crit;

    // Get the class definition
    const classDef = player.advancedClassId
      ? ADVANCED_CLASSES[player.advancedClassId]
      : BASE_CLASSES[player.classId];

    if (classDef) {
      // Pick a random skill based on weights
      const skill = pickRandomSkill(classDef.skills);
      next.lastSkillName = skill.name;

      let damage = 0;
      const skillMult = skill.multiplier ?? 1;
      const hits = skill.hits ?? 1;

      // Calculate damage: base attack × skill multiplier × combo × crit × hits
      const dmgPerHit = calculateDamage(base * skillMult, next.combo, crit);
      damage = dmgPerHit * hits;

      // Apply skill effects
      if (skill.stun && skill.stunDuration) {
        next.stunTimer = skill.stunDuration;
      }
      if (skill.freeze && skill.freezeDuration) {
        next.stunTimer = (next.stunTimer || 0) + skill.freezeDuration;
      }
      if (skill.heal && skill.healPercent) {
        const healAmt = Math.round(next.playerMaxHp * skill.healPercent);
        next.playerHp = Math.min(next.playerHp + healAmt, next.playerMaxHp);
      }
      if (skill.shield && skill.shieldDuration) {
        next.invulnerable = (next.invulnerable || 0) + skill.shieldDuration;
      }
      if (skill.dodge) {
        next.invulnerable = (next.invulnerable || 0) + 1;
      }

      next.lastDamageDealt = damage;
      next.monsterHp = Math.max(0, next.monsterHp - damage);
    } else {
      // Fallback — no class def found
      const damage = calculateDamage(base, next.combo, crit);
      next.lastSkillName = '攻击';
      next.lastDamageDealt = damage;
      next.monsterHp = Math.max(0, next.monsterHp - damage);
    }

    next.lastDamageTaken = 0;
    next.combo += 1;
    next.phase = 'result';

    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
  } else {
    const base = getPlayerAttack(player);
    const crit = isCrit(player, wasLastWrong);
    next.lastCrit = crit;
    const damage = calculateDamage(base, next.combo, crit);
    next.lastDamageDealt = damage;
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.lastDamageTaken = 0;
    next.combo = 0;
    next.phase = 'monster-turn';

    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
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
 * - 25% chance to use a random skill from monster.skills (for variety)
 * - Otherwise: normal attack.
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
    next.lastMonsterSkillName = '';
    return next;
  }

  // Check invulnerable (player shield/dodge)
  if (next.invulnerable > 0) {
    next.invulnerable -= 1;
    next.turn += 1;
    next.phase = 'question';
    next.lastMonsterSkillName = '';
    return next;
  }

  const defense = next.playerDefense ?? 0;
  const baseDmg = Math.max(1, monster.attack - defense);
  let finalDmg = baseDmg;
  let skillName = '';

  // 25% chance to use a skill
  if (monster.skills && monster.skills.length > 0 && Math.random() < 0.25) {
    const skill = pickRandomSkill(monster.skills);
    skillName = skill.name;

    // Apply skill multiplier
    if (skill.multiplier) {
      finalDmg = Math.max(1, Math.round(monster.attack * skill.multiplier - defense));
    }

    // Skill effects
    if (skill.stun) {
      next.stunTimer = 1;
    }
    if (skill.shield) {
      next.invulnerable = (next.invulnerable || 0) + 1;
    }
    if (skill.heal && skill.healPercent) {
      const healAmt = Math.round(next.monsterMaxHp * skill.healPercent);
      next.monsterHp = Math.min(next.monsterHp + healAmt, next.monsterMaxHp);
    }
    if (skill.enrage && skill.enrageAttack) {
      // For simplicity, enrage just adds a one-time flat damage bonus
      finalDmg += skill.enrageAttack;
    }
  }

  next.lastMonsterSkillName = skillName;
  next.lastDamageTaken = finalDmg;
  next.playerHp = Math.max(0, next.playerHp - finalDmg);
  next.turn += 1;

  if (next.playerHp <= 0) {
    next.status = 'lost';
  } else {
    next.phase = 'question';
  }

  return next;
}
