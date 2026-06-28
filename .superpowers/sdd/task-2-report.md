# Task 2 — Init battle log and track lastCrit in engine

**Status:** ✅ Complete

## What changed

**File:** `src/core/engine/battle.ts`

| Change | Location (line) | Detail |
|---|---|---|
| `lastCrit: false` added to `createBattle` return | 105 | New field tracked on every `BattleState` |
| `log: []` added to `createBattle` return | 106 | Empty battle log array initialized |
| `next.lastCrit = crit;` in correct-answer path | 131 | After `isCrit(player, wasLastWrong)` call on line 130 |
| `next.lastCrit = crit;` in wrong-answer path | 183 | After `isCrit(player, wasLastWrong)` call on line 182 |

## TypeScript check

```
> cd "D:\reasonix\l9eng" && npx tsc --noEmit
```

**Result:** Zero errors.

## Commit

```
9914724 feat: init battle log and track lastCrit in engine
 1 file changed, 4 insertions(+)
```
