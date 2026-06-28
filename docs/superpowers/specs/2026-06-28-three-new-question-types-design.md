# 三种新微题型 — 设计与实现规范

> 为 Dragon Words 增加三种新题型：极速拼词、词性/搭配判断、极速配对
> 参考设计来源: `micro-question-types-examples.md`

**日期:** 2026-06-28
**状态:** 已设计，待实现

---

## 1. 概述

在现有 `word-meaning` 和 `listening` 两种题型基础上，增加三种新题型以丰富玩法：

| 题型 | 类型标识 | 交互模式 | 权重 |
|------|---------|---------|------|
| 极速拼词 | `spell` | 虚拟键盘拼写单词前N字母 | 20% |
| 词性/搭配 | `pos` | 4选项选择正确搭配/词性 | 10% |
| 极速配对 | `match` | 双栏点击连线，5对/局 | 5% |

### 目标

- 增加游戏深度和复玩性
- 覆盖更多语言学习维度（拼写、搭配、词义对应）
- 维持 D&D 主题美术风格一致性
- 现有题型逻辑零破坏

---

## 2. 数据模型变更

### 2.1 `QuestionType` 扩展

```typescript
// src/core/data/types.ts
export type QuestionType =
  | 'word-meaning'
  | 'meaning-word'
  | 'fill-blank'
  | 'listening'
  | 'spell'      // 新增
  | 'pos'        // 新增
  | 'match';     // 新增
```

### 2.2 `Word` 接口扩展

```typescript
export interface Word {
  english: string;
  chinese: string;
  level: WordLevel;
  difficulty?: 1 | 2 | 3;           // 难度等级（spell 用）
  collocations?: string[];           // 常用搭配（pos 用）
  posVariants?: {
    noun?: string;
    verb?: string;
    adj?: string;
    adv?: string;
  };
}
```

### 2.3 `Question` 联合类型

现有单一接口改为联合类型，保证各题型携带特有字段：

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

export type Question = TranslateQuestion | SpellQuestion | PosQuestion | MatchQuestion;
```

---

## 3. 出题引擎

### 3.1 权重轮盘

新增 `src/core/data/balance.ts`:

```typescript
export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.30,
  'meaning-word': 0.10,
  'fill-blank':   0.05,
  'listening':    0.20,
  'spell':        0.20,
  'pos':          0.10,
  'match':        0.05,   // 仅非 Boss 关
};
```

`pickQuestionType` 使用伪随机轮盘算法。**Spell 保底：** 每场战斗前 3 题中，如轮盘未抽到 spell，第 3 题强制转为 spell。**Boss 关排除：** Boss 关卡权重中 `match` 的 5% 重新分配给 `word-meaning`（+3%）和 `listening`（+2%）。

### 3.2 生成器注册表

```typescript
type Generator = (word: Word, wordPool: Word[], timeLimit: number) => Question;

const generators: Record<string, Generator> = {
  'word-meaning': generateTranslateQuestion,
  'listening':    generateListeningQuestion,
  'spell':        generateSpellQuestion,
  'pos':          generatePosQuestion,
  'match':        generateMatchQuestion,
};
```

`generateQuestion` 入口函数：选词 → 轮盘定题型 → 调用对应生成器。

### 3.3 Spell 生成算法

```typescript
function generateSpellQuestion(word: Word, timeLimit: number): SpellQuestion {
  const lenMap = { 1: 3, 2: 4, 3: 5 } as const;
  const targetLen = Math.min(lenMap[word.difficulty ?? 2], word.english.length);
  return {
    type: 'spell',
    word,
    targetLetters: word.english.slice(0, targetLen).toUpperCase().split(''),
    maxLength: targetLen,
    chineseHint: word.chinese,
    timeLimit: timeLimit + 2,  // 拼写题多 2 秒
  };
}
```

### 3.4 POS 生成算法

- 60% 概率出搭配题：从 `word.collocations` 取正确搭配 + 3 个干扰项
- 40% 概率出词性题：给句子填空，4 个同根词选 1
- 干扰项策略：替换动词、同义词误配、语法错误
- **兜底策略：** 如果 `word.collocations` 为空且 `word.posVariants` 为空（数据未录入），回退到 `word-meaning` 题型

### 3.5 Match 生成算法

- 从当前关卡词汇表抽 5 对，优先包含错题本中的词
- 左右栏分别打乱，确保正确连线唯一对应关系
- 生成时限制为 30 秒

---

## 4. UI 组件

### 4.1 组件结构

```
BattlePage.tsx
└── QuestionRenderer.tsx        // 按 question.type 分发
    ├── QuestionCard.tsx        // 复用：word-meaning, listening, meaning-word, fill-blank, pos
    ├── SpellQuestion.tsx       // 新增：虚拟键盘 + 字母槽
    └── MatchQuestion.tsx       // 新增：双栏点击连线
