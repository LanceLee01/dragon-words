# 三种新微题型 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Dragon Words 增加三种新题型（极速拼词、词性/搭配、极速配对），扩展出题引擎和 UI 组件

**Architecture:** 紧贴现有纯函数出题引擎 + Zustand store + React 组件架构。扩展 QuestionType 联合类型和 Question 联合类型，新增权重轮盘出题算法，为 Spell/Match 新增独立组件，POS 复用 4 选项网格。单词数据已有 id/difficulty 等字段但类型未声明，先补齐类型定义再扩展新字段。

**Tech Stack:** TypeScript, React 18, Zustand, Framer Motion, Tailwind CSS 4, Vitest

**Spec:** `docs/superpowers/specs/2026-06-28-three-new-question-types-design.md`

## Global Constraints

- 纯函数出题逻辑必须与 React 组件分离（现有架构保持一致）
- Question 类型改为联合类型后，现有代码中访问 `question.options` / `question.correctAnswer` 的地方需要加类型守卫
- 所有对外暴露的函数和组件需通过测试
- 无需真正录入 collocations/posVariants 语料数据——回退策略保证功能完整

---

### 任务 1: 更新 Word 类型定义 + 扩展 QuestionType

**文件：**
- 修改: `src/core/data/types.ts`

**说明：** words.ts 数据文件已含有 id, difficulty, imagePath, correctCount, wrongCount, lastSeenAt 字段，但 Word 接口未声明。先补齐这些字段，再添加新题型所需的 collocations/posVariants。同时扩展 QuestionType 联合类型。

- [ ] **步骤 1: 更新 Word 接口**

将：

```typescript
export interface Word {
  english: string;
  chinese: string;
  level: WordLevel;
}
```

改为：

```typescript
export interface Word {
  id: number;
  english: string;
  chinese: string;
  level: WordLevel;
  difficulty: 1 | 2 | 3;
  imagePath: string;
  correctCount: number;
  wrongCount: number;
  lastSeenAt: number;
  collocations?: string[];
  posVariants?: {
    noun?: string;
    verb?: string;
    adj?: string;
    adv?: string;
  };
}
```

- [ ] **步骤 2: 扩展 QuestionType**

```typescript
export type QuestionType =
  | 'word-meaning'
  | 'meaning-word'
  | 'fill-blank'
  | 'listening'
  | 'spell'
  | 'pos'
  | 'match';
```

- [ ] **步骤 3: 改为 Question 联合类型**

将现有单一 `Question` 接口替换为：

```typescript
export interface BaseQuestion {
  type: QuestionType;
  timeLimit: number;
}

export interface TranslateQuestion extends BaseQuestion {
  type: 'word-meaning' | 'meaning-word' | 'listening' | 'fill-blank';
  word: Word;
  options: string[];
  correctAnswer: string;
  imagePath: string;
}

export interface SpellQuestion extends BaseQuestion {
  type: 'spell';
  word: Word;
  targetLetters: string[];
  maxLength: number;
  chineseHint: string;
  audioPath?: string;
}

export interface PosQuestion extends BaseQuestion {
  type: 'pos';
  subtype: 'collocation' | 'wordForm';
  word: Word;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MatchPair {
  id: string;
  left: { type: 'text'; content: string; wordId: number };
  right: { type: 'text' | 'image'; content: string; wordId: number };
  locked: boolean;
}

export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  pairs: MatchPair[];
  reward: { goldBase: number; goldMultiplier: number; shieldBonus: number };
}

export type Question =
  | TranslateQuestion
  | SpellQuestion
  | PosQuestion
  | MatchQuestion;
```

- [ ] **步骤 4: 运行 TypeScript 编译检查确认无错误**

```bash
npx tsc --noEmit
```

预期：通过（words.ts 数据与 Word 接口可能有不一致，需要调整）

- [ ] **步骤 5: 提交**

```bash
git add src/core/data/types.ts
git commit -m "feat: expand Word/Question types for 3 new question types"
```

