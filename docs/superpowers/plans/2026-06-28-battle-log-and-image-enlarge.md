# Battle Log & Image Enlarge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-column layout to the battle page with a scrolling answer log (left) and combat stats log (right), and enlarge all battle images by 1.5x.

**Architecture:** Add `BattleLogEntry[]` to `BattleState`, push entries in `battleStore.submitAnswer`/`finishMonsterTurn`, render via two new stateless components. Layout change is purely in `BattlePage.tsx` (flex row instead of flex column).

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS 4, Framer Motion

## Global Constraints

- No new npm dependencies
- Follow existing patterns (Zustand stores, pure engine functions, Tailwind classes)
- All existing functionality must be preserved (HUD, timer, sounds, match questions, victory/defeat)
- Build must pass with `npx tsc --noEmit` and `npx vite build`

---

### Task 1: Add BattleLogEntry type and update BattleState

**Files:**
- Modify: `src/core/data/types.ts` (add `BattleLogEntry` interface, add `log` and `lastCrit` fields to `BattleState`)

**Interfaces:**
- Consumes: existing `BattleState` type
- Produces: `BattleLogEntry` type, updated `BattleState` with `log: BattleLogEntry[]` and `lastCrit: boolean`

- [ ] **Step 1: Add BattleLogEntry interface** (after line 243, before `BaseQuestion`)

Add to `src/core/data/types.ts`:

```typescript
/** A single entry in the battle log */
export interface BattleLogEntry {
  turn: number;
  wordEnglish: string;
  wordChinese: string;
  questionType: string;
  isCorrect: boolean;
  damageDealt: number;
  damageTaken: number;
  lastCombo: number;
  isCrit: boolean;
  monsterHpAfter: number;
  monsterMaxHp: number;
  playerHpAfter: number;
  playerMaxHp: number;
  monsterName: string;
}
```

- [ ] **Step 2: Add `log` and `lastCrit` to BattleState**

Add after `lastDamageTaken: number` (line 242):

```typescript
  /** Whether the last attack was a critical hit */
  lastCrit: boolean;
  /** Battle log entries accumulated during the fight */
  log: BattleLogEntry[];
```

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: errors about missing fields in the return value of `createBattle`

- [ ] **Step 4: Commit**

```bash
git add src/core/data/types.ts
git commit -m "feat: add BattleLogEntry type and log/lastCrit to BattleState"
```

---

### Task 2: Update battle engine to initialize log and track lastCrit

**Files:**
- Modify: `src/core/engine/battle.ts`

**Interfaces:**
- Consumes: `BattleLogEntry`, updated `BattleState` (from Task 1)
- Produces: updated `createBattle` (initializes `log: []`, `lastCrit: false`), updated `answerQuestion` (sets `lastCrit`)

- [ ] **Step 1: Update createBattle to initialize new fields**

In `src/core/engine/battle.ts`, add to the return value of `createBattle` (before the closing `}`):

```typescript
    lastCrit: false,
    log: [],
```

- [ ] **Step 2: Set lastCrit in answerQuestion**

In `answerQuestion`, after `const crit = isCrit(player, wasLastWrong);` (line 128 and line 179), add:

```typescript
    next.lastCrit = crit;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS (zero errors)

- [ ] **Step 4: Commit**

```bash
git add src/core/engine/battle.ts
git commit -m "feat: init battle log and track lastCrit in engine"
```

---

### Task 3: Push battle log entries in the store

**Files:**
- Modify: `src/stores/battleStore.ts`

**Interfaces:**
- Consumes: `BattleLogEntry`, updated `BattleState` (from Tasks 1-2), `currentQuestion`, `monster`
- Produces: log entries pushed in `submitAnswer` and `finishMonsterTurn`

- [ ] **Step 1: Update submitAnswer to append a log entry**

In `src/stores/battleStore.ts`, inside `submitAnswer` after computing `nextBattle` (line 156), add log entry:

```typescript
    // Build battle log entry
    const entry: BattleLogEntry = {
      turn: nextBattle.turn,
      wordEnglish: currentQuestion.word?.english || '',
      wordChinese: currentQuestion.word?.chinese || '',
      questionType: currentQuestion.type,
      isCorrect: correct,
      damageDealt: nextBattle.lastDamageDealt,
      damageTaken: 0, // filled later in finishMonsterTurn
      lastCombo: nextBattle.combo > 0 ? nextBattle.combo - (correct ? 1 : 0) : 0, // combo before increment
      isCrit: nextBattle.lastCrit,
      monsterHpAfter: nextBattle.monsterHp,
      monsterMaxHp: nextBattle.monsterMaxHp,
      playerHpAfter: nextBattle.playerHp,
      playerMaxHp: nextBattle.playerMaxHp,
      monsterName: monster.name,
    };
    nextBattle.log = [...nextBattle.log, entry];
