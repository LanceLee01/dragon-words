// ---------------------------------------------------------------------------
// Equipment Affix Engine — generation, merging, locking, & stat application
// ---------------------------------------------------------------------------
import type { Affix, AffixInstance } from '../data/affixes';
import { AFFIX_POOLS, rollAffixValue } from '../data/affixes';
import { pickRandom } from '../utils/random';
import type { Equipment, BattleStats } from '../data/types';

// ---------------------------------------------------------------------------
// Boolean stat keys — these are set to true when value > 0
// ---------------------------------------------------------------------------
const BOOLEAN_STATS = new Set<string>([
  'doubleCast',
  'cheatDeath',
  'infiniteCombo',
  'skillDoubleCast',
]);

// ---------------------------------------------------------------------------
// Affix count per tier
// ---------------------------------------------------------------------------

/**
 * Roll a random number of affixes for a given equipment tier.
 * T1: 0-1 affix, T2: 1-2, T3: 2-3, T4 (legendary): 3-4
 */
export function getAffixCount(tier: number): number {
  switch (tier) {
    case 1:
      return Math.floor(Math.random() * 2);        // 0–1
    case 2:
      return 1 + Math.floor(Math.random() * 2);     // 1–2
    case 3:
      return 2 + Math.floor(Math.random() * 2);     // 2–3
    case 4:
      return 3 + Math.floor(Math.random() * 2);     // 3–4
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Allowed affix tiers per equipment tier
// ---------------------------------------------------------------------------

/**
 * Get which affix tiers are available for a given equipment tier.
 * T1: tier 1 pool, T2: tier 1-2, T3: tier 2-3, T4: tier 3-4
 */
export function getAllowedTiers(tier: number): number[] {
  switch (tier) {
    case 1:
      return [1];
    case 2:
      return [1, 2];
    case 3:
      return [2, 3];
    case 4:
      return [3, 4];
    default:
      return [1];
  }
}

// ---------------------------------------------------------------------------
// Affix generation
// ---------------------------------------------------------------------------

/**
 * Generate affixes for equipment based on its quality/tier.
 * Higher tier equipment gets more affixes and from higher tier pools.
 */
export function generateAffixes(tier: number, count?: number): AffixInstance[] {
  const allowedTiers = getAllowedTiers(tier);
  const affixCount = count ?? getAffixCount(tier);

  if (affixCount <= 0) return [];

  // Gather all affix definitions from the allowed tiers
  const pool: Affix[] = [];
  for (const t of allowedTiers) {
    const tierPool = AFFIX_POOLS[t];
    if (tierPool) {
      pool.push(...tierPool);
    }
  }

  // Deduplicate by stat — when the same stat appears in multiple tiers,
  // prefer the higher tier version (which appears later in the pool)
  const seenStats = new Set<string>();
  const deduped: Affix[] = [];
  // Iterate in reverse so higher tiers take precedence, but keep first occurrence
  for (let i = pool.length - 1; i >= 0; i--) {
    const affix = pool[i];
    if (!seenStats.has(affix.stat)) {
      seenStats.add(affix.stat);
      deduped.unshift(affix); // prepend to restore original order
    }
  }

  if (affixCount > deduped.length) {
    // Not enough unique affixes — return what we have
    // (pickRandom would throw, so we fall back gracefully)
    return deduped.map((affix) => ({
      id: `${affix.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      affixId: affix.id,
      stat: affix.stat,
      value: rollAffixValue(affix),
      locked: false,
    }));
  }

  // Pick random affixes from the deduplicated pool (no duplicates by stat)
  const picked = pickRandom(deduped, affixCount);

  return picked.map((affix) => ({
    id: `${affix.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    affixId: affix.id,
    stat: affix.stat,
    value: rollAffixValue(affix),
    locked: false,
  }));
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

/**
 * Merge two pieces of same-name equipment.
 * Keeps the best values for each affix, up to 6 affixes total.
 * Locked affixes are always preserved.
 */
export function mergeAffixes(
  base: AffixInstance[],
  donor: AffixInstance[],
  lockedIds: string[],
): AffixInstance[] {
  const lockedSet = new Set(lockedIds);

  // 1. Collect all affixes by stat, keeping the higher value
  const bestByStat = new Map<string, AffixInstance>();

  for (const affix of [...base, ...donor]) {
    const existing = bestByStat.get(affix.stat);
    if (!existing || affix.value > existing.value) {
      bestByStat.set(affix.stat, { ...affix });
    }
  }

  // 2. Separate locked and unlocked
  const locked: AffixInstance[] = [];
  const unlocked: AffixInstance[] = [];

  for (const affix of bestByStat.values()) {
    if (lockedSet.has(affix.id)) {
      locked.push(affix);
    } else {
      unlocked.push(affix);
    }
  }

  // 3. Sort unlocked by value descending
  unlocked.sort((a, b) => b.value - a.value);

  // 4. Combine: locked always kept, fill rest with highest-value unlocked up to 6 total
  const result: AffixInstance[] = [...locked];
  const remaining = 6 - result.length;

  for (let i = 0; i < remaining && i < unlocked.length; i++) {
    result.push(unlocked[i]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stat application
// ---------------------------------------------------------------------------

/**
 * Apply affixes to base BattleStats and return the modified stats.
 */
export function applyAffixes(
  stats: BattleStats,
  affixes: AffixInstance[],
): BattleStats {
  const result = { ...stats };

  for (const affix of affixes) {
    const key = affix.stat;

    if (BOOLEAN_STATS.has(key)) {
      // Boolean stats: set to true if value > 0
      (result as Record<string, unknown>)[key] = affix.value > 0;
    } else {
      // Numeric stat: add the value
      const current = (result as Record<string, number>)[key] ?? 0;
      (result as Record<string, number>)[key] = current + affix.value;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Equipment + affixes convenience
// ---------------------------------------------------------------------------

/**
 * Create an EquipmentWithAffixes by attaching generated affixes to base equipment.
 */
export function generateEquipmentWithAffixes(
  base: Equipment,
): Equipment & { affixes: AffixInstance[] } {
  const affixes = generateAffixes(base.tier);
  return {
    ...base,
    affixes,
  };
}