---

### 任务 2: 权重配置 + 轮盘出题算法

**文件：**
- 新建: `src/core/data/balance.ts`
- 修改: `src/core/utils/question.ts`
- 修改: `src/core/utils/question.test.ts`

**接口：**
- 消费: Task 1 中扩展的 `QuestionType`, `Word`, `Question` 联合类型
- 产出: `pickQuestionType(weights, round, isBoss): QuestionType` 和 `generateSpellQuestion`, `generatePosQuestion`, `generateMatchQuestion`

- [ ] **步骤 1: 创建 `balance.ts`**

```typescript
// src/core/data/balance.ts
import type { QuestionType } from './types';

export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.30,
  'meaning-word': 0.10,
  'fill-blank':   0.05,
  'listening':    0.20,
  'spell':        0.20,
  'pos':          0.10,
  'match':        0.05,
};

/**
 * Pick a question type via weighted roulette.
 * - Boss level: excludes 'match' (redistribute to word-meaning + listening)
 * - Spell guarantee: if no spell appears in first 3 rounds, force round 3 to spell
 */
export function pickQuestionType(
  weights: Record<string, number>,
  round: number,
  isBoss: boolean,
): QuestionType {
  const available = Object.entries(weights).filter(
    ([type]) => !(isBoss && type === 'match'),
  );

  // Spell guarantee: round 0-2, if none was 'spell' yet, force on round 2
  // (caller tracks whether spell appeared)

  const rand = ((round * 2654435761) % 1000) / 1000;
  let cumulative = 0;
  for (const [type, weight] of available) {
    cumulative += weight;
    if (rand < cumulative) return type as QuestionType;
  }
  return 'word-meaning';
}
```

- [ ] **步骤 2: 在 `question.ts` 新增 `generateSpellQuestion`**

```typescript
export function generateSpellQuestion(word: Word, timeLimit: number): SpellQuestion {
  const lenMap = { 1: 3, 2: 4, 3: 5 } as const;
  const targetLen = Math.min(lenMap[word.difficulty ?? 2], word.english.length);
  return {
    type: 'spell',
    word,
    targetLetters: word.english.slice(0, targetLen).toUpperCase().split(''),
    maxLength: targetLen,
    chineseHint: word.chinese,
    timeLimit: timeLimit + 2,
  };
}
```

- [ ] **步骤 3: 新增 `generatePosQuestion`**

```typescript
export function generatePosQuestion(word: Word, wordPool: Word[], timeLimit: number): PosQuestion | null {
  // 60% collocation, 40% wordForm
  if (Math.random() < 0.6 && word.collocations && word.collocations.length > 0) {
    const correct = word.collocations[Math.floor(Math.random() * word.collocations.length)];
    const distractors = generateCollocationDistractors(correct, word);
    return {
      type: 'pos',
      subtype: 'collocation',
      word,
      stem: `选择 "${word.english}" 的正确搭配`,
      options: shuffle([correct, ...distractors]),
      correctIndex: 0, // Will be set after shuffle
      explanation: `"${word.english}" 常搭配：${word.collocations.join('、')}`,
      timeLimit,
    };
  }
  // If no collocation data, fallback
  return null;
}
```

- [ ] **步骤 4: 新增 `generateMatchQuestion`**

```typescript
export function generateMatchQuestion(wordPool: Word[], timeLimit: number): MatchQuestion {
  const selected = shuffle([...wordPool]).slice(0, 5);
  const pairs: MatchPair[] = selected.map((w, i) => ({
    id: `pair_${i}`,
    left: { type: 'text', content: w.english, wordId: w.id },
    right: { type: 'text', content: w.chinese, wordId: w.id },
    locked: false,
  }));
  return {
    type: 'match',
    pairs: shufflePairs(pairs),
    timeLimit: 30,
    reward: { goldBase: 10, goldMultiplier: 1.5, shieldBonus: 1 },
  };
}

function shufflePairs(pairs: MatchPair[]): MatchPair {
  const leftItems = shuffle(pairs.map(p => p.left));
  const rightItems = shuffle(pairs.map(p => p.right));
  return pairs.map((p, i) => ({
    ...p,
    left: leftItems[i],
    right: rightItems[i],
  }));
}
```

