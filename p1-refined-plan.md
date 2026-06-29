# P1 精细化实施计划（依赖驱动版）

> 基于 `p1-detailed-design.md` 重构为可执行子任务，按依赖关系分 5 个阶段推进。

---

## 目录

- [依赖关系图](#依赖关系图)
- [Phase 0：基础设施与共享层](#phase-0基础设施与共享层)
- [Phase 1：隐藏随机事件系统](#phase-1隐藏随机事件系统)
- [Phase 2：装备词条系统](#phase-2装备词条系统)
- [Phase 3：隐形 DDA 难度调节](#phase-3隐形-dda-难度调节)
- [Phase 4：微剧情 + 全局集成与验收](#phase-4微剧情--全局集成与验收)
- [并行可独立开发的任务](#并行可独立开发的任务)

---

## 依赖关系图

```
Phase 0 ──┬──→ Phase 1 (随机事件) ──→ 产出 globalFlags ──┐
          ├──→ Phase 2 (装备词条) ──→ 修改 battle.ts  ──→ ├──→ Phase 4 (微剧情 + 集成)
          └──→ Phase 3 (DDA) ──→ 依赖 battle + question  ──→ ┘

并行组（无交叉依赖）：
  ┌─ Phase 1 (随机事件) ─ 完全独立，只需 Phase 0 的 store 扩展
  ├─ Phase 2 (装备词条) ─ 独立于 Phase 1/3，但修改 battle.ts
  └─ Phase 3 (DDA) ───── 独立于 Phase 1/2，但修改 battle.ts + question.ts
```

**核心原则**：Phase 1/2/3 的引擎逻辑互相独立，但在 `battle.ts` 上有"写冲突"——需要按顺序合并或统一接口设计。

---

## Phase 0：基础设施与共享层

> ⏱ 预估：2-3 天 | 📁 纯新增 + 少量修改

### 0.1 类型定义统一

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 0.1.1 | `core/data/types.ts` | 追加全局共享类型：`TriggerPoint`, `EventResult`, `DDAModifiers`, `BattleStats`, `AffixStat` |
| 0.1.2 | `core/data/types.ts` | 追加 `GameFlags` 类型（用于全局旗标追踪 → 第 15 章双结局） |

### 0.2 Store 扩展 — 统一预留字段

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 0.2.1 | `stores/gameStore.ts` | 追加 `eventHistory`, `globalFlags`, `storyProgress` 字段 + actions |
| 0.2.2 | `stores/playerStore.ts` | 追加 `equipment.affixes`, `lockedAffixIds` 字段 + actions |
| 0.2.3 | `stores/battleStore.ts` | 追加 `ddaState` 字段 + actions（DDA 状态持久化） |

### 0.3 共享 UI 组件

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 0.3.1 | `components/ui/Modal.tsx` | 通用模态框（撑满/居中/动画），被 EventModal/StoryPlayer 复用 |
| 0.3.2 | `components/ui/TypewriterText.tsx` | 打字机效果文本组件（被 EventModal + StoryPlayer 共用） |
| 0.3.3 | `components/ui/FlyReward.tsx` | 奖励飞入动画组件（金币/经验飞入计数器），被事件+战斗结算共用 |
| 0.3.4 | `components/ui/IconBadge.tsx` | 词条分类图标徽章（红/绿/蓝/金），被装备详情+商店共用 |

### 0.4 工具函数

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 0.4.1 | `core/utils/random.ts` | 加权随机抽选工具 `weightedRandom<T>(items: {item:T, weight:number}[])` |
| 0.4.2 | `core/utils/random.ts` | 防重复随机工具（用于不重复抽选词条池） |

---

## Phase 1：隐藏随机事件系统

> ⏱ 预估：5-7 天 | 📁 纯新增，零依赖其他模块

### 1.1 数据层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 1.1.1 | `core/data/events.ts` | 实现 `RandomEvent`, `EventChoice`, `EventReward` 接口（不含 starFragment/fragment 类型） |
| 1.1.2 | `core/data/events.ts` | 实现默认事件池：5 类模板 × 变体（商人 3、谜题 5、精英 15、宝箱 4、剧情若干） |
| 1.1.3 | `core/data/balance.ts` | 追加事件相关参数：触发概率、冷却天数、权重基线（集中配置，不改代码） |

### 1.2 引擎层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 1.2.1 | `core/engine/eventEngine.ts` | `checkTrigger()` — 按触发点过滤 + 加权轮盘抽选 |
| 1.2.2 | `core/engine/eventEngine.ts` | `checkRequirements()` — 检查 minChapter/maxChapter/minLevel/hasItem/flag |
| 1.2.3 | `core/engine/eventEngine.ts` | `checkCooldown()` — 检查冷却天数（对比 eventHistory 时间戳） |
| 1.2.4 | `core/engine/eventEngine.ts` | `checkOncePerRun()` — 检查本次运行是否已触发 |
| 1.2.5 | `core/engine/eventEngine.ts` | `executeChoice()` — 扣费 → 判定 outcome → 发奖励 → 设旗标 → 链式 nextEvent |
| 1.2.6 | `core/engine/eventEngine.ts` | `grantRewards()` — 按 reward.type 分发到对应 store（gold→playerStore, xp→...等） |
| 1.2.7 | `core/engine/eventEngine.ts` | `saveHistory()` / `loadHistory()` — 持久化 eventHistory 到 localStorage |

### 1.3 触发点接入

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 1.3.1 | `components/battle/VictoryScreen.tsx` | Boss 胜利结算后追加 `EventEngine.checkTrigger('boss_victory')` 调用 |
| 1.3.2 | `pages/MapPage.tsx` | 章节首通后追加 100% 触发固定剧情事件 |
| 1.3.3 | `src/main.tsx` 或 App 层 | 每日首次登录检测 → 10% 触发"流浪商人" |
| 1.3.4 | `stores/gameStore.ts` | 连续登录天数追踪（3 天 → 50% 触发"神秘宝箱"） |
| 1.3.5 | `core/data/achievements.ts`（如存在）或成就表 | 成就达成时触发 `unlockEvent` |

### 1.4 事件 UI

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 1.4.1 | `components/adventure/EventModal.tsx` | 全屏事件弹窗：标题 + 插画（占位图） + 打字机描述 + 选项按钮列表 |
| 1.4.2 | `components/adventure/EventModal.tsx` | 选项按钮渲染：显示成本图标、金额、不可选灰色态 |
| 1.4.3 | `components/adventure/EventModal.tsx` | 点击选项 → 执行动画（扣费动画 → 判定转场 → 奖励飞入） |
| 1.4.4 | `components/adventure/EventModal.tsx` | 链式事件支持：`nextEventId` → 自动弹出下一级 EventModal |
| 1.4.5 | `components/adventure/EventModal.tsx` | 关闭后回到 MapPage |

### 1.5 单测

| 子任务 | 测试范围 |
|--------|----------|
| 1.5.1 | `eventEngine.test.ts` — 触发概率分布（Mock Math.random，跑 10000 次验证分布） |
| 1.5.2 | `eventEngine.test.ts` — 冷却/oncePerRun/requirements 条件过滤 |
| 1.5.3 | `eventEngine.test.ts` — choice 扣费 + outcome 判定 + 奖励分发 |
| 1.5.4 | `eventEngine.test.ts` — nextEventId 链式事件流转 |
| 1.5.5 | `eventEngine.test.ts` — 边界：空事件池、零权重、无匹配事件 |

---

## Phase 2：装备词条系统

> ⏱ 预估：6-8 天 | 📁 独立引擎 + 修改 battle.ts + 商店

### 2.1 数据层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 2.1.1 | `core/data/affixes.ts` | 实现 `Affix`, `AffixStat`, `AffixValue` 类型 + 四大分类 24+ 条具体词条定义 |
| 2.1.2 | `core/data/affixes.ts` | 实现 `AFFIX_POOLS` — 按 tier 1-4 分组的词条池（普通/稀有/史诗/传说） |
| 2.1.3 | `core/data/balance.ts` | 追加词条相关参数：词条数范围、融合消耗、锁链石价格、商店刷新周期 |

### 2.2 引擎层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 2.2.1 | `core/engine/equipment.ts` | `generateEquipment()` — 按品质决定词条数 → 从对应 tier 池抽选 → 随机数值 |
| 2.2.2 | `core/engine/equipment.ts` | `rerollAffixes()` — 重随指定词条（保留锁定词条） |
| 2.2.3 | `core/engine/equipment.ts` | `mergeEquipment()` — Lv30 解锁：同名装备融合，保留 6 词条取最高值 |
| 2.2.4 | `core/engine/equipment.ts` | `lockAffix()` / `unlockAffix()` — Lv40 解锁：消耗锁链石锁定/解锁词条 |
| 2.2.5 | `core/engine/equipment.ts` | `applyAffixes()` — 汇总装备+词条加成到 `BattleStats`（被 battle.ts 调用） |
| 2.2.6 | `core/engine/equipment.ts` | `getEquipmentByQuality()` — 品质过滤/排序工具（用于商店刷新） |

### 2.3 战斗接入

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 2.3.1 | `core/engine/battle.ts` | 战斗初始化时调用 `applyAffixes()` 计算带词条的 `BattleStats` |
| 2.3.2 | `core/engine/battle.ts` | 词条特效触发点：暴击判定、反伤计算、护盾上限、HP 回复/回合 |
| 2.3.3 | `components/battle/CombatLog.tsx` | 词条触发时追加"飘字反馈"（如"暴击！+50%"） |

### 2.4 UI 层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 2.4.1 | `components/collection/EquipmentDetail.tsx` | 装备详情面板：词条列表（按分类着色）、数值范围条、锁定按钮 |
| 2.4.2 | `components/collection/EquipmentDetail.tsx` | 融合界面：选择两件同名装备 → 预览结果 → 确认融合 |
| 2.4.3 | `pages/ShopPage.tsx` | 词条商店：周刷新传说装备、指定传说词条、锁链石售卖 |
| 2.4.4 | `components/collection/InventoryPanel.tsx`（新建）| 背包面板：装备列表（品质着色）、筛选（按部位/等级）、排序 |

### 2.5 单测

| 子任务 | 测试范围 |
|--------|----------|
| 2.5.1 | `equipment.test.ts` — 生成装备词条数、数值范围正确 |
| 2.5.2 | `equipment.test.ts` — 融合：同名装备、保留最高值、锁定词条不参与重随 |
| 2.5.3 | `equipment.test.ts` — 锁定/解锁：消耗正确、锁定后融合/重随保护 |
| 2.5.4 | `equipment.test.ts` — applyAffixes 加成汇总正确 |

---

## Phase 3：隐形 DDA 难度调节

> ⏱ 预估：4-6 天 | 📁 纯新增引擎 + 修改 battle.ts + question.ts

### 3.1 DDA 引擎（纯 TS，零 UI 依赖）

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 3.1.1 | `core/engine/dda.ts` | `DDAController` 类：`mistakeStreak` / `correctStreak` 状态管理 |
| 3.1.2 | `core/engine/dda.ts` | 保护机制（PROTECTION_TIERS）：连错 5 次减怪物属性、强制简单词、给护盾、导师提示 |
| 3.1.3 | `core/engine/dda.ts` | 挑战机制（CHALLENGE_TIERS）：连对 15 次进入挑战模式、怪物增强、结算倍率提升 |
| 3.1.4 | `core/engine/dda.ts` | `applyToMonster()` — 根据当前 modifier 计算怪物 HP/ATK 系数 |
| 3.1.5 | `core/engine/dda.ts` | `applyToTimeLimit()` — 答题时间加成（保护模式加时） |
| 3.1.6 | `core/engine/dda.ts` | `getWordBias()` / `shouldForceEasyWord()` — 出题权重调节 |
| 3.1.7 | `core/engine/dda.ts` | `getSettlementMultipliers()` — 结算倍率（挑战模式金币×1.3、稀有度提升） |
| 3.1.8 | `core/engine/dda.ts` | `getExtraShield()` / `shouldForceTutor()` — 额外保护能力 |
| 3.1.9 | `core/data/balance.ts` | 追加 DDA 参数：各 tier 阈值、modifier 数值、倍率系数（集中配置） |

### 3.2 战斗接入

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 3.2.1 | `stores/battleStore.ts` | 答对/答错时调用 `dda.onAnswerCorrect()` / `onAnswerWrong()` |
| 3.2.2 | `core/engine/battle.ts` | 初始化怪物时调用 `dda.applyToMonster()` 应用 DDA modifier |
| 3.2.3 | `core/engine/battle.ts` | 结算时调用 `dda.getSettlementMultipliers()` 调整奖励 |
| 3.2.4 | `components/shared/Timer.tsx` | 调用 `dda.applyToTimeLimit()` 动态调整倒计时 |

### 3.3 出题接入

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 3.3.1 | `core/utils/question.ts` | `selectWordWithDDA()` — 根据 DDA 词权重偏好在词池中加权抽选 |
| 3.3.2 | `core/utils/question.ts` | 当 `dda.shouldForceEasyWord()` 时强制从难度 1 的词池中出题 |
| 3.3.3 | `core/utils/question.ts` | 当 `dda.shouldForceTutor()` 时展示导师提示 |

### 3.4 调试面板（仅开发模式）

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 3.4.1 | `components/adventure/DDADebugPanel.tsx` | 调试面板 UI：显示 mistakStreak、protectionLevel、challengeMode、当前 modifier |
| 3.4.2 | `components/adventure/DDADebugPanel.tsx` | [Reset] / [Simulate 5 Wrong] / [Sim 15 Right] 按钮（仅在 import.meta.env.DEV 显示） |

### 3.5 单测

| 子任务 | 测试范围 |
|--------|----------|
| 3.5.1 | `dda.test.ts` — 连错 0-10 次逐级验证 modifier 变化 |
| 3.5.2 | `dda.test.ts` — 连对 0-20 次逐级验证 challenge modifier 变化 |
| 3.5.3 | `dda.test.ts` — 保护覆盖挑战（mistakeStreak ≥ threshold 时不进入挑战模式）|
| 3.5.4 | `dda.test.ts` — 边界：mix 错/对、streak 溢出、回滚机制 |
| 3.5.5 | `dda.test.ts` — applyToMonster/applyToTimeLimit/getWordBias/getSettlementMultipliers 独立验证 |

---

## Phase 4：微剧情 + 全局集成与验收

> ⏱ 预估：5-7 天 | 📁 依赖 Phase 1 的 globalFlags + 剧情旗标

### 4.1 数据层

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.1.1 | `core/data/story.ts` | 实现 `StoryBeat`, `StoryPanel`, `StoryReward` 接口（不含 fragment 类型） |
| 4.1.2 | `core/data/story.ts` | 实现 15 章关键剧情节点定义（至少含第 1/3/5/7/10/13/15 章） |
| 4.1.3 | `core/data/story.ts` | 实现第 15 章双结局分支表（`endings` 根据 `flags` 条件判定） |

### 4.2 剧情播放器

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.2.1 | `components/adventure/StoryPlayer.tsx` | 面板逐帧播放器：image/text/choice 三种类型渲染 |
| 4.2.2 | `components/adventure/StoryPlayer.tsx` | 打字机文本 + 角色名 + 表情指示 |
| 4.2.3 | `components/adventure/StoryPlayer.tsx` | 选择分支：`choice.setFlag` → 写入 `gameStore.globalFlags` |
| 4.2.4 | `components/adventure/StoryPlayer.tsx` | 进度指示器 + 跳过按钮 |
| 4.2.5 | `components/adventure/StoryPlayer.tsx` | 播放完成 → 发放 `StoryReward` → 写入 `gameStore.storyProgress` |

### 4.3 触发点接入

| 子任务 | 文件 | 变更 |
|--------|------|------|
| 4.3.1 | `components/battle/VictoryScreen.tsx` | Boss 战后检查是否有 `trigger === 'boss_post'` 的 StoryBeat |
| 4.3.2 | `pages/MapPage.tsx` | 章节开始时检查 `chapter_start`、章节完成时检查 `first_clear` |
| 4.3.3 | `components/adventure/EventModal.tsx` | 隐藏事件完成后检查 `hidden_event` StoryBeat |
| 4.3.4 | `components/battle/VictoryScreen.tsx` | 无伤通关/全词正确时检查 `perfect_clear` |

### 4.4 剧情回看页面

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.4.1 | `components/home/GalleryPage.tsx` | 剧情回看主页：15 章进度总览（已解锁/未解锁） |
| 4.4.2 | `components/home/GalleryPage.tsx` | 单章展开：分镜缩略图，可回看已解锁分镜 |
| 4.4.3 | `components/home/GalleryPage.tsx` | 已解锁结局展示（封印/驯服） |

### 4.5 第 15 章双结局

| 子任务 | 文件 | 说明 |
|--------|------|------|
| 4.5.1 | `core/engine/storyResolver.ts`（新建）| 结局判定引擎：遍历 `flags` → 匹配结局条件（封印/驯服） |
| 4.5.2 | `components/adventure/StoryPlayer.tsx` | 最终结局分支渲染（根据 resolver 结果播放对应 CG + 旁白） |
| 4.5.3 | `stores/gameStore.ts` | 追加 `unlockedEndings` 字段（用于展示"已解锁结局"）|

### 4.6 跨模块集成

| 子任务 | 说明 |
|--------|------|
| 4.6.1 | **事件→剧情链路**：验证隐藏事件设置的 flags 正确影响第 15 章剧情分支 |
| 4.6.2 | **词条→战斗链路**：验证装备词条在战斗中正确生效、飘字反馈 |
| 4.6.3 | **DDA→结算链路**：验证 DDA challenge mode 下结算金币×1.3、掉落稀有度提升 |
| 4.6.4 | **剧情旗标→结局链路**：验证选择分支的 flags 正确传递到第 15 章结局判定 |

### 4.7 数值平衡验算

| 子任务 | 说明 |
|--------|------|
| 4.7.1 | **词条强度**：验证 4 件传说装备全词条叠加后是否导致战斗失衡 |
| 4.7.2 | **DDA + 词条叠加**：当玩家有强力生存词条 + DDA 保护激活时，怪物是否过弱 |
| 4.7.3 | **事件经济**：验证事件奖励的金币/经验是否合理 |

### 4.8 验收标准回归

| 验收用例 | 覆盖模块 | 验证方式 |
|----------|----------|----------|
| Boss 后 20% 触发，事件流程完整 | 随机事件 | 手动 + 单元测试 |
| 同事件冷却/oncePerRun 生效 | 随机事件 | 单元测试 |
| 选项扣费正确、奖励到账 | 随机事件 | 单元测试 |
| 同名装备融合保留最高词条、锁定生效 | 装备词条 | 单元测试 |
| 战斗中词条触发有飘字反馈 | 装备词条 | 手动 |
| 周商店固定刷新传说装备 | 装备词条 | 手动 |
| 连错 5 次后怪物减属性、出简单词、给护盾 | DDA | 单元测试 |
| 连对 15 次进入挑战模式、结算×1.3 | DDA | 单元测试 |
| 玩家无感知（无 DDA UI 泄露） | DDA | 代码审查 |
| 关键节点自动播放分镜、打字机文本、可跳过 | 微剧情 | 手动 |
| 解锁剧情可在回看图鉴查看 | 微剧情 | 手动 |
| 第 15 章双结局根据旗标正确分支 | 微剧情 | 单元 + 集成测试 |

### 4.9 性能 & 边界

| 子任务 | 说明 |
|--------|------|
| 4.9.1 | 事件池 50+ 条时 `checkTrigger` 筛选性能（应 < 1ms） |
| 4.9.2 | DDA 状态持久化到 localStorage 后读取正确 |
| 4.9.3 | 词条融合后装备数据完整性检查（不丢失词条） |
| 4.9.4 | 第 15 章无任何 flags 时的默认结局兜底 |

---

## 并行可独立开发的任务

以下任务无交叉依赖，可并行推进：

| 并行组 A | 并行组 B | 并行组 C |
|-----------|-----------|-----------|
| P0.1 类型定义 | P0.2 store 扩展 | P0.3 共享 UI 组件 |
| P1.1-1.2 事件数据+引擎 | P2.1-2.2 词条数据+引擎 | P3.1 DDA 引擎 |
| P0.4 工具函数 | | P1.4 EventModal UI |

**推荐并行策略**：
- **第 1 人**：Phase 0（类型 + store + UI 组件 + 工具函数）
- **第 2 人**：Phase 1（事件系统全链路）— 2-3 天后可与 Phase 0 集成
- **第 3 人**：Phase 2（词条系统全链路）— 2-3 天后可与 Phase 0 集成
- **第 4 人**：Phase 3（DDA 引擎）— 2 天后可集成

Phase 4（微剧情 + 集成验收）串行在 Phase 1 之后（依赖 globalFlags + 剧情旗标）。

---

## 文件新增/修改清单汇总

| 操作 | 文件 |
|------|------|
| **新增** | `core/data/events.ts`, `core/data/affixes.ts`, `core/data/story.ts` |
| **新增** | `core/engine/eventEngine.ts`, `core/engine/equipment.ts`, `core/engine/dda.ts`, `core/engine/storyResolver.ts` |
| **新增** | `core/utils/random.ts` |
| **新增** | `components/adventure/EventModal.tsx`, `components/adventure/StoryPlayer.tsx`, `components/adventure/DDADebugPanel.tsx` |
| **新增** | `components/ui/Modal.tsx`, `components/ui/TypewriterText.tsx`, `components/ui/FlyReward.tsx`, `components/ui/IconBadge.tsx` |
| **新增** | `components/collection/EquipmentDetail.tsx`, `components/collection/InventoryPanel.tsx` |
| **新增** | `components/home/GalleryPage.tsx` |
| **修改** | `core/data/types.ts`, `core/data/balance.ts` |
| **修改** | `core/engine/battle.ts`, `core/utils/question.ts` |
| **修改** | `stores/gameStore.ts`, `stores/playerStore.ts`, `stores/battleStore.ts` |
| **修改** | `pages/MapPage.tsx`, `pages/ShopPage.tsx` |
| **修改** | `components/battle/VictoryScreen.tsx`, `components/battle/CombatLog.tsx`, `components/shared/Timer.tsx` |
