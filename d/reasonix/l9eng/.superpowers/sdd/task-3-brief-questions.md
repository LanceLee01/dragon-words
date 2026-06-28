# Task 3 Brief: 更新 battleStore 支持新题型判定

## 需求

修改 `src/stores/battleStore.ts`，适配新题型的判定逻辑和 Match 特殊交互。

## 依赖

- Task 1: `Question` 现在是联合类型
- Task 2: `generateQuestion` 现在接受可选的 `isBoss` 参数，支持新题型生成

## 具体变更

### 1. 新增 `matchConnect` action

Match 题型不是一次性答题，而是逐对连线。需要新增：

```typescript
matchConnect: (leftWordId: number, rightWordId: number) => void
```

逻辑：
- 获取当前 question，检查是否是 match 类型
- 判定 `leftWordId === rightWordId`
- 正确：更新该 pair 的 `locked = true`，播放正确音效
- 错误：不锁定，可重新尝试（错误时倒扣 1 秒剩余时间）
- 如果全部 5 对都 locked，触发结算：
  - 每对 +1 combo
  - 全对额外 +1 护盾 + 金币 ×1.5
  - 设置 `lastAnswerCorrect = true`，下一轮

Match 不需要调用 `submitAnswer`，因为它自身管理状态。

### 2. 修改 `submitAnswer` 的判定方式

现有 `submitAnswer` 用 `selected === currentQuestion.correctAnswer` 直接字符串比较。

改为调用 `evaluateAnswer` 函数分发判定：

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

在 `submitAnswer` 中将 `const correct = selected === currentQuestion.correctAnswer` 替换为：
```typescript
const correct = evaluateAnswer(currentQuestion, selected);
```

### 3. 传递 `isBoss` 参数

Task 2 的 `generateQuestion` 新增 `isBoss?: boolean` 参数。

在 `generateNextQuestion` 中，当前已经有 `isBoss` 判断：
```typescript
const isBoss = useBattleStore.getState().battle?.isBoss ?? false;
```

这已经用于 `getTimeLimit`，现在也需要传给 `generateQuestion`：
```typescript
return generateQuestion(wp, usedWordIds, timeLimit, ch, undefined, isBoss);
```

### 4. Match 奖励结算

在 `matchConnect` 中，当所有 pairs 都被 locked 时：

```typescript
// 计算完成对数和奖励
const completedPairs = updatedPairs.filter(p => p.locked).length;
const allCorrect = completedPairs === updatedPairs.length;
const goldMatch = 10 * completedPairs * (allCorrect ? 1.5 : 1);
const shieldBonus = allCorrect ? 1 : 0;

// 更新 battle 状态
// combo += completedPairs
// 如果 allCorrect: 护盾 +1
```

## 验证命令

```bash
npx tsc --noEmit
npx vitest run
```

## 注意

- 不要在 battleStore 中直接修改 `pairs` 引用——用不可变更新
- MatchQuestion 目前是联合类型的一部分，需要用类型守卫
- `matchConnect` 应在 BattlePage 中通过事件处理绑定
- 音效播放保持简单（暂时不新增音效文件）