```

### 4.2 QuestionCard 复用

`pos` 题型可直接复用现有 QuestionCard 的 4 选项网格，只需额外传入 `explanation` 字段，答错后显示搭配小贴士。

### 4.3 SpellQuestion 组件

- 顶部：单词长度占位符（如 `C O U R _ _ _ _`）+ 中文释义
- 中部：26 字母软键盘（A-Z）+ 退格 ← + 确认 ✓ 按钮
- 仅允许字母输入，按行排列 8-8-8-2 布局
- 已输入满足 `maxLength` 时自动提交
- 支持物理键盘输入

### 4.4 MatchQuestion 组件

- 左栏英文单词列表（点击高亮）+ 右栏中文释义列表（乱序）
- 点左 → 点右 完成连线，正确锁定（绿色），错误抖动回弹
- 顶部进度条：x/5 + 倒计时环
- 全部完成或超时自动结算

### 4.5 CSS/D&D 主题

```css
:root {
  --color-parchment: #fdf6e3;
  --color-gold: #d4a843;
  --color-rune-blue: #3a7bd5;
  --font-gothic: 'Cinzel Decorative', cursive;
  --font-hand: 'MedievalSharp', cursive;
}
```

---

## 5. Store 改造

### 5.1 submitAnswer 判定

```typescript
function evaluateAnswer(question: Question, answer: string | number): boolean {
  switch (question.type) {
    case 'spell': return answer === question.targetLetters.join('');
    case 'pos':   return Number(answer) === (question as PosQuestion).correctIndex;
    default:      return answer === (question as TranslateQuestion).correctAnswer;
  }
}
```

### 5.2 Match 独立 action

Match 题型逐对连线，不通过 `submitAnswer` 处理，新增：

```typescript
matchConnect: (leftWordId: number, rightWordId: number) => void
```

内部判定 `leftWordId === rightWordId`，正确锁定，错误扣秒。全部 5 对完成后触发 `settleMatch` 结算奖励。

---

## 6. 测试计划

| 文件 | 新增测试 |
|------|---------|
| `question.test.ts` | 3 个新题型的 `generate*` 函数 + `pickQuestionType` 权重分布 + `evaluateAnswer` 判定 |
| `battle.test.ts` | Match 逐对连线 + 全对结算 + 部分正确结算 |

---

## 7. 文件变更清单

| 文件 | 变更 |
|------|------|
| `src/core/data/types.ts` | 修改：QuestionType、Word、Question |
| `src/core/data/balance.ts` | 新增：权重配置 |
| `src/core/utils/question.ts` | 修改：3 个生成函数 + 轮盘 |
| `src/core/utils/question.test.ts` | 修改：新增测试 |
| `src/components/battle/SpellQuestion.tsx` | 新增 |
| `src/components/battle/MatchQuestion.tsx` | 新增 |
| `src/components/battle/QuestionRenderer.tsx` | 新增 |
| `src/components/battle/QuestionCard.tsx` | 修改：支持 pos/meaning-word/fill-blank |
| `src/pages/BattlePage.tsx` | 修改：接入 QuestionRenderer |
| `src/stores/battleStore.ts` | 修改：evaluateAnswer + matchConnect |
| `src/index.css` | 修改：D&D 主题变量 |