```

Wait — `lastCombo` should be the combo *before* this answer. Currently combo is incremented after damage. I need to capture it before the increment. Actually, in `answerQuestion`, combo is modified on the `next` object. So in the store, after `answerQuestion` returns, the combo is already updated. Let me compute it differently:

The store calls `answerQuestion` which increments combo (for correct) or resets to 0 (for wrong). So `nextBattle.combo` is already the *new* combo. I need the combo *before* this action. For correct: `nextBattle.combo - 1`. For wrong: it's 0 (reset), but the previous combo was on `battle.combo`. Let me use `battle.combo` for the entry instead of `nextBattle.combo`.

Corrected Step 1:

```typescript
    // Build battle log entry
    const entry: BattleLogEntry = {
      turn: nextBattle.turn,
      wordEnglish: currentQuestion.word?.english || '',
      wordChinese: currentQuestion.word?.chinese || '',
      questionType: currentQuestion.type,
      isCorrect: correct,
      damageDealt: nextBattle.lastDamageDealt,
      damageTaken: 0, // filled later in finishMonsterTurn for wrong answers
      lastCombo: correct ? battle.combo : battle.combo, // combo before this action
      isCrit: nextBattle.lastCrit,
      monsterHpAfter: nextBattle.monsterHp,
      monsterMaxHp: nextBattle.monsterMaxHp,
      playerHpAfter: nextBattle.playerHp,
      playerMaxHp: nextBattle.playerMaxHp,
      monsterName: monster.name,
    };
    nextBattle.log = [...nextBattle.log, entry];
```

- [ ] **Step 2: Update finishMonsterTurn to update damageTaken on the last log entry**

In `src/stores/battleStore.ts`, inside `finishMonsterTurn`, after `monsterTurn` returns `nextBattle`, update the last log entry's `damageTaken`:

```typescript
    // Update the last log entry with actual damage taken
    if (nextBattle.log.length > 0) {
      const lastEntry = { ...nextBattle.log[nextBattle.log.length - 1] };
      lastEntry.damageTaken = nextBattle.lastDamageTaken;
      lastEntry.playerHpAfter = nextBattle.playerHp;
      nextBattle.log = [
        ...nextBattle.log.slice(0, -1),
        lastEntry,
      ];
    }
```

But wait — `finishMonsterTurn` also creates a new battle state and then `set`'s it. The `set` includes `battle: nextBattle`. Let me check the current code... In `finishMonsterTurn` (line 197-210):

```typescript
finishMonsterTurn: () => {
    const { battle, monster } = get();
    if (!battle || !monster) return;
    const nextBattle = monsterTurn(battle, monster);
    set({ battle: nextBattle });
    if (nextBattle.status !== 'lost') {
      const question = generateNextQuestion(get().chapter, get().usedWordIds);
      set({ currentQuestion: question, lastAnswerCorrect: null });
    }
  },
```

So I need to add the log update before the `set({ battle: nextBattle })` call.

Actually, looking more carefully — `lastDamageTaken` is only > 0 when the monster actually attacks (not stunned/invulnerable). In the log entry I set `damageTaken: 0` initially. If the monster attacks, `nextBattle.lastDamageTaken` will be set properly by `monsterTurn`. So the simple approach is: after `monsterTurn`, update the last log entry's `damageTaken` from `nextBattle.lastDamageTaken`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/battleStore.ts
git commit -m "feat: push battle log entries in store"
```

---

### Task 4: Create AnswerLog component (left panel)

**Files:**
- Create: `src/components/battle/AnswerLog.tsx`

**Interfaces:**
- Consumes: `useBattleStore` for `battle.log`
- Produces: A scrollable list component displaying answer records

- [ ] **Step 1: Create AnswerLog.tsx**

