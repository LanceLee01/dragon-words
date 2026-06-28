# Task 4 Brief: QuestionRenderer + SpellQuestion 组件

## 需求

1. 新建 `src/components/battle/QuestionRenderer.tsx` — 按 `question.type` 分发的路由组件
2. 新建 `src/components/battle/SpellQuestion.tsx` — 极速拼词组件（虚拟键盘 + 字母槽）

## 依赖

- Task 1: `Question` 联合类型有 `'spell'` 类型分支
- Task 2: `generateSpellQuestion` 可生成 SpellQuestion
- Task 3: `battleStore.submitAnswer` 可接受拼词答案字符串

## 具体变更

### 1. QuestionRenderer.tsx

按 `question.type` 分发到对应组件。`pos` 题型复用现有 `QuestionCard`。

```typescript
import type { Question } from '@/core/data/types';
import { QuestionCard } from './QuestionCard';
import { SpellQuestion } from './SpellQuestion';
import { MatchQuestion } from './MatchQuestion';

interface Props {
  question: Question;
  onAnswer: (answer: string | number) => void;
  onMatchConnect?: (leftWordId: number, rightWordId: number) => void;
  disabled: boolean;
}

export function QuestionRenderer({ question, onAnswer, onMatchConnect, disabled }: Props) {
  switch (question.type) {
    case 'spell':
      return <SpellQuestion question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'match':
      return <MatchQuestion question={question} onMatchConnect={onMatchConnect} disabled={disabled} />;
    default:
      return <QuestionCard question={question} onAnswer={onAnswer} disabled={disabled} />;
  }
}
```

注意：pos 题型走 default 分支（复用 QuestionCard）。

### 2. SpellQuestion.tsx

一个独立组件，包含：

**状态：**
- `inputLetters: string[]` — 已输入的字母序列

**UI 结构：**
```
┌──────────────────────────────────┐
│  📝 courage (n. 勇气)            │
│                                  │
│   ┌─────────────────────┐       │
│   │ C │ O │ U │ R │ _ │ _ │ _ │ _ │
│   └─────────────────────┘       │
│                                  │
│   ┌───┬───┬───┬───┬───┬───┬───┬───┐
│   │ A │ B │ C │ D │ E │ F │ G │ H │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ I │ J │ K │ L │ M │ N │ O │ P │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ Q │ R │ S │ T │ U │ V │ W │ X │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤
│   │ Y │ Z │   │ ← │   │ ✓ │   │   │
│   └───┴───┴───┴───┴───┴───┴───┴───┘
│                                  │
│   已输入: C O U R                │
└──────────────────────────────────┘
```

**交互：**
- 点击字母按钮 → 追加到 `inputLetters`
- 点击「←」退格 → 弹出最后一个字母
- 当 `inputLetters.length === maxLength` 时自动提交
- 物理键盘 A-Z 键输入，退格键删除，回车提交
- 已输入的字母按钮显示为灰色禁用态
- 提交后禁用所有交互

**Props 类型：**
```typescript
interface SpellQuestionProps {
  question: SpellQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}
```

**样式：**
- 使用 Tailwind CSS，配合 D&D 主题色
- 字母槽：白色背景圆角格，字母居中，空格显示为 `_`
- 字母按钮：深色背景，悬停高亮，点击缩放动画（使用 framer-motion）
- 当前活跃字母槽有蓝色边框高亮

**判定逻辑：** 拼写完成时调用 `onAnswer(inputLetters.join(''))`，battleStore 会对比 `targetLetters.join('')`。

## 验证命令

```bash
npx tsc --noEmit
npx vitest run
```
