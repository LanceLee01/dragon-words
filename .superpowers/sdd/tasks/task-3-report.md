# Task 3 Report — Extend `stores/playerStore.ts`

**Status: DONE**

## Commits

- `138b8e7` — `feat(p1): extend playerStore with equipmentWithAffixes and lockedAffixIds`

## Changes Made

**File modified:** `src/stores/playerStore.ts` (+37 lines, -1)

1. **Interface (`PlayerStore`)** — Appended after `updateCombo`:
   - `equipmentWithAffixes` — object with `weapon`, `armor`, `accessory` slots, each `(Equipment & { affixes: Array<{id, stat, value}> }) | null`
   - `lockedAffixIds: string[]`
   - `equipWithAffixes(slot, item)` — assigns affixed item to a slot
   - `lockAffix(affixId)` — adds ID to locked set (idempotent)
   - `unlockAffix(affixId)` — removes ID from locked set
   - `isAffixLocked(affixId): boolean` — checks if ID is locked

2. **Creator callback** — Changed `(set)` → `(set, get)` to support the reader action.

3. **Initial state / actions** — Appended after `updateCombo`:
   - `equipmentWithAffixes: { weapon: null, armor: null, accessory: null }`
   - `lockedAffixIds: []`
   - All four actions implemented per spec.

## Verification

- `npx tsc --noEmit --pretty` — **zero errors**
- `git diff` confirms only appended content; all existing fields unchanged.

## Concerns

None.
