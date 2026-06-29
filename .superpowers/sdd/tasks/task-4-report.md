# Task 4 Report: Extend `stores/battleStore.ts`

**Status:** DONE

## Commits

- `7c4dd1d` — `feat(p1): extend battleStore with ddaState and updateDDA/resetDDA`

## Summary

Added DDA (Dynamic Difficulty Adjustment) state and actions to `src/stores/battleStore.ts`:

1. **Interface** (`BattleStore`): Added `ddaState` (containing `mistakeStreak`, `correctStreak`, `protectionLevel`, `challengeMode`) and `updateDDA`/`resetDDA` action signatures.

2. **Initial state**: `ddaState` initialized with all zeroes/false inside the Zustand creator.

3. **`updateDDA(correct)`**: Updates streaks — on correct answer, `mistakeStreak` decreases by 2 (min 0) and `correctStreak` increments; on wrong answer, `correctStreak` decreases by 5 (min 0) and `mistakeStreak` increments.

4. **`resetDDA()`**: Resets `ddaState` back to default values.

## Verification

- `npx tsc --noEmit --pretty` — **zero errors**
- Existing fields/actions (`battle`, `monster`, `initBattle`, `submitAnswer`, `nextRound`, `finishMonsterTurn`, `matchConnect`, `resetBattle`) are unchanged.

## Concerns

None.
