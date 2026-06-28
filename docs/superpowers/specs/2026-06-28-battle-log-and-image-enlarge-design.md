# Battle Log & Image Enlargement Design

## 概述

在战斗页面增加三栏布局和战斗记录系统，并将所有战斗图片放大一倍。

## 布局变更

当前：单列垂直布局（HUD → 连击 → 主内容区）

改为：三栏水平布局

```
┌──────────────────────────────────────────────────────────────────┐
│  Top HUD：玩家HP | 计时器 | 怪物HP —— 保持原样                    │
├────────────┬──────────────────────────────┬──────────────────────┤
│ 左栏 280px  │         中间 flex-1          │    右栏 280px        │
│ 答题记录    │    战斗主区域（保持原样）      │    战斗统计           │
│            │    题目/结果/怪物回合/胜/败    │                      │
│ 自动滚动    │                            │    自动滚动           │
└────────────┴──────────────────────────────┴──────────────────────┘
```

- **顶部 HUD**：完全保持原样（玩家血量条 + 头像 / 计时器 / 怪物血量条 + 头像）
- **连击显示**：移到 HUD 下方、三栏上方，居中
- **中间栏**：`flex-1`，容纳 `AnimatePresence` 内的所有战斗内容，完全不变
- **左栏**：固定宽度 280px，半透明深色背景 (`bg-black/20`)，`overflow-y-auto`，显示答题记录
- **右栏**：固定宽度 280px，半透明深色背景 (`bg-black/20`)，`overflow-y-auto`，显示战斗统计

## 数据模型

### BattleLogEntry

```typescript
interface BattleLogEntry {
  turn: number;

  // 答题记录（左栏使用）
  wordEnglish: string;
  wordChinese: string;
  questionType: string;  // 'word-meaning' | 'listening' | 'spell' | 'pos' | 'match'
  isCorrect: boolean;

  // 战斗统计（右栏使用）
  damageDealt: number;
  damageTaken: number;
  lastCombo: number;     // 记录时的连击数
  isCrit: boolean;
  monsterHpAfter: number;
  monsterMaxHp: number;
  playerHpAfter: number;
  playerMaxHp: number;
  monsterName: string;   // 当前怪物名称
}
```

### BattleState 变更

在 `BattleState` 中新增字段：

```typescript
export interface BattleState {
  // ... 现有字段不变 ...
  log: BattleLogEntry[];  // 新增
}
```

### 记录追加时机

每次玩家答题后（`submitAnswer` / `answerQuestion` 返回时）追加一条记录，包含：
- `turn`、答题信息 → 从 `currentQuestion` 获取
- `isCorrect` → 从 `evaluateAnswer` 结果
- `damageDealt` → 从 `battle.lastDamageDealt`
- `isCrit` → 由 engine 计算（新增返回值）
- `combo` → 从 `battle.combo`
- `monsterHpAfter` → 从 `nextBattle.monsterHp`
- `playerHpAfter` → 从 `nextBattle.playerHp`

怪物回合不追加新记录（因为条目是在答题时一并记录的）。

### 答错时的怪物伤害

答错时，`monsterTurn` 执行完毕后的 `battle.lastDamageTaken` 会被记录到上一条记录的 `damageTaken` 字段（需要延迟补录或作为答题记录的一部分一起生成）。

**简化方案**：`submitAnswer` 中仅在玩家答题后记录一条日志，`damageTaken` 在 `finishMonsterTurn` 后被更新到上一条记录。

## UI 组件

### AnswerLog.tsx（左栏）

```
┌──────────────────────────┐
│ 📝 答题记录               │
├──────────────────────────┤
│ #1  apple  苹果          │  ← 绿色左边框（答对）
│    ✅ 正确               │
│──────────────────────────│
│ #2  banana  香蕉         │  ← 红色左边框（答错）
│    ❌ 错误               │
│──────────────────────────│
│ #3  cat  猫              │
│    ✅ 正确               │
└──────────────────────────┘
```

- 每个条目高度约 56px
- 答对条目：左边 3px 绿色竖条 (`border-l-4 border-green-500`)
- 答错条目：左边 3px 红色竖条 (`border-l-4 border-red-500`)
- 条目之间 1px 分隔线 (`border-b border-white/10`)
- 容器 `overflow-y-auto`，最新条目在底部，自动滚动到底

### CombatLog.tsx（右栏）

```
┌──────────────────────────┐
│ ⚔️ 战斗统计               │
├──────────────────────────┤
│ #1  ⚔️ 对哥布林造成 15 点  │
│    🔥 连击 x1  💥 暴击!   │
│    ❤️ 怪物 HP: 85/100     │
│──────────────────────────│
│ #2  💢 受到哥布林 8 点伤害 │
│    ❤️ 玩家 HP: 92/100     │
│──────────────────────────│
│ #3  ⚔️ 对哥布林造成 12 点  │
│    🔥 连击 x2            │
│    ❤️ 怪物 HP: 73/100     │
└──────────────────────────┘
```

- 每个条目高度约 64px
- 答对回合：显示 `⚔️ 对{monsterName}造成{damage}点伤害`
- 答错回合：显示 `💢 受到{monsterName}{damage}点伤害`
- 如有暴击：额外显示 `💥 暴击!`
- 连击 >1：显示 `🔥 连击 xN`
- 始终显示怪物/玩家剩余 HP

## 图片放大

所有战斗相关图片尺寸翻倍：

| 图片 | 当前尺寸 | 新尺寸 |
|------|---------|--------|
| 玩家头像容器 | `h-48 w-48` (192px) | `h-56 w-56` (224px) **或放大 1.5x** |
| 怪物头像容器 | `h-48 w-48` (192px) | `h-56 w-56` (224px) **或放大 1.5x** |
| 单词图片 (QuestionCard) | `h-40 w-56` (160×224px) | `h-48 w-72` (192×288px) |

考虑到三栏布局会压缩中间宽度，头像不宜过大。建议适度放大 1.5 倍而非 2 倍。

## 需要修改的文件

| 文件 | 变更内容 |
|------|---------|
| `src/core/data/types.ts` | 新增 `BattleLogEntry` 接口；`BattleState` 新增 `log: BattleLogEntry[]` |
| `src/core/engine/battle.ts` | `answerQuestion` 新增 `isCrit` 返回值；`createBattle` 初始化 `log: []` |
| `src/stores/battleStore.ts` | `submitAnswer` 中追加日志记录；`finishMonsterTurn` 中更新上一条的 `damageTaken` |
| `src/components/battle/AnswerLog.tsx` | **新建**：左栏答题记录组件 |
| `src/components/battle/CombatLog.tsx` | **新建**：右栏战斗统计组件 |
| `src/pages/BattlePage.tsx` | 改为三栏 flex 布局；引入 AnswerLog 和 CombatLog；图片尺寸放大 |
| `src/components/battle/QuestionCard.tsx` | 单词图片尺寸从 `h-40 w-56` → `h-48 w-72` |

## 实现顺序

1. types.ts — 新增 BattleLogEntry
2. battle.ts — 修改 createBattle 初始化 log，answerQuestion 返回 isCrit
3. battleStore.ts — submitAnswer 追加日志，finishMonsterTurn 补录 damageTaken
4. AnswerLog.tsx + CombatLog.tsx — 新建两个 UI 组件
5. BattlePage.tsx — 三栏布局改造 + 图片放大
6. QuestionCard.tsx — 单词图片放大
7. TypeScript 编译验证 + Playwright 实机测试
