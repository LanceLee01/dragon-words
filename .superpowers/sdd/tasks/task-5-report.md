# Task 5 Report: `weightedRandom` and `pickRandom` utilities

## Status
✅ Complete

## Files Created
- `src/core/utils/random.ts` — core utility functions
- `src/core/utils/random.test.ts` — unit tests

## Description
Created two random-selection utility functions per the TDD process (tests first, then implementation):

### `weightedRandom<T>(items)`
- Selects an item from a weighted array using `Math.random()`
- Each item's `weight` determines its probability of selection
- Handles edge cases: empty array (throws), all-zero weights (returns first item), negative weights (clamped to 0)
- Falls through to the last item if floating-point precision causes the loop to never hit `roll <= 0`

### `pickRandom<T>(items, count, usedIds?)`
- Picks `count` unique items from an array
- Supports optional `usedIds` set to exclude already-used items (by `id` field)
- Uses rejection sampling to ensure uniqueness
- Throws if `count` exceeds available items

## Test Results

```
 ✓ src/core/utils/random.test.ts (9 tests)

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  11:04:59
   Duration  1.14s
```

All 9 tests pass as implemented:
- **weightedRandom:** single-item returns that item; mock `Math.random` at 0 and 0.5 to verify weighted distribution; all-zero weights returns first; empty array throws
- **pickRandom:** returns requested count; respects `usedIds` exclusion; returns all unique items when count equals length; throws when count exceeds available

## Commit
```
32ed1b5 feat(p1): add weightedRandom and pickRandom utilities
```

## Concerns
None. Both functions are stateless, well-typed, and documented with JSDoc. They are ready for consumption by later phases.
