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
