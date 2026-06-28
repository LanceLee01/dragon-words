# Task 5 Report: Persistence Layer & Zustand Stores

## Files Created

| File | Description |
|------|-------------|
| `src/core/utils/storage.ts` | localStorage persistence layer (4 key-value pairs) |
| `src/core/utils/storage.test.ts` | 9 tests covering save/load roundtrip + defaults |
| `src/stores/playerStore.ts` | Zustand store for player state (13 actions) |
| `src/stores/gameStore.ts` | Zustand store wrapping GameFSM (4 actions) |
| `src/stores/battleStore.ts` | Zustand store for battle lifecycle (6 actions) |

## Verification

- **Tests:** 69 pass (60 original + 9 storage tests)
- **TypeScript:** `npx tsc --noEmit` — zero errors
- **Key constraints met:**
  - `createBattle` takes 2 params (no `playerBoardAttack`)
  - `answerQuestion` wrong path sets `phase='monster-turn'` (no damage)
  - `monsterTurn` sets `phase='question'` after acting
  - All core/utils files have zero React imports
  - Path alias `@/` → `src/` used throughout
  - Zustand v5 `create` imported from `'zustand'`

## Store Details

### playerStore
- `init()` loads from localStorage; `loaded` flag for UI gate
- `addXp` auto-levels up using `getXpForLevel()` threshold loop
- All mutators call `savePlayer()` for persistence

### gameStore
- Creates a `GameFSM` instance internally
- Registers `onEnterPhase` callbacks for all 7 phases to sync to React
- `sendEvent` delegates to FSM; `setPhase` uses `forcePhase`

### battleStore
- `initBattle(ch, lv)` looks up `CHAPTER_MONSTERS` + `MONSTERS`, calls `createBattle`, generates first question
- `submitAnswer` compares selected vs `correctAnswer`, calls `answerQuestion`, awards gold (10) on correct, XP (30/100) on victory
- `useSkillAction` delegates to `useSkill`, awards XP on victory
- `finishMonsterTurn` delegates to `monsterTurn`
- `nextRound` generates a fresh question via `generateQuestion`
- Word pool sourced from `useGameStore.getState().words`

## Commit
```
feat: implement storage layer and Zustand stores
```
