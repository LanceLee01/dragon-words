# Dragon Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Dragon Words — a PvE D&D-themed vocabulary battle game for Chinese students (1600 words, 15 chapters, 6 classes)

**Architecture:** React SPA with three-layer separation: UI (React + Framer Motion), logic (pure TypeScript engine, zero React dependency), data (Zustand + localStorage). Mobile-first responsive web, static deployment to Aliyun OSS.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Zustand, Framer Motion, Tailwind CSS, Web Speech API, Vitest

## Global Constraints

- Platform: Web responsive, mobile-first; React 18 + TypeScript 5 + Vite 5; Zustand state; Framer Motion + CSS; Web Speech API (switchable)
- Storage: localStorage (IndexedDB later); Styles: Tailwind CSS; Tests: Vitest
- Pure logic layer: `core/` has zero React imports
- Only 英译中 + 听音辨义 (no spelling); Timer ≥ 8s; No backend — local-first with Aliyun sync interface reserved

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `vitest.config.ts`
- Create: directory tree under `src/`

**Interfaces:**
- Produces: Runnable Vite dev server with React + TS + Tailwind, all directories

- [ ] **Step 1: Scaffold with Vite**

```bash
npm create vite@latest . -- --template react-ts && npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom zustand framer-motion
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vite** — write `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': '/src' } },
});
```

- [ ] **Step 4: Configure TypeScript** — write `tsconfig.json` with strict mode, path alias `@/*` → `./src/*`

- [ ] **Step 5: Write `src/index.css`** with Tailwind import, D&D theme colors (`--color-parchment`, `--color-gold`, `--color-magic`, `--color-blood`, `--color-dragon`), and `.game-active { user-select: none; }`

- [ ] **Step 6: Write minimal `src/App.tsx`** — BrowserRouter with single Route showing "Dragon Words" placeholder

- [ ] **Step 7: Write minimal `src/main.tsx`** — StrictMode + App + CSS import

- [ ] **Step 8: Write `vitest.config.ts`** — jsdom environment, `@/` alias

- [ ] **Step 9: Verify dev server runs:** `npx vite --host` → see "Dragon Words"

- [ ] **Step 10: Create directory structure:**

```bash
mkdir -p src/core/engine src/core/data src/core/utils src/stores src/components/ui src/components/battle src/components/adventure src/components/home src/components/shared src/hooks src/pages src/assets/images/{monsters,classes,word-images,equipment,ui} src/assets/sounds src/assets/fonts
```

- [ ] **Step 11: Commit:** `git init && git add -A && git commit -m "feat: scaffold Vite + React + TS + Tailwind project"`

---

### Task 2: Core Type Definitions & Static Data

**Files:**
- Create: `src/core/data/types.ts`, `src/core/data/classes.ts`, `src/core/data/monsters.ts`, `src/core/data/levels.ts`, `src/core/data/equipment.ts`

**Interfaces:**
- Produces: All types (`Word`, `PlayerState`, `BattleState`, `Question`, `ClassDef`, `AdvancedClassDef`, `MonsterDef`, `ChapterDef`, `Equipment` etc.) and static data records

- [ ] **Step 1: Write `src/core/data/types.ts`** — all TypeScript interfaces:

```typescript
export type GamePhase = 'home' | 'class-select' | 'adventure' | 'battle' | 'win' | 'lose' | 'shop';
export type QuestionType = 'en-to-cn' | 'listen-to-cn';
export type ClassId = 'warrior' | 'mage' | 'ranger' | 'paladin' | 'rogue' | 'druid';
export type AdvancedClassId = 'dragon-knight' | 'archmage' | 'elf-lord' | 'light-lord' | 'shadow-master' | 'nature-spirit';
export type Difficulty = 1 | 2 | 3;
export type WordLevel = 'primary' | 'middle';

export interface Word {
  id: number; english: string; chinese: string; level: WordLevel;
  difficulty: Difficulty; imagePath: string;
  correctCount: number; wrongCount: number; lastSeenAt: number;
}

export interface ClassDef {
  id: ClassId; name: string; icon: string; description: string;
  baseAttack: number; passiveName: string; passiveDesc: string;
  skill: { name: string; description: string; chargeNeeded: number };
  advancedTo: AdvancedClassId | null;
}

export interface AdvancedClassDef {
  id: AdvancedClassId; name: string; baseClass: ClassId;
  passiveName: string; passiveDesc: string;
  skill: { name: string; description: string; chargeNeeded: number; secondaryName?: string; secondaryDesc?: string };
  baseAttackBonus: number;
}

export interface MonsterDef {
  id: string; name: string; hp: number; attack: number; imagePath: string;
  isBoss: boolean; bossSkill?: { name: string; description: string };
}

export interface ChapterDef {
  chapter: number; name: string; mapName: string; wordLevel: WordLevel;
  wordCount: number; levels: { chapter: number; level: number; monster: string; wordPoolSize: number; isBossLevel: boolean; isPromotionTrial?: ClassId }[];
}

export interface Equipment { id: string; name: string; classId: ClassId; tier: 1|2|3; icon: string; cost: number; attackBonus: number; defenseBonus: number; description: string; }

export interface PlayerState {
  classId: ClassId | null; advancedClassId: AdvancedClassId | null; level: number; xp: number;
  gold: number; maxHp: number; currentHp: number; attack: number; defense: number;
  equippedWeapon: string | null; ownedEquipment: string[];
  completedLevels: string[]; completedChapters: number[]; achievements: string[];
  mistakeBook: number[]; wordStats: Record<number, { correct: number; wrong: number }>;
  highestCombo: number; totalCorrect: number; totalQuestions: number;
}

export interface BattleState {
  phase: 'question' | 'result' | 'monster-turn' | 'victory' | 'defeat';
  monsterHp: number; monsterMaxHp: number; playerHp: number; playerMaxHp: number;
  combo: number; skillCharge: number; currentQuestion: Question | null;
  lastAnswerCorrect: boolean | null; isMonsterStunned: boolean; monsterStunTurns: number;
  isPlayerInvulnerable: boolean; playerInvulnerableTurns: number;
  questionsAnswered: number; correctAnswers: number;
}

export interface Question {
  wordId: number; english: string; correctChinese: string; options: string[];
  type: QuestionType; imagePath: string; timeLimit: number;
}
```

- [ ] **Step 2: Write `src/core/data/classes.ts`** — `BASE_CLASSES` record with 6 classes (warrior/mage/ranger/paladin/rogue/druid) and `ADVANCED_CLASSES` record with 6 advanced classes matching spec Table 4.3. Each class has baseAttack, passiveName, passiveDesc, and skill with chargeNeeded=5.

- [ ] **Step 3: Write `src/core/data/monsters.ts`** — `MONSTERS` record with 15 normal + 15 boss monsters (goblin through ancientRed dragon), and `CHAPTER_MONSTERS` mapping chapter→{normal, boss} IDs. Bosses include bossSkill descriptions matching spec Table 5.2.

- [ ] **Step 4: Write `src/core/data/levels.ts`** — `CHAPTERS` array (15 chapters with word counts matching spec 5.1: ch1-5 ~101 words, ch6-15 ~109 words). Include `getDifficultyPhase(chapter)`, `getTimeLimit(chapter, type)`, `getMonsterHpRange(chapter)`, `getMonsterAttackRange(chapter)`, `getXpForLevel(level)` functions matching spec Table 4.5.

- [ ] **Step 5: Write `src/core/data/equipment.ts`** — `EQUIPMENT` array with 18 items (3 tiers × 6 classes), each with id, name, classId, tier, cost (100/500/1500), attackBonus, defenseBonus matching spec Table 6.3.

- [ ] **Step 6: Verify:** `npx tsc --noEmit` → no errors

- [ ] **Step 7: Commit:** `git add -A && git commit -m "feat: add core type definitions and static data"`

---

### Task 3: Core Battle Engine (Pure TypeScript)

**Files:**
- Create: `src/core/engine/battle.ts`, `src/core/engine/battle.test.ts`, `src/core/engine/fsm.ts`, `src/core/engine/fsm.test.ts`

**Interfaces:**
- Consumes: types, class data, monster data
- Produces: `createBattle(p,m,b)`, `answerQuestion(b,p,m,c)`, `useSkill(b,p,m,i)`, `monsterTurn(b,m)`, `calculateDamage(a,c,cr,sk)`, `getComboMultiplier(c)`, `getPlayerAttack(p)`, `isCrit(p,wasLastWrong)`, `GameFSM` class

- [ ] **Step 1: Write `src/core/engine/battle.test.ts`** — test `createBattle` initializes state, `calculateDamage` applies combo multipliers (×1→×1.5→×2→×3 at combos 0→3→5→7), crit doubles, `answerQuestion` increments combo on correct/clears on wrong, `answerQuestion` transitions to victory/defeat when HP≤0.

- [ ] **Step 2: Run:** `npx vitest run src/core/engine/battle.test.ts` → FAIL (module not found)

- [ ] **Step 3: Write `src/core/engine/battle.ts`** implementing all functions:
  - `createBattle(p, m, attack)` → BattleState with phase='question', monsterHp=m.hp, playerHp=p.currentHp
  - `calculateDamage(base, combo, isCrit, isSkill)` → Math.round(base × comboMultiplier) × 2 if crit
  - `getComboMultiplier(c)` → 1 / 1.5 / 2 / 3 for combos ≥1/3/5/7
  - `answerQuestion(b, p, m, correct)` → if correct: combo++, skillCharge++, deal damage, check victory; if wrong: combo=0, skillCharge=0, phase='monster-turn'
  - `useSkill(b, p, m, skillIndex)` → class-specific: warrior×3(×4 advanced), mage×2(×3)+stun, ranger 3(5) hits, paladin heal 40%(full), rogue instakill<50% or ×2.5, druid damage+stun 2 turns
  - `monsterTurn(b, m)` → handle stun/invulnerable; otherwise damage player, check defeat

- [ ] **Step 4: Run:** `npx vitest run src/core/engine/battle.test.ts` → PASS

- [ ] **Step 5: Write `src/core/engine/fsm.test.ts`** — test home→START_GAME→class-select→SELECT_CLASS→adventure→START_BATTLE→battle→BATTLE_WIN→win→RETURN_MAP→adventure, reject invalid transitions, trigger onEnter callbacks

- [ ] **Step 6: Write `src/core/engine/fsm.ts`** — `GameFSM` class with `phase`, `send(event)`, `onEnterPhase(phase, handler)`, internal transition map covering all GamePhase states

- [ ] **Step 7: Run:** `npx vitest run src/core/engine/fsm.test.ts` → PASS

- [ ] **Step 8: Commit:** `git add -A && git commit -m "feat: implement core battle engine and FSM with tests"`

---

### Task 4: Question Engine & Speech Engine

**Files:**
- Create: `src/core/utils/question.ts`, `src/core/utils/question.test.ts`, `src/core/utils/speech.ts`, `src/hooks/useSpeech.ts`

**Interfaces:**
- Produces: `generateQuestion(pool, usedIds, timeLimit, chapter, mistakeWords?)`, `generateOptions(allWords, correctChinese, excludeId)`, `getQuestionTypeForRound(round)`
- Produces: `SpeechEngine` class (`speak(word)`, `isAvailable()`, `setRate()`, `cancel()`), `useSpeech()` hook

- [ ] **Step 1: Write `src/core/utils/question.test.ts`** — test that `generateOptions` returns 4 unique options including correct, that `getQuestionTypeForRound` distributes ~60/40 over 1000 iterations, that `generateQuestion` returns valid question with options, that it returns null when pool exhausted

- [ ] **Step 2: Run:** `npx vitest run src/core/utils/question.test.ts` → FAIL

- [ ] **Step 3: Write `src/core/utils/question.ts`:**
  - `getQuestionTypeForRound(round)` → `(round * 2654435761) % 100 < 60 ? 'en-to-cn' : 'listen-to-cn'`
  - `generateOptions(allWords, correct, excludeId)` → filter 3 random unique Chinese meanings from other words
  - `generateQuestion(pool, usedIds, timeLimit, chapter, mistakeWords?)` → 30% chance from mistake book if available; pick random unused word; return Question with options, type, imagePath

- [ ] **Step 4: Run:** `npx vitest run src/core/utils/question.test.ts` → PASS

- [ ] **Step 5: Write `src/core/utils/speech.ts`** — `SpeechEngine` class wrapping `window.speechSynthesis`, `speak(word)` returns Promise, `isAvailable()` checks browser support, `setRate(rate)`, `cancel()`. Export singleton `speechEngine`.

- [ ] **Step 6: Write `src/hooks/useSpeech.ts`** — `useSpeech()` hook that wraps `speechEngine.speak()` with a ref guard to prevent overlapping calls. Returns `{ speak, isAvailable }`.

- [ ] **Step 7: Commit:** `git add -A && git commit -m "feat: implement question engine and speech engine"`

---

### Task 5: Persistence Layer & Zustand Stores

**Files:**
- Create: `src/core/utils/storage.ts`, `src/core/utils/storage.test.ts`, `src/stores/gameStore.ts`, `src/stores/playerStore.ts`, `src/stores/battleStore.ts`

**Interfaces:**
- Produces: `loadPlayer/savePlayer`, `loadProgress/saveProgress`, `loadSettings/saveSettings`, `loadWordStats/saveWordStats` → localStorage
- Produces: `useGameStore` (phase, fsm, words, sendEvent), `usePlayerStore` (player state + actions), `useBattleStore` (battle state + actions)

- [ ] **Step 1: Write `src/core/utils/storage.test.ts`** — test save/load player roundtrip, default values when nothing saved

- [ ] **Step 2: Run:** `npx vitest run src/core/utils/storage.test.ts` → FAIL

- [ ] **Step 3: Write `src/core/utils/storage.ts`** — all storage functions using localStorage with JSON serialization, graceful fallback when localStorage unavailable. Default player: level=1, 100HP, no class, 0 gold.

- [ ] **Step 4: Run:** `npx vitest run src/core/utils/storage.test.ts` → PASS

- [ ] **Step 5: Write `src/stores/gameStore.ts`** — Zustand store with `phase`, `fsm`, `words`, `setWords`, `sendEvent`, `setPhase`. FSM handles all transitions.

- [ ] **Step 6: Write `src/stores/playerStore.ts`** — Zustand store with full PlayerState + actions: `init()` (load from storage), `selectClass(id)`, `addGold(n)`, `addXp(n)`, `takeDamage(n)`, `healToFull()`, `completeLevel(key, ch)`, `equipWeapon(id)`, `promoteToAdvanced(id)`, `addMistakeWord(id)`, `recordAnswer(id, correct)`, `updateCombo(n)`. All mutations auto-save.

- [ ] **Step 7: Write `src/stores/battleStore.ts`** — Zustand store with `battle`, `monster`, `chapter`, `level`, `usedWordIds`. Actions: `initBattle(ch, lv)`, `submitAnswer(selected)`, `useSkillAction()`, `nextRound()`, `finishMonsterTurn()`, `resetBattle()`. Integrates with playerStore for gold/xp/combo tracking and gameStore for word pool.

- [ ] **Step 8: Verify:** `npx tsc --noEmit` → no errors

- [ ] **Step 9: Commit:** `git add -A && git commit -m "feat: implement storage layer and Zustand stores"`

---

### Task 6: UI Foundation — Shared Components & Hooks

**Files:**
- Create: `src/hooks/useTimer.ts`, `src/components/shared/HealthBar.tsx`, `src/components/shared/Timer.tsx`, `src/components/shared/DamageNumber.tsx`, `src/components/shared/ComboDisplay.tsx`
- Modify: `src/App.tsx` → full route setup

**Interfaces:**
- Produces: `useTimer(initialSeconds, onExpire)` → { remaining, reset, isUrgent }
- Produces: `<HealthBar current max label color? />`, `<Timer remaining isUrgent />`, `<DamageNumber value isCrit? isHeal? />`, `<ComboDisplay combo />`

- [ ] **Step 1: Write `src/hooks/useTimer.ts`** — countdown timer with `reset(seconds?)`; calls onExpire when reaching 0; `isUrgent` = remaining ≤ 3

- [ ] **Step 2: Write `src/components/shared/HealthBar.tsx`** — horizontal bar with Framer Motion animated width, label and current/max text, configurable color prop

- [ ] **Step 3: Write `src/components/shared/Timer.tsx`** — displays ⏱ and seconds; red pulsing animation when isUrgent

- [ ] **Step 4: Write `src/components/shared/DamageNumber.tsx`** — floating number that animates upward and fades; green for healing, yellow/large for crit, red for normal damage

- [ ] **Step 5: Write `src/components/shared/ComboDisplay.tsx`** — shows "Nice!"(1), "Great!!"(3), "AMAZING!!!"(5), "LEGENDARY!!!!"(7+) with spring animation and Combo counter

- [ ] **Step 6: Update `src/App.tsx`** — add routes: `/`→HomePage, `/select-class`→SelectClassPage, `/map`→MapPage, `/battle/:chapter/:level`→BattlePage, `/shop`→ShopPage. Add `usePlayerStore.init()` on mount. Show loading spinner while not loaded.

- [ ] **Step 7: Verify:** `npx tsc --noEmit` (page imports may error — expected until pages exist)

- [ ] **Step 8: Commit:** `git add -A && git commit -m "feat: add shared UI components, timer hook, and route setup"`

---

### Task 7: Pages — Home, Class Selection, Adventure Map

**Files:**
- Create: `src/pages/HomePage.tsx`, `src/pages/SelectClassPage.tsx`, `src/pages/MapPage.tsx`

- [ ] **Step 1: Write `src/pages/HomePage.tsx`** — dark gradient background with dragon icon, title "Dragon Words", subtitle "龙与地下城 · 背单词冒险". Buttons: "继续冒险" (if has save→navigate /map) or "开始冒险" (→/select-class), "重新选择职业", "商店". Show player stats if save exists (Lv, gold, highestCombo, accuracy).

- [ ] **Step 2: Write `src/pages/SelectClassPage.tsx`** — grid of 6 class cards with staggered Framer Motion entrance. Each card shows: class icon, name, description, passive (green), skill (blue). Clicking selects class via `usePlayerStore.selectClass()`, sends FSM SELECT_CLASS, navigates to /map.

- [ ] **Step 3: Write `src/pages/MapPage.tsx`** — vertical list of 15 chapters. Each chapter card: name, word count, 5 level buttons. Boss level (5th) shown with 👑 + boss name. Unlocked chapters: full opacity+border, locked: dimmed. Completed levels: green. Chapter unlocked if previous chapter completed (chapter 1 always open). Header with ←Home, Lv+gold, Shop button. Level click → navigate to `/battle/:chapter/:level`.

- [ ] **Step 4: Verify:** `npx tsc --noEmit` → no errors (except BattlePage not yet created)

- [ ] **Step 5: Commit:** `git add -A && git commit -m "feat: implement Home, Class Selection, and Adventure Map pages"`

---

### Task 8: Battle Page — Full Combat UI

**Files:**
- Create: `src/pages/BattlePage.tsx`, `src/components/battle/QuestionCard.tsx`, `src/components/battle/VictoryScreen.tsx`, `src/components/battle/DefeatScreen.tsx`

- [ ] **Step 1: Write `src/components/battle/QuestionCard.tsx`** — displays: (1) word image (with fallback to 📜 emoji), (2) for listen-to-cn: 🔊 button with "再听一次" (max 1 replay), (3) for en-to-cn: large English word + 🔊 button, (4) 2×2 grid of 4 option buttons (A/B/C/D). Props: `question`, `onAnswer(selectedChinese)`, `disabled`.

- [ ] **Step 2: Write `src/components/battle/VictoryScreen.tsx`** — animated entrance: 🏆, "胜利!", gold + XP display, "继续冒险 →" button calling `onContinue`

- [ ] **Step 3: Write `src/components/battle/DefeatScreen.tsx`** — 💀, "战败...", encouragement text, "再来一次" (onRetry) and "返回地图" (onLeave) buttons

- [ ] **Step 4: Write `src/pages/BattlePage.tsx`** — full battle flow:
  - Parse chapter/level from URL params
  - `useEffect` to init battle, cleanup to reset
  - Timer hook synced to current question's timeLimit
  - Handle answer: call `submitAnswer`, show result phase
  - Handle next round / monster turn via store actions
  - Phase routing: 'question'→QuestionCard, 'result'→correct feedback+next button, 'monster-turn'→wrong feedback+correct answer+continue, 'victory'→VictoryScreen (rewards: 50+lv×10 gold, 100XP, level completion), 'defeat'→DefeatScreen
  - Top HUD: Player HealthBar | Timer | Monster HealthBar
  - ComboDisplay between HUD and question
  - Skill button at bottom when skillCharge≥5 (pulsing purple glow)

- [ ] **Step 5: Verify:** `npx tsc --noEmit` → no errors

- [ ] **Step 6: Commit:** `git add -A && git commit -m "feat: implement Battle page with question, victory, and defeat screens"`

---

### Task 9: Shop Page & Word Data Pipeline

**Files:**
- Create: `src/pages/ShopPage.tsx`
- Create: `scripts/generate-words.ts`, `scripts/placeholder-words.md`
- Create (generated): `src/core/data/words.ts`

- [ ] **Step 1: Write `src/pages/ShopPage.tsx`** — shows player's class-specific equipment (3 tiers). Each item: icon, name, tier badge, description, stat bonuses (⚔ attack, 🛡 defense). States: "已装备" (gold border, ✅), "装备" (owned but not equipped), "💰 cost" (buyable). If no class selected, prompt to go home.

- [ ] **Step 2: Write `scripts/placeholder-words.md`** — Markdown with `## Primary` and `## Middle` sections, each line format: `- english | chinese | difficulty`. Include 20 sample words.

- [ ] **Step 3: Write `scripts/generate-words.ts`** — parses Markdown, pads to 1600 words with generated placeholders, writes `src/core/data/words.ts` exporting `WORDS: Word[]` array

- [ ] **Step 4: Run generation:** `npx tsx scripts/generate-words.ts`

- [ ] **Step 5: Update `src/stores/gameStore.ts`** — add `initWords()` action that loads `WORDS` into store, and call it from App.tsx on mount

- [ ] **Step 6: Verify:** `npx tsc --noEmit && npm run build` → succeeds

- [ ] **Step 7: Commit:** `git add -A && git commit -m "feat: implement Shop page and word data generation pipeline"`

---

### Task 10: Full Build, Test & Fix

- [ ] **Step 1: Run all tests:** `npx vitest run` → all pass

- [ ] **Step 2: Type check:** `npx tsc --noEmit` → no errors

- [ ] **Step 3: Production build:** `npm run build` → `dist/` created

- [ ] **Step 4: Fix any issues found, then commit:** `git commit -m "fix: final integration fixes and build verification"`

---

### Task 11: Deployment Config

- [ ] **Step 1: Verify `vite.config.ts`** has proper `build.outDir: 'dist'`

- [ ] **Step 2: Build and verify output:** `npm run build && ls dist/` → `index.html` + `assets/`

- [ ] **Step 3: Commit:** `git add -A && git commit -m "chore: finalize production build configuration"`
