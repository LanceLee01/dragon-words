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
