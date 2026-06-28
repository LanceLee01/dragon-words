// ---------------------------------------------------------------------------
// Equipment definitions — 18 items (3 tiers × 6 classes)
// ---------------------------------------------------------------------------
import type { Equipment } from './types';

/**
 * 18 equipment items: 3 tiers per class.
 *
 * Tier 1: cost 100,  attack +3,  defense 0-2
 * Tier 2: cost 500,  attack +7,  defense 1-5
 * Tier 3: cost 1500, attack 10-18, defense 2-20
 *
 * Paladin shields are defense-focused; rogue daggers are attack-focused.
 */
export const EQUIPMENT: Equipment[] = [
  // ---- Warrior ----
  {
    id: 'warrior-tier1',
    name: '铁剑',
    tier: 1,
    cost: 100,
    classId: 'warrior',
    attack: 3,
    defense: 0,
  },
  {
    id: 'warrior-tier2',
    name: '钢刃大剑',
    tier: 2,
    cost: 500,
    classId: 'warrior',
    attack: 7,
    defense: 2,
  },
  {
    id: 'warrior-tier3',
    name: '龙牙巨剑',
    tier: 3,
    cost: 1500,
    classId: 'warrior',
    attack: 15,
    defense: 5,
  },

  // ---- Mage ----
  {
    id: 'mage-tier1',
    name: '木质法杖',
    tier: 1,
    cost: 100,
    classId: 'mage',
    attack: 3,
    defense: 0,
  },
  {
    id: 'mage-tier2',
    name: '水晶法杖',
    tier: 2,
    cost: 500,
    classId: 'mage',
    attack: 7,
    defense: 1,
  },
  {
    id: 'mage-tier3',
    name: '星辰魔杖',
    tier: 3,
    cost: 1500,
    classId: 'mage',
    attack: 14,
    defense: 3,
  },

  // ---- Ranger ----
  {
    id: 'ranger-tier1',
    name: '短弓',
    tier: 1,
    cost: 100,
    classId: 'ranger',
    attack: 3,
    defense: 0,
  },
  {
    id: 'ranger-tier2',
    name: '长弓',
    tier: 2,
    cost: 500,
    classId: 'ranger',
    attack: 7,
    defense: 1,
  },
  {
    id: 'ranger-tier3',
    name: '精灵之弓',
    tier: 3,
    cost: 1500,
    classId: 'ranger',
    attack: 16,
    defense: 4,
  },

  // ---- Paladin (defense-focused shields) ----
  {
    id: 'paladin-tier1',
    name: '木盾',
    tier: 1,
    cost: 100,
    classId: 'paladin',
    attack: 3,
    defense: 2,
  },
  {
    id: 'paladin-tier2',
    name: '钢盾',
    tier: 2,
    cost: 500,
    classId: 'paladin',
    attack: 7,
    defense: 5,
  },
  {
    id: 'paladin-tier3',
    name: '圣光之盾',
    tier: 3,
    cost: 1500,
    classId: 'paladin',
    attack: 10,
    defense: 20,
  },

  // ---- Rogue (attack-focused daggers) ----
  {
    id: 'rogue-tier1',
    name: '匕首',
    tier: 1,
    cost: 100,
    classId: 'rogue',
    attack: 3,
    defense: 0,
  },
  {
    id: 'rogue-tier2',
    name: '淬毒匕首',
    tier: 2,
    cost: 500,
    classId: 'rogue',
    attack: 7,
    defense: 1,
  },
  {
    id: 'rogue-tier3',
    name: '暗影之刃',
    tier: 3,
    cost: 1500,
    classId: 'rogue',
    attack: 18,
    defense: 2,
  },

  // ---- Druid ----
  {
    id: 'druid-tier1',
    name: '藤蔓鞭',
    tier: 1,
    cost: 100,
    classId: 'druid',
    attack: 3,
    defense: 0,
  },
  {
    id: 'druid-tier2',
    name: '荆棘法杖',
    tier: 2,
    cost: 500,
    classId: 'druid',
    attack: 7,
    defense: 3,
  },
  {
    id: 'druid-tier3',
    name: '自然之杖',
    tier: 3,
    cost: 1500,
    classId: 'druid',
    attack: 12,
    defense: 8,
  },
];
