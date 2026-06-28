# Task 1: Add BattleLogEntry type and update BattleState

**Files:**
- Modify: `src/core/data/types.ts`

**Steps:**
1. Add `BattleLogEntry` interface after line 243 (before `BaseQuestion`)
2. Add `lastCrit: boolean` and `log: BattleLogEntry[]` fields to `BattleState` after `lastDamageTaken`

## BattleLogEntry interface

```typescript
/** A single entry in the battle log */
export interface BattleLogEntry {
  turn: number;
  wordEnglish: string;
  wordChinese: string;
  questionType: string;
  isCorrect: boolean;
  damageDealt: number;
  damageTaken: number;
  lastCombo: number;
  isCrit: boolean;
  monsterHpAfter: number;
  monsterMaxHp: number;
  playerHpAfter: number;
  playerMaxHp: number;
  monsterName: string;
}
```

## BattleState changes

Add after `lastDamageTaken: number`:
```typescript
  /** Whether the last attack was a critical hit */
  lastCrit: boolean;
  /** Battle log entries accumulated during the fight */
  log: BattleLogEntry[];
```

After making changes, verify with `npx tsc --noEmit`. It will show errors because `createBattle` in battle.ts doesn't return the new fields — that's expected and will be fixed in Task 2.
