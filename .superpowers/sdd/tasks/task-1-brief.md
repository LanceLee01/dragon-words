# Task 1: Append P1 types to `core/data/types.ts`

**Files:**
- Modify: `src/core/data/types.ts` (append at end of file)

**Interfaces:**
- Consumes: existing types like `Equipment`, `PlayerState`
- Produces: `TriggerPoint`, `DDAModifiers`, `BattleStats`, `AffixStat`, `EventResult`, `GameFlags` — used by all later tasks

## Implementation

Navigate to the end of `src/core/data/types.ts` and add the following block:

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
  rewards: Array<{ type: string; amount: number }>;
  nextEvent: null | { id: string };
  flags: string[];
}

/** Global flags container for story branching (Chapter 15 endings) */
export interface GameFlags {
  flags: Set<string>;
}
```

> Note: `EventResult` uses inline placeholder types instead of forwarding to `events.ts` (which doesn't exist yet). This keeps the file compile-clean. Phase 1 will update this when creating `events.ts`.

## Steps

1. Open `src/core/data/types.ts`, scroll to end, append the block above
2. Verify: `npx tsc --noEmit --pretty 2>&1 | head -30` → expected: zero errors
3. Commit:
   ```
   git add src/core/data/types.ts
   git commit -m "feat(p1): add P1 module shared types (TriggerPoint, DDAModifiers, BattleStats, etc.)"
   ```

## Verification

- Run `npx tsc --noEmit --pretty` — zero errors
- Check the new exports are present: `grep "export type TriggerPoint" src/core/data/types.ts`
- Check the file still has its original content (types appended, not overwritten)
