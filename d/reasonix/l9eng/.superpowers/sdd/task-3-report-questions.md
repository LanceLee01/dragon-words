# Task 3 Report: Adapt battleStore for New Question Types

## Changes Made

### File Modified
- `src/stores/battleStore.ts`

### 1. Added `evaluateAnswer` function (module-level, lines 84-94)
A pure function that dispatches answer validation based on `question.type`:
- **spell**: compares answer with `targetLetters.join('')`
- **pos**: converts numeric string answer to compare with `correctIndex`
- **default** (word-meaning, meaning-word, fill-blank, listening): string compare with `correctAnswer`

### 2. Modified `submitAnswer` (line 152)
Replaced:
```typescript
const correct = selected === (currentQuestion as TranslateQuestion).correctAnswer;
```
With:
```typescript
const correct = evaluateAnswer(currentQuestion, selected);
```
This enables correct evaluation of all question types through the discriminated union dispatch.

### 3. Added `matchConnect` action (lines 216-281)
New Zustand action `matchConnect(leftWordId, rightWordId)`:
- Validates current question is type `'match'`
- Finds the pair where `left.wordId === leftWordId`
- If already locked, returns early (idempotent)
- **Correct connection** (`leftWordId === rightWordId`):
  - Locks the pair immutably via `pairs.map`
  - When all pairs locked (settlement): awards gold (`goldBase * completedPairs * multiplier`), processes through `answerQuestion(battle, player, monster, true)` for proper damage/combo, adds extra combo (`completedPairs - 1`), gives shield bonus (`invulnerable += 1`), tracks used word, sets `lastAnswerCorrect = true`, and calls `nextRound()`
  - Plays `soundEngine.play('combo')` for individual matches, `soundEngine.play('coin')` on settlement
- **Wrong connection**: no lock applied, plays `soundEngine.play('click')` as feedback

### 4. Pass `isBoss` to `generateQuestion` (line 77)
Changed:
```typescript
return generateQuestion(wp, usedWordIds, timeLimit, ch);
```
To:
```typescript
return generateQuestion(wp, usedWordIds, timeLimit, ch, undefined, isBoss);
```

### 5. Updated imports (lines 5, 13)
- Added `SpellQuestion`, `PosQuestion`, `MatchQuestion`, `MatchPair` to type imports
- Added `soundEngine` import for match feedback sounds
- Added `matchConnect` to the `BattleStore` interface

## Verification

```bash
npx tsc --noEmit    # ✅ Passes (0 errors)
npx vitest run      # ✅ 4 files, 79 tests all pass
```

## Design Decisions

- **Immutable updates**: `pairs` arrays are mapped immutably; `battle` state is spread into new objects
- **Battle engine reuse**: `matchConnect` calls `answerQuestion(battle, ..., true)` so class-specific damage/heal/stun still applies for match questions
- **Combo per pair**: `answerQuestion` adds +1 combo for "correct"; extra pairs add `(completedPairs - 1)` additional combo
- **Sound effects**: Reuses existing `soundEngine` events (`'combo'`, `'coin'`, `'click'`) — no new sound files required
- **Used word tracking**: Follows the same `usedWordIds.size` pattern as `submitAnswer`
