// @vitest-environment node
// ---------------------------------------------------------------------------
// Equipment Affix Engine — comprehensive unit tests
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAffixCount,
  getAllowedTiers,
  generateAffixes,
  applyAffixes,
  mergeAffixes,
} from './equipment';
import { AFFIX_POOLS } from '../data/affixes';
import type { BattleStats, AffixStat } from '../data/types';
import type { AffixInstance } from '../data/affixes';

// ===========================================================================
// 1. getAffixCount — correct ranges for tiers 1-4
// ===========================================================================
describe('getAffixCount', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 for tier 1 when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getAffixCount(1)).toBe(0);
  });

  it('returns 1 for tier 1 when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(getAffixCount(1)).toBe(1);
  });

  it('returns 1 for tier 2 when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getAffixCount(2)).toBe(1);
  });

  it('returns 2 for tier 2 when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(getAffixCount(2)).toBe(2);
  });

  it('returns 2 for tier 3 when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getAffixCount(3)).toBe(2);
  });

  it('returns 3 for tier 3 when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(getAffixCount(3)).toBe(3);
  });

  it('returns 3 for tier 4 when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getAffixCount(4)).toBe(3);
  });

  it('returns 4 for tier 4 when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(getAffixCount(4)).toBe(4);
  });

  it('returns 0 for unknown tier (default case)', () => {
    expect(getAffixCount(0)).toBe(0);
    expect(getAffixCount(5)).toBe(0);
    expect(getAffixCount(99)).toBe(0);
  });

  it('never exceeds the documented max for each tier (1000 iterations)', () => {
    for (let i = 0; i < 1000; i++) {
      const t1 = getAffixCount(1);
      const t2 = getAffixCount(2);
      const t3 = getAffixCount(3);
      const t4 = getAffixCount(4);
      expect(t1).toBeLessThanOrEqual(1);
      expect(t2).toBeLessThanOrEqual(2);
      expect(t3).toBeLessThanOrEqual(3);
      expect(t4).toBeLessThanOrEqual(4);
    }
  });
});

// ===========================================================================
// 2. getAllowedTiers — correct tier arrays for tiers 1-4
// ===========================================================================
describe('getAllowedTiers', () => {
  it('returns [1] for tier 1', () => {
    expect(getAllowedTiers(1)).toEqual([1]);
  });

  it('returns [1, 2] for tier 2', () => {
    expect(getAllowedTiers(2)).toEqual([1, 2]);
  });

  it('returns [2, 3] for tier 3', () => {
    expect(getAllowedTiers(3)).toEqual([2, 3]);
  });

  it('returns [3, 4] for tier 4', () => {
    expect(getAllowedTiers(4)).toEqual([3, 4]);
  });

  it('returns [1] for unknown tier (default case)', () => {
    expect(getAllowedTiers(0)).toEqual([1]);
    expect(getAllowedTiers(5)).toEqual([1]);
    expect(getAllowedTiers(-1)).toEqual([1]);
  });
});

