// ---------------------------------------------------------------------------
// Equipment definitions — 3 slot types (weapon/armor/accessory) × 3 tiers × 6 classes
// ---------------------------------------------------------------------------
import type { Equipment } from './types';

const EQUIPMENT_DATA: Equipment[] = [
  // =====================================================================
  // WEAPONS (primary attack stat)
  // =====================================================================
  // Warrior
  { id: 'warrior-weapon-t1', name: '铁剑', tier: 1, slot: 'weapon', cost: 50,  classId: 'warrior', attack: 1, defense: 0 },
  { id: 'warrior-weapon-t2', name: '钢刃大剑', tier: 2, slot: 'weapon', cost: 200, classId: 'warrior', attack: 2, defense: 0 },
  { id: 'warrior-weapon-t3', name: '龙牙巨剑', tier: 3, slot: 'weapon', cost: 500, classId: 'warrior', attack: 3, defense: 0 },
  // Mage
  { id: 'mage-weapon-t1', name: '木质法杖', tier: 1, slot: 'weapon', cost: 50,  classId: 'mage', attack: 1, defense: 0 },
  { id: 'mage-weapon-t2', name: '水晶法杖', tier: 2, slot: 'weapon', cost: 200, classId: 'mage', attack: 2, defense: 0 },
  { id: 'mage-weapon-t3', name: '星辰魔杖', tier: 3, slot: 'weapon', cost: 500, classId: 'mage', attack: 3, defense: 0 },
  // Ranger
  { id: 'ranger-weapon-t1', name: '短弓', tier: 1, slot: 'weapon', cost: 50,  classId: 'ranger', attack: 1, defense: 0 },
  { id: 'ranger-weapon-t2', name: '长弓', tier: 2, slot: 'weapon', cost: 200, classId: 'ranger', attack: 2, defense: 0 },
  { id: 'ranger-weapon-t3', name: '精灵之弓', tier: 3, slot: 'weapon', cost: 500, classId: 'ranger', attack: 3, defense: 0 },
  // Paladin
  { id: 'paladin-weapon-t1', name: '木盾', tier: 1, slot: 'weapon', cost: 50,  classId: 'paladin', attack: 1, defense: 0 },
  { id: 'paladin-weapon-t2', name: '钢盾', tier: 2, slot: 'weapon', cost: 200, classId: 'paladin', attack: 2, defense: 0 },
  { id: 'paladin-weapon-t3', name: '圣光之盾', tier: 3, slot: 'weapon', cost: 500, classId: 'paladin', attack: 3, defense: 1 },
  // Rogue
  { id: 'rogue-weapon-t1', name: '匕首', tier: 1, slot: 'weapon', cost: 50,  classId: 'rogue', attack: 2, defense: 0 },
  { id: 'rogue-weapon-t2', name: '淬毒匕首', tier: 2, slot: 'weapon', cost: 200, classId: 'rogue', attack: 3, defense: 0 },
  { id: 'rogue-weapon-t3', name: '暗影之刃', tier: 3, slot: 'weapon', cost: 500, classId: 'rogue', attack: 4, defense: 0 },
  // Druid
  { id: 'druid-weapon-t1', name: '藤蔓鞭', tier: 1, slot: 'weapon', cost: 50,  classId: 'druid', attack: 1, defense: 0 },
  { id: 'druid-weapon-t2', name: '荆棘法杖', tier: 2, slot: 'weapon', cost: 200, classId: 'druid', attack: 2, defense: 0 },
  { id: 'druid-weapon-t3', name: '自然之杖', tier: 3, slot: 'weapon', cost: 500, classId: 'druid', attack: 3, defense: 0 },

  // =====================================================================
  // ARMORS (primary defense stat)
  // =====================================================================
  // Warrior
  { id: 'warrior-armor-t1', name: '皮甲', tier: 1, slot: 'armor', cost: 50,  classId: 'warrior', attack: 0, defense: 1 },
  { id: 'warrior-armor-t2', name: '锁子甲', tier: 2, slot: 'armor', cost: 200, classId: 'warrior', attack: 0, defense: 2 },
  { id: 'warrior-armor-t3', name: '板甲', tier: 3, slot: 'armor', cost: 500, classId: 'warrior', attack: 0, defense: 3 },
  // Mage
  { id: 'mage-armor-t1', name: '布袍', tier: 1, slot: 'armor', cost: 50,  classId: 'mage', attack: 0, defense: 1 },
  { id: 'mage-armor-t2', name: '符文袍', tier: 2, slot: 'armor', cost: 200, classId: 'mage', attack: 1, defense: 1 },
  { id: 'mage-armor-t3', name: '大法师袍', tier: 3, slot: 'armor', cost: 500, classId: 'mage', attack: 1, defense: 2 },
  // Ranger
  { id: 'ranger-armor-t1', name: '轻甲', tier: 1, slot: 'armor', cost: 50,  classId: 'ranger', attack: 0, defense: 1 },
  { id: 'ranger-armor-t2', name: '狩猎甲', tier: 2, slot: 'armor', cost: 200, classId: 'ranger', attack: 0, defense: 2 },
  { id: 'ranger-armor-t3', name: '龙皮甲', tier: 3, slot: 'armor', cost: 500, classId: 'ranger', attack: 1, defense: 2 },
  // Paladin
  { id: 'paladin-armor-t1', name: '铁甲', tier: 1, slot: 'armor', cost: 50,  classId: 'paladin', attack: 0, defense: 2 },
  { id: 'paladin-armor-t2', name: '精钢甲', tier: 2, slot: 'armor', cost: 200, classId: 'paladin', attack: 0, defense: 3 },
  { id: 'paladin-armor-t3', name: '神圣铠甲', tier: 3, slot: 'armor', cost: 500, classId: 'paladin', attack: 1, defense: 4 },
  // Rogue
  { id: 'rogue-armor-t1', name: '夜行衣', tier: 1, slot: 'armor', cost: 50,  classId: 'rogue', attack: 0, defense: 1 },
  { id: 'rogue-armor-t2', name: '影甲', tier: 2, slot: 'armor', cost: 200, classId: 'rogue', attack: 1, defense: 1 },
  { id: 'rogue-armor-t3', name: '暗影斗篷', tier: 3, slot: 'armor', cost: 500, classId: 'rogue', attack: 1, defense: 2 },
  // Druid
  { id: 'druid-armor-t1', name: '树皮甲', tier: 1, slot: 'armor', cost: 50,  classId: 'druid', attack: 0, defense: 1 },
  { id: 'druid-armor-t2', name: '藤甲', tier: 2, slot: 'armor', cost: 200, classId: 'druid', attack: 0, defense: 2 },
  { id: 'druid-armor-t3', name: '自然之铠', tier: 3, slot: 'armor', cost: 500, classId: 'druid', attack: 1, defense: 3 },

  // =====================================================================
  // ACCESSORIES (balanced stats, shared across classes)
  // =====================================================================
  { id: 'accessory-t1', name: '铜戒指', tier: 1, slot: 'accessory', cost: 50,  classId: 'warrior', attack: 1, defense: 1 },
  { id: 'accessory-t2', name: '银戒指', tier: 2, slot: 'accessory', cost: 200, classId: 'warrior', attack: 2, defense: 2 },
  { id: 'accessory-t3', name: '金戒指', tier: 3, slot: 'accessory', cost: 500, classId: 'warrior', attack: 3, defense: 3 },
];

export const EQUIPMENT = EQUIPMENT_DATA;
