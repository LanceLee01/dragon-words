// ---------------------------------------------------------------------------
// Affix data types and 4-tier affix pools for the equipment affix system
// ---------------------------------------------------------------------------

export interface Affix {
  id: string;
  category: 'offense' | 'defense' | 'utility' | 'legendary';
  tier: 1 | 2 | 3 | 4;
  stat: string;  // matches BattleStats keys
  value: { type: 'flat' | 'pct' | 'formula'; min: number; max: number; base?: number; perTier?: number };
  display: {
    name: string;
    description: string;
    icon: string;
    color: string;
  };
  group?: string;
  tags?: string[];
}

export interface AffixInstance {
  id: string;
  stat: string;
  value: number;
  locked: boolean;
}

// =====================================================================
// Tier 1 (普通) — 6 affixes
// =====================================================================
const TIER_1: Affix[] = [
  {
    id: 'shrewd',
    category: 'offense',
    tier: 1,
    stat: 'critRate',
    value: { type: 'pct', min: 3, max: 5 },
    display: {
      name: '敏锐',
      description: '暴击率 +3-5%',
      icon: 'crosshair',
      color: '#9d9d9d',
    },
    tags: ['crit', 'common'],
  },
  {
    id: 'solid',
    category: 'defense',
    tier: 1,
    stat: 'dmgReduction',
    value: { type: 'flat', min: 2, max: 4 },
    display: {
      name: '坚固',
      description: '防御 +2-4',
      icon: 'shield',
      color: '#9d9d9d',
    },
    tags: ['defense', 'common'],
  },
  {
    id: 'vitality',
    category: 'defense',
    tier: 1,
    stat: 'maxHp',
    value: { type: 'flat', min: 10, max: 20 },
    display: {
      name: '活力',
      description: 'HP +10-20',
      icon: 'heart',
      color: '#9d9d9d',
    },
    tags: ['hp', 'common'],
  },
  {
    id: 'luck',
    category: 'utility',
    tier: 1,
    stat: 'goldBonus',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '幸运',
      description: '金币 +5-10%',
      icon: 'coins',
      color: '#9d9d9d',
    },
    tags: ['gold', 'common'],
  },
  {
    id: 'sharp',
    category: 'offense',
    tier: 1,
    stat: 'armorPen',
    value: { type: 'flat', min: 1, max: 3 },
    display: {
      name: '尖锐',
      description: '攻击 +1-3',
      icon: 'sword',
      color: '#9d9d9d',
    },
    tags: ['attack', 'common'],
  },
  {
    id: 'light',
    category: 'utility',
    tier: 1,
    stat: 'comboDecayReduction',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '轻灵',
      description: '连击衰减 -5-10%',
      icon: 'feather',
      color: '#9d9d9d',
    },
    tags: ['combo', 'common'],
  },
];

// =====================================================================
// Tier 2 (稀有) — 8 affixes
// =====================================================================
const TIER_2: Affix[] = [
  {
    id: 'sharp-edge',
    category: 'offense',
    tier: 2,
    stat: 'critDmg',
    value: { type: 'pct', min: 10, max: 20 },
    display: {
      name: '锋利',
      description: '暴击伤害 +10-20%',
      icon: 'lightning',
      color: '#4a90d9',
    },
    tags: ['crit', 'rare'],
  },
  {
    id: 'iron-wall',
    category: 'defense',
    tier: 2,
    stat: 'dmgReduction',
    value: { type: 'pct', min: 3, max: 5 },
    display: {
      name: '铁壁',
      description: '伤害减免 +3-5%',
      icon: 'wall',
      color: '#4a90d9',
    },
    tags: ['defense', 'rare'],
  },
  {
    id: 'regen',
    category: 'defense',
    tier: 2,
    stat: 'hpRegen',
    value: { type: 'flat', min: 2, max: 5 },
    display: {
      name: '再生',
      description: '每回合HP +2-5',
      icon: 'heal',
      color: '#4a90d9',
    },
    tags: ['hp', 'regen', 'rare'],
  },
  {
    id: 'focus',
    category: 'utility',
    tier: 2,
    stat: 'skillChargeSpeed',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '聚能',
      description: '技能充能 +5-10%',
      icon: 'zap',
      color: '#4a90d9',
    },
    tags: ['skill', 'rare'],
  },
  {
    id: 'armor-break',
    category: 'offense',
    tier: 2,
    stat: 'armorPen',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '破甲',
      description: '穿透 +5-10%',
      icon: 'broken-shield',
      color: '#4a90d9',
    },
    tags: ['penetration', 'rare'],
  },
  {
    id: 'resistance',
    category: 'defense',
    tier: 2,
    stat: 'statusResist',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '抗性',
      description: '状态抗性 +5-10%',
      icon: 'shield',
      color: '#4a90d9',
    },
    tags: ['resist', 'rare'],
  },
  {
    id: 'wisdom',
    category: 'utility',
    tier: 2,
    stat: 'xpBonus',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '智慧',
      description: '经验 +5-10%',
      icon: 'book',
      color: '#4a90d9',
    },
    tags: ['xp', 'rare'],
  },
  {
    id: 'swift',
    category: 'utility',
    tier: 2,
    stat: 'timeBonus',
    value: { type: 'flat', min: 1, max: 2 },
    display: {
      name: '迅捷',
      description: '答题时间 +1-2s',
      icon: 'clock',
      color: '#4a90d9',
    },
    tags: ['time', 'rare'],
  },
];

