# Task 3: Extend `stores/playerStore.ts`

**Files:**
- Modify: `src/stores/playerStore.ts`

**Interfaces:**
- Consumes: `Equipment` type from `@/core/data/types`
- Produces: `equipmentWithAffixes`, `lockedAffixIds` fields + 4 actions

## Implementation

### Step 1: Add to PlayerStore interface

Find the `PlayerStore` export interface in `src/stores/playerStore.ts`. Add after the last existing action (after `promoteToAdvancedClass` or whichever is last):

```typescript
  // === P1: Equipment Affixes ===
  equipmentWithAffixes: {
    weapon: (Equipment & { affixes: Array<{ id: string; stat: string; value: number }> }) | null;
    armor: (Equipment & { affixes: Array<{ id: string; stat: string; value: number }> }) | null;
    accessory: (Equipment & { affixes: Array<{ id: string; stat: string; value: number }> }) | null;
  };
  lockedAffixIds: string[];

  equipWithAffixes: (
    slot: 'weapon' | 'armor' | 'accessory',
    item: Equipment & { affixes: Array<{ id: string; stat: string; value: number }> },
  ) => void;
  lockAffix: (affixId: string) => void;
  unlockAffix: (affixId: string) => void;
  isAffixLocked: (affixId: string) => boolean;
```

### Step 2: Add initial state and actions inside Zustand creator

Find the `return {` inside `create<PlayerStore>((set, get) => {` block. Add after the last existing return field:

```typescript
    // === P1: Equipment Affixes ===
    equipmentWithAffixes: { weapon: null, armor: null, accessory: null },
    lockedAffixIds: [],

    equipWithAffixes: (slot, item) => set((s) => ({
      equipmentWithAffixes: { ...s.equipmentWithAffixes, [slot]: item },
    })),

    lockAffix: (affixId) => set((s) => ({
      lockedAffixIds: s.lockedAffixIds.includes(affixId)
        ? s.lockedAffixIds
        : [...s.lockedAffixIds, affixId],
    })),

    unlockAffix: (affixId) => set((s) => ({
      lockedAffixIds: s.lockedAffixIds.filter((id) => id !== affixId),
    })),

    isAffixLocked: (affixId) => get().lockedAffixIds.includes(affixId),
```

### Verification

- Run `npx tsc --noEmit --pretty 2>&1 | head -30` — zero errors
- Check that existing playerStore fields are unchanged

### Commit

```
git add src/stores/playerStore.ts
git commit -m "feat(p1): extend playerStore with equipmentWithAffixes and lockedAffixIds"
```