- [ ] **步骤 5: 重构 `generateQuestion` 使用轮盘 + 生成器注册表**

改写 `generateQuestion` 函数使其根据 `pickQuestionType` 结果分发到对应生成器。当 POS 生成器返回 null（数据不足）时回退到 word-meaning。

- [ ] **步骤 6: 编写测试**

在 `question.test.ts` 中添加：

```typescript
describe('generateSpellQuestion', () => {
  it('extracts first N letters based on difficulty', () => {
    const word = { ...SAMPLE_WORDS[0], difficulty: 2, english: 'COURAGE' };
    const q = generateSpellQuestion(word, 10);
    expect(q.targetLetters.join('')).toBe('COUR');
    expect(q.maxLength).toBe(4);
  });

  it('uses full word if shorter than target length', () => {
    const word = { ...SAMPLE_WORDS[0], difficulty: 2, english: 'DOG' };
    const q = generateSpellQuestion(word, 10);
    expect(q.targetLetters.join('')).toBe('DOG');
    expect(q.maxLength).toBe(3);
  });
});

describe('generateMatchQuestion', () => {
  it('returns 5 pairs with shuffled sides', () => {
    const q = generateMatchQuestion(SAMPLE_WORDS, 30);
    expect(q.pairs).toHaveLength(5);
    expect(q.type).toBe('match');
  });
});

describe('pickQuestionType', () => {
  it('never returns match for boss levels', () => {
    for (let i = 0; i < 100; i++) {
      const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, i, true);
      expect(type).not.toBe('match');
    }
  });

  it('returns only valid types', () => {
    for (let i = 0; i < 100; i++) {
      const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, i, false);
      expect(Object.keys(QUESTION_TYPE_WEIGHTS)).toContain(type);
    }
  });
});
```

- [ ] **步骤 7: 运行测试确保通过**

```bash
npx vitest run src/core/utils/question.test.ts
```

- [ ] **步骤 8: 提交**

```bash
git add src/core/data/balance.ts src/core/utils/question.ts src/core/utils/question.test.ts
git commit -m "feat: weighted question type roulette + 3 new generators"
```

---

### 任务 3: 更新 battleStore 支持新题型判定

**文件：**
- 修改: `src/stores/battleStore.ts`

**接口：**
- 消费: Task 1 的 `Question` 联合类型, Task 2 的 `generate*` 函数
- 产出: `submitAnswer` 适配新判定逻辑, 新增 `matchConnect` action

- [ ] **步骤 1: 新增 `matchConnect` action**

```typescript
matchConnect: (leftWordId: number, rightWordId: number) => {
  const { currentQuestion } = get();
  if (!currentQuestion || currentQuestion.type !== 'match') return;

  const matchQ = currentQuestion as MatchQuestion;
  const correct = leftWordId === rightWordId;

  // Update the pair state
  const updatedPairs = matchQ.pairs.map(p => {
    if (p.left.wordId === leftWordId && p.right.wordId === rightWordId) {
      return { ...p, locked: correct };
    }
    return p;
  });

  set({
    currentQuestion: { ...matchQ, pairs: updatedPairs } as Question,
  });

  // Check if all pairs locked
  const allLocked = updatedPairs.every(p => p.locked);
  if (allLocked) {
    // Trigger settlement
    const completedCount = updatedPairs.filter(p => p.locked).length;
    // ... reward logic
  }
}
```

- [ ] **步骤 2: 修改 `submitAnswer` 添加 evaluateAnswer 分发**