// =====================================================================
// Tier 3 (史诗) — 6 affixes
// =====================================================================
const TIER_3: Affix[] = [
  {
    id: 'elemental-power',
    category: 'offense',
    tier: 3,
    stat: 'elementalDmg',
    value: { type: 'pct', min: 10, max: 20 },
    display: {
      name: '元素之力',
      description: '元素伤害 +10-20%',
      icon: 'flame',
      color: '#a855f7',
    },
    tags: ['elemental', 'epic'],
  },
  {
    id: 'thorns',
    category: 'defense',
    tier: 3,
    stat: 'thorns',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '荆棘',
      description: '反伤 +5-10%',
      icon: 'thorns',
      color: '#a855f7',
    },
    tags: ['reflect', 'epic'],
  },
  {
    id: 'shield-master',
    category: 'defense',
    tier: 3,
    stat: 'shieldMax',
    value: { type: 'pct', min: 10, max: 20 },
    display: {
      name: '护盾大师',
      description: '护盾上限 +10-20%',
      icon: 'shield',
      color: '#a855f7',
    },
    tags: ['shield', 'epic'],
  },
  {
    id: 'precision',
    category: 'offense',
    tier: 3,
    stat: 'critRate',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '精确',
      description: '暴击率 +5-10%',
      icon: 'target',
      color: '#a855f7',
    },
    tags: ['crit', 'epic'],
  },
  {
    id: 'lifesteal',
    category: 'offense',
    tier: 3,
    stat: 'killHeal',
    value: { type: 'pct', min: 5, max: 10 },
    display: {
      name: '吸血',
      description: '击杀回血 +5-10%',
      icon: 'droplet',
      color: '#a855f7',
    },
    tags: ['heal', 'epic'],
  },
  {
    id: 'distractor-removal',
    category: 'utility',
    tier: 3,
    stat: 'autoRemoveDistractor',
    value: { type: 'flat', min: 1, max: 1 },
    display: {
      name: '干扰排除',
      description: '自动排除干扰项 +1',
      icon: 'eye',
      color: '#a855f7',
    },
    tags: ['utility', 'epic'],
  },
];

// =====================================================================
// Tier 4 (传说) — 4 affixes
// =====================================================================
const TIER_4: Affix[] = [
  {
    id: 'double-cast',
    category: 'legendary',
    tier: 4,
    stat: 'doubleCast',
    value: { type: 'flat', min: 1, max: 1 },
    display: {
      name: '双重施法',
      description: '双重施法',
      icon: 'copy',
      color: '#f59e0b',
    },
    tags: ['legendary', 'cast'],
  },
  {
    id: 'omni-resist',
    category: 'legendary',
    tier: 4,
    stat: 'omniResist',
    value: { type: 'pct', min: 10, max: 20 },
    display: {
      name: '全能抗性',
      description: '全能抗性 +10-20%',
      icon: 'star',
      color: '#f59e0b',
    },
    tags: ['legendary', 'resist'],
  },
  {
    id: 'infinite-combo',
    category: 'legendary',
    tier: 4,
    stat: 'infiniteCombo',
    value: { type: 'flat', min: 1, max: 1 },
    display: {
      name: '连击不衰',
      description: '连击不衰减',
      icon: 'infinity',
      color: '#f59e0b',
    },
    tags: ['legendary', 'combo'],
  },
  {
    id: 'cheat-death',
    category: 'legendary',
    tier: 4,
    stat: 'cheatDeath',
    value: { type: 'flat', min: 1, max: 1 },
    display: {
      name: '濒死不灭',
      description: '濒死不死',
      icon: 'skull',
      color: '#f59e0b',
    },
    tags: ['legendary', 'survival'],
  },
];

// =====================================================================
// Combined affix pools indexed by tier
// =====================================================================
export const AFFIX_POOLS: Record<number, Affix[]> = {
  1: TIER_1,
  2: TIER_2,
  3: TIER_3,
  4: TIER_4,
};

export const ALL_AFFIXES: Affix[] = [
  ...TIER_1,
  ...TIER_2,
  ...TIER_3,
  ...TIER_4,
];

// =====================================================================
// Helper functions
// =====================================================================

export function getAffixesByTier(tier: number): Affix[] {
  return AFFIX_POOLS[tier] ?? [];
}

export function getAffixesByCategory(category: string): Affix[] {
  return ALL_AFFIXES.filter(
    (a) => a.category === category || a.display.name === category,
  );
}

/**
 * Generate a random integer value within the affix's min-max range (inclusive).
 * For boolean-style affixes (min === max), returns that fixed value.
 */
export function rollAffixValue(affix: Affix): number {
  const { min, max, base, perTier } = affix.value;

  if (min === max) {
    return min;
  }

  const range = max - min + 1;
  const rolled = Math.floor(Math.random() * range) + min;

  // If the affix uses a formula (e.g. base + perTier * tier), apply it
  if (affix.value.type === 'formula' && base !== undefined && perTier !== undefined) {
    return base + perTier * affix.tier;
  }

  return rolled;
}
