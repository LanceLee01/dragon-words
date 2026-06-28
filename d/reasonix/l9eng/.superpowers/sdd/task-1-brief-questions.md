# Task 1 Brief: 更新 Word 类型定义 + 扩展 QuestionType

## 需求

1. 更新 `src/core/data/types.ts` 中的 `Word` 接口，添加已有字段和新字段
2. 扩展 `QuestionType` 联合类型
3. 将现有单一 `Question` 接口改为联合类型
4. TypeScript 编译通过，已有测试通过

## 具体变更

### 1. Word 接口

**当前代码：**
```typescript
export interface Word {
  english: string;
  chinese: string;
  level: WordLevel;
}
```

**改后代码：**
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

### 2. QuestionType 扩展

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

### 3. Question 联合类型

将 `export interface Question` 替换为以下内容：

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

## 注意

- 保留现有 `Question` 类型的使用方式——修改后各消费方需要加类型守卫
- `words.ts` 数据已经有 `id`、`difficulty`、`imagePath`、`correctCount`、`wrongCount`、`lastSeenAt` 字段（但类型未声明），添加后数据与类型一致
- `collocations` 和 `posVariants` 是可选字段（`?`），数据中不需要立即填充
- 运行 `npx tsc --noEmit` 确保编译通过
- 运行 `npx vitest run` 确保测试通过

## 验证命令

```bash
npx tsc --noEmit
npx vitest run
```
