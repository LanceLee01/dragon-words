// ---------------------------------------------------------------------------
// Monster definitions — 15 normal + 15 boss monsters
// ---------------------------------------------------------------------------
import type { MonsterDef } from './types';

// ---------------------------------------------------------------------------
// Normal monsters
// ---------------------------------------------------------------------------

export const MONSTERS: Record<string, MonsterDef> = {
  goblin: {
    id: 'goblin',
    name: '哥布林',
    hp: 200,
    attack: 12,
    isBoss: false,
    skills: [
      { name: '偷袭', description: '造成1.5倍伤害', multiplier: 1.5, weight: 1 },
    ],
  },
  skeleton: {
    id: 'skeleton',
    name: '骷髅兵',
    hp: 225,
    attack: 14,
    isBoss: false,
    skills: [
      { name: '骨盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  apprentice: {
    id: 'apprentice',
    name: '学徒法师',
    hp: 250,
    attack: 16,
    isBoss: false,
    skills: [
      { name: '魔法箭', description: '造成1.5倍伤害', multiplier: 1.5, weight: 1 },
    ],
  },
  shadowwolf: {
    id: 'shadowwolf',
    name: '影狼',
    hp: 275,
    attack: 16,
    isBoss: false,
    skills: [
      { name: '迅捷爪击', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  gargoyle: {
    id: 'gargoyle',
    name: '石像鬼',
    hp: 275,
    attack: 16,
    isBoss: false,
    skills: [
      { name: '石化', description: '眩晕玩家', stun: true, weight: 1 },
    ],
  },
  troglodyte: {
    id: 'troglodyte',
    name: '穴居人',
    hp: 375,
    attack: 24,
    isBoss: false,
    skills: [
      { name: '重击', description: '造成1.5倍伤害', multiplier: 1.5, weight: 1 },
    ],
  },

  // ── Elite monsters ─────────────────────────────────────────────────────
  wolf_elite: {
    id: 'wolf_elite',
    name: '巨狼首領',
    hp: 400,
    attack: 18,
    isBoss: true,
    skills: [
      { name: '狼嚎', description: '提升攻击力', attackBuff: 1.3, weight: 1 },
      { name: '撕裂', description: '造成1.5倍伤害', multiplier: 1.5, weight: 1 },
    ],
  },

  harpy: {
    id: 'harpy',
    name: '鹰身女妖',
    hp: 400,
    attack: 26,
    isBoss: false,
    skills: [
      { name: '尖啸', description: '眩晕玩家', stun: true, weight: 1 },
    ],
  },
  ghost: {
    id: 'ghost',
    name: '幽灵',
    hp: 425,
    attack: 28,
    isBoss: false,
    skills: [
      { name: '灵魂吸取', description: '恢复20%生命', heal: true, weight: 1 },
    ],
  },
  ogre: {
    id: 'ogre',
    name: '食人魔',
    hp: 450,
    attack: 30,
    isBoss: false,
    skills: [
      { name: '猛砸', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  succubus: {
    id: 'succubus',
    name: '魅魔',
    hp: 475,
    attack: 32,
    isBoss: false,
    skills: [
      { name: '魅惑', description: '眩晕玩家', stun: true, weight: 1 },
    ],
  },
  demonhound: {
    id: 'demonhound',
    name: '地狱猎犬',
    hp: 500,
    attack: 34,
    isBoss: false,
    skills: [
      { name: '地狱火', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  fallenAngel: {
    id: 'fallenAngel',
    name: '堕天使',
    hp: 550,
    attack: 36,
    isBoss: false,
    skills: [
      { name: '堕落之光', description: '造成1.5倍伤害并眩晕', multiplier: 1.5, stun: true, weight: 1 },
    ],
  },
  timeGhost: {
    id: 'timeGhost',
    name: '时光幽灵',
    hp: 600,
    attack: 40,
    isBoss: false,
    skills: [
      { name: '时光迟缓', description: '眩晕玩家', stun: true, weight: 1 },
    ],
  },
  dragonborn: {
    id: 'dragonborn',
    name: '龙裔',
    hp: 650,
    attack: 44,
    isBoss: false,
    skills: [
      { name: '龙息', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  eliteGuard: {
    id: 'eliteGuard',
    name: '精英卫兵',
    hp: 750,
    attack: 50,
    isBoss: false,
    skills: [
      { name: '盾击', description: '造成1.5倍伤害并眩晕', multiplier: 1.5, stun: true, weight: 1 },
    ],
  },

  // -----------------------------------------------------------------------
  // Bosses
  // -----------------------------------------------------------------------

  goblinKing: {
    id: 'goblinKing',
    name: '哥布林王',
    hp: 250,
    attack: 16,
    isBoss: true,
    skills: [
      {
      name: '王之号令',
      description: '召唤哥布林增援',
      summon: true,
    },
      { name: '王之怒吼', description: '提升100%攻击力1回合', enrage: true, enrageAttack: 16, weight: 1 },
    ],
  },
  deathKnight: {
    id: 'deathKnight',
    name: '死亡骑士',
    hp: 275,
    attack: 18,
    isBoss: true,
    skills: [
      {
      name: '死亡缠绕',
      description: '造成暗影伤害并吸血',
      heal: true,
    },
      { name: '暗影打击', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  archmage_boss: {
    id: 'archmage_boss',
    name: '大法师',
    hp: 300,
    attack: 20,
    isBoss: true,
    skills: [
      {
      name: '魔力风暴',
      description: '全体魔法攻击',
      aoe: true,
    },
      { name: '寒冰护盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  treantElder: {
    id: 'treantElder',
    name: '树精长老',
    hp: 325,
    attack: 22,
    isBoss: true,
    skills: [
      {
      name: '自然屏障',
      description: '为自己恢复生命值',
      heal: true,
    },
      { name: '缠绕根须', description: '造成1.5倍伤害并眩晕', multiplier: 1.5, stun: true, weight: 1 },
    ],
  },
  lavaGiant: {
    id: 'lavaGiant',
    name: '熔岩巨人',
    hp: 350,
    attack: 24,
    isBoss: true,
    skills: [
      {
      name: '熔岩爆发',
      description: '造成全体伤害并灼烧',
      aoe: true,
      poison: true,
    },
      { name: '熔岩护甲', description: '提升防御', shield: true, weight: 1 },
    ],
  },
  drowElf: {
    id: 'drowElf',
    name: '黑暗精灵',
    hp: 500,
    attack: 30,
    isBoss: true,
    skills: [
      {
      name: '暗影突袭',
      description: '造成2倍伤害',
      multiplier: 2,
    },
      { name: '暗影之幕', description: '眩晕玩家1回合', stun: true, weight: 1 },
    ],
  },
  wyvern: {
    id: 'wyvern',
    name: '双足飞龙',
    hp: 550,
    attack: 32,
    isBoss: true,
    skills: [
      {
      name: '毒液喷射',
      description: '造成伤害并使其中毒',
      poison: true,
    },
      { name: '龙尾扫击', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  lichKing: {
    id: 'lichKing',
    name: '巫妖王',
    hp: 600,
    attack: 36,
    isBoss: true,
    skills: [
      {
      name: '亡灵天灾',
      description: '召唤亡灵大军',
      summon: true,
    },
      { name: '灵魂收割', description: '造成1.5倍伤害并恢复生命', multiplier: 1.5, heal: true, weight: 1 },
    ],
  },
  stormGiant: {
    id: 'stormGiant',
    name: '风暴巨人',
    hp: 700,
    attack: 40,
    isBoss: true,
    skills: [
      {
      name: '雷霆之怒',
      description: '造成全体伤害并眩晕',
      aoe: true,
      stun: true,
    },
      { name: '风暴之盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  darkKnight: {
    id: 'darkKnight',
    name: '暗黑骑士',
    hp: 800,
    attack: 44,
    isBoss: true,
    skills: [
      {
      name: '黑暗护盾',
      description: '获得护盾减少伤害',
      shield: true,
    },
      { name: '暗影斩', description: '造成2倍伤害', multiplier: 2, weight: 1 },
    ],
  },
  abyssalLord: {
    id: 'abyssalLord',
    name: '深渊领主',
    hp: 900,
    attack: 50,
    isBoss: true,
    skills: [
      {
      name: '深渊凝视',
      description: '造成3倍伤害并使目标恐惧',
      multiplier: 3,
      stun: true,
    },
      { name: '深渊护盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  archangel: {
    id: 'archangel',
    name: '大天使',
    hp: 1000,
    attack: 56,
    isBoss: true,
    skills: [
      {
      name: '圣光审判',
      description: '全体攻击并恢复自身生命',
      aoe: true,
      heal: true,
    },
      { name: '天使之盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  timeKeeper: {
    id: 'timeKeeper',
    name: '时空守护者',
    hp: 1150,
    attack: 60,
    isBoss: true,
    skills: [
      {
      name: '时光倒流',
      description: '恢复大量生命值',
      heal: true,
      multiplier: 0.5,
    },
      { name: '时间裂缝', description: '造成1.5倍伤害并眩晕', multiplier: 1.5, stun: true, weight: 1 },
    ],
  },
  dracolich: {
    id: 'dracolich',
    name: '龙巫妖',
    hp: 1300,
    attack: 70,
    isBoss: true,
    skills: [
      {
      name: '龙息亡者',
      description: '造成毁灭性伤害并召唤骷髅',
      aoe: true,
      summon: true,
    },
      { name: '亡灵护盾', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
  ancientRed: {
    id: 'ancientRed',
    name: '远古红龙',
    hp: 2500,
    attack: 120,
    isBoss: true,
    skills: [
      {
      name: '灭世龙息',
      description: '全体5倍伤害',
      aoe: true,
      multiplier: 5,
    },
      { name: '龙鳞护体', description: '获得护盾', shield: true, weight: 1 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Chapter-to-monster mapping (chapters 1-15)
// ---------------------------------------------------------------------------

export const CHAPTER_MONSTERS: Record<number, { normal: string; boss: string }> = {
  1:  { normal: 'goblin',      boss: 'goblinKing' },
  2:  { normal: 'skeleton',    boss: 'deathKnight' },
  3:  { normal: 'apprentice',  boss: 'archmage_boss' },
  4:  { normal: 'shadowwolf',  boss: 'treantElder' },
  5:  { normal: 'gargoyle',    boss: 'lavaGiant' },
  6:  { normal: 'troglodyte',  boss: 'drowElf' },
  7:  { normal: 'harpy',       boss: 'wyvern' },
  8:  { normal: 'ghost',       boss: 'lichKing' },
  9:  { normal: 'ogre',        boss: 'stormGiant' },
  10: { normal: 'succubus',    boss: 'darkKnight' },
  11: { normal: 'demonhound',  boss: 'abyssalLord' },
  12: { normal: 'fallenAngel', boss: 'archangel' },
  13: { normal: 'timeGhost',   boss: 'timeKeeper' },
  14: { normal: 'dragonborn',  boss: 'dracolich' },
  15: { normal: 'eliteGuard',  boss: 'ancientRed' },
};
