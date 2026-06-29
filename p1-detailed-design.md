# P1 详细设计规范（首月迭代）

> 仅含单机 PvE 范围，三大模块：随机事件、装备词条、隐形 DDA（含微剧情系统）。

---

## 1. 隐藏随机事件系统

### 1.1 触发规则

| 触发点 | 概率 | 条件 |
|--------|------|------|
| Boss 胜利结算后 | 20% | 无额外条件 |
| 章节首通（星级 ≥3） | 100% | 仅首次，给固定剧情事件 |
| 每日首次登录 | 10% | 给 "流浪商人" 固定事件 |
| 连续 3 天登录 | 50% | 给 "神秘宝箱" |
| 特定成就达成 | 100% | 配置在成就表 `unlockEvent` 字段 |

> **不触发**：Boss 战中、微题型中、剧情播放中、设置界面。

### 1.2 事件池定义（数据驱动）

```typescript
// core/data/events.ts
interface RandomEvent {
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
  title: string;
  description: string;
  illustration: string;
  choices: EventChoice[];
  rewards: EventReward[];
  internalState?: Record<string, any>;
}

interface EventChoice {
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
}

interface EventReward {
  type: 'gold' | 'xp' | 'shield' | 'item' | 'cosmetic';
  id?: string;
  amount: number;
  weight?: number;
}
```

### 1.3 五大类事件模板

#### ① 流浪商人

```json
{
  "id": "merchant_wandering",
  "weight": 30,
  "category": "merchant",
  "title": "流浪商人",
  "description": "一位披着斗篷的商人从阴影中走出，眼中闪烁着奇异的光。\"年轻的冒险者，想看看我的货物吗？\"",
  "illustration": "assets/events/merchant_wandering.png",
  "choices": [
    {
      "id": "buy_equip",
      "text": "购买装备 (500 金币)",
      "icon": "⚔️",
      "cost": [{ "type": "gold", "amount": 500 }],
      "outcome": "success",
      "successRewards": [{ "type": "item", "id": "random_rare_equip", "amount": 1 }]
    },
    {
      "id": "buy_potion",
      "text": "购买药水 (100 金币)",
      "icon": "🧪",
      "cost": [{ "type": "gold", "amount": 100 }],
      "outcome": "success",
      "successRewards": [{ "type": "item", "id": "shield_potion", "amount": 3 }]
    },
    {
      "id": "leave",
      "text": "离开",
      "icon": "👋",
      "outcome": "success"
    }
  ],
  "rewards": []
}
```

#### ② 古老谜题

```json
{
  "id": "puzzle_ancient_riddle",
  "weight": 25,
  "category": "puzzle",
  "minChapter": 3,
  "title": "古老谜题",
  "description": "石碑上刻着谜语：\"{riddle}\"\n\n你需要从四个选项中选出答案。答对可获得丰厚金币奖励。",
  "illustration": "assets/events/puzzle_riddle.png",
  "choices": [
    {
      "id": "answer_0",
      "text": "{option_0}",
      "outcome": "random",
      "successRate": 0.25,
      "successRewards": [{ "type": "gold", "amount": 300 }],
      "failPenalty": [{ "type": "hp", "amount": -10 }]
    },
    { "id": "answer_1", "text": "{option_1}", "outcome": "random", "successRate": 0.25, "successRewards": [{ "type": "gold", "amount": 300 }], "failPenalty": [{ "type": "hp", "amount": -10 }] },
    { "id": "answer_2", "text": "{option_2}", "outcome": "random", "successRate": 0.25, "successRewards": [{ "type": "gold", "amount": 300 }], "failPenalty": [{ "type": "hp", "amount": -10 }] },
    { "id": "answer_3", "text": "{option_3}", "outcome": "random", "successRate": 0.25, "successRewards": [{ "type": "gold", "amount": 300 }], "failPenalty": [{ "type": "hp", "amount": -10 }] },
    {
      "id": "skip",
      "text": "放弃思考",
      "outcome": "success"
    }
  ],
  "rewards": [],
  "internalState": { "riddlePool": "riddles_chapter_3_5" }
}
```

> **谜题池**：每章 10 条 D&D 风格谜语（英文+中文），运行时随机抽 1 条 + 3 个干扰项。

