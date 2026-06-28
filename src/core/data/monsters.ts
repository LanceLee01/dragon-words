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
    hp: 40,
    attack: 6,
    isBoss: false,
  },
  skeleton: {
    id: 'skeleton',
    name: '骷髅兵',
    hp: 45,
    attack: 7,
    isBoss: false,
  },
  apprentice: {
    id: 'apprentice',
    name: '学徒法师',
    hp: 50,
    attack: 8,
    isBoss: false,
  },
  shadowwolf: {
    id: 'shadowwolf',
    name: '影狼',
    hp: 55,
    attack: 8,
    isBoss: false,
  },
  gargoyle: {
    id: 'gargoyle',
    name: '石像鬼',
    hp: 55,
    attack: 8,
    isBoss: false,
  },
  troglodyte: {
    id: 'troglodyte',
    name: '穴居人',
    hp: 75,
    attack: 12,
    isBoss: false,
  },
  harpy: {
    id: 'harpy',
    name: '鹰身女妖',
    hp: 80,
    attack: 13,
    isBoss: false,
  },
  ghost: {
    id: 'ghost',
    name: '幽灵',
    hp: 85,
    attack: 14,
    isBoss: false,
  },
  ogre: {
    id: 'ogre',
    name: '食人魔',
    hp: 90,
    attack: 15,
    isBoss: false,
  },
  succubus: {
    id: 'succubus',
    name: '魅魔',
    hp: 95,
    attack: 16,
    isBoss: false,
  },
  demonhound: {
    id: 'demonhound',
    name: '地狱猎犬',
    hp: 100,
    attack: 17,
    isBoss: false,
  },
  fallenAngel: {
    id: 'fallenAngel',
    name: '堕天使',
    hp: 110,
    attack: 18,
    isBoss: false,
  },
  timeGhost: {
    id: 'timeGhost',
    name: '时光幽灵',
    hp: 120,
    attack: 20,
    isBoss: false,
  },
  dragonborn: {
    id: 'dragonborn',
    name: '龙裔',
    hp: 130,
    attack: 22,
    isBoss: false,
  },
  eliteGuard: {
    id: 'eliteGuard',
    name: '精英卫兵',
    hp: 150,
    attack: 25,
    isBoss: false,
  },

  // -----------------------------------------------------------------------
  // Bosses
  // -----------------------------------------------------------------------

  goblinKing: {
    id: 'goblinKing',
    name: '哥布林王',
    hp: 50,
    attack: 8,
    isBoss: true,
    bossSkill: {
      name: '王之号令',
      description: '召唤哥布林增援',
      summon: true,
    },
  },
  deathKnight: {
    id: 'deathKnight',
    name: '死亡骑士',
    hp: 55,
    attack: 9,
    isBoss: true,
    bossSkill: {
      name: '死亡缠绕',
      description: '造成暗影伤害并吸血',
      heal: true,
    },
  },
  archmage_boss: {
    id: 'archmage_boss',
    name: '大法师',
    hp: 60,
    attack: 10,
    isBoss: true,
    bossSkill: {
      name: '魔力风暴',
      description: '全体魔法攻击',
      aoe: true,
    },
  },
  treantElder: {
    id: 'treantElder',
    name: '树精长老',
    hp: 65,
    attack: 11,
    isBoss: true,
    bossSkill: {
      name: '自然屏障',
      description: '为自己恢复生命值',
      heal: true,
    },
  },
  lavaGiant: {
    id: 'lavaGiant',
    name: '熔岩巨人',
    hp: 70,
    attack: 12,
    isBoss: true,
    bossSkill: {
      name: '熔岩爆发',
      description: '造成全体伤害并灼烧',
      aoe: true,
      poison: true,
    },
  },
  drowElf: {
    id: 'drowElf',
    name: '黑暗精灵',
    hp: 100,
    attack: 15,
    isBoss: true,
    bossSkill: {
      name: '暗影突袭',
      description: '造成2倍伤害',
      multiplier: 2,
    },
  },
  wyvern: {
    id: 'wyvern',
    name: '双足飞龙',
    hp: 110,
    attack: 16,
    isBoss: true,
    bossSkill: {
      name: '毒液喷射',
      description: '造成伤害并使其中毒',
      poison: true,
    },
  },
  lichKing: {
    id: 'lichKing',
    name: '巫妖王',
    hp: 120,
    attack: 18,
    isBoss: true,
    bossSkill: {
      name: '亡灵天灾',
      description: '召唤亡灵大军',
      summon: true,
    },
  },
  stormGiant: {
    id: 'stormGiant',
    name: '风暴巨人',
    hp: 140,
    attack: 20,
    isBoss: true,
    bossSkill: {
      name: '雷霆之怒',
      description: '造成全体伤害并眩晕',
      aoe: true,
      stun: true,
    },
  },
  darkKnight: {
    id: 'darkKnight',
    name: '暗黑骑士',
    hp: 160,
    attack: 22,
    isBoss: true,
    bossSkill: {
      name: '黑暗护盾',
      description: '获得护盾减少伤害',
      shield: true,
    },
  },
  abyssalLord: {
    id: 'abyssalLord',
    name: '深渊领主',
    hp: 180,
    attack: 25,
    isBoss: true,
    bossSkill: {
      name: '深渊凝视',
      description: '造成3倍伤害并使目标恐惧',
      multiplier: 3,
      stun: true,
    },
  },
  archangel: {
    id: 'archangel',
    name: '大天使',
    hp: 200,
    attack: 28,
    isBoss: true,
    bossSkill: {
      name: '圣光审判',
      description: '全体攻击并恢复自身生命',
      aoe: true,
      heal: true,
    },
  },
  timeKeeper: {
    id: 'timeKeeper',
    name: '时空守护者',
    hp: 230,
    attack: 30,
    isBoss: true,
    bossSkill: {
      name: '时光倒流',
      description: '恢复大量生命值',
      heal: true,
      multiplier: 0.5,
    },
  },
  dracolich: {
    id: 'dracolich',
    name: '龙巫妖',
    hp: 260,
    attack: 35,
    isBoss: true,
    bossSkill: {
      name: '龙息亡者',
      description: '造成毁灭性伤害并召唤骷髅',
      aoe: true,
      summon: true,
    },
  },
  ancientRed: {
    id: 'ancientRed',
    name: '远古红龙',
    hp: 500,
    attack: 60,
    isBoss: true,
    bossSkill: {
      name: '灭世龙息',
      description: '全体5倍伤害',
      aoe: true,
      multiplier: 5,
    },
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
