# Task 5: Create `core/utils/random.ts` with tests

**Files:**
- Create: `src/core/utils/random.ts`
- Create: `src/core/utils/random.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `weightedRandom<T>()`, `pickRandom<T>()` — used by all later phases

## Implementation

### Step 1: Write the failing test

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

### Step 2: Run the test to verify it fails

Run: `npx vitest run src/core/utils/random.test.ts` — Expected: FAIL (module not found)

### Step 3: Write the implementation

Create `src/core/utils/random.ts`:

```typescript
/**
 * Weighted random selection from an array of items.
 * Each item's weight determines its probability.
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
  return items[items.length - 1].item;
}

/**
 * Pick count unique items from an array, optionally excluding already-used IDs.
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

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/core/utils/random.test.ts` — Expected: all PASS

### Step 5: Commit

```
git add src/core/utils/random.ts src/core/utils/random.test.ts
git commit -m "feat(p1): add weightedRandom and pickRandom utilities"
```