#### ③ 精英怪挑战

```json
{
  "id": "elite_monster_challenge",
  "weight": 20,
  "category": "elite",
  "minChapter": 4,
  "title": "精英怪踪迹",
  "description": "你发现了 {monsterName} 的巢穴。它比普通怪物强大，但击败它能获得丰厚奖励。接受挑战吗？",
  "illustration": "assets/events/elite_{monsterId}.png",
  "choices": [
    {
      "id": "accept",
      "text": "接受挑战",
      "icon": "⚔️",
      "outcome": "success",
      "nextEventId": "elite_battle_{monsterId}"
    },
    {
      "id": "prepare",
      "text": "先准备一下 (消耗 1 护盾获得 BUFF)",
      "icon": "🛡️",
      "cost": [{ "type": "shield", "amount": 1 }],
      "outcome": "success",
      "successRewards": [{ "type": "item", "id": "elite_battle_buff", "amount": 1 }],
      "nextEventId": "elite_battle_{monsterId}"
    },
    {
      "id": "decline",
      "text": "暂不挑战",
      "icon": "🏃",
      "outcome": "success"
    }
  ],
  "rewards": []
}
```

> **精英战**：复用 `BattlePage`，怪物数据 = 普通怪 HP×2、攻击×1.5、额外 1 个词条技能。胜利给稀有装备 + 大量金币。

#### ④ 神秘宝箱

```json
{
  "id": "chest_mysterious",
  "weight": 15,
  "category": "chest",
  "title": "神秘宝箱",
  "description": "一只上了锁的宝箱静静躺在路边。锁孔旁刻着符文：\"{hint}\"",
  "illustration": "assets/events/chest_mysterious.png",
  "choices": [
    {
      "id": "unlock_gold",
      "text": "花费 200 金币强行打开",
      "cost": [{ "type": "gold", "amount": 200 }],
      "outcome": "success",
      "successRewards": [
        { "type": "gold", "amount": 500, "weight": 30 },
        { "type": "item", "id": "random_rare_equip", "amount": 1, "weight": 20 },
        { "type": "cosmetic", "id": "random", "amount": 1, "weight": 5 }
      ]
    },
    {
      "id": "unlock_key",
      "text": "使用钥匙打开 (需要 1 护盾)",
      "cost": [{ "type": "shield", "amount": 1 }],
      "outcome": "success",
      "successRewards": [
        { "type": "gold", "amount": 800, "weight": 40 },
        { "type": "item", "id": "random_legendary_equip", "amount": 1, "weight": 15 },
        { "type": "cosmetic", "id": "random", "amount": 1, "weight": 10 }
      ]
    },
    {
      "id": "leave",
      "text": "不冒险",
      "outcome": "success"
    }
  ],
  "rewards": []
}
```

#### ⑤ 剧情片段

```json
{
  "id": "lore_dragon_history",
  "weight": 10,
  "category": "lore",
  "minChapter": 6,
  "oncePerRun": true,
  "title": "龙族史诗",
  "description": "古老的壁画记录了远古红龙的崛起...",
  "illustration": "assets/events/lore_dragon_1.png",
  "choices": [
    {
      "id": "read",
      "text": "细细阅读",
      "outcome": "success",
      "setFlag": "lore_dragon_1_read",
      "successRewards": [{ "type": "xp", "amount": 500 }]
    }
  ],
  "rewards": [{ "type": "xp", "amount": 200 }]
}
```

### 1.4 事件引擎实现

