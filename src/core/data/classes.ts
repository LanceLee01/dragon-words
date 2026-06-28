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
      value: 0.2,
    },
    skills: [
      { name: '猛击', description: '造成3倍伤害', multiplier: 3, weight: 3 },
      { name: '旋风斩', description: '造成2倍伤害并攻击2次', multiplier: 2, hits: 2, weight: 2 },
      { name: '破甲', description: '造成1.5倍伤害并附加20%额外伤害', multiplier: 1.5, weight: 2 },
      { name: '战吼', description: '造成1.2倍伤害，下回合必暴击', multiplier: 1.2, weight: 1 },
    ],
    advancedTo: 'dragon-knight',
  },
  mage: {
    id: 'mage',
    name: '法师',
    baseAttack: 8,
    passive: {
      type: 'comboStart',
      value: 1.5,
    },
    skills: [
      { name: '火球术', description: '造成2.5倍伤害', multiplier: 2.5, weight: 3 },
      { name: '冰冻波', description: '造成1.5倍伤害并冰冻1回合', multiplier: 1.5, freeze: true, freezeDuration: 1, weight: 2 },
      { name: '闪电链', description: '造成1.8倍伤害攻击2次', multiplier: 1.8, hits: 2, weight: 2 },
      { name: '奥术冲击', description: '造成3倍伤害，但下回合适用', multiplier: 3, weight: 1 },
    ],
    advancedTo: 'archmage',
  },
  ranger: {
    id: 'ranger',
    name: '游侠',
    baseAttack: 9,
    passive: {
      type: 'critAfterWrong',
      value: 0.3,
    },
    skills: [
      { name: '连射', description: '连续射击3次', hits: 3, weight: 3 },
      { name: '瞄准射击', description: '造成2.5倍伤害', multiplier: 2.5, weight: 2 },
      { name: '毒箭', description: '造成1.5倍伤害并持续2回合伤害', multiplier: 1.5, dot: true, dotDuration: 2, weight: 2 },
      { name: '闪避射击', description: '造成1倍伤害并闪避下回合攻击', multiplier: 1, dodge: true, weight: 1 },
    ],
    advancedTo: 'elf-lord',
  },
  paladin: {
    id: 'paladin',
    name: '圣骑士',
    baseAttack: 7,
    passive: {
      type: 'damageReduction',
      value: 0.3,
    },
    skills: [
      { name: '圣光打击', description: '造成2.5倍伤害', multiplier: 2.5, weight: 3 },
      { name: '制裁之锤', description: '造成2倍伤害', multiplier: 2, weight: 2 },
      { name: '神圣护盾', description: '造成1倍伤害并获得1回合护盾', multiplier: 1, shield: true, shieldDuration: 1, weight: 2 },
      { name: '惩戒', description: '造成2.5倍伤害并恢复20%生命', multiplier: 2.5, heal: true, healPercent: 0.2, weight: 1 },
    ],
    advancedTo: 'light-lord',
  },
  rogue: {
    id: 'rogue',
    name: '盗贼',
    baseAttack: 10,
    passive: {
      type: 'critBonus',
      value: 0.15,
    },
    skills: [
      { name: '背刺', description: '造成3倍伤害', multiplier: 3, weight: 3 },
      { name: '毒刃', description: '造成1.5倍伤害并附加8%怪物当前生命的伤害', multiplier: 1.5, weight: 2 },
      { name: '暗影步', description: '造成2倍伤害并眩晕1回合', multiplier: 2, stun: true, stunDuration: 1, weight: 2 },
      { name: '致命一击', description: '对生命低于40%的敌人造成5倍伤害', multiplier: 5, weight: 1 },
    ],
    advancedTo: 'shadow-master',
  },
  druid: {
    id: 'druid',
    name: '德鲁伊',
    baseAttack: 6,
    passive: {
      type: 'regen',
      value: 0.05,
    },
    skills: [
      { name: '自然之怒', description: '造成2倍伤害并眩晕2回合', multiplier: 2, stun: true, stunDuration: 2, weight: 3 },
      { name: '月火术', description: '造成2倍伤害并灼烧2回合', multiplier: 2, dot: true, dotDuration: 2, weight: 2 },
      { name: '缠绕根须', description: '造成1.5倍伤害并冰冻1回合', multiplier: 1.5, freeze: true, freezeDuration: 1, weight: 2 },
      { name: '星火术', description: '造成2.5倍伤害', multiplier: 2.5, weight: 1 },
    ],
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
      value: 0.3,
      extra: '0.5',
    },
    skills: [
      { name: '龙息', description: '造成4倍伤害并获得1回合护盾', multiplier: 4, shield: true, shieldDuration: 1, weight: 3 },
      { name: '龙尾扫击', description: '造成3倍伤害并眩晕1回合', multiplier: 3, stun: true, stunDuration: 1, weight: 2 },
      { name: '龙翼打击', description: '造成3倍伤害并眩晕1回合', multiplier: 3, stun: true, stunDuration: 1, weight: 2 },
      { name: '龙威', description: '造成2倍伤害并降低怪物攻击30%持续2回合', multiplier: 2, weight: 1 },
    ],
  },
  archmage: {
    id: 'archmage',
    name: '大法师',
    baseAttackBonus: 7,
    passive: {
      type: 'comboX2FreeSkill',
      value: 2,
      extra: 'free',
    },
    skills: [
      { name: '暴风雪', description: '造成3倍伤害并冰冻3回合', multiplier: 3, freeze: true, freezeDuration: 3, weight: 3 },
      { name: '陨石术', description: '造成4倍伤害', multiplier: 4, weight: 2 },
      { name: '魔法护盾', description: '恢复20%生命值并获得2回合护盾', heal: true, healPercent: 0.2, shield: true, shieldDuration: 2, weight: 2 },
      { name: '时间扭曲', description: '造成2倍伤害，下回合连击数翻倍', multiplier: 2, weight: 1 },
    ],
  },
  'elf-lord': {
    id: 'elf-lord',
    name: '精灵领主',
    baseAttackBonus: 6,
    passive: {
      type: 'critX3',
      value: 0.5,
    },
    skills: [
      { name: '穿心箭', description: '5连击并闪避下回合攻击', hits: 5, dodge: true, weight: 3 },
      { name: '鹰眼', description: '造成3倍伤害', multiplier: 3, weight: 2 },
      { name: '箭雨', description: '造成1.5倍伤害攻击4次', multiplier: 1.5, hits: 4, weight: 2 },
      { name: '精准射击', description: '造成3倍伤害', multiplier: 3, weight: 2 },
    ],
  },
  'light-lord': {
    id: 'light-lord',
    name: '光明领主',
    baseAttackBonus: 4,
    passive: {
      type: 'dmgReduceRegen',
      value: 0.5,
      extra: '0.05',
    },
    skills: [
      { name: '神圣裁决', description: '完全恢复生命值，攻击减半持续3回合', heal: true, healPercent: 1.0, multiplier: 0.5, weight: 3 },
      { name: '圣光之矛', description: '造成3倍伤害', multiplier: 3, weight: 2 },
      { name: '守护之光', description: '造成1.5倍伤害并获得2回合护盾', multiplier: 1.5, shield: true, shieldDuration: 2, weight: 2 },
      { name: '净化', description: '造成2倍伤害并消除怪物增益', multiplier: 2, weight: 1 },
    ],
  },
  'shadow-master': {
    id: 'shadow-master',
    name: '暗影大师',
    baseAttackBonus: 7,
    passive: {
      type: 'critKillHeal',
      value: 0.3,
      extra: '0.3',
    },
    skills: [
      { name: '暗影标记', description: '标记目标后造成4倍伤害', multiplier: 4, mark: true, weight: 3 },
      { name: '暗影突袭', description: '造成3倍伤害并眩晕1回合', multiplier: 3, stun: true, stunDuration: 1, weight: 2 },
      { name: '暗影之盾', description: '恢复20%生命值并闪避下回合', heal: true, healPercent: 0.2, dodge: true, weight: 2 },
      { name: '死亡印记', description: '对生命低于30%的敌人造成6倍伤害', multiplier: 6, weight: 1 },
    ],
  },
  'nature-spirit': {
    id: 'nature-spirit',
    name: '自然之灵',
    baseAttackBonus: 5,
    passive: {
      type: 'regenImmune',
      value: 0.1,
      extra: 'immune',
    },
    skills: [
      { name: '自然复苏', description: '3回合持续伤害并恢复15%生命', dot: true, dotDuration: 3, heal: true, healPercent: 0.15, weight: 3 },
      { name: '荆棘之墙', description: '造成2倍伤害并获得2回合反伤盾', multiplier: 2, shield: true, shieldDuration: 2, weight: 2 },
      { name: '风刃', description: '造成2.5倍伤害', multiplier: 2.5, weight: 2 },
      { name: '自然之力', description: '召唤树人造成2.5倍伤害', multiplier: 2.5, weight: 1 },
    ],
  },
};
