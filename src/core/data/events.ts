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
  actionPayload?: { chapter: number; level: number };
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
      '一位身披斗篷的商人推著滿載盔甲的手推車緩緩走來。他掀開布簾，露出閃閃發光的護甲。「冒險者，這些可都是上等貨色。怎麼樣，有興趣嗎？」',
    illustration: 'merchant_armor',
    choices: [
      {
        id: 'buy_leather',
        text: '購買皮甲（50金）',
        icon: '🛒',
        cost: [{ type: 'gold', amount: 50 }],
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 20 }],
      },
      {
        id: 'buy_chainmail',
        text: '購買鎖子甲（120金）',
        icon: '🛒',
        cost: [{ type: 'gold', amount: 120 }],
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 50 }],
      },
      {
        id: 'decline',
        text: '暫時不需要',
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
      '一股草藥味撲鼻而來。一個滿頭白髮的老者坐在路邊，面前擺滿了各式各樣的瓶瓶罐罐。「年輕人啊，我看你氣色不太好，來瓶回血藥水吧？包你精神百倍！」',
    illustration: 'merchant_potion',
    choices: [
      {
        id: 'buy_hp_potion',
        text: '購買回血藥水（30金）',
        icon: '🧪',
        cost: [{ type: 'gold', amount: 30 }],
        outcome: 'success',
        successRewards: [{ type: 'gold', amount: -30 }, { type: 'xp', amount: 5 }],
      },
      {
        id: 'buy_elixir',
        text: '購買精力藥劑（80金）',
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
    title: '流浪商人 — 地圖商',
    description:
      '一名遮住半邊臉的商人神秘地招手。「嘿，我這裡有一張藏寶圖，據說標記了某個古老遺跡的位置。有興趣的話……價格好商量。」',
    illustration: 'merchant_map',
    choices: [
      {
        id: 'buy_map',
        text: '購買藏寶圖（100金）',
        icon: '🗺️',
        cost: [{ type: 'gold', amount: 100 }],
        outcome: 'random',
        successRate: 0.6,
        successRewards: [{ type: 'gold', amount: 200 }, { type: 'xp', amount: 40 }],
        failPenalty: [{ type: 'gold', amount: -100 }],
      },
      {
        id: 'refuse',
        text: '覺得是騙局，離開',
        icon: '🚶',
        outcome: 'success',
        successRewards: [],
      },
    ],
    rewards: [],
  },

  // ── Puzzle (古老謎題) ────────────────────────────────────────────────
  {
    id: 'puzzle_rune',
    weight: 20,
    category: 'puzzle',
    minChapter: 2,
    cooldownDays: 3,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'chapter_first_clear'],
    title: '古老謎題 — 符文石',
    description:
      '一塊巨大的符文石擋住了去路。石面上刻滿了發光的古代文字，似乎在考驗過路者的智慧。符文緩緩流轉，等待著你的答案。',
    illustration: 'puzzle_rune',
    choices: [
      {
        id: 'solve',
        text: '嘗試解讀符文（智力考驗）',
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
        text: '強行破壞符文',
        icon: '⚡',
        outcome: 'random',
        successRate: 0.3,
        successRewards: [{ type: 'xp', amount: 30 }],
        failPenalty: [{ type: 'hp', amount: 30 }],
      },
      {
        id: 'bypass',
        text: '繞路而行',
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
    title: '古老謎題 — 守門人的問題',
    description:
      '一道巨大的鐵門前，一個由光影構成的守門人浮現。「回答我的問題，或者……承受後果。」他用空洞的聲音說道。',
    illustration: 'puzzle_riddle',
    choices: [
      {
        id: 'answer',
        text: '回答謎題',
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
        text: '賄賂守門人（60金）',
        icon: '💰',
        cost: [{ type: 'gold', amount: 60 }],
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 40 }],
      },
    ],
    rewards: [],
  },

  // ── Elite (精英怪挑戰) ──────────────────────────────────────────────
  {
    id: 'elite_wolf',
    weight: 25,
    category: 'elite',
    minChapter: 1,
    cooldownDays: 2,
    triggerPoints: ['boss_victory', 'chapter_first_clear'],
    title: '精英怪 — 巨狼首領',
    description:
      '草叢中傳來低沉的咆哮。一頭比同類大兩倍的巨狼緩緩步出，眼中閃爍著紅光。牠的牙齒上還掛著上一個挑戰者的布條。',
    illustration: 'elite_wolf',
    choices: [
      {
        id: 'fight',
        text: '迎戰巨狼',
        icon: '⚔️',
        outcome: 'success',
        action: 'battle',
        actionPayload: { chapter: 1, level: 6 },
        successRewards: [
          { type: 'xp', amount: 120 },
          { type: 'gold', amount: 60 },
          { type: 'item', id: 'wolf_fang', amount: 1 },
        ],
      },
      {
        id: 'sneak',
        text: '悄悄繞過',
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
    title: '精英怪 — 石像鬼守衛',
    description:
      '一座古老的石像鬼突然從雕像底座上活了過來！牠伸展著石化翅膀，發出刺耳的尖叫聲，震得地面都在顫抖。',
    illustration: 'elite_golem',
    choices: [
      {
        id: 'fight',
        text: '與石像鬼戰鬥',
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
        text: '嘗試交涉',
        icon: '💬',
        outcome: 'random',
        successRate: 0.3,
        successRewards: [{ type: 'xp', amount: 40 }],
        failPenalty: [{ type: 'hp', amount: 30 }],
      },
    ],
    rewards: [],
  },

  // ── Chest (神秘寶箱) ────────────────────────────────────────────────
  {
    id: 'chest_wooden',
    weight: 35,
    category: 'chest',
    minChapter: 1,
    cooldownDays: 1,
    triggerPoints: ['boss_victory', 'daily_login'],
    title: '神秘寶箱 — 木箱',
    description:
      '一個樸素的木箱出現在路中央，沒有上鎖，卻散發著淡淡的魔法氣息。裡面可能裝著有用的物資……也可能什麼都沒有。',
    illustration: 'chest_wooden',
    choices: [
      {
        id: 'open',
        text: '打開寶箱',
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
        text: '無視寶箱',
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
    title: '神秘寶箱 — 黃金寶箱',
    description:
      '一個華麗的黃金寶箱鑲嵌著各種寶石，靜靜地放在祭壇上。週圍刻著警告符文：『貪婪者，慎之。』',
    illustration: 'chest_golden',
    choices: [
      {
        id: 'open',
        text: '打開黃金寶箱',
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
        text: '仔細檢查符文',
        icon: '🔍',
        outcome: 'success',
        successRewards: [{ type: 'xp', amount: 30 }],
      },
    ],
    rewards: [],
  },

  // ── Lore (劇情片段) ─────────────────────────────────────────────────
  {
    id: 'lore_ancient_shrine',
    weight: 20,
    category: 'lore',
    minChapter: 2,
    cooldownDays: 3,
    oncePerRun: true,
    triggerPoints: ['boss_victory', 'chapter_first_clear', 'achievement'],
    title: '劇情 — 遠古神廟',
    description:
      '在密林深處，你發現了一座被藤蔓覆蓋的遠古神廟。石門上刻著一段銘文：「語言是萬物的鑰匙，掌握語言者掌握世界。」',
    illustration: 'lore_ancient_shrine',
    choices: [
      {
        id: 'enter',
        text: '進入神廟探索',
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
        text: '在門前祈禱',
        icon: '🙏',
        outcome: 'success',
        successRewards: [{ type: 'shield', amount: 15 }],
      },
      {
        id: 'record',
        text: '記錄銘文後離開',
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
    title: '劇情 — 流浪詩人',
    description:
      '一個背著豎琴的詩人坐在路邊的火堆旁。他微笑著向你招手：「來，坐下來聽我說個故事吧。這是關於一個勇敢的語言學者的傳說……」',
    illustration: 'lore_wanderer',
    choices: [
      {
        id: 'listen',
        text: '坐下來聽故事',
        icon: '🎵',
        outcome: 'success',
        successRewards: [
          { type: 'xp', amount: 50 },
          { type: 'cosmetic', id: 'poem_scroll', amount: 1 },
        ],
      },
      {
        id: 'donate',
        text: '捐贈金幣支持詩人（20金）',
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