```typescript
// core/engine/eventEngine.ts
class EventEngine {
  private events: RandomEvent[] = loadEvents();
  private playerState: PlayerState;
  private globalFlags: Set<string> = new Set();
  private eventHistory: { id: string; timestamp: number; choice: string }[] = [];

  checkTrigger(triggerPoint: TriggerPoint): RandomEvent | null {
    const candidates = this.events.filter(e => 
      e.weight > 0 &&
      this.checkRequirements(e) &&
      this.checkCooldown(e) &&
      this.checkOncePerRun(e) &&
      this.checkChapterRange(e)
    );
    if (!candidates.length) return null;
    
    const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const e of candidates) {
      roll -= e.weight;
      if (roll <= 0) return e;
    }
    return null;
  }

  async executeChoice(event: RandomEvent, choiceId: string): Promise<EventResult> {
    const choice = event.choices.find(c => c.id === choiceId)!;
    
    for (const cost of choice.cost || []) {
      await this.payCost(cost);
    }

    let rewards: EventReward[] = [...event.rewards];
    let nextEvent: RandomEvent | null = null;

    if (choice.outcome === 'random') {
      const success = Math.random() < (choice.successRate || 0.5);
      if (success) {
        rewards.push(...(choice.successRewards || []));
      } else {
        rewards.push(...(choice.failPenalty || []));
      }
    } else if (choice.outcome === 'success') {
      rewards.push(...(choice.successRewards || []));
    }

    await this.grantRewards(rewards);

    if (choice.setFlag) this.globalFlags.add(choice.setFlag);

    if (choice.nextEventId) {
      nextEvent = this.events.find(e => e.id === choice.nextEventId) || null;
    }

    this.eventHistory.push({ id: event.id, timestamp: Date.now(), choice: choiceId });
    this.saveHistory();

    return { rewards, nextEvent, flags: Array.from(this.globalFlags) };
  }
}
```

### 1.5 UI 流程

```
BossVictoryModal
    │
    ▼ (20% 几率)
EventTriggerCheck ──No──▶ 正常结算奖励
    │ Yes
    ▼
EventModal (全屏)
    ├─ 标题 + 插画 + 描述文本（打字机效果）
    ├─ 选项按钮列表（显示成本/图标）
    │   └─ 点击 → 执行动画 → 奖励飞入动画
    ├─ 如有 nextEvent → 自动弹出下一级 EventModal
    └─ 关闭 → 回到 MapPage
```

### 1.6 ComfyUI 素材清单

| 事件类 | 插画数量 | 提示词模板 |
|--------|----------|------------|
| 商人 | 3 种外观 | `wandering merchant, D&D style, cloaked figure, magical backpack, glowing items, dungeon lighting` |
| 谜题 | 5 石碑变体 | `ancient stone tablet, runic inscription, glowing runes, moss covered, dungeon atmosphere` |
| 精英怪 | 15 种 (每章 1 种) | `elite {monster name}, larger, glowing eyes, magical aura, armor pieces, boss variant` |
| 宝箱 | 4 种 (普通/精致/上古/诅咒) | `treasure chest, {variant}, D&D style, runes, lock, glowing cracks, gold trim` |
| 剧情 | 15 章 × 2-3 关键帧 | `medieval fantasy illustration, {scene description}, parchment texture, storybook style` |

---

## 2. 装备词条系统

### 2.1 词条分类体系

```
┌─────────────────────────────────────────────────────────────┐
│                    装备词条三大体系                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   攻击系      │   生存系      │   功能系      │   特殊/传说    │
│  (红色图标)   │  (绿色图标)   │  (蓝色图标)   │  (金色/彩色)   │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ 暴击率        │ 最大生命      │ 金币加成      │ 双重施法       │
│ 暴击伤害      │ 生命回复/回合 │ 经验加成      │ 全能抗性       │
│ 元素伤害      │ 伤害减免      │ 连击衰减减缓  │ 连击不衰减     │
│ 穿透护甲      │ 护盾上限      │ 技能充能加速  │ 濒死不死       │
│ 状态异常增伤  │ 状态抗性      │ 答题时间延长  │ 击杀回血       │
│ 破盾伤害      │ 反伤          │ 干扰项自动排除│ 技能双倍释放   │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 2.2 词条数据结构

```typescript
// core/data/affixes.ts
interface Affix {
  id: string;
  category: 'offense' | 'defense' | 'utility' | 'legendary';
  tier: 1 | 2 | 3 | 4;
  stat: AffixStat;
  value: AffixValue;
  display: {
    name: string;
    description: string;
    icon: string;
    color: string;
  };
  group?: string;
  tags?: string[];
}

