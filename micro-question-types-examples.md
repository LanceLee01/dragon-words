# 微题型实例设计（可直接落地）

> 对应 P0 改进方案中的 3 种新题型，每种给出：UI 交互、数据结构、出题算法、判定逻辑、ComfyUI 素材需求。

---

## 1. 极速拼词

### 1.1 交互原型

```
┌─────────────────────────────────────┐
│  🛡️  护盾: 2   ⚔️  Combo: 4   ⏱️ 08s │
├─────────────────────────────────────┤
│                                     │
│        📝  拼写前 4 字母            │
│                                     │
│       ┌─────────────────────┐       │
│       │  C O U R _ _ _ _    │       │  ← 目标单词：courage (n. 勇气)
│       └─────────────────────┘       │
│                                     │
│   中文提示：勇气                     │
│   🔊 点击播放发音（可重播 1 次）     │
│                                     │
│   ┌───┬───┬───┬───┬───┬───┬───┬───┐ │
│   │ A │ B │ C │ D │ E │ F │ G │ H │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│   │ I │ J │ K │ L │ M │ N │ O │ P │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│   │ Q │ R │ S │ T │ U │ V │ W │ X │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┤ │
│   │ Y │ Z │ ← │ ✓ │   │   │   │   │ │
│   └───┴───┴───┴───┴───┴───┴───┴───┘ │
│                                     │
│   已输入：C O U R                    │
│   剩余：_ _ _ _                      │ 得分                    │
└─────────────────────────────────────┘
```

### 1.2 核心规则

| 项 | 规则 |
|----|------|
| **目标** | 拼写单词**前 4 字母**（或全词 ≤4 字母则全拼） |
| **限时** | 10 秒（听音题 +2s = 12s） |
| **交互** | 点击屏幕软键盘 / 物理键盘输入，**仅允许输入字母**，错字可点「←」退格 |
| **提示** | 始终显示中文释义 + 单词长度占位符（`_ _ _ _ _ _`）+ 可选发音 |
| **判定** | 4 字母全对 → **正确**（+1 Combo、触发伤害）<br>任一字母错 / 超时 → **错误**（扣护盾/血、Combo 归零） |
| **难度自适应** | - 简单词：拼前 3 字母<br>- 中等词：拼前 4 字母<br>- 困难词：拼前 5 字母（配置在 `Word.difficulty`） |

### 1.3 数据结构

```typescript
// core/engine/question.ts
interface SpellQuestion extends BaseQuestion {
  type: 'spell';
  // 运行时生成字段
  targetLetters: string[];      // ['C','O','U','R'] 目标字母序列
  maxLength: number;            // 4 (或 3/5)
  chineseHint: string;          // "勇气"
  audioPath?: string;           // 预录发音路径
}

// 生成函数签名
function generateSpellQuestion(word: Word, difficulty: 1|2|3): SpellQuestion {
  const lenMap = { 1: 3, 2: 4, 3: 5 };
  const targetLen = Math.min(lenMap[difficulty], word.english.length);
  return {
    type: 'spell',
    wordId: word.id,
    english: word.english,
    chineseHint: word.chinese,
    targetLetters: word.english.slice(0, targetLen).toUpperCase().split(''),
    maxLength: targetLen,
    audioPath: word.audioPath,  // 预录 mp3
    timeLimit: 10000 + (word.questionType === 'listening' ? 2000 : 0),
  };
}
```

### 1.4 出题权重配置

```typescript
// core/data/balance.ts
questionTypeWeights: {
  'translate': 0.40,   // 英译中
  'listening': 0.25,   // 听音辨义
  'spell': 0.20,       // 极速拼词 ← 新增
  'pos': 0.10,         // 词性/搭配 ← 新增
  'match': 0.05,       // 极速配对 ← 新增
}
```

### 1.5 ComfyUI 素材需求

| 素材 | 规格 | 提示词建议 |
|------|------|------------|
| 拼词界面背景 | 1024×768 | `D&D style parchment background, worn edges, magical runes border, warm sepia tones, high detail` |
| 字母键盘按键 | 80×80 × 26 | `medieval fantasy letter tile, illuminated manuscript style, gold leaf letter {A-Z}, stone texture, 3D render` |
| 正确/错误反馈特效 | 序列帧 | `golden sparkle burst` / `red cracked stone shatter` |