```typescript
function evaluateAnswer(question: Question, answer: string | number): boolean {
  switch (question.type) {
    case 'spell':
      return answer === (question as SpellQuestion).targetLetters.join('');
    case 'pos':
      return Number(answer) === (question as PosQuestion).correctIndex;
    default:
      return answer === (question as TranslateQuestion).correctAnswer;
  }
}
```

在 `submitAnswer` 中替换 `selected === currentQuestion.correctAnswer` 为 `evaluateAnswer(currentQuestion, selected)`。

- [ ] **步骤 3: 处理 Match 特殊结算**

在 `finishMonsterTurn` 或 `matchConnect` 中完成 Match 的奖励结算逻辑（每对+1 combo，全对额外+1 护盾+金币×1.5）。

- [ ] **步骤 4: 提交**

```bash
git add src/stores/battleStore.ts
git commit -m "feat: adapt battleStore for new question types"
```

---

### 任务 4: 新增 QuestionRenderer + SpellQuestion 组件

**文件：**
- 新建: `src/components/battle/QuestionRenderer.tsx`
- 新建: `src/components/battle/SpellQuestion.tsx`

**接口：**
- 消费: Task 1 的 `Question` 联合类型
- 产出: 按 `question.type` 分发渲染的组件

- [ ] **步骤 1: 创建 `QuestionRenderer.tsx`**

```typescript
import type { Question } from '@/core/data/types';
import { QuestionCard } from './QuestionCard';
import { SpellQuestion } from './SpellQuestion';
import { MatchQuestion } from './MatchQuestion';

interface Props {
  question: Question;
  onAnswer: (answer: string | number) => void;
  disabled: boolean;
}

export function QuestionRenderer({ question, onAnswer, disabled }: Props) {
  switch (question.type) {
    case 'spell':
      return <SpellQuestion question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'match':
      return <MatchQuestion question={question} onAnswer={onAnswer} disabled={disabled} />;
    default:
      return <QuestionCard question={question} onAnswer={onAnswer} disabled={disabled} />;
  }
}
```

- [ ] **步骤 2: 创建 `SpellQuestion.tsx`**

核心交互：显示单词占位符 + 字母键盘。点击字母填入槽，退格删除，满长度自动提交。

```typescript
// SpellQuestion.tsx
// State: inputLetters: string[]
// 1. Display word slots: show filled letters + empty underscores
// 2. Alphabet keyboard: 8-8-8-2 grid layout
// 3. On letter click: add to inputLetters
// 4. On backspace: pop last letter
// 5. When inputLetters.length === maxLength: auto-submit via onAnswer(inputLetters.join(''))
// 6. Show chinese hint below the slots
```

键盘布局：
```
A B C D E F G H
I J K L M N O P
Q R S T U V W X
Y Z ← ✓
```

- [ ] **步骤 3: 实现字母点击交互和物理键盘支持**

- 使用 `useCallback` + `useEffect` 监听物理键盘 keydown
- 仅允许字母键 A-Z、退格、回车
- 物理键盘输入实时同步到字母槽

- [ ] **步骤 4: 提交**

```bash
git add src/components/battle/QuestionRenderer.tsx src/components/battle/SpellQuestion.tsx
git commit -m "feat: QuestionRenderer + SpellQuestion component"
```

---

### 任务 5: 新增 MatchQuestion 组件

**文件：**
- 新建: `src/components/battle/MatchQuestion.tsx`

**接口：**
- 消费: `MatchQuestion`, `MatchPair`
- 产出: 双栏点击连线 UI

- [ ] **步骤 1: 创建 MatchQuestion.tsx**

核心交互：点击左侧单词 → 高亮 → 点击右侧释义 → 连线判定。

```typescript
interface MatchQuestionProps {
  question: MatchQuestion;
  onConnect: (leftWordId: number, rightWordId: number) => void;
  disabled: boolean;
}
```

- State: `selectedLeftId: number | null`
- **连线判定不通过 onAnswer，而是通过 onConnect 回调**（BattlePage 调用 matchConnect）
- 正确锁定显示绿色 + ✅，错误抖动回弹 + ❌
- 顶部显示进度 x/5 和 30s 倒计时
- 全部锁定或超时触发结算

