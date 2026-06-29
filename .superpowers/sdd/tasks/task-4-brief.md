# Task 4: Extend `stores/battleStore.ts`

**Files:**
- Modify: `src/stores/battleStore.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `ddaState` field + `updateDDA`, `resetDDA` actions

## Implementation

### Step 1: Add to BattleStore interface

Find the `BattleStore` export interface in `src/stores/battleStore.ts`. Add after the last existing field:

```typescript
  // === P1: DDA State ===
  ddaState: {
    mistakeStreak: number;
    correctStreak: number;
    protectionLevel: number;
    challengeMode: boolean;
  };

  updateDDA: (correct: boolean) => void;
  resetDDA: () => void;
```

### Step 2: Add initial state and actions inside Zustand creator

Find the `return {` inside `create<BattleStore>((set, get) => {` block. Add after the last existing return field:

```typescript
    // === P1: DDA State ===
    ddaState: {
      mistakeStreak: 0,
      correctStreak: 0,
      protectionLevel: 0,
      challengeMode: false,
    },

    updateDDA: (correct) => set((s) => {
      const next = { ...s.ddaState };
      if (correct) {
        next.mistakeStreak = Math.max(0, next.mistakeStreak - 2);
        next.correctStreak++;
      } else {
        next.correctStreak = Math.max(0, next.correctStreak - 5);
        next.mistakeStreak++;
      }
      return { ddaState: next };
    }),

    resetDDA: () => set({
      ddaState: { mistakeStreak: 0, correctStreak: 0, protectionLevel: 0, challengeMode: false },
    }),
```

### Verification

- Run `npx tsc --noEmit --pretty 2>&1 | head -30` — zero errors
- Check that existing battleStore fields are unchanged

### Commit

```
git add src/stores/battleStore.ts
git commit -m "feat(p1): extend battleStore with ddaState and updateDDA/resetDDA"
```