---

## 2. 词性/搭配判断

### 2.1 交互原型

```
┌─────────────────────────────────────┐
│  🛡️  护盾: 1   ⚔️  Combo: 7   ⏱️ 12s │
├─────────────────────────────────────┤
│                                     │
│        📚  选出正确的搭配           │
│                                     │
│       目标单词：decision (n. 决定)   │
│       ┌─────────────────────────┐   │
│       │  make a decision        │   │  ← 正确答案
│       │  do a decision          │   │
│       │  take decision          │   │
│       │  have decision          │   │
│       └─────────────────────────┘   │
│                                     │
│   💡 提示：决策类名词常搭配 make/take │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 核心规则

| 项 | 规则 |
|----|------|
| **题型分两类** | ① **搭配判断**（动词+名词/形容词+名词/介词搭配）<br>② **词性判断**（同词不同词性选正确用法） |
| **选项** | 4 选 1，1 个正确 + 3 个干扰项 |
| **干扰项来源** | - 同词错误搭配（`do a decision`）<br>- 易混淆词搭配（`make a choice` → 干扰 `do a choice`）<br>- 语法错误（`take decision` 缺冠词） |
| **限时** | 12 秒（比英译中 +2s） |
| **提示机制** | 答错/超时后显示 **搭配小贴士**（1 行文本，如 "decision 搭配 make/take/reach"） |
| **判定** | 选中正确 → 正确；否则错误 |

### 2.3 数据结构

```typescript
// 单词数据扩展（Markdown 源文件需新增字段）
interface Word {
  // ...既有字段
  collocations?: string[];      // 常用搭配 ["make a decision", "reach a decision", "tough decision"]
  posVariants?: {               // 词性变体
    noun?: string;              // "decision"
    verb?: string;              // "decide"
    adj?: string;               // "decisive"
    adv?: string;               // "decisively"
  };
  // 运行时生成
  posQuestions?: PosQuestion[];
}

// 题目结构
interface PosQuestion extends BaseQuestion {
  type: 'pos';
  subtype: 'collocation' | 'wordForm';
  stem: string;                 // 题干："选择 decision 的正确搭配" / "填空：The _____ was difficult."
  options: string[];            // 4 选项
  correctIndex: number;
  explanation: string;          // "decision 是名词，常搭配 make/take/reach"
}