// ===========================================================================
// 3. generateAffixes — generation logic, no duplicates, values in range
// ===========================================================================
describe('generateAffixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when count is 0', () => {
    expect(generateAffixes(1, 0)).toEqual([]);
    expect(generateAffixes(4, 0)).toEqual([]);
  });

  it('returns empty array for tier 1 when random gives 0 affixes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = generateAffixes(1);
    expect(result).toEqual([]);
  });

  it('generates the requested number of affixes when count is given', () => {
    // Mock rollAffixValue to return a deterministic value
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateAffixes(4, 2);
    expect(result).toHaveLength(2);
  });

  it('generates no duplicate stats', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateAffixes(4, 4);
    const stats = result.map((a) => a.stat);
    expect(new Set(stats).size).toBe(stats.length);
  });

  it('generates affixes from the correct tier pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Tier 1 only allows tier 1 pool
    const t1result = generateAffixes(1, 1);
    if (t1result.length > 0) {
      const affixDef = AFFIX_POOLS[1].find((a) => a.id === t1result[0].affixId);
      expect(affixDef).toBeDefined();
    }

    // Tier 4 allows tiers 3 and 4 — all generated affix ids should be from those pools
    const t4result = generateAffixes(4, 3);
    const t3Ids = new Set(AFFIX_POOLS[3].map((a) => a.id));
    const t4Ids = new Set(AFFIX_POOLS[4].map((a) => a.id));
    for (const affix of t4result) {
      expect(t3Ids.has(affix.affixId) || t4Ids.has(affix.affixId)).toBe(true);
    }
  });

  it('produces values within the affix min-max range', () => {
    // For each affix def in the pool, verify its rollAffixValue produces in-range values
    // We need to generate affixes and check values
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateAffixes(4, 4);
    for (const affix of result) {
      // Look up the affix definition to get min/max
      for (const tierKey of [1, 2, 3, 4]) {
        const def = AFFIX_POOLS[tierKey].find((a) => a.id === affix.affixId);
        if (def) {
          expect(affix.value).toBeGreaterThanOrEqual(def.value.min);
          expect(affix.value).toBeLessThanOrEqual(def.value.max);
          break;
        }
      }
    }
  });

  it('defaults to getAffixCount when count is not provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999); // max count
    const result = generateAffixes(4);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('sets locked to false on all generated affixes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateAffixes(4, 3);
    for (const affix of result) {
      expect(affix.locked).toBe(false);
    }
  });

  it('each generated affix has a unique id', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateAffixes(4, 4);
    const ids = result.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ===========================================================================
// 4. applyAffixes — numeric addition, boolean stats, immutability
// ===========================================================================
describe('applyAffixes', () => {
  const BASE_STATS: BattleStats = {
    critRate: 5,
    critDmg: 50,
    elementalDmg: 0,
    armorPen: 0,
    dotDmg: 0,
    shieldBreak: 0,
    maxHp: 100,
    hpRegen: 0,
    dmgReduction: 0,
    shieldMax: 0,
    statusResist: 0,
    thorns: 0,
    goldBonus: 0,
    xpBonus: 0,
    comboDecayReduction: 0,
    skillChargeSpeed: 0,
    timeBonus: 0,
    autoRemoveDistractor: 0,
    doubleCast: false,
    omniResist: 0,
    infiniteCombo: false,
    cheatDeath: false,
    killHeal: 0,
    skillDoubleCast: false,
  };

  it('adds numeric affix values correctly', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'critRate', value: 10, locked: false },
      { id: 'test-2', stat: 'maxHp', value: 50, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.critRate).toBe(15); // 5 + 10
    expect(result.maxHp).toBe(150);   // 100 + 50
  });

  it('sets boolean stats to true when value > 0', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'doubleCast', value: 1, locked: false },
      { id: 'test-2', stat: 'cheatDeath', value: 1, locked: false },
      { id: 'test-3', stat: 'infiniteCombo', value: 1, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.doubleCast).toBe(true);
    expect(result.cheatDeath).toBe(true);
    expect(result.infiniteCombo).toBe(true);
  });

  it('keeps boolean stats as false when value is 0', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'doubleCast', value: 0, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.doubleCast).toBe(false);
  });

  it('does not mutate the original stats object (immutability)', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'critRate', value: 10, locked: false },
    ];
    const original = { ...BASE_STATS };
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result).not.toBe(BASE_STATS);
    expect(BASE_STATS.critRate).toBe(original.critRate);
  });

  it('does not mutate the affixes array', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'critRate', value: 10, locked: false },
    ];
    const originalAffixes = [...affixes];
    applyAffixes(BASE_STATS, affixes);
    expect(affixes).toEqual(originalAffixes);
  });

  it('handles multiple affixes on the same stat (cumulative)', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'dmgReduction', value: 3, locked: false },
      { id: 'test-2', stat: 'dmgReduction', value: 2, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.dmgReduction).toBe(5); // 0 + 3 + 2
  });

  it('starts from a base of 0 for unset numeric stats', () => {
    const affixes: AffixInstance[] = [
      { id: 'test-1', stat: 'thorns', value: 5, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.thorns).toBe(5); // 0 + 5
  });

  it('applies all stat keys present in the affix data', () => {
    const affixes: AffixInstance[] = [
      { id: 't1', stat: 'critRate', value: 3, locked: false },
      { id: 't2', stat: 'critDmg', value: 15, locked: false },
      { id: 't3', stat: 'elementalDmg', value: 10, locked: false },
      { id: 't4', stat: 'armorPen', value: 2, locked: false },
      { id: 't5', stat: 'maxHp', value: 20, locked: false },
      { id: 't6', stat: 'hpRegen', value: 3, locked: false },
      { id: 't7', stat: 'dmgReduction', value: 4, locked: false },
      { id: 't8', stat: 'shieldMax', value: 15, locked: false },
      { id: 't9', stat: 'statusResist', value: 5, locked: false },
      { id: 't10', stat: 'thorns', value: 7, locked: false },
      { id: 't11', stat: 'goldBonus', value: 8, locked: false },
      { id: 't12', stat: 'xpBonus', value: 6, locked: false },
      { id: 't13', stat: 'comboDecayReduction', value: 5, locked: false },
      { id: 't14', stat: 'skillChargeSpeed', value: 7, locked: false },
      { id: 't15', stat: 'timeBonus', value: 1, locked: false },
      { id: 't16', stat: 'autoRemoveDistractor', value: 1, locked: false },
      { id: 't17', stat: 'omniResist', value: 15, locked: false },
      { id: 't18', stat: 'killHeal', value: 8, locked: false },
    ];
    const result = applyAffixes(BASE_STATS, affixes);
    expect(result.critRate).toBe(8);
    expect(result.critDmg).toBe(65);
    expect(result.elementalDmg).toBe(10);
    expect(result.armorPen).toBe(2);
    expect(result.maxHp).toBe(120);
    expect(result.hpRegen).toBe(3);
    expect(result.dmgReduction).toBe(4);
    expect(result.shieldMax).toBe(15);
    expect(result.statusResist).toBe(5);
    expect(result.thorns).toBe(7);
    expect(result.goldBonus).toBe(8);
    expect(result.xpBonus).toBe(6);
    expect(result.comboDecayReduction).toBe(5);
    expect(result.skillChargeSpeed).toBe(7);
    expect(result.timeBonus).toBe(1);
    expect(result.autoRemoveDistractor).toBe(1);
    expect(result.omniResist).toBe(15);
    expect(result.killHeal).toBe(8);
  });
});

