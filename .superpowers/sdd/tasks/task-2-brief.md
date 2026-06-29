# Task 2: Extend `stores/gameStore.ts`

**Files:**
- Modify: `src/stores/gameStore.ts`

**Interfaces:**
- Consumes: nothing new (types already exist from Task 1)
- Produces: `eventHistory`, `globalFlags`, `storyProgress` fields + their actions

## Implementation

### Step 1: Add to GameStore interface

Find the `GameStore` export interface in `src/stores/gameStore.ts` and add after the last existing field (after `initWords`):

```typescript
  // === P1: Random Events & Story Progress ===
  eventHistory: Array<{ id: string; timestamp: number; choice: string }>;
  globalFlags: Set<string>;
  storyProgress: {
    unlockedBeats: Set<string>;
    galleryEntries: Set<string>;
  };

  addEventToHistory: (entry: { id: string; choice: string }) => void;
  setFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  unlockStoryBeat: (beatId: string) => void;
  unlockGalleryEntry: (entryId: string) => void;
```

### Step 2: Add initial state and actions inside Zustand creator

Find the `return {` inside `create<GameStore>((set, get) => {` block. Add after the last existing return field:

```typescript
    // === P1: Random Events & Story Progress ===
    eventHistory: [],
    globalFlags: new Set<string>(),
    storyProgress: {
      unlockedBeats: new Set<string>(),
      galleryEntries: new Set<string>(),
    },

    addEventToHistory: (entry) => set((s) => ({
      eventHistory: [...s.eventHistory, { ...entry, timestamp: Date.now() }],
    })),

    setFlag: (flag) => set((s) => ({
      globalFlags: new Set(s.globalFlags).add(flag),
    })),

    hasFlag: (flag) => get().globalFlags.has(flag),

    unlockStoryBeat: (beatId) => set((s) => ({
      storyProgress: {
        ...s.storyProgress,
        unlockedBeats: new Set(s.storyProgress.unlockedBeats).add(beatId),
      },
    })),

    unlockGalleryEntry: (entryId) => set((s) => ({
      storyProgress: {
        ...s.storyProgress,
        galleryEntries: new Set(s.storyProgress.galleryEntries).add(entryId),
      },
    })),
```

### Verification

- Run `npx tsc --noEmit --pretty 2>&1 | head -30` — zero errors
- Check that existing gameStore fields are unchanged

### Commit

```
git add src/stores/gameStore.ts
git commit -m "feat(p1): extend gameStore with eventHistory, globalFlags, storyProgress"
```