// 生成算法
function generatePosQuestion(word: Word): PosQuestion {
  if (Math.random() < 0.6 && word.collocations?.length) {
    // 搭配题
    const correct = sample(word.collocations);
    const distractors = generateCollocationDistractors(correct, word);
    return shuffleOptions({
      type: 'pos',
      subtype: 'collocation',
      stem: `选择 "${word.english}" 的正确搭配`,
      options: [correct, ...distractors],
      explanation: `"${word.english}" 常搭配：${word.collocations.join('、')}`,
    });
  } else if (word.posVariants) {
    // 词性题
    return generateWordFormQuestion(word);
  }
  // 兜底：回退英译中
  return generateTranslateQuestion(word);
}
```

### 2.4 干扰项生成策略

```typescript
function generateCollocationDistractors(correct: string, word: Word): string[] {
  const distractors = new Set<string>();
  const [verb, ...rest] = correct.split(' ');
  
  // 策略 1：替换动词为高频错误动词
  const errorVerbs = ['do', 'have', 'get', 'make', 'take', 'give'];
  for (const v of errorVerbs) {
    if (v !== verb) distractors.add(`${v} ${rest.join(' ')}`);
  }
  
  // 策略 2：同义词替换（但搭配不当）
  const synonyms = { decision: 'choice', answer: 'reply', plan: 'scheme' };
  if (synonyms[word.english]) {
    distractors.add(`${verb} a ${synonyms[word.english]}`);
  }
  
  // 策略 3：语法错误（缺冠词/错介词）
  distractors.add(correct.replace('a ', '').replace('an ', '').replace('the ', ''));
  distractors.add(correct.replace('of ', 'for ').replace('in ', 'on '));
  
  return Array.from(distractors).slice(0, 3);
}
```

### 2.5 ComfyUI 素材需求

| 素材 | 规格 | 提示词建议 |
|------|------|------------|
| 题目卡片背景 | 1024×600 | `open spellbook page, handwritten calligraphy, ink splash, magical glow, D&D style` |
| 选项按钮（正常/选中/正确/错误） | 4 态 × 多张 | `pergament button, rune border, hover glow, pressed state, correct: golden rune, wrong: red cracked` |
| "搭配小贴士" 气泡 | 512×200 | `scroll tooltip, quill writing animation, parchment texture, warm light` |

---

## 3. 极速配对

### 3.1 交互原型

```
┌─────────────────────────────────────┐
│  🛡️  护盾: 3   ⚔️  Combo: 12  ⏱️ 28s │
├─────────────────────────────────────┤
│        ⚡  极速配对 (30s)            │
│                                     │
│  ┌──────────┐     ┌──────────┐      │
│  │  courage │────▶│  勇气    │      │  ← 已连线（绿色锁定）
│  └──────────┘     └──────────┘      │
│                                     │
│  ┌──────────┐     ┌──────────┐      │
│  │  dragon  │  ?  │  龙      │      │  ← 待连线
│  └──────────┘     └──────────┘      │
│                                     │
│  ┌──────────┐     ┌──────────┐      │
│  │  sword   │  ?  │  剑      │      │
│  └──────────┘     └──────────┘      │
│                                     │
│  ┌──────────┐     ┌──────────┐      │
│  │  magic   │  ?  │  魔法    │      │
│  └──────────┘     └──────────┘      │
│                                     │
│  左栏：英文单词（可点选）            │
│  右栏：中文释义（可点选）            │
│  规则：点左再点右完成连线，正确锁定，错误抖动回弹 │
│                                     │
│  进度：2/5  对  ⚡ 连击奖励 +50% 金币  │
└─────────────────────────────────────┘
```

### 3.2 核心规则

| 项 | 规则 |
|----|------|
| **形式** | 单词-中文/单词-图片 **双栏连线**，5 对/局 |
| **限时** | 30 秒固定（不随难度变），倒计时条在顶部 |
| **交互** | 点击左侧单词 → 高亮 → 点击右侧释义/图片 → 连线<br>正确：绿色锁定、播放「叮」音效、+1 进度<br>错误：红色抖动回弹、播放「嗡」音效、扣 1 秒 |
| **奖励** | - 全对：额外 **+1 护盾** + **金币 ×1.5**<br>- 每对：基础金币 10，Combo 乘区同战斗系统 |
| **出现时机** | 仅在 **非 Boss 关** 随机触发（权重 5%），替换该回合 1 道常规题 |
| **单词池** | 当前关卡词汇表 + 历史错题池（优先） |

### 3.3 数据结构

```typescript
interface MatchQuestion extends BaseQuestion {
  type: 'match';
  pairs: MatchPair[];           // 5 对
  timeLimit: 30000;             // 固定 30s
  reward: {
    goldBase: 10;
    goldMultiplier: 1.5;        // 全对额外乘数
    shieldBonus: 1;             // 全对奖励护盾
  };
}

interface MatchPair {
  id: string;                   // 'pair_0'...
  left: MatchItem;              // 英文单词
  right: MatchItem;             // 中文/图片
  locked: boolean;              // 已连线锁定
}

interface MatchItem {
  type: 'text' | 'image';
  content: string;              // 文本或图片路径
  wordId: number;               // 关联单词 ID
}

// 生成：从当前关卡词汇表 + 错题本抽 5 个
function generateMatchQuestion(levelWords: Word[], wrongWords: Word[]): MatchQuestion {
  const pool = [...wrongWords.slice(0, 3), ...sample(levelWords, 5)];
  const selected = shuffle(pool).slice(0, 5);
  
  const pairs = selected.map((w, i) => ({
    id: `pair_${i}`,
    left: { type: 'text' as const, content: w.english, wordId: w.id },
    right: { 
      type: Math.random() < 0.7 ? 'text' : 'image' as const,  // 70% 文本，30% 图片
      content: Math.random() < 0.7 ? w.chinese : w.imagePath,
      wordId: w.id 
    },
    locked: false,
  }));
  
  // 打乱左右顺序
  return {
    type: 'match',
    pairs: shufflePairs(pairs),
    timeLimit: 30000,
    reward: { goldBase: 10, goldMultiplier: 1.5, shieldBonus: 1 },
  };
}
```

### 3.4 判定与结算

```typescript
// 连线判定
function checkMatch(pair: MatchPair, selectedLeft: MatchItem, selectedRight: MatchItem): boolean {
  return selectedLeft.wordId === selectedRight.wordId;
}

