# Task 3 Report: Core Battle Engine & FSM

**Date:** 2026-06-18

## Summary

Implemented the pure TypeScript battle engine and finite state machine for Dragon Words, following TDD methodology. All 46 tests pass (35 battle + 11 FSM) with zero TypeScript errors.

## Files Created

### `src/core/engine/battle.ts` — Battle Engine

| Function | Description |
|---|---|
| `createBattle(player, monster, playerBoardAttack)` | Initializes `BattleState` with full HP, combo=0, charge=0, phase='question' |
| `calculateDamage(baseAttack, combo, isCrit, isSkill)` | Applies combo multiplier (1/1.5/2/3 for combo≥1/3/5/7) and crit ×2, then `Math.round` |
| `getComboMultiplier(combo)` | Returns the multiplier for a given combo count |
| `getPlayerAttack(player)` | Base class `baseAttack` + player `attack` + advanced class `baseAttackBonus` |
| `getEffectiveComboStart(player)` | 2 for archmage, 1 for mage, 0 otherwise |
| `isCrit(player, wasLastWrong)` | Probabilistic crit: shadow-master 30%, elf-lord 50%, rogue 15%, ranger+wrong 30% |
| `answerQuestion(battle, player, monster, correct)` | Correct: combo++/charge++/deal damage/check victory. Wrong: reset combo/charge, monster counter-attack |
| `useSkill(battle, player, monster, skillIndex)` | 11 skill variants (6 base + 5 advanced) with damage multipliers, stun, shield, heal, multi-hit, instakill, DoT |
| `monsterTurn(battle, monster)` | Decrements stun/invulnerable timers, skips attack if active, otherwise deals monster damage |

### `src/core/engine/fsm.ts` — GameFSM

- **Phase type:** `GamePhase` from data types (`'menu' | 'classSelect' | 'adventure' | 'battle' | 'reward' | 'gameover' | 'shop'`)
- **`send(event)`**: Transition by event string; invalid transitions silently return current phase
- **`onEnterPhase(phase, handler)`**: Register callback for phase entry
- **`forcePhase(phase)`**: Direct set with callback firing

**Transition table:**

| From | Event | To |
|---|---|---|
| menu | START_GAME | classSelect |
| classSelect | SELECT_CLASS | adventure |
| adventure | START_BATTLE | battle |
| adventure | OPEN_SHOP | shop |
| adventure | GO_HOME | menu |
| battle | BATTLE_WIN | reward |
| battle | BATTLE_LOSE | gameover |
| reward | RETURN_MAP | adventure |
| reward | GO_HOME | menu |
| gameover | RETURN_MAP | adventure |
| gameover | GO_HOME | menu |
| shop | CLOSE_SHOP | adventure |
| shop | GO_HOME | menu |

### `src/core/engine/battle.test.ts` — 35 tests

- `createBattle`: HP/combo/charge/phase initialization
- `calculateDamage`: Multiplier thresholds (0,3,5,7+), crit doubling, rounding
- `getComboMultiplier`: All four multiplier ranges
- `getPlayerAttack`: Base class, advanced class bonus
- `isCrit`: Per-class probabilities with randomized acceptance ranges
- `answerQuestion`: Combo/charge increment/reset, damage, victory, defeat
- `useSkill`: Warrior ×3, dragon-knight ×4+shield, paladin 40% heal, light-lord full heal
- `monsterTurn`: Normal damage, stun skip, invulnerable skip, defeat

### `src/core/engine/fsm.test.ts` — 11 tests

- Start at menu, full win/lose chains, invalid transitions, callback triggers, `forcePhase`, shop/open/close, GO_HOME from all phases

## Verification

```
npx vitest run      → 2 files, 46 tests passed
npx tsc --noEmit    → zero errors
```

## Constraints Satisfied

- ✅ Pure TypeScript — zero React imports in `core/`
- ✅ Test files side by side with implementation
- ✅ All imports use `@/` path alias or relative paths
- ✅ TDD followed (tests written first, confirmed failing, then implemented)

---

## Fix Round 1 — 2026-06-18

### 4 Issues Resolved

#### Issue 1: Double-attack bug
- **Problem:** `answerQuestion` wrong path dealt monster counterattack damage AND set `phase='monster-turn'`, while `monsterTurn` also dealt damage — double attack.
- **Fix:** Removed counterattack damage from `answerQuestion` wrong path (now only resets combo/charge/phase). `monsterTurn` now sets `phase='question'` after dealing damage (unless player HP ≤ 0 → 'defeat'). Stun/invulnerable skip paths also cycle phase to 'question'.

#### Issue 2: Two BattleState interfaces
- **Problem:** `src/core/data/types.ts` had a simpler `BattleState` while `src/core/engine/battle.ts` defined its own extended version.
- **Fix:** Added `combo`, `phase` (new `BattlePhase` type), `stunTimer`, `invulnerable` to types.ts. battle.ts imports `BattleState` from types.ts — local duplicate removed.

#### Issue 3: Missing `getEffectiveComboStart` tests
- **Added:** 3 tests — mage starts at 1, archmage starts at 2, warrior starts at 0.

#### Issue 4: Unused parameters
- **Removed:** `_isSkill` from `calculateDamage` signature (4th boolean was never used). `_playerBoardAttack` from `createBattle` signature (3rd number was never used). Updated all callers.

### Files Changed
- `src/core/data/types.ts` — BattleState extended with combo/phase/stunTimer/invulnerable, BattlePhase type added
- `src/core/engine/battle.ts` — imports BattleState from types.ts; removed local types; removed 2 unused params; removed counterattack from wrong path; monsterTurn cycles phase
- `src/core/engine/battle.test.ts` — updated all caller signatures; rewritten wrong-answer test (#7); added phase assertions to monsterTurn tests; added getEffectiveComboStart tests

### Verification
```
npx vitest run src/core/engine/battle.test.ts → 38 tests passed
npx vitest run src/core/engine/fsm.test.ts    → 11 tests passed
npx tsc --noEmit                               → zero errors
```
