# Battle UI Enhancement & Event Fix — 设计规格

> 日期: 2026-06-29
> 状态: 已设计，待实施

---

## 概述

基于用户反馈，对游戏进行四项关键改进：修复 EventModal 随机事件无法正确推进的 bug、重构剧情播放器为单页全内容模式、放大关卡答题区域文字、调整题目类型权重。

---

## 1. EventModal 随机事件修复

### 问题

`App.tsx` 中的 `handleLoginChoice` 在事件选择后仅关闭弹窗，不检查 `EventChoice` 中的 `action` 字段。精英怪事件（如 `elite_wolf`）定义了 `action: 'battle'` + `actionPayload`，但选择后弹窗关闭，什么也没发生。

### 修复方案

在 `handleLoginChoice` 中，找出用户选择的 choice，检查其 `action` 和 `actionPayload`：

```typescript
const handleLoginChoice = useCallback(async (choiceId: string) => {
  if (!loginEvent) return;
  const engine = new EventEngine({ ... });
  await engine.executeChoice(loginEvent, choiceId);

  // Find the selected choice and check for action
  const selectedChoice = loginEvent.choices.find(c => c.id === choiceId);
  if (selectedChoice?.action === 'battle' && selectedChoice.actionPayload) {
    const { chapter, level, monsterId } = selectedChoice.actionPayload;
    const params = monsterId ? `?monster=${monsterId}` : '';
    navigate(`/battle/${chapter}/${level}${params}`);
  } else {
    setShowLoginEvent(false);
    setLoginEvent(null);
  }
}, [...]);
```

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/App.tsx` | `handleLoginChoice` 增加 action 检查 + navigate 跳转 |

---

## 2. StoryPlayer 单页全内容模式

### 设计决策

新增 `StoryPlayer` 模式：通过 `singlePage` prop 控制，当前 `beat.panels` 的所有内容渲染在同一页面。

### 渲染逻辑

- 遍历所有 `panels`，按序渲染：
  - `image` 类型：大图显示，尺寸从当前 `h-56` 放大到全屏宽度（`w-full max-h-[70vh]`）
  - `text` 类型：文字存入全局文字数组，由打字机效果逐个打出
  - `choice` 类型：所有 choices 在底部渲染
- 所有 image 先渲染完成，然后文字逐个打字输出（打字机继续保留）
- **完全移除**：ProgressBar、auto-advance timers、分页导航按钮
- 所有文字打字完成后，底部出现「继续」按钮
- 用户点击「继续」前，不执行 `onComplete`

### 状态管理

```typescript
// 新增状态
const [allTexts, setAllTexts] = useState<string[]>([]);  // 所有 panels 的文本数组
const [currentTextIndex, setCurrentTextIndex] = useState(0); // 当前打字文本索引
const [showContinue, setShowContinue] = useState(false);  // 是否显示继续按钮
```

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/components/adventure/StoryPlayer.tsx` | 新增单页模式渲染逻辑 + 打字机 + 继续按钮 |

---

## 3. 答题区域文字放大

### 当前尺寸 vs 新尺寸

| 元素 | 当前类名/尺寸 | 新类名/尺寸 |
|------|-------------|-------------|
| 选项文字 | `text-sm` (~14px) px-4 py-3 | `text-2xl` (~24px) px-6 py-5 |
| 题目提示 | `text-lg` (~18px) | `text-3xl` (~36px) |
| 单词/中文显示 | `text-3xl` (~30px) | `text-5xl` (~48px) |
| 选项标签圈 | `h-7 w-7` (28px) | `h-10 w-10` (40px) |
| 标签字号 | `text-xs` (~12px) | `text-lg` (~18px) |

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/components/battle/QuestionCard.tsx` | 修改各元素字号、padding、尺寸类 |

---

## 4. 题目权重调整

### 新权重配置

```typescript
export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.091,   // 原 0.11，调低
  'meaning-word': 0.265,   // 原 0.32，调低
  'fill-blank':   0.050,   // 原 0.06，调低
  'listening':    0.166,   // 原 0.20，调低
  'spell':        0.001,   // 原 0.15 → 0.1%
  'pos':          0.083,   // 原 0.10，调低
  'match':        0.250,   // 原 0.06 → 25%
};
```

> 计算逻辑：spell 从 0.15 降至 0.001（释放 0.149），match 从 0.06 提升至 0.25（消耗 0.19），其余类型等比例缩减至总和 1.0。缩减系数 = (1 - 0.001 - 0.25) / (1 - 0.15 - 0.06) = 0.749 / 0.79 ≈ 0.9481。

### 移除 Match 排除条件

`pickQuestionType` 中删除 `isBoss && type === 'match'` 的过滤逻辑，使 match 在所有关卡均可出现。

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/core/data/balance.ts` | 更新权重值 + 移除 isBoss 排除 match 的条件 |

---

## 文件变更清单汇总

| 操作 | 文件 | 变更类型 |
|------|------|----------|
| 修改 | `src/App.tsx` | `handleLoginChoice` 添加 action 检查 + navigate |
| 修改 | `src/components/adventure/StoryPlayer.tsx` | 新增单页全内容模式 |
| 修改 | `src/components/battle/QuestionCard.tsx` | 字号/尺寸放大 |
| 修改 | `src/core/data/balance.ts` | 新权重 + 移除 boss 排除 |

---

## 验收标准

1. 精英怪事件选择"迎战"后正确跳转到战斗页面，不卡在弹窗关闭
2. 剧情播放器：所有内容同屏显示，图片占屏幕宽度 70%+，打字机逐个打出文字，完成后出现「继续」按钮
3. 答题选项文字明显增大（约 2-3 倍），标签和按钮相应放大，布局不乱
4. 实际出题中 spell 几乎不出现，match 约 25% 比例，boss 关也能出 match
5. `tsc -b` 编译无报错
