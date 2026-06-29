# P1 Phase 0: Infrastructure & Shared Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundational types, store extensions, utility functions, and shared UI components that all P1 modules (Random Events, Equipment Affixes, DDA, Micro-story) depend on.

**Architecture:** Pure TS types in `core/data/types.ts` → Zustand store extensions → utility functions in `core/utils/random.ts` → framer-motion UI components in `components/ui/`. Zero business logic — only infrastructure.

**Tech Stack:** React 18, TypeScript 5.6, Zustand v5, framer-motion v12, Tailwind CSS v4, Vitest

## Global Constraints

- All new types go in `src/core/data/types.ts` (the existing types file, NOT new files)
- Store extensions follow existing Zustand patterns: `create<X>((set, get) => ({...}))`
- UI components use Tailwind CSS v4 + framer-motion (both already in deps)
- New files go next to their peers: `core/utils/`, `components/ui/`
- All utility functions MUST have unit tests in a co-located `.test.ts` file

---
## File Structure

```
src/
├── core/
│   ├── data/
│   │   └── types.ts              ← MODIFY: append P1 types
│   └── utils/
│       ├── random.ts              ← CREATE: weightedRandom, pickRandom
│       └── random.test.ts         ← CREATE: unit tests
├── stores/
│   ├── gameStore.ts               ← MODIFY: add eventHistory, globalFlags, storyProgress
│   ├── playerStore.ts             ← MODIFY: add equipmentWithAffixes, lockedAffixIds
│   └── battleStore.ts             ← MODIFY: add ddaState
└── components/
    └── ui/
        ├── Modal.tsx              ← CREATE: fullscreen + centered overlay
        ├── TypewriterText.tsx     ← CREATE: typewriter animation
        ├── FlyReward.tsx          ← CREATE: reward fly-in animation
        └── IconBadge.tsx          ← CREATE: colored category badge
```

---

### Task 1: Append P1 types to `core/data/types.ts`

**Files:**
- Modify: `src/core/data/types.ts` (append at end of file)

**Interfaces:**
- Consumes: existing types like `Equipment`, `PlayerState`
- Produces: `TriggerPoint`, `DDAModifiers`, `BattleStats`, `AffixStat`, `EventResult`, `GameFlags` — used by all later tasks

- [ ] **Step 1: Open `src/core/data/types.ts` and append the P1 types block**

Navigate to the end of `src/core/data/types.ts` and add:

```typescript
// =====================================================================
// P1 Module Shared Types  (hidden random events, affixes, DDA, micro-story)
// =====================================================================

/** Points at which a random event may trigger */
export type TriggerPoint =
  | 'boss_victory'
  | 'daily_login'
  | 'login_streak'
  | 'chapter_first_clear'
  | 'achievement'
  | 'game_start';

/** Current DDA modifiers — all fields are serializable */
export interface DDAModifiers {
  monsterHpMul: number;
  monsterAtkMul: number;
  timeBonus: number;
  easyWordBias: number;
  hardWordBias: number;
  forceEasyWord: boolean;
  forceTutor: boolean;
  extraShield: number;
  rewardGoldMul: number;
  rewardXpMul: number;
  dropRarityBonus: number;
  challengeMode: boolean;
}

/** Accumulated battle stats after applying all equipment affixes */
export interface BattleStats {
  critRate: number;
  critDmg: number;
  elementalDmg: number;
  armorPen: number;
  dotDmg: number;
  shieldBreak: number;
  maxHp: number;
  hpRegen: number;
  dmgReduction: number;
  shieldMax: number;
  statusResist: number;
  thorns: number;
  goldBonus: number;
  xpBonus: number;
  comboDecayReduction: number;
  skillChargeSpeed: number;
  timeBonus: number;
  autoRemoveDistractor: number;
  doubleCast: boolean;
  omniResist: number;
  infiniteCombo: boolean;
  cheatDeath: boolean;
  killHeal: number;
  skillDoubleCast: boolean;
}

/** Union of all affix stat keys (keeps affixes and BattleStats in sync) */
export type AffixStat = keyof BattleStats;

/** Return type of EventEngine.executeChoice() */
export interface EventResult {
  rewards: import('./events').EventReward[];
  nextEvent: import('./events').RandomEvent | null;
  flags: string[];
}

/** Global flags container for story branching (Chapter 15 endings) */
export interface GameFlags {
  flags: Set<string>;
}
```

