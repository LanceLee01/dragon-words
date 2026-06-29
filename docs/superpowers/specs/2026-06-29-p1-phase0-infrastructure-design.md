# P1 Phase 0: 基础设施与共享层 — 设计规格

> 基于 `p1-detailed-design.md`（整体设计）和 `p1-refined-plan.md`（实施计划）的 Phase 0 详细规格。
> 整体 P1 范围：随机事件 + 装备词条 + 隐形 DDA + 微剧情。

---

## 0.1 类型定义 — `core/data/types.ts` 追加

在现有类型文件末尾追加以下类型（约 30 行）：

```typescript
// =====================================================================
// P1 Module Shared Types
// =====================================================================

/** 随机事件触发点枚举 */
type TriggerPoint = 'boss_victory' | 'daily_login' | 'login_streak'
  | 'chapter_first_clear' | 'achievement' | 'game_start';

/** DDA 难度调节器 — 所有 modifier 的汇总结构 */
interface DDAModifiers {
  monsterHpMul: number;
  monsterAtkMul: number;
  timeBonus: number;
  easyWordBias: number;
  hardWordBias: number;
  forceEasyWord: boolean;
  forceTutor: boolean;
  extraShield: number;
  rewardGoldMul: number;
  rewardXpMul: number;
  dropRarityBonus: number;
  challengeMode: boolean;
}

/** 装备词条统计值（传入 battle.ts 做战斗计算） */
interface BattleStats {
  critRate: number;
  critDmg: number;
  elementalDmg: number;
  armorPen: number;
  dotDmg: number;
  shieldBreak: number;
  maxHp: number;
  hpRegen: number;
  dmgReduction: number;
  shieldMax: number;
  statusResist: number;
  thorns: number;
  goldBonus: number;
  xpBonus: number;
  comboDecayReduction: number;
  skillChargeSpeed: number;
  timeBonus: number;
  autoRemoveDistractor: number;
  doubleCast: boolean;
  omniResist: number;
  infiniteCombo: boolean;
  cheatDeath: boolean;
  killHeal: number;
  skillDoubleCast: boolean;
}

/** 词条属性类型联合 */
type AffixStat = keyof BattleStats;

/** 事件执行结果（引擎返回值） */
interface EventResult {
  rewards: EventReward[];
  nextEvent: RandomEvent | null;
  flags: string[];
}

/** 全局旗标接口（用于第 15 章双结局） */
interface GameFlags {
  flags: Set<string>;
}
```

### 设计决策

- `BattleStats` 使用单一扁平对象而非嵌套分类，简化 battle.ts 中的统计加总
- `DDAModifiers` 全部为 number/boolean，无嵌套，便于序列化到 localStorage
- `TriggerPoint` 为字符串联合而非枚举，与事件数据中的字符串值一致
- `AffixInstance` 类型在 Phase 2 `core/data/affixes.ts` 中定义，playerStore 仅在 Phase 2 启用后 import 该类型

---

## 0.2 Store 扩展

### `stores/gameStore.ts`

```typescript
// 追加到 GameStore 接口
interface GameStore {
  // ... 现有字段 ...

  // === P1 新增 ===
  eventHistory: Array<{ id: string; timestamp: number; choice: string }>;
  globalFlags: Set<string>;
  storyProgress: {
    unlockedBeats: Set<string>;
    galleryEntries: Set<string>;
  };

  // Actions
  addEventToHistory: (entry: { id: string; choice: string }) => void;
  setFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  unlockStoryBeat: (beatId: string) => void;
  unlockGalleryEntry: (entryId: string) => void;
}
```

**实现要点**：
- `Set` 使用 `new Set()` 初始化，Zustand 中的 Set 通过 `set({ globalFlags: new Set(get().globalFlags).add(flag) })` 更新
- 持久化策略：`eventHistory` 写入 localStorage；`globalFlags` 存于运行时（session 级）；`storyProgress` 写入 localStorage

### `stores/playerStore.ts`

```typescript
// 追加到 PlayerStore 接口
interface PlayerStore {
  // ... 现有字段 ...

  // === P1 新增 ===
  equipmentWithAffixes: {
    weapon: (Equipment & { affixes: AffixInstance[] }) | null;
    armor: (Equipment & { affixes: AffixInstance[] }) | null;
    accessory: (Equipment & { affixes: AffixInstance[] }) | null;
  };
  lockedAffixIds: string[];

  // Actions
  equipWithAffixes: (slot: 'weapon' | 'armor' | 'accessory',
    item: Equipment & { affixes: AffixInstance[] }) => void;
  lockAffix: (affixId: string) => void;
  unlockAffix: (affixId: string) => void;
  isAffixLocked: (affixId: string) => boolean;
}
```