type AffixStat = 
  | 'critRate' | 'critDmg' | 'elementalDmg' | 'armorPen' | 'dotDmg' | 'shieldBreak'
  | 'maxHp' | 'hpRegen' | 'dmgReduction' | 'shieldMax' | 'statusResist' | 'thorns'
  | 'goldBonus' | 'xpBonus' | 'comboDecayReduction' | 'skillChargeSpeed' | 'timeBonus' | 'autoRemoveDistractor'
  | 'doubleCast' | 'omniResist' | 'infiniteCombo' | 'cheatDeath' | 'killHeal' | 'skillDoubleCast';

type AffixValue = 
  | { type: 'flat'; min: number; max: number }
  | { type: 'pct'; min: number; max: number }
  | { type: 'formula'; base: number; perTier: number };

const AFFIX_POOLS: Record<number, Affix[]> = {
  1: [  // 普通
    { id: 'crit_rate_1', category: 'offense', tier: 1, stat: 'critRate', value: {type:'pct', min:0.03, max:0.05}, display:{name:'敏锐', description:'暴击率
```

> （词条池剩余定义不变，省略号表示保持原内容）

### 2.3 装备生成系统

```typescript
// core/engine/equipment.ts
function generateEquipment(quality: EquipmentQuality): Equipment {
  const affixCount = getAffixCount(quality);
  const allowedTiers = getAllowedTiers(quality);
  const selectedAffixes = pickAffixes(allowedTiers, affixCount);
  
  return {
    ...baseEquipment,
    affixes: selectedAffixes.map(affix => ({
      ...affix,
      value: rollValue(affix.value),
    })),
  };
}
```

### 2.4 词条融合系统（Lv30 解锁）

```
同名装备融合规则：
  1. 选两件同名品质装备
  2. 结果保留 ≤6 词条（从两件中挑最高值）
  3. 锁定词条强制保留、不参与重随
  4. 消耗金币 = 装备等级 × 50
```

### 2.5 锁词条系统（Lv40 解锁）

```
锁词条规则：
  1. 消耗 "锁链石"（商店购买 / 成就奖励）
  2. 锁定后该词条在融合/重随时保留
  3. 解锁免费（但锁链石消耗不退）
```

### 2.6 战斗接入

```typescript
// core/engine/battle.ts
function applyAffixesToStats(stats: BattleStats, equipment: Equipment[]): BattleStats {
  const merged = { ...stats };
  for (const eq of equipment) {
    for (const affix of eq.affixes) {
      applySingleAffix(merged, affix);
    }
  }
  return merged;
}
```

### 2.7 商店刷新（周刷新）

```
周商店规则：
  - 每周固定 3 件传说装备（含 1 件指定传说词条）
  - 锁链石 ×5（每周限购）
  - 可用金币购买，价格随品质递增
  - 刷新时间：每周一 0:00（客户端校时）
```

### 2.8 UI 组件

| 组件 | 说明 |
|------|------|
| `EquipmentDetail` | 装备详情：词条列表（按分类着色）、锁定按钮 |
| `InventoryPanel` | 背包列表：品质着色、筛选、排序 |
| `ShopPage（扩充）` | 词条商店页签：传说装备 + 锁链石 |

---

## 3. 隐形 DDA 难度调节

> 完全对玩家不可见，无 UI 提示，纯后台运行。

### 3.1 状态管理

```typescript
// core/engine/dda.ts
interface DDAState {
  mistakeStreak: number;    // 连续答错次数
  correctStreak: number;    // 连续答对次数
  protectionLevel: number;  // 0=无, 1=轻度, 2=强力, 3=极限
  challengeMode: boolean;   // 挑战模式激活
  currentModifiers: DDAModifiers;
}

interface DDAModifiers {
  monsterHpMul: number;
  monsterAtkMul: number;
  timeBonus: number;        // 秒（正数=加时）
  easyWordBias: number;     // 简单词权重增量
  hardWordBias: number;     // 难词权重增量
  forceEasyWord: boolean;
  forceTutor: boolean;
  extraShield: number;
  rewardGoldMul: number;
  rewardXpMul: number;
  dropRarityBonus: number;
  challengeMode: boolean;
}
```

### 3.2 保护机制（连错触发）

| 保护层级 | 连错阈值 | 效果 |
|----------|----------|------|
| 轻度保护 | 5 次 | 怪物 HP×0.85、ATK×0.80、+2s 答题时间、简单词权重 +25% |
| 强力保护 | 8 次 | 怪物 HP×0.65、ATK×0.60、+4s 答题时间、强制出简单词、+1 护盾 |
| 极限保护 | 10 次 | 怪物 HP×0.30、ATK×0.20、+6s、必出简单词、+2 护盾、导师提示出现 |

### 3.3 挑战机制（连对触发）

| 挑战层级 | 连对阈值 | 效果 |
|----------|----------|------|
| 挑战 I | 15 次 | 怪物 HP×1.15、ATK×1.10、-2s、结算金币 ×1.3、掉落稀有度 +1 |
| 挑战 II | 25 次 | 怪物 HP×1.30、ATK×1.20、-3s、结算金币 ×1.5、掉落稀有度 +2 |

> **保护优先**：只要 mistakeStreak ≥ 5，不进入挑战模式（哪怕 correctStreak 也很高）。

### 3.4 DDA 控制器实现

```typescript
// core/engine/dda.ts
class DDAController {
  private BASE: DDAModifiers = {
    monsterHpMul: 1, monsterAtkMul: 1, timeBonus: 0,
    easyWordBias: 0, hardWordBias: 0,
    forceEasyWord: false, forceTutor: false, extraShield: 0,
    rewardGoldMul: 1, rewardXpMul: 1, dropRarityBonus: 0, challengeMode: false,
  };

  private PROTECTION_TIERS = [
    { threshold: 5, mods: { monsterHpMul: 0.85, monsterAtkMul: 0.80, timeBonus: 2, easyWordBias: 0.25 } },
    { threshold: 8, mods: { monsterHpMul: 0.65, monsterAtkMul: 0.60, timeBonus: 4, forceEasyWord: true, extraShield: 1 } },
    { threshold: 10, mods: { monsterHpMul: 0.30, monsterAtkMul: 0.20, timeBonus: 6, forceEasyWord: true, extraShield: 2, forceTutor: true } },
  ];

  private CHALLENGE_TIERS = [
    { threshold: 15, mods: { monsterHpMul: 1.15, monsterAtkMul: 1.10, timeBonus: -2, rewardGoldMul: 1.3, dropRarityBonus: 1, challengeMode: true } },
    { threshold: 25, mods: { monsterHpMul: 1.30, monsterAtkMul: 1.20, timeBonus: -3, rewardGoldMul: 1.5, dropRarityBonus: 2, challengeMode: true } },
  ];

  onAnswerCorrect() {
    this.state.mistakeStreak = Math.max(0, this.state.mistakeStreak - 2);
    this.state.correctStreak++;
    this.recalculate();
  }

  onAnswerWrong() {
    this.state.correctStreak = Math.max(0, this.state.correctStreak - 5);
    this.state.mistakeStreak++;
    this.recalculate();
  }

  private recalculate() {
    let mods = { ...this.BASE };
    let protectionLevel = 0;
    
    for (const tier of this.PROTECTION_TIERS) {
      if (this.state.mistakeStreak >= tier.threshold) {
        mods = { ...mods, ...tier.mods };
        protectionLevel = this.PROTECTION_TIERS.indexOf(tier);
      } else break;
    }
    
    if (protectionLevel === 0) {
      for (const tier of this.CHALLENGE_TIERS) {
        if (this.state.correctStreak >= tier.threshold) {
          mods = { ...mods, ...tier.mods };
        } else break;
      }
    }
    
    this.state.currentModifiers = mods;
    this.state.protectionLevel = protectionLevel;
    this.state.challengeMode = mods.challengeMode === true;
  }

  getModifiers(): DDAModifiers {
    return { ...this.state.currentModifiers };
  }

  applyToMonster(baseHp: number, baseAtk: number): { hp: number; atk: number } {
    const m = this.state.currentModifiers;
    return {
      hp: Math.floor(baseHp * m.monsterHpMul),
      atk: Math.floor(baseAtk * m.monsterAtkMul),
    };
  }

  applyToTimeLimit(baseTime: number): number {
    return baseTime + this.state.currentModifiers.timeBonus * 1000;
  }

  getWordBias(): { easy: number; hard: number } {
    const m = this.state.currentModifiers;
    return { easy: m.easyWordBias, hard: m.hardWordBias };
  }

  shouldForceEasyWord(): boolean {
    return this.state.currentModifiers.forceEasyWord === true;
  }

  shouldForceTutor(): boolean {
    return this.state.currentModifiers.forceTutor === true;
  }

  getExtraShield(): number {
    return this.state.currentModifiers.extraShield || 0;
  }

  getSettlementMultipliers(): { gold: number; xp: number; rarity: number } {
    const m = this.state.currentModifiers;
    return { gold: m.rewardGoldMul, xp: m.rewardXpMul, rarity: m.dropRarityBonus };
  }
}
```

### 3.5 出题引擎接入

```typescript
// core/engine/question.ts
function selectWordWithDDA(pool: Word[], dda: DDAController): Word {
  const { easy, hard } = dda.getWordBias();
  
  const weighted = pool.map(w => {
    let weight = 1;
    if (w.difficulty === 1) weight += easy * 10;
    else if (w.difficulty === 3) weight += hard * 10;
    weight += (w.historicalErrorRate || 0) * 5;
    return { word: w, weight };
  });
  
  if (dda.shouldForceEasyWord()) {
    const easyWords = weighted.filter(w => w.word.difficulty === 1);
    if (easyWords.length) return weightedRandom(easyWords).word;
  }
  
  return weightedRandom(weighted).word;
}
```

### 3.6 开发者调试面板（仅开发模式）

```
┌─ DDA Debug ────────────────────────┐
│ Mistake Streak: 3                  │
│ Correct Streak: 0                  │
│ Protection Level: 2 (强力保护)        │
│ Challenge Mode: false              │
│ ─────────────────────────────────  │
│ Monster HP ×0.85   ATK ×0.80       │
│ Time Bonus: +2s                    │
│ Easy Word Bias: +25%               │
│ Force Easy Word: YES               │
│ Extra Shield: +1                   │
│ ─────────────────────────────────  │
│ [Reset] [Simulate 5 Wrong] [Sim 15 Right]
└────────────────────────────────────┘
```

---

## 4. 微剧情系统

### 4.1 叙事架构

```
全局主线（15 章）
    │
    ├─ 第 1-5 章：觉醒篇（小学词汇）── 发现龙族苏醒的征兆
    ├─ 第 6-10 章：试炼篇（初中前半）── 深入地下城，面对各族势力
    ├─ 第 11-14 章：决战篇（初中后半）── 集结同盟，攻入龙巢
    └─ 第 15 章：终局篇────────── 面对远古红龙，抉择世界命运
```

### 4.2 剧情交付形式

```typescript
// core/data/story.ts
interface StoryBeat {
  id: string;
  chapter: number;
  trigger: 'chapter_start' | 'boss_pre' | 'boss_post' | 'hidden_event' | 'perfect_clear' | 'first_clear';
  format: 'comic' | 'dialogue' | 'narration';
  panels: StoryPanel[];
  rewards: StoryReward[];
  unlockFlags?: string[];
}

interface StoryPanel {
  type: 'image' | 'text' | 'choice';
  imagePath?: string;
  text?: string;
  character?: string;
  emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'determined' | 'mysterious';
  duration?: number;
  choices?: { text: string; nextPanelId: string; setFlag?: string }[];
}

interface StoryReward {
  type: 'gold' | 'xp' | 'cosmetic' | 'galleryEntry';
  id?: string;
  amount: number;
}
```

### 4.3 关键剧情节点（示例）

| 章节 | 触发点 | 形式 | 核心内容 | 奖励 |
|------|--------|------|----------|------|
| 1 | 章节开始 | 漫画 4 格 | 冒险者在森林小径醒来，遇见向导精灵，得知 "单词之力" 可封印魔物 | 金币 200 |
| 3 | Boss 前 | 对话 | 大法师透露 "词根之源" 失窃，单词失去魔力 | 经验 500 |
| 5 | 章节通关 | 旁白 | 矮人长老赠送 "符文钥匙"，指引去幽暗地域 | 传说装备 ×1 |
| 7 | 隐藏事件 | 漫画 | 双足飞龙巢穴发现龙蛋，选择"守护"或"夺取" → 分支旗标 | 经验 1000 |
| 10 | Boss 后 | 对话 | 暗黑骑士临死揭露 "远古红龙在吞噬词根" | 金币 500 |
| 13 | 完美通关 | 旁白 | 时之守护者显现："时间回溯只能一次，谨慎选择" | 传说装备 ×1 |
| 15 | 最终 Boss 前 | 漫画 6 格 | 远古红龙现身，世界命运掌握在冒险者手中 | 经验 2000 |
| 15 | 通关 | 旁白 + CG | 两种结局：封印 / 驯服（取决于全剧情选择） | 专属外观 "龙之子嗣" + 真·结局图鉴 |

### 4.4 播放器实现

```typescript
// components/adventure/StoryPlayer.tsx
function StoryPlayer({ beat, onComplete, onChoice }: StoryPlayerProps) {
  const [panelIndex, setPanelIndex] = useState(0);
  const panel = beat.panels[panelIndex];

  const nextPanel = () => {
    if (panelIndex < beat.panels.length - 1) {
      setPanelIndex(panelIndex + 1);
    } else {
      onComplete(beat.rewards);
    }
  };

  const renderPanel = () => {
    switch (panel.type) {
      case 'image':
        return <img src={panel.imagePath} className="story-image" alt="" />;
      case 'text':
        return (
          <div className="story-text-box">
            {panel.character && <span className="character-name">{panel.character}</span>}
            <TypewriterText text={panel.text} speed={30} />
          </div>
        );
      case 'choice':
        return (
          <div className="story-choices">
            {panel.choices?.map((c, i) => (
              <button key={i} onClick={() => { if (c.setFlag) onChoice?.(c.setFlag); nextPanel(); }}>
                {c.text}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="story-modal">
      <div className="story-panel">{renderPanel()}</div>
      {panel.type !== 'choice' && panelIndex < beat.panels.length - 1 && (
        <button className="story-next" onClick={nextPanel}>▶</button>
      )}
      <div className="story-progress">{panelIndex + 1} / {beat.panels.length}</div>
    </div>
  );
}
```

### 4.5 剧情回看系统

```
┌─ 剧情回看 ───────────────────────────────────────┐
│ 进度：8/15 章已解锁                               │
├───────────────────────────────────────────────────┤
│ 第 1 章 ☑ 可回看  │ 第 2 章 ☑ 可回看              │
│ 第 3 章 ☑ 可回看  │ 第 4 章 ☐ 未解锁              │
│ ...                                               │
├───────────────────────────────────────────────────┤
│ [第 3 章] 展开 → 显示 4 个分镜缩略图               │
│   分镜 1: 冒险者醒来 ☑  (点击回看)                 │
│   分镜 2: 精灵向导 ☑                              │
│   分镜 3: 单词之力 ☑                              │
│   分镜 4: 踏上旅程 ☑                              │
└───────────────────────────────────────────────────┘
```

```typescript
// stores/gameStore.ts
interface StoryProgressState {
  unlockedBeats: Set<string>;     // 已解锁剧情节点 ID
  galleryEntries: Set<string>;    // 已解锁图鉴条目
  flags: Set<string>;             // 全局旗标（影响第 15 章结局）
}
```

### 4.6 第 15 章双结局

| 结局 | 条件 | 奖励 |
|------|------|------|
| 封印结局 | 默认（无特殊 flag 或 "选择封印"） | 专属外观 "龙之子嗣" |
| 驯服结局 | 特定 flag 链（"选择驯服" + 之前剧情选择正向） | 专属外观 "龙之子嗣" + 真·结局图鉴 |

```typescript
// core/engine/storyResolver.ts
function resolveEnding(flags: Set<string>): 'seal' | 'tame' {
  if (flags.has('ending_choice_tame') && flags.has('lore_dragon_1_read')) {
    return 'tame';
  }
  return 'seal';
}
```

### 4.7 ComfyUI 素材需求（剧情分镜）

| 章节 | 关键分镜数 | 总计 | 风格关键词 |
|------|------------|------|------------|
| 1-5 | 4-5 张/章 | ~22 | `storybook illustration, warm sepia, parchment texture, detailed character design, D&D 5e art style` |
| 6-10 | 5-6 张/章 | ~28 | `darker tones, dungeon atmosphere, magical lighting, dynamic composition` |
| 11-14 | 6-7 张/章 | ~38 | `epic scale, dragon imagery, celestial/abyssal themes, cinematic lighting` |
| 15 | 8-10 张 | ~9 | `final boss confrontation, dual ending branches, legendary quality` |
| **总计** | | **~97 张** | 统一用 `ComfyUI + ControlNet (canny/depth)` 保证角色一致性 |

> **角色一致性方案**：
> - 训练 6 个主角 LoRA（对应 6 基础职业）+ 1 个精灵向导 LoRA + 1 个远古红龙 LoRA
> - 分镜提示词固定 `character: {class}_adventurer, {elf_guide}, {ancient_red_dragon}`
> - 使用 `--consistent-character` 工作流批量生成

---

## 5. 三模块集成清单

| 模块 | 新增文件 | 修改文件 | 存储新增字段 |
|------|----------|----------|--------------|
| 随机事件 | `core/data/events.ts`, `core/engine/eventEngine.ts`, `components/adventure/EventModal.tsx` | `stores/gameStore.ts`, `pages/MapPage.tsx` | `eventHistory`, `globalFlags` |
| 装备词条 | `core/data/affixes.ts`, `core/engine/equipment.ts`, `components/collection/EquipmentDetail.tsx`, `components/shop/ShopPage.tsx` | `core/engine/battle.ts`, `stores/playerStore.ts` | `equipment.affixes`, `lockedAffixIds` |
| 隐形 DDA | `core/engine/dda.ts` | `stores/battleStore.ts`, `core/engine/battle.ts`, `core/engine/question.ts` | `ddaState` |
| 微剧情 | `core/data/story.ts`, `components/adventure/StoryPlayer.tsx`, `components/home/GalleryPage.tsx` | `stores/gameStore.ts`, `pages/MapPage.tsx`, `pages/BattlePage.tsx` | `storyProgress` |

---

## 6. 开发排期（4 周）

| 周 | 交付里程碑 |
|----|------------|
| **Week 1** | 随机事件引擎 + 5 类事件模板完整跑通（含 ComfyUI 占位图）；EventModal 组件上线 |
| **Week 2** | 装备词条系统：数据定义、生成、融合、战斗加成、商店刷新、UI 面板全链路 |
| **Week 3** | DDA 控制器 + 接入 battle/question + 开发者调试面板；内测验证不可见性与保护效果 |
| **Week 4** | 剧情播放器 + 回看图鉴页；第 1、3、5、7、10、15 章关键分镜接入；全链路回归测试 |

---

## 7. 验收标准

| 模块 | 验收用例 |
|------|----------|
| 随机事件 | 1) Boss 后 20% 触发，事件流程完整<br>2) 同事件冷却生效、oncePerRun 生效<br>3) 选项扣费正确、奖励到账 |
| 装备词条 | 1) 同名装备融合保留最高数值词条、锁定生效<br>2) 战斗中词条触发有飘字反馈<br>3) 周商店固定刷新传说装备、指定传说词条 |
| DDA | 1) 连错 5 次后怪物 HP/攻击显著降低、必出简单词、给护盾、导师提示<br>2) 连对 15 次进入挑战模式、结算金币 ×1.3、掉落稀有度提升<br>3) 玩家无感知 |
| 微剧情 | 1) 关键节点自动播放分镜、打字机文本、可跳过<br>2) 解锁剧情可在回看图鉴查看<br>3) 第 15 章双结局根据旗标正确分支 |

---

## 8. 一句话给各角色

> **程序**：事件引擎/词条融合/DDA 控制器/剧情播放器 — 四个独立纯 TS 模块，核心逻辑零 React 依赖，单测覆盖率 ≥90%。
> **美术**：97 张分镜 + 5 类事件插画 + 20+ 词条图标 + 融合/商店/图鉴 UI 套件 — 全部 ComfyUI + ControlNet 批量产出，风格锁 "D&D 5e 规则书插画"。
> **策划**：事件权重/词条数值/DDA 曲线 — 全部在 `core/data/balance.ts` 集中配置，上线后仅改配置不改代码。
> **测试**：重点跑 "连错 10 次不死"、"融合词条不丢失"、"DDA 回滚正确"、"剧情旗标分支正确" 四大回归用例。