> **Note:** `EventResult` references `events.ts` which is created in Phase 1. This forward-reference will cause a compile error until `events.ts` exists. If you prefer a compile-clean Phase 0, replace the import references with inline placeholder types:
> ```typescript
> export interface EventResult {
>   rewards: Array<{ type: string; amount: number }>;
>   nextEvent: null | { id: string };
>   flags: string[];
> }
> ```
> The placeholder will be replaced when Phase 1 creates the real types.

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Either zero errors, or only expected errors about `events.ts` not existing yet (if using forward-reference).

- [ ] **Step 3: Commit**

```bash
git add src/core/data/types.ts
git commit -m "feat(p1): add P1 module shared types (TriggerPoint, DDAModifiers, BattleStats, etc.)"
```

---

### Task 2: Extend `stores/gameStore.ts`

**Files:**
- Modify: `src/stores/gameStore.ts`

**Interfaces:**
- Consumes: `GameFlags` from types.ts
- Produces: `eventHistory`, `globalFlags`, `storyProgress` fields + their actions

- [ ] **Step 1: Add new fields and actions to the `GameStore` interface**

Find the `GameStore` export interface and add after the last existing field:

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

- [ ] **Step 2: Add initial state and action implementations inside the Zustand creator**

Find the `return {` inside `create<GameStore>((set, get) => {` and add after the existing return fields:

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

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Zero errors (or only the expected events.ts forward-reference error).

- [ ] **Step 4: Commit**

```bash
git add src/stores/gameStore.ts
git commit -m "feat(p1): extend gameStore with eventHistory, globalFlags, storyProgress"
```

---

### Task 3: Extend `stores/playerStore.ts`

**Files:**
- Modify: `src/stores/playerStore.ts`

**Interfaces:**
- Consumes: `Equipment` from types.ts
- Produces: `equipmentWithAffixes`, `lockedAffixIds` fields + actions

- [ ] **Step 1: Add new fields and actions to `PlayerStore`**

Find the `PlayerStore` interface and add after the last existing action:

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

- [ ] **Step 2: Add initial state and implementations inside the Zustand creator**

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

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/stores/playerStore.ts
git commit -m "feat(p1): extend playerStore with equipmentWithAffixes and lockedAffixIds"
```

---

### Task 4: Extend `stores/battleStore.ts`

**Files:**
- Modify: `src/stores/battleStore.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `ddaState` field + actions

- [ ] **Step 1: Read existing battleStore to find the right insertion points**

- [ ] **Step 2: Add `ddaState` to the store interface**

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

- [ ] **Step 3: Add initial state and implementations**

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

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/stores/battleStore.ts
git commit -m "feat(p1): extend battleStore with ddaState and updateDDA/resetDDA"
```

---

### Task 5: Create `core/utils/random.ts` with tests

**Files:**
- Create: `src/core/utils/random.ts`
- Create: `src/core/utils/random.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `weightedRandom<T>()`, `pickRandom<T>()` — used by Phase 1 event engine, Phase 2 affix selection, Phase 3 DDA word selection

- [ ] **Step 1: Write the failing test**