// 结算
function settleMatch(question: MatchQuestion, completedPairs: number, timeUsed: number): MatchResult {
  const allCorrect = completedPairs === question.pairs.length;
  const gold = question.reward.goldBase * completedPairs * (allCorrect ? question.reward.goldMultiplier : 1);
  const shield = allCorrect ? question.reward.shieldBonus : 0;
  const comboBonus = completedPairs;  // 每对 +1 Combo
  
  return { gold, shield, comboBonus, allCorrect };
}
```

### 3.5 ComfyUI 素材需求

| 素材 | 规格 | 提示词建议 |
|------|------|------------|
| 配对界面背景 | 1024×768 | `ancient stone table, magical energy lines connecting runes, D&D dungeon atmosphere, torch light` |
| 连线特效（进行中/正确/错误） | Spine/序列帧 | `magical tether beam, golden particles` / `green rune lock, sparkle burst` / `red lightning crack, shake` |
| 单词卡片/图片卡片 | 200×120 × 多张 | `D&D item card, {word} illustration, parchment texture, gold border` |
| 倒计时环 | 128×128 | `magical countdown ring, rune segments, glowing, depleting clockwise` |

---

## 4. 三题型统一接入点

### 4.1 QuestionType 联合类型

```typescript
// core/engine/question.ts
type Question = 
  | TranslateQuestion   // 英译中
  | ListeningQuestion   // 听音辨义
  | SpellQuestion       // 极速拼词
  | PosQuestion         // 词性/搭配
  | MatchQuestion;      // 极速配对

// 出题引擎统一入口
function generateQuestion(context: BattleContext): Question {
  const rand = Math.random();
  const weights = BALANCE.questionTypeWeights;
  
  let cumulative = 0;
  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) {
      return generators[type](context);
    }
  }
  return generators.translate(context); // 兜底
}
```

### 4.2 战斗 UI 组件复用策略

```
BattlePage.tsx
├── QuestionRenderer.tsx        // 根据 question.type 渲染对应子组件
│   ├── TranslateQuestion.tsx   // 既有
│   ├── ListeningQuestion.tsx          
│   │   └── AudioPlayer.tsx     // 复用：预录 mp3 / Web Speech 切换
│   ├── SpellQuestion.tsx       // 新增：软键盘 + 字母槽
│   ├── PosQuestion.tsx         // 新增：4 选项卡片 + 解释弹窗
│   └── MatchQuestion.tsx       // 新增：双栏拖拽/点点连线 + 倒计时环
├── BattleHUD.tsx               // 血条、护盾、Combo、倒计时（全题型共用）
└── ResultFeedback.tsx          // 正确/错误动画、伤害数字、奖励结算
```

### 4.3 关键 CSS 变量（Tailwind 扩展）

```css
/* src/index.css */
:root {
  --color-parchment: #fdf6e3;
  --color-ink: #2d2d2d;
  --color-gold: #d4a843;
  --color-rune-blue: #3a7bd5;
  --color-blood-red: #c0392b;
  --color-nature-green: #27ae60;
  --font-gothic: 'Cinzel Decorative', cursive;
  --font-hand: 'MedievalSharp', cursive;
}
```

---

## 5. 开发里程碑（建议）

| 周期 | 交付物 |
|------|--------|
| **Week 1** | `SpellQuestion` 完整实现（生成→渲染→判定→音效→ComfyUI 素材占位） |
| **Week 2** | `PosQuestion` 完整实现 + 单词数据扩展 `collocations` / `posVariants` 字段录入工具 |
| **Week 3** | `MatchQuestion` 完整实现（拖拽/点点双模式、30s 倒计时、奖励结算） |
| **Week 4** | 出题引擎权重接入、DDA 对微题型的适配、全链路测试、素材替换上线 |

---

## 6. 一句话给美术/音效同事

> **拼词**要「羊皮纸+发光符文字母块」，**词性**要「展开的法术书页面+羽毛笔手写感」，**配对**要「魔法石桌+符文连线光束」；音效统一用「魔法回响/符文锁定/碎裂」三件套，风格锁 **D&D 5e 规则书美术风**。