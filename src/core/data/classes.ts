// ---------------------------------------------------------------------------
// Class definitions — 6 base classes + 6 advanced classes
// ---------------------------------------------------------------------------
import type { ClassDef, AdvancedClassDef } from './types';

// ---------------------------------------------------------------------------
// Base classes
// ---------------------------------------------------------------------------

export const BASE_CLASSES: Record<string, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: '战士',
    baseAttack: 12,
    passive: {
      type: 'attackPerk',
      value: 0.2,       // +20% attack
    },
    skill: {
      name: '猛击',
      description: '造成3倍伤害',
      chargeNeeded: 5,
      multiplier: 3,
    },
    advancedTo: 'dragon-knight',
  },
  mage: {
    id: 'mage',
    name: '法师',
    baseAttack: 8,
    passive: {
      type: 'comboStart',
      value: 1.5,       // first skill use ×1.5
    },
    skill: {
      name: '火球术',
      description: '造成2倍伤害并眩晕',
      chargeNeeded: 5,
      multiplier: 2,
      stun: true,
      stunDuration: 1,
    },
    advancedTo: 'archmage',
  },
  ranger: {
    id: 'ranger',
    name: '游侠',
    baseAttack: 9,
    passive: {
      type: 'critAfterWrong',
      value: 0.3,       // 30% chance crit after player answers wrong
    },
    skill: {
      name: '连射',
      description: '连续射击3次',
      chargeNeeded: 5,
      hits: 3,
    },
    advancedTo: 'elf-lord',
  },
  paladin: {
    id: 'paladin',
    name: '圣骑士',
    baseAttack: 7,
    passive: {
      type: 'damageReduction',
      value: 0.3,       // -30% damage taken
    },
    skill: {
      name: '圣光',
      description: '恢复40%生命值',
      chargeNeeded: 5,
      heal: true,
      healPercent: 0.4,
    },
    advancedTo: 'light-lord',
  },
  rogue: {
    id: 'rogue',
    name: '盗贼',
    baseAttack: 10,
    passive: {
      type: 'critBonus',
      value: 0.15,      // +15% crit chance
    },
    skill: {
      name: '暗杀',
      description: '对生命低于50%的敌人即死',
      chargeNeeded: 5,
      multiplier: 999,   // instant-kill
    },
    advancedTo: 'shadow-master',
  },
  druid: {
    id: 'druid',
    name: '德鲁伊',
    baseAttack: 6,
    passive: {
      type: 'regen',
      value: 0.05,      // regen 5% HP per turn
    },
    skill: {
      name: '自然之怒',
      description: '造成伤害并眩晕2回合',
      chargeNeeded: 5,
      multiplier: 2,
      stun: true,
      stunDuration: 2,
    },
    advancedTo: 'nature-spirit',
  },
};

// ---------------------------------------------------------------------------
// Advanced classes
// ---------------------------------------------------------------------------

export const ADVANCED_CLASSES: Record<string, AdvancedClassDef> = {
  'dragon-knight': {
    id: 'dragon-knight',
    name: '龙骑士',
    baseAttackBonus: 8,
    passive: {
      type: 'atkPlusDmgReduce',
      value: 0.3,       // attack +30%
      extra: '0.5',     // damage -50%
    },
    skill: {
      name: '龙息',
      description: '造成4倍伤害并获得1回合护盾',
      chargeNeeded: 5,
      multiplier: 4,
      shield: true,
      shieldDuration: 1,
    },
  },
  archmage: {
    id: 'archmage',
    name: '大法师',
    baseAttackBonus: 7,
    passive: {
      type: 'comboX2FreeSkill',
      value: 2,         // combo ×2
      extra: 'free',    // plus free skill use
    },
    skill: {
      name: '暴风雪',
      description: '造成3倍伤害并冰冻3回合',
      chargeNeeded: 5,
      multiplier: 3,
      freeze: true,
      freezeDuration: 3,
    },
  },
  'elf-lord': {
    id: 'elf-lord',
    name: '精灵领主',
    baseAttackBonus: 6,
    passive: {
      type: 'critX3',
      value: 0.5,       // 50% crit ×3 damage
    },
    skill: {
      name: '穿心箭',
      description: '5连击并闪避下回合攻击',
      chargeNeeded: 5,
      hits: 5,
      dodge: true,
    },
  },
  'light-lord': {
    id: 'light-lord',
    name: '光明领主',
    baseAttackBonus: 4,
    passive: {
      type: 'dmgReduceRegen',
      value: 0.5,       // -50% damage
      extra: '0.05',    // +5% regen
    },
    skill: {
      name: '神圣裁决',
      description: '完全恢复生命值，攻击减半持续3回合',
      chargeNeeded: 5,
      heal: true,
      healPercent: 1.0,
      multiplier: 0.5,
    },
  },
  'shadow-master': {
    id: 'shadow-master',
    name: '暗影大师',
    baseAttackBonus: 7,
    passive: {
      type: 'critKillHeal',
      value: 0.3,       // 30% crit
      extra: '0.3',     // kill heal 30%
    },
    skill: {
      name: '暗影标记',
      description: '标记目标后即死',
      chargeNeeded: 5,
      mark: true,
      multiplier: 999,
    },
  },
  'nature-spirit': {
    id: 'nature-spirit',
    name: '自然之灵',
    baseAttackBonus: 5,
    passive: {
      type: 'regenImmune',
      value: 0.1,       // regen 10%
      extra: 'immune',  // immune to status effects
    },
    skill: {
      name: '自然复苏',
      description: '3回合持续伤害并复活队友',
      chargeNeeded: 5,
      dot: true,
      dotDuration: 3,
      resurrect: true,
    },
  },
};