Create `src/core/utils/random.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { weightedRandom, pickRandom } from './random';

describe('weightedRandom', () => {
  it('returns the only item when weight is 1', () => {
    const items = [{ item: 'a', weight: 1 }];
    expect(weightedRandom(items)).toBe('a');
  });

  it('returns item based on cumulative weight at roll=0', () => {
    const items = [
      { item: 'a', weight: 10 },
      { item: 'b', weight: 20 },
      { item: 'c', weight: 70 },
    ];
    // roll=0 → picks first item
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(weightedRandom(items)).toBe('a');
    vi.restoreAllMocks();
  });

  it('returns item based on cumulative weight at roll=0.5', () => {
    const items = [
      { item: 'a', weight: 10 },
      { item: 'b', weight: 20 },
      { item: 'c', weight: 70 },
    ];
    // total weight = 100, roll=0.5 → 50 falls in 'b' range (10-30)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(weightedRandom(items)).toBe('c');
    vi.restoreAllMocks();
  });

  it('handles all zero weights by picking first item', () => {
    const items = [
      { item: 'a', weight: 0 },
      { item: 'b', weight: 0 },
    ];
    expect(weightedRandom(items)).toBe('a');
  });

  it('throws on empty array', () => {
    expect(() => weightedRandom([])).toThrow();
  });
});

describe('pickRandom', () => {
  const items = [
    { id: '1', name: 'a' },
    { id: '2', name: 'b' },
    { id: '3', name: 'c' },
    { id: '4', name: 'd' },
  ];

  it('returns the requested count of items', () => {
    const result = pickRandom(items, 2);
    expect(result).toHaveLength(2);
  });

  it('does not include usedIds items', () => {
    const used = new Set<string>(['1', '2']);
    const result = pickRandom(items, 2, used);
    expect(result.every((item) => !used.has(item.id))).toBe(true);
  });

  it('returns all items when count equals length', () => {
    const result = pickRandom(items, 4);
    expect(result).toHaveLength(4);
    expect(new Set(result.map((i) => i.id)).size).toBe(4);
  });

  it('throws when count exceeds available items', () => {
    expect(() => pickRandom(items, 10)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/utils/random.test.ts 2>&1`
Expected: FAIL with import/resolution error (module not found).

- [ ] **Step 3: Write the minimal implementation**

Create `src/core/utils/random.ts`:

```typescript
/**
 * Weighted random selection from an array of items.
 * Each item's `weight` determines its probability.
 * Throws if array is empty.
 */
export function weightedRandom<T>(
  items: Array<{ item: T; weight: number }>,
): T {
  if (items.length === 0) {
    throw new Error('weightedRandom: empty array');
  }
  const totalWeight = items.reduce((sum, it) => sum + Math.max(0, it.weight), 0);
  if (totalWeight <= 0) {
    return items[0].item;
  }
  let roll = Math.random() * totalWeight;
  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.item;
  }
  // Fallback (shouldn't reach here due to floating point)
  return items[items.length - 1].item;
}

/**
 * Pick `count` unique items from an array, optionally excluding already-used IDs.
 * Throws if count exceeds available items.
 */
export function pickRandom<T extends { id: string }>(
  items: T[],
  count: number,
  usedIds?: Set<string>,
): T[] {
  let available = usedIds
    ? items.filter((item) => !usedIds.has(item.id))
    : [...items];

  if (count > available.length) {
    throw new Error(
      `pickRandom: requested ${count} items but only ${available.length} available`,
    );
  }

  const result: T[] = [];
  const taken = new Set<number>();

  while (result.length < count) {
    const idx = Math.floor(Math.random() * available.length);
    if (taken.has(idx)) continue;
    taken.add(idx);
    result.push(available[idx]);
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/core/utils/random.test.ts 2>&1`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/utils/random.ts src/core/utils/random.test.ts
git commit -m "feat(p1): add weightedRandom and pickRandom utilities"
```

---

### Task 6: Create `Modal.tsx` shared UI component

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: framer-motion (`motion`, `AnimatePresence`), ReactNode
- Produces: `<Modal open onClose variant>children</Modal>` — used by EventModal (Phase 1) and StoryPlayer (Phase 4)

- [ ] **Step 1: Write `src/components/ui/Modal.tsx`**

```tsx
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  variant?: 'fullscreen' | 'centered';
  children: ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fullscreenVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const centeredVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export function Modal({ open, onClose, variant = 'centered', children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className={
              variant === 'fullscreen'
                ? 'relative max-h-[90vh] w-[90vw] overflow-auto rounded-xl bg-gray-900 p-6'
                : 'relative max-h-[70vh] w-full max-w-md overflow-auto rounded-xl bg-gray-900 p-6 shadow-2xl'
            }
            variants={variant === 'fullscreen' ? fullscreenVariants : centeredVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat(p1): add shared Modal component (fullscreen + centered variants)"
```

---

### Task 7: Create `TypewriterText.tsx` shared UI component

**Files:**
- Create: `src/components/ui/TypewriterText.tsx`

**Interfaces:**
- Produces: `<TypewriterText text speed onComplete />` — used by EventModal (Phase 1) and StoryPlayer (Phase 4)

- [ ] **Step 1: Write `src/components/ui/TypewriterText.tsx`**

```tsx
import { useEffect, useState, useRef, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({ text, speed = 30, onComplete, className = '' }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayed(text);
    setDone(true);
    onComplete?.();
  }, [text, onComplete]);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    timerRef.current = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <span className={className} onClick={skip} style={{ cursor: done ? 'default' : 'pointer' }}>
      {displayed}
      {!done && <span className="animate-pulse">▌</span>}
    </span>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TypewriterText.tsx
git commit -m "feat(p1): add shared TypewriterText component with skip-on-click"
```

---

### Task 8: Create `FlyReward.tsx` shared UI component

**Files:**
- Create: `src/components/ui/FlyReward.tsx`

**Interfaces:**
- Produces: `<FlyReward rewards origin onComplete />` — used by EventModal (Phase 1) and VictoryScreen

- [ ] **Step 1: Write `src/components/ui/FlyReward.tsx`**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FlyRewardItem {
  type: string;
  amount: number;
  icon?: string;
}

interface FlyRewardProps {
  rewards: FlyRewardItem[];
  origin?: { x: number; y: number };
  onComplete?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  gold: '🪙',
  xp: '⚡',
  shield: '🛡️',
  item: '📦',
  cosmetic: '✨',
};

export function FlyReward({ rewards, onComplete }: FlyRewardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (rewards.length === 0) {
      onComplete?.();
      return;
    }
    // Auto-dismiss after all animations finish
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, rewards.length * 300 + 600);
    return () => clearTimeout(timer);
  }, [rewards, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {rewards.map((reward, i) => (
            <motion.div
              key={`${reward.type}-${i}`}
              className="absolute flex items-center gap-2 rounded-full bg-gray-800/90 px-4 py-2 text-lg font-bold text-white shadow-lg"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [0, -40 - i * 30, -80 - i * 30],
                scale: [0.5, 1.2, 1, 0.8],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
            >
              <span>{reward.icon || TYPE_ICONS[reward.type] || '🎁'}</span>
              <span>+{reward.amount}</span>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FlyReward.tsx
git commit -m "feat(p1): add shared FlyReward component with parabolic fly-in animation"
```

---

### Task 9: Create `IconBadge.tsx` shared UI component

**Files:**
- Create: `src/components/ui/IconBadge.tsx`

**Interfaces:**
- Produces: `<IconBadge category size tooltip />` — used by EquipmentDetail (Phase 2) and ShopPage

- [ ] **Step 1: Write `src/components/ui/IconBadge.tsx`**

```tsx
import { useState } from 'react';

interface IconBadgeProps {
  category: 'offense' | 'defense' | 'utility' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  offense: { color: 'bg-red-500', icon: '⚔️', label: '攻击' },
  defense: { color: 'bg-green-500', icon: '🛡️', label: '生存' },
  utility: { color: 'bg-blue-500', icon: '🔧', label: '功能' },
  legendary: { color: 'bg-yellow-500', icon: '⭐', label: '传说' },
};

const SIZE_MAP = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-7 h-7 text-sm',
  lg: 'w-9 h-9 text-base',
};

export function IconBadge({ category, size = 'md', tooltip }: IconBadgeProps) {
  const [showTip, setShowTip] = useState(false);
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.utility;

  return (
    <span className="relative inline-flex">
      <span
        className={`${SIZE_MAP[size]} ${config.color} inline-flex items-center justify-center rounded-full text-white shadow-sm`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {config.icon}
      </span>
      {showTip && tooltip && (
        <span className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow">
          {tooltip}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/IconBadge.tsx
git commit -m "feat(p1): add shared IconBadge component with category colors and tooltip"
```

---

## Self-Review Checklist

1. **Spec coverage:** Every section from the Phase 0 spec has a corresponding task:
   - 0.1 Types → Task 1
   - 0.2 gameStore → Task 2, playerStore → Task 3, battleStore → Task 4
   - 0.3 Modal → Task 6, TypewriterText → Task 7, FlyReward → Task 8, IconBadge → Task 9
   - 0.4 random.ts → Task 5

2. **Placeholder scan:** No TBD, TODO, or incomplete steps. Every step has exact code.

3. **Type consistency:** All type names match the spec doc. `AffixStat = keyof BattleStats` consistency maintained. `EventResult` forward-reference noted with fallback option.