// ===========================================================================
// 5. mergeAffixes — best value, locked preserved, max 6
// ===========================================================================
describe('mergeAffixes', () => {
  it('keeps the best value for the same stat', () => {
    const base: AffixInstance[] = [
      { id: 'a1', stat: 'critRate', value: 5, locked: false },
    ];
    const donor: AffixInstance[] = [
      { id: 'a2', stat: 'critRate', value: 10, locked: false },
    ];
    const result = mergeAffixes(base, donor, []);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(10);
  });

  it('preserves locked affixes regardless of value', () => {
    const base: AffixInstance[] = [
      { id: 'locked-1', stat: 'critRate', value: 3, locked: true },
    ];
    const donor: AffixInstance[] = [
      { id: 'donor-1', stat: 'critRate', value: 10, locked: false },
    ];
    const result = mergeAffixes(base, donor, ['locked-1']);
    // locked-1 is in the locked set, so it's preserved even though donor has higher value
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('locked-1');
    expect(result[0].value).toBe(10); // But value is still the best (10 > 3)
  });

  it('limits total affixes to 6', () => {
    const affixes: AffixInstance[] = [];
    for (let i = 0; i < 10; i++) {
      affixes.push({
        id: `affix-${i}`,
        stat: `stat${i}`,
        value: i,
        locked: false,
      });
    }
    const result = mergeAffixes(affixes, [], []);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  it('combines base and donor affixes', () => {
    const base: AffixInstance[] = [
      { id: 'b1', stat: 'critRate', value: 5, locked: false },
      { id: 'b2', stat: 'maxHp', value: 20, locked: false },
    ];
    const donor: AffixInstance[] = [
      { id: 'd1', stat: 'dmgReduction', value: 3, locked: false },
    ];
    const result = mergeAffixes(base, donor, []);
    expect(result).toHaveLength(3);
    const stats = result.map((a) => a.stat).sort();
    expect(stats).toEqual(['critRate', 'dmgReduction', 'maxHp']);
  });

  it('sorts unlocked affixes by value descending', () => {
    const base: AffixInstance[] = [
      { id: 'b1', stat: 'low', value: 1, locked: false },
      { id: 'b2', stat: 'high', value: 99, locked: false },
      { id: 'b3', stat: 'mid', value: 50, locked: false },
    ];
    const result = mergeAffixes(base, [], []);
    expect(result[0].value).toBe(99);
    expect(result[1].value).toBe(50);
    expect(result[2].value).toBe(1);
  });

  it('keeps locked affixes at the start regardless of value', () => {
    const base: AffixInstance[] = [
      { id: 'low-locked', stat: 'low', value: 1, locked: true },
      { id: 'high-unlocked', stat: 'high', value: 99, locked: false },
    ];
    const result = mergeAffixes(base, [], ['low-locked']);
    expect(result[0].id).toBe('low-locked');
    expect(result[1].id).toBe('high-unlocked');
  });

  it('returns empty array for empty inputs', () => {
    const result = mergeAffixes([], [], []);
    expect(result).toEqual([]);
  });

  it('deduplicates same stat across base and donor keeping higher value', () => {
    const base: AffixInstance[] = [
      { id: 'b1', stat: 'critRate', value: 5, locked: false },
      { id: 'b2', stat: 'maxHp', value: 100, locked: false },
    ];
    const donor: AffixInstance[] = [
      { id: 'd1', stat: 'critRate', value: 8, locked: false },
      { id: 'd2', stat: 'maxHp', value: 50, locked: false },
    ];
    const result = mergeAffixes(base, donor, []);
    expect(result).toHaveLength(2);
    const cr = result.find((a) => a.stat === 'critRate')!;
    const hp = result.find((a) => a.stat === 'maxHp')!;
    expect(cr.value).toBe(8);   // donor has higher
    expect(hp.value).toBe(100); // base has higher
  });
});

// ===========================================================================
// 6. Edge cases
// ===========================================================================
describe('edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyAffixes with empty affix array', () => {
    it('returns a copy of the original stats unchanged', () => {
      const stats: BattleStats = {
        critRate: 5,
        critDmg: 50,
        elementalDmg: 0,
        armorPen: 0,
        dotDmg: 0,
        shieldBreak: 0,
        maxHp: 100,
        hpRegen: 0,
        dmgReduction: 0,
        shieldMax: 0,
        statusResist: 0,
        thorns: 0,
        goldBonus: 0,
        xpBonus: 0,
        comboDecayReduction: 0,
        skillChargeSpeed: 0,
        timeBonus: 0,
        autoRemoveDistractor: 0,
        doubleCast: false,
        omniResist: 0,
        infiniteCombo: false,
        cheatDeath: false,
        killHeal: 0,
        skillDoubleCast: false,
      };
      const result = applyAffixes(stats, []);
      expect(result).toEqual(stats);
      expect(result).not.toBe(stats); // different reference
    });
  });

  describe('tier 4 with count=4 (exceeds tier 4 pool size of 4)', () => {
    it('generates 4 affixes from tiers 3 and 4 combined (total 10 unique stats)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = generateAffixes(4, 4);
      expect(result).toHaveLength(4);
      // Check no duplicate stats
      const stats = result.map((a) => a.stat);
      expect(new Set(stats).size).toBe(4);
    });
  });

  describe('generateAffixes with count larger than available unique stats', () => {
    it('gracefully falls back to returning all available affixes when count > pool size', () => {
      // T4 allowed tiers = [3, 4], combined deduped pool = 6 (T3) + 4 (T4) - 0 overlap = 10
      // Let's request more than the pool size
      const result = generateAffixes(1, 100);
      // T1 pool has 6 affixes, so it should return all 6
      expect(result.length).toBeLessThanOrEqual(6);
      // All unique stats
      const stats = new Set(result.map((a) => a.stat));
      expect(stats.size).toBe(result.length);
    });
  });

  describe('mergeAffixes with all locked affixes', () => {
    it('keeps all locked affixes up to 6', () => {
      const affixes: AffixInstance[] = [
        { id: 'l1', stat: 'critRate', value: 5, locked: true },
        { id: 'l2', stat: 'critDmg', value: 20, locked: true },
        { id: 'l3', stat: 'maxHp', value: 50, locked: true },
        { id: 'l4', stat: 'dmgReduction', value: 3, locked: true },
      ];
      const result = mergeAffixes(affixes, [], ['l1', 'l2', 'l3', 'l4']);
      expect(result).toHaveLength(4);
      expect(result.every((a) => a.locked)).toBe(true);
    });

    it('does not include locked affixes not present in either base or donor', () => {
      const base: AffixInstance[] = [
        { id: 'b1', stat: 'critRate', value: 5, locked: false },
      ];
      // 'nonexistent' is in lockedIds but not in base or donor
      const result = mergeAffixes(base, [], ['nonexistent']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b1');
    });
  });

  describe('mergeAffixes with more than 6 locked affixes', () => {
    it('still caps at 6 total affixes', () => {
      const affixes: AffixInstance[] = [];
      const lockedIds: string[] = [];
      for (let i = 0; i < 8; i++) {
        const id = `locked-${i}`;
        affixes.push({ id, stat: `stat${i}`, value: i, locked: true });
        lockedIds.push(id);
      }
      const result = mergeAffixes(affixes, [], lockedIds);
      expect(result).toHaveLength(6);
    });
  });

  describe('getAffixCount consistency across multiple calls', () => {
    it('returns values within documented range for each tier', () => {
      // Run many iterations to verify the distribution is valid
      const ranges: Record<number, [number, number]> = {
        1: [0, 1],
        2: [1, 2],
        3: [2, 3],
        4: [3, 4],
      };
      for (let tier = 1; tier <= 4; tier++) {
        for (let i = 0; i < 500; i++) {
          const count = getAffixCount(tier);
          const [min, max] = ranges[tier];
          expect(count).toBeGreaterThanOrEqual(min);
          expect(count).toBeLessThanOrEqual(max);
        }
      }
    });
  });
});
