# Task 2 Brief: 权重配置 + 轮盘出题算法 + 3 个生成器 + 测试

## 需求

1. 新建 `src/core/data/balance.ts` — 题型权重配置
2. 修改 `src/core/utils/question.ts` — 新增权重轮盘函数和 3 个生成器
3. 修改 `src/core/utils/question.test.ts` — 新增测试

## 依赖

Task 1 已将类型定义改为联合类型。当前的 `Question` 类型是 `TranslateQuestion | SpellQuestion | PosQuestion | MatchQuestion`。

当前 `generateQuestion` 函数的签名和实现需要重构。

## 具体变更

### 1. 新建 `src/core/data/balance.ts`

```typescript
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

export function pickQuestionType(
  weights: Record<string, number>,
  round: number,
  isBoss: boolean,
): QuestionType {
  const available = Object.entries(weights).filter(
    ([type]) => !(isBoss && type === 'match'),
  );
  const rand = ((round * 2654435761) % 1000) / 1000;
  let cumulative = 0;
  for (const [type, weight] of available) {
    cumulative += weight;
    if (rand < cumulative) return type as QuestionType;
  }
  return 'word-meaning';
}
```

### 2. 在 `question.ts` 新增 3 个生成函数

**`generateSpellQuestion(word, timeLimit): SpellQuestion`**

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

**`generatePosQuestion(word, wordPool, timeLimit): PosQuestion | null`**

60% collocation, 40% wordForm。如果 `word.collocations` 为空则返回 null（触发回退）。

- Collocation 题：从 `word.collocations` 选正确搭配，生成 3 个干扰项
- WordForm 题：从 `word.posVariants` 选正确形式，生成 3 个干扰项
- 干扰项生成：替换动词、同义词误配、语法错误
- 返回 null 时 caller 回退到 word-meaning

**`generateMatchQuestion(wordPool, timeLimit): MatchQuestion`**

从 `wordPool` 抽 5 个词，左右栏分别打乱，生成 `MatchPair[]`。

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
```

### 3. 重构 `generateQuestion` 函数

改为：
1. 选词（同现有逻辑, 30% 错题池）
2. 用 `pickQuestionType` 确定题型（传入轮数 + isBoss）
3. Spell 保底：如果前 2 题都不是 spell，第 3 题强制 spell
4. 调用对应生成器
5. 如果生成器返回 null（POS 数据不足），回退到 word-meaning

需要在函数参数中传递 `isBoss: boolean`。

当前函数签名：
```typescript
export function generateQuestion(
  wordPool: Word[],
  usedWordIds: Set<number>,
  timeLimit: number,
  chapter: number,
  mistakeWords?: Word[],
): Question | null
```

改为：
```typescript
export function generateQuestion(
  wordPool: Word[],
  usedWordIds: Set<number>,
  timeLimit: number,
  chapter: number,
  mistakeWords?: Word[],
  isBoss?: boolean,
): Question | null
```

### 4. 测试

在 `question.test.ts` 中添加针对新函数的测试：

**`generateSpellQuestion`:**
- 验证按 difficulty 提取正确数量的前缀字母
- 验证单词短于目标长度时取完整单词
- 验证返回对象结构

**`generateMatchQuestion`:**
- 验证返回 5 对
- 验证结构正确

**`pickQuestionType`:**
- Boss 关不返回 'match'
- 只返回有效类型

**`generateQuestion` (更新后的):**
- 验证新版 generateQuestion 能产生新题型
- 验证 Boss 关不产生 match

## 验证命令

```bash
npx tsc --noEmit
npx vitest run src/core/utils/question.test.ts
```