### `stores/battleStore.ts`

```typescript
// 追加到 BattleStore 接口
interface BattleStore {
  // ... 现有字段 ...

  // === P1 新增 ===
  ddaState: {
    mistakeStreak: number;
    correctStreak: number;
    protectionLevel: number;
    challengeMode: boolean;
  };

  // Actions
  updateDDA: (correct: boolean) => void;
  resetDDA: () => void;
}
```

---

## 0.3 共享 UI 组件

### `components/ui/Modal.tsx`

```
Props:
  open: boolean
  onClose: () => void
  variant: 'fullscreen' | 'centered'  (default: 'centered')
  children: ReactNode

行为:
  - variant='fullscreen': 全屏遮罩 + 居中内容, 用于 EventModal / StoryPlayer
  - variant='centered': 居中弹窗, 用于装备详情 / 确认框
  - framer-motion: fadeIn 遮罩 + scaleIn 内容
  - ESC / 点击遮罩调用 onClose
```

### `components/ui/TypewriterText.tsx`

```
Props:
  text: string
  speed?: number  (ms/字符, default: 30)
  onComplete?: () => void
  className?: string

行为:
  - useEffect + setInterval 逐字追加显示
  - 完成时调用 onComplete
  - 点击文本可立即跳过动画（直接显示完整文本）
```

### `components/ui/FlyReward.tsx`

```
Props:
  rewards: Array<{ type: string; amount: number; icon?: string }>
  origin?: { x: number; y: number }  (起始位置)
  onComplete?: () => void

行为:
  - 每个奖励项从 origin 飞入屏幕上方计数器区域
  - framer-motion: 抛物线路径 + 缩放消失
  - 所有奖励动画完成后调用 onComplete
  - 用于事件奖励 / 战斗结算
```

### `components/ui/IconBadge.tsx`

```
Props:
  category: 'offense' | 'defense' | 'utility' | 'legendary'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string

行为:
  - 显示对应颜色的圆形徽章 + 分类图标
  - 颜色映射: offense=红色, defense=绿色, utility=蓝色, legendary=金色
  - hover 时显示 tooltip 文字
```

---

## 0.4 工具函数 — `core/utils/random.ts`

```typescript
/**
 * 加权随机抽选
 * 从带权重的数组中按 weight 概率抽选一项
 * 性能: O(n), n=items.length
 */
function weightedRandom<T>(
  items: Array<{ item: T; weight: number }>
): T;

/**
 * 防重复抽选
 * 从数组中抽 count 个不重复元素
 * usedIds 可选: 传入选中的 ID 集合避免重复
 */
function pickRandom<T extends { id: string }>(
  items: T[],
  count: number,
  usedIds?: Set<string>
): T[];
```

**单元测试覆盖**：
- `weightedRandom`: Mock Math.random, 验证 0/0.25/0.5/0.75/1.0 各分位返回正确项
- `weightedRandom`: 全零权重返回第一个项
- `pickRandom`: 抽选数量 ≤ 数组长度
- `pickRandom`: 传入 usedIds 时排除已选 ID

---

## 文件变更清单

| 操作 | 文件 | 变更类型 |
|------|------|----------|
| 追加 | `src/core/data/types.ts` | 新增 ~30 行类型定义 |
| 追加 | `src/stores/gameStore.ts` | 新增 5 字段 + 5 actions |
| 追加 | `src/stores/playerStore.ts` | 新增 2 字段 + 4 actions |
| 追加 | `src/stores/battleStore.ts` | 新增 1 字段 + 2 actions |
| 新建 | `src/core/utils/random.ts` | 2 个工具函数 + 测试 |
| 新建 | `src/components/ui/Modal.tsx` | ~80 行 |
| 新建 | `src/components/ui/TypewriterText.tsx` | ~60 行 |
| 新建 | `src/components/ui/FlyReward.tsx` | ~80 行 |
| 新建 | `src/components/ui/IconBadge.tsx` | ~50 行 |

---

## 验收标准

1. `types.ts` 中所有新增类型在 VSCode/LSP 中无报错
2. 三个 Store 的 P1 字段可通过 `useGameStore()` 等 hook 访问并更新
3. `weightedRandom` 单测通过（覆盖率 ≥95%）
4. 4 个 UI 组件在 Storybook（如有）或测试页中渲染正常