- [ ] **步骤 2: 实现连线动画**

- 使用 Framer Motion 的 `motion.div` 实现：
  - 选中左栏：边框高亮动画（蓝色 rune 发光）
  - 正确连线：绿色锁定 + 缩放脉冲
  - 错误配对：红色抖动（`x: [0, -5, 5, -5, 5, 0]`）

- [ ] **步骤 3: 提交**

```bash
git add src/components/battle/MatchQuestion.tsx
git commit -m "feat: MatchQuestion component with dual-pane click-to-connect"
```

---

### 任务 6: 集成到 BattlePage + 端到端打通

**文件：**
- 修改: `src/pages/BattlePage.tsx`
- 修改: `src/components/battle/QuestionCard.tsx`（可选微调）
- 修改: `src/index.css`（可选）

- [ ] **步骤 1: BattlePage 使用 QuestionRenderer 替换直接引用 QuestionCard**

```typescript
// 替换:
import { QuestionCard } from '@/components/battle/QuestionCard';
// 改为:
import { QuestionRenderer } from '@/components/battle/QuestionRenderer';

// 替换:
<QuestionCard question={currentQuestion} onAnswer={handleAnswer} disabled={answeredRef.current} />
// 改为:
<QuestionRenderer question={currentQuestion} onAnswer={handleAnswer} disabled={answeredRef.current} />
```

- [ ] **步骤 2: Match 事件处理**

为 MatchQuestion 添加独立回调：

```typescript
const handleMatchConnect = useCallback(
  (leftWordId: number, rightWordId: number) => {
    if (answeredRef.current) return;
    submitMatchConnect(leftWordId, rightWordId);
  },
  [submitMatchConnect],
);
```

从 battleStore 获取 `submitMatchConnect`（包装 `matchConnect`）。

- [ ] **步骤 3: 添加 D&D 主题 CSS 变量到 `index.css`**

```css
:root {
  --color-parchment: #fdf6e3;
  --color-gold: #d4a843;
  --color-rune-blue: #3a7bd5;
  --color-blood-red: #c0392b;
  --color-nature-green: #27ae60;
  --font-gothic: 'Cinzel Decorative', cursive;
  --font-hand: 'MedievalSharp', cursive;
}
```

- [ ] **步骤 4: 运行编译检查 + 全部测试**

```bash
npx tsc --noEmit
npx vitest run
```

预期：全部通过，0 errors

- [ ] **步骤 5: 提交**

```bash
git add src/pages/BattlePage.tsx src/components/battle/QuestionCard.tsx src/index.css
git commit -m "feat: integrate new question types into BattlePage"
```

---

### 任务 7: 端到端手动验证清单

- [ ] **步骤 1: 启动 dev server**

```bash
npm run dev
```

- [ ] **步骤 2: 手动验证清单**

| 验证项 | 操作 | 预期 |
|--------|------|------|
| 进入战斗 | 在首页点"开始战斗" | 能看到战斗正常加载 |
| word-meaning 题型 | 等待出题 | 4 选项网格，正常点击答题 |
| spell 题型 | 等待出题（20% 概率） | 看到字母槽+软键盘，可以拼写 |
| spell 判定 | 拼写正确/错误 | 正确放行，错误 combo 归零 |
| pos 题型 | 等待出题（10% 概率） | 4 选项，答错显示搭配小贴士 |
| match 题型 | 等待出题（5% 概率，非 Boss）| 双栏连线界面，可点击连线 |
| match 全对 | 连对所有 5 对 | 结算显示金币×1.5 + 额外护盾 |
| 战斗结束 | 打完一场 | 正常跳转胜利/失败画面 |

- [ ] **步骤 3: 修复任何发现的问题**

- [ ] **步骤 4: 最终提交**

```bash
git add -A
git commit -m "chore: final adjustments after manual verification"
```