```typescript
// ---------------------------------------------------------------------------
// AnswerLog — left panel: scrolling answer history
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

export function AnswerLog() {
  const log = useBattleStore((s) => s.battle?.log ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  if (log.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        暂无记录
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        📝 答题记录
      </h3>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {log.map((entry, i) => (
          <div
            key={i}
            className={`rounded px-2 py-1.5 text-xs ${
              entry.isCorrect
                ? 'border-l-4 border-green-500 bg-green-900/10'
                : 'border-l-4 border-red-500 bg-red-900/10'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">#{entry.turn}</span>
              <span className="font-medium text-white">{entry.wordEnglish}</span>
              <span className="text-gray-400">{entry.wordChinese}</span>
            </div>
            <div className="text-gray-400">
              {entry.isCorrect ? '✅ 正确' : '❌ 错误'}
              <span className="ml-2 text-gray-500">{entry.questionType}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/battle/AnswerLog.tsx
git commit -m "feat: add AnswerLog component for left panel"
```

---

### Task 5: Create CombatLog component (right panel)

**Files:**
- Create: `src/components/battle/CombatLog.tsx`

**Interfaces:**
- Consumes: `useBattleStore` for `battle.log`
- Produces: A scrollable list component displaying combat stats

- [ ] **Step 1: Create CombatLog.tsx**

```typescript
// ---------------------------------------------------------------------------
// CombatLog — right panel: scrolling combat statistics
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

export function CombatLog() {
  const log = useBattleStore((s) => s.battle?.log ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  if (log.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        暂无记录
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        ⚔️ 战斗统计
      </h3>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {log.map((entry, i) => (
          <div
            key={i}
            className="rounded border-l-4 border-gray-600 bg-black/20 px-2 py-1.5 text-xs"
          >
            {entry.isCorrect ? (
              <>
                <div className="text-green-300">
                  ⚔️ 对 {entry.monsterName} 造成 {entry.damageDealt} 点伤害
                  {entry.isCrit && <span className="ml-1 text-yellow-300">💥 暴击!</span>}
                </div>
                {entry.lastCombo >= 1 && (
                  <div className="text-orange-300">🔥 连击 x{entry.lastCombo + 1}</div>
                )}
              </>
            ) : (
              <>
                <div className="text-red-300">
                  ❌ 答错
                </div>
                {entry.damageTaken > 0 && (
                  <div className="text-red-400">
                    💢 受到 {entry.monsterName} {entry.damageTaken} 点伤害
                  </div>
                )}
              </>
            )}
            <div className="mt-0.5 text-gray-500">
              ❤️ 怪物 HP: {entry.monsterHpAfter}/{entry.monsterMaxHp} · 玩家 HP: {entry.playerHpAfter}/{entry.playerMaxHp}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/battle/CombatLog.tsx
git commit -m "feat: add CombatLog component for right panel"
```

---

### Task 6: Refactor BattlePage layout to three columns + enlarge images

**Files:**
- Modify: `src/pages/BattlePage.tsx` (change layout from single column to three columns)
- Modify: `src/components/battle/QuestionCard.tsx` (enlarge word image)

**Interfaces:**
- Consumes: `AnswerLog`, `CombatLog` (from Tasks 4-5)

- [ ] **Step 1: Enlarge player and monster portraits in BattlePage.tsx**

Change player portrait container from `h-48 w-48` to `h-56 w-56`:
```
Line 295: <div className="h-56 w-56 overflow-hidden rounded-xl ...">
```

Change monster portrait container from `h-48 w-48` to `h-56 w-56`:
```
Line 338: <div className="h-56 w-56 overflow-hidden rounded-xl ...">
```

- [ ] **Step 2: Change main content area to three-column flex layout**

Current (line 362-533):
```tsx
{/* ===== Main content area ===== */}
<div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
```

Change to:
```tsx
{/* ===== Main content area (three columns) ===== */}
<div className="flex flex-1 gap-2 px-2 pb-2 pt-1 overflow-hidden">
  {/* Left column — Answer Log */}
  <div className="w-[280px] shrink-0 rounded-xl bg-black/10 p-3 overflow-hidden flex flex-col">
    <AnswerLog />
  </div>

  {/* Center column — Battle content */}
  <div className="flex flex-1 flex-col items-center justify-center px-2 overflow-y-auto">
    <AnimatePresence mode="wait">
      ... (unchanged AnimatePresence content)
    </AnimatePresence>
  </div>

  {/* Right column — Combat Log */}
  <div className="w-[280px] shrink-0 rounded-xl bg-black/10 p-3 overflow-hidden flex flex-col">
    <CombatLog />
  </div>
</div>
```

The imports needed at the top:
```typescript
import { AnswerLog } from '@/components/battle/AnswerLog';
import { CombatLog } from '@/components/battle/CombatLog';
```

And the existing center content (`AnimatePresence` block, lines 364-531) stays exactly the same — it just moves inside the center column div.

- [ ] **Step 3: Remove the now-redundant combo wrapper positioning**

The combo display (line 358-360) currently sits between HUD and the main content area. It should remain there since it's above the three columns. No change needed.

- [ ] **Step 4: Enlarge word image in QuestionCard.tsx**

In `src/components/battle/QuestionCard.tsx`, change the image container from:
```tsx
<div className="relative flex h-40 w-56 items-center ...">
```
to:
```tsx
<div className="relative flex h-48 w-72 items-center ...">
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Verify Vite build works**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/pages/BattlePage.tsx src/components/battle/QuestionCard.tsx
git commit -m "feat: three-column battle layout and enlarge images"
```

---

### Task 7: Playwright E2E verification

**Files:**
- Create: `scripts/test-battle-log.mjs` (or use existing test-images.mjs pattern)

- [ ] **Step 1: Write test script that navigates through the game flow and verifies the log panels appear**

The test should:
1. Navigate through Home → Select Class → Map → Battle (same flow as test-images.mjs)
2. Click a correct answer to trigger a log entry
3. Verify the AnswerLog and CombatLog panels are visible
4. Check that log entries contain the expected text (word, damage, etc.)

- [ ] **Step 2: Run the test**

```bash
node scripts/test-battle-log.mjs
```

Expected: Both log panels visible with at least one entry each after answering a question.

- [ ] **Step 3: Commit**

```bash
git add scripts/test-battle-log.mjs
git commit -m "test: add E2E test for battle log panels"
```
