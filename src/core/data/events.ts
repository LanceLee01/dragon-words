// ---------------------------------------------------------------------------
// Event Data Layer — types + default event pool
// ---------------------------------------------------------------------------
import type { TriggerPoint } from './types';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface EventReward {
  type: 'gold' | 'xp' | 'shield' | 'item' | 'cosmetic';
  id?: string;
  amount: number;
  weight?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  icon?: string;
  cost?: { type: 'gold' | 'hp' | 'shield' | 'item'; amount: number; itemId?: string }[];
  outcome: 'success' | 'fail' | 'random';
  successRate?: number;
  successRewards?: EventReward[];
  failPenalty?: EventReward[];
  nextEventId?: string;
  setFlag?: string;
  /** If set, triggers a special action instead of just resolving rewards */
  action?: 'battle';
  /** Parameters for the action (e.g. battle chapter/level) */
  actionPayload?: { chapter: number; level: number; monsterId?: string };
}

export interface RandomEvent {
  id: string;
  weight: number;
  category: 'merchant' | 'puzzle' | 'elite' | 'chest' | 'lore';
  minChapter?: number;
  maxChapter?: number;
  cooldownDays?: number;
  oncePerRun?: boolean;
  requirements?: {
    minLevel?: number;
    hasItem?: string;
    flag?: string;
  };
  triggerPoints?: TriggerPoint[];
  title: string;
  description: string;
  illustration: string;
  choices: EventChoice[];
  rewards: EventReward[];
  internalState?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Default event pool (5 categories, multiple variations)
// ---------------------------------------------------------------------------

export const EVENT_POOL: RandomEvent[] = [
  // ── Merchant (流浪商人) ──────────────────────────────────────────────
  {
    id: 'merchant_armor',
    weight: 30,
    category: 'merchant',
    minChapter: 1,
    cooldownDays: 1,
    triggerPoints: ['boss_victory', 'daily_login'],
    title: '流浪商人 — 盔甲商',
    description:
      '一位身披斗篷的商人推着满载盔甲的手推车缓缓走来。他掀开布帘，露出闪闪发光的护甲。「冒险者，这些可都是上等货色。怎么样，有兴趣吗？」',
    illustration: 'merchant_armor',
    choices: [
      {
        id: 'buy_leather',
        text: '购买皮甲（50金）',
        icon: '🛒',
        cost: [{ type: 'gold', amount: 50 }],
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 20 }],
      },
      {
        id: 'buy_chainmail',
        text: '购买锁子甲（120金）',
        icon: '🛒',
        cost: [{ type: 'gold', amount: 120 }],
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 50 }],
      },
      {
        id: 'decline',
        text: '暂时不需要',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },
  {
    id: 'merchant_potion',
    weight: 30,
    category: 'merchant',
    minChapter: 1,
    cooldownDays: 1,
    triggerPoints: ['boss_victory', 'daily_login'],
    title: '流浪商人 — 藥水商',
    description:
      '一股草药味扑鼻而来。一个满头白发的老者坐在路边，面前摆满了各式各样的瓶瓶罐罐。「年轻人啊，我看你气色不太好，来瓶回血药水吧？包你精神百倍！」',
    illustration: 'merchant_potion',
    choices: [
      {
        id: 'buy_hp_potion',
        text: '购买回血药水（30金）',
        icon: '🧪',
        cost: [{ type: 'gold', amount: 30 }],
        outcome: 'success',
        successRewards: [{ type: 'gold', amount: -30 }, { type: 'xp', amount: 5 }],
      },
      {
        id: 'buy_elixir',
        text: '购买精力药剂（80金）',
        icon: '⚗️',
        cost: [{ type: 'gold', amount: 80 }],
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 30 }],
      },
      {
        id: 'decline',
        text: '婉拒',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },
  {
    id: 'merchant_map',
    weight: 25,
    category: 'merchant',
    minChapter: 3,
    cooldownDays: 2,
    triggerPoints: ['boss_victory'],
    title: '流浪商人 — 地图商',
    description:
      '一名遮住半边脸的商人神秘地招手。「嘿，我这里有一张藏宝图，据说标记了某个古老遗迹的位置。有兴趣的话……价格好商量。」',
    illustration: 'merchant_map',
    choices: [
      {
        id: 'buy_map',
        text: '购买藏宝图（100金）',
        icon: '🗺️',
        cost: [{ type: 'gold', amount: 100 }],
        outcome: 'random',
        successRate: 0.6,
        successRewards: [{ type: 'gold', amount: 200 }, { type: 'xp', amount: 40 }],
        failPenalty: [{ type: 'gold', amount: -100 }],
      },
      {
        id: 'refuse',
        text: '觉得是骗局，离开',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },

  // ── Puzzle (古老谜题) ────────────────────────────────────────────────
  {
    id: 'puzzle_rune',
    weight: 20,
    category: 'puzzle',
    minChapter: 2,
    cooldownDays: 3,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'chapter_first_clear'],
    title: '古老谜题 — 符文石',
    description:
      '一块巨大的符文石挡住了去路。石面上刻满了发光的古代文字，似乎在考验过路者的智慧。符文缓缓流转，等待着你的答案。',
    illustration: 'puzzle_rune',
    choices: [
      {
        id: 'solve',
        text: '尝试解读符文（智力考验）',
        icon: '🧠',
        outcome: 'random',
        successRate: 0.5,
        successRewards: [
          { type: 'xp', amount: 80 },
          { type: 'item', id: 'rune_key', amount: 1 },
        ],
        failPenalty: [{ type: 'hp', amount: 15 }],
      },
      {
        id: 'force',
        text: '强行破坏符文',
        icon: '⚡',
        outcome: 'random',
        successRate: 0.3,
        successRewards: [{ type: 'xp', amount: 30 }],
        failPenalty: [{ type: 'hp', amount: 30 }],
      },
      {
        id: 'bypass',
        text: '绕路而行',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },
  {
    id: 'puzzle_riddle',
    weight: 18,
    category: 'puzzle',
    minChapter: 4,
    cooldownDays: 4,
    oncePerRun: true,
    triggerPoints: ['boss_victory'],
    title: '古老谜题 — 守门人的问题',
    description:
      '一道巨大的铁门前，一个由光影构成的守门人浮现。「回答我的问题，或者……承受后果。」他用空洞的声音说道。',
    illustration: 'puzzle_riddle',
    choices: [
      {
        id: 'answer',
        text: '回答谜题',
        icon: '💬',
        outcome: 'random',
        successRate: 0.4,
        successRewards: [
          { type: 'xp', amount: 100 },
          { type: 'gold', amount: 80 },
        ],
        failPenalty: [{ type: 'hp', amount: 25 }, { type: 'shield', amount: -10 }],
      },
      {
        id: 'bribe',
        text: '贿赂守门人（60金）',
        icon: '💰',
        cost: [{ type: 'gold', amount: 60 }],
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 40 }],
      },
    ],
    rewards: [],
  },

  // ── Elite (精英怪挑战) ──────────────────────────────────────────────
  {
    id: 'elite_wolf',
    weight: 25,
    category: 'elite',
    minChapter: 1,
    cooldownDays: 2,
    triggerPoints: ['boss_victory', 'chapter_first_clear'],
    title: '精英怪 — 巨狼首领',
    description:
      '草丛中传来低沉的咆哮。一头比同类大两倍的巨狼缓缓步出，眼中闪烁着红光。它的牙齿上还挂着上一个挑战者的布条。',
    illustration: 'elite_wolf',
    choices: [
      {
        id: 'fight',
        text: '迎战巨狼',
        icon: '⚔️',
        outcome: 'success',
        action: 'battle',
        actionPayload: { chapter: 1, level: 1, monsterId: 'wolf_elite' },
        successRewards: [
          { type: 'xp', amount: 120 },
          { type: 'gold', amount: 60 },
          { type: 'item', id: 'wolf_fang', amount: 1 },
        ],
      },
      {
        id: 'sneak',
        text: '悄悄绕过',
        icon: '👤',
        outcome: 'random',
        successRate: 0.7,
        successRewards: [],
        failPenalty: [{ type: 'hp', amount: 20 }],
      },
    ],
    rewards: [],
  },
  {
    id: 'elite_golem',
    weight: 20,
    category: 'elite',
    minChapter: 5,
    cooldownDays: 3,
    triggerPoints: ['boss_victory'],
    title: '精英怪 — 石像鬼守卫',
    description:
      '一座古老的石像鬼突然从雕像底座上活了过来！它伸展着石化翅膀，发出刺耳的尖叫声，震得地面都在颤抖。',
    illustration: 'elite_golem',
    choices: [
      {
        id: 'fight',
        text: '与石像鬼战斗',
        icon: '⚔️',
        outcome: 'random',
        successRate: 0.45,
        successRewards: [
          { type: 'xp', amount: 150 },
          { type: 'gold', amount: 90 },
          { type: 'shield', amount: 30 },
        ],
        failPenalty: [{ type: 'hp', amount: 50 }],
      },
      {
        id: 'parley',
        text: '尝试交涉',
        icon: '💬',
        outcome: 'random',
        successRate: 0.3,
        successRewards: [{ type: 'xp', amount: 40 }],
        failPenalty: [{ type: 'hp', amount: 30 }],
      },
    ],
    rewards: [],
  },

  // ── Chest (神秘宝箱) ────────────────────────────────────────────────
  {
    id: 'chest_wooden',
    weight: 35,
    category: 'chest',
    minChapter: 1,
    cooldownDays: 1,
    triggerPoints: ['boss_victory', 'daily_login'],
    title: '神秘宝箱 — 木箱',
    description:
      '一个朴素的木箱出现在路中央，没有上锁，却散发着淡淡的魔法气息。里面可能装着有用的物资……也可能什么都没有。',
    illustration: 'chest_wooden',
    choices: [
      {
        id: 'open',
        text: '打开宝箱',
        icon: '📦',
        outcome: 'random',
        successRate: 0.7,
        successRewards: [
          { type: 'gold', amount: 40 },
          { type: 'xp', amount: 15 },
        ],
        failPenalty: [{ type: 'hp', amount: 10 }],
      },
      {
        id: 'leave',
        text: '无视宝箱',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },
  {
    id: 'chest_golden',
    weight: 15,
    category: 'chest',
    minChapter: 4,
    cooldownDays: 4,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'chapter_first_clear'],
    title: '神秘宝箱 — 黄金宝箱',
    description:
      '一个华丽的黄金宝箱镶嵌着各种宝石，静静地放在祭坛上。周围刻着警告符文：『贪婪者，慎之。』',
    illustration: 'chest_golden',
    choices: [
      {
        id: 'open',
        text: '打开黄金宝箱',
        icon: '📦',
        outcome: 'random',
        successRate: 0.35,
        successRewards: [
          { type: 'gold', amount: 300 },
          { type: 'xp', amount: 100 },
          { type: 'item', id: 'golden_key', amount: 1 },
        ],
        failPenalty: [
          { type: 'hp', amount: 60 },
          { type: 'gold', amount: -100 },
        ],
      },
      {
        id: 'examine',
        text: '仔细检查符文',
        icon: '🔍',
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 30 }],
      },
    ],
    rewards: [],
  },

  // ── Lore (剧情片段) ─────────────────────────────────────────────────
  {
    id: 'lore_ancient_shrine',
    weight: 20,
    category: 'lore',
    minChapter: 2,
    cooldownDays: 3,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'chapter_first_clear', 'achievement'],
    title: '剧情 — 远古神庙',
    description:
      '在密林深处，你发现了一座被藤蔓覆盖的远古神庙。石门上刻着一段铭文：「语言是万物的钥匙，掌握语言者掌握世界。」',
    illustration: 'lore_ancient_shrine',
    choices: [
      {
        id: 'enter',
        text: '进入神庙探索',
        icon: '🚪',
        outcome: 'random',
        successRate: 0.6,
        successRewards: [
          { type: 'xp', amount: 60 },
          { type: 'item', id: 'ancient_tablet', amount: 1 },
        ],
        failPenalty: [{ type: 'hp', amount: 15 }],
      },
      {
        id: 'pray',
        text: '在门前祈祷',
        icon: '🙏',
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 15 }],
      },
      {
        id: 'record',
        text: '记录铭文後离开',
        icon: '📝',
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 20 }],
      },
    ],
    rewards: [],
  },
  {
    id: 'lore_wanderer',
    weight: 18,
    category: 'lore',
    minChapter: 3,
    cooldownDays: 4,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'achievement', 'daily_login'],
    title: '剧情 — 流浪诗人',
    description:
      '一个背着竖琴的诗人坐在路边的火堆旁。他微笑着向你招手：「来，坐下来听我说个故事吧。这是关于一个勇敢的语言学者的传说……」',
    illustration: 'lore_wanderer',
    choices: [
      {
        id: 'listen',
        text: '坐下来听故事',
        icon: '🎵',
        outcome: 'success',
        successRewards: [
          { type: 'xp', amount: 50 },
          { type: 'cosmetic', id: 'poem_scroll', amount: 1 },
        ],
      },
      {
        id: 'donate',
        text: '捐赠金币支持诗人（20金）',
        icon: '🪙',
        cost: [{ type: 'gold', amount: 20 }],
        outcome: 'success',
        successRewards: [
          { type: 'xp', amount: 80 },
          { type: 'shield', amount: 10 },
        ],
      },
    ],
    rewards: [],
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function getEventsByTrigger(point: TriggerPoint): RandomEvent[] {
  return EVENT_POOL.filter(e => e.triggerPoints?.includes(point));
}
