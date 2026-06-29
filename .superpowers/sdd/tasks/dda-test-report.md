# DDAController Test Report

**File:** `src/core/engine/dda.test.ts`  
**Source:** `src/core/engine/dda.ts`  
**Date:** 2025-06-18  
**Command:** `npx vitest run src/core/engine/dda.test.ts`  
**Result:** ✅ **56 / 56 tests passed**

---

## Test Coverage by Category

### 1. Initial State (4 tests)
| # | Test | Status |
|---|------|--------|
| 1 | Starts with zero streaks, no protection, no challenge, base modifiers | ✅ |
| 2 | Accepts optional initial streaks but does NOT recalculate | ✅ |
| 3 | Defaults to zero when constructor receives undefined | ✅ |
| 4 | `getModifiers()` returns a copy (not a reference) | ✅ |
| 5 | `getState()` returns a snapshot (immutable copy) | ✅ |

### 2. `onAnswerCorrect` (3 tests)
| # | Test | Status |
|---|------|--------|
| 6 | Increments `correctStreak` by 1 | ✅ |
| 7 | Decreases `mistakeStreak` by 2 (floor at 0) | ✅ |
| 8 | Can reduce `mistakeStreak` from any value without going negative | ✅ |
| 9 | Triggers recalculate — protection can downgrade | ✅ |

### 3. `onAnswerWrong` (3 tests)
| # | Test | Status |
|---|------|--------|
| 10 | Increments `mistakeStreak` by 1 | ✅ |
| 11 | Decreases `correctStreak` by 5 (floor at 0) | ✅ |
| 12 | Triggers recalculate — protection activates at threshold | ✅ |

### 4. Protection Tiers (9 tests)
| # | Test | Status |
|---|------|--------|
| 13 | Tier 0 (5 mistakes): `monsterHpMul=0.85`, `monsterAtkMul=0.80`, `timeBonus=2`, `easyWordBias=0.25` | ✅ |
| 14 | Tier 1 (8 mistakes): `monsterHpMul=0.65`, `forceEasyWord=true`, `extraShield=1` | ✅ |
| 15 | Tier 2 (10 mistakes): `monsterHpMul=0.30`, `forceEasyWord=true`, `forceTutor=true`, `extraShield=2` | ✅ |
| 16 | Boundary: 4 mistakes = no protection, 5 = tier 0 | ✅ |
| 17 | Boundary: 7 mistakes = tier 0, 8 = tier 1 | ✅ |
| 18 | Boundary: 9 mistakes = tier 1, 10 = tier 2 | ✅ |
| 19 | `shouldForceEasyWord()` correct per tier | ✅ |
| 20 | `shouldForceTutor()` true only at tier 2 | ✅ |
| 21 | `getExtraShield()` correct per tier | ✅ |

### 5. Challenge Tiers (4 tests)
| # | Test | Status |
|---|------|--------|
| 22 | Tier 0 (15 correct): `rewardGoldMul=1.3`, `challengeMode=true`, harder monsters | ✅ |
| 23 | Tier 1 (25 correct): `rewardGoldMul=1.5`, `challengeMode=true` | ✅ |
| 24 | Boundary: 14 correct = base, 15 = tier 0 | ✅ |
| 25 | Boundary: 24 correct = tier 0, 25 = tier 1 | ✅ |

### 6. Protection Overrides Challenge (3 tests)
| # | Test | Status |
|---|------|--------|
| 26 | At `mistakeStreak >= 5`, challenge mode is **not** active even with high `correctStreak` | ✅ |
| 27 | When `mistakeStreak` drops below 5, challenge reactivates | ✅ |
| 28 | At `mistakeStreak=8` + high `correctStreak`, protection rules completely | ✅ |

### 7. `applyToMonster` (4 tests)
| # | Test | Status |
|---|------|--------|
| 29 | Returns floored hp/atk based on current multipliers | ✅ |
| 30 | Applies protection reduction | ✅ |
| 31 | Applies challenge increase | ✅ |
| 32 | Floors the result (`Math.floor`) | ✅ |
| 33 | Works with zero base values | ✅ |

### 8. `applyToTimeLimit` (4 tests)
| # | Test | Status |
|---|------|--------|
| 34 | Base time unchanged when `timeBonus=0` | ✅ |
| 35 | Adds `timeBonus * 1000` (protection extends time) | ✅ |
| 36 | Negative `timeBonus` (challenge) reduces time | ✅ |
| 37 | Works with zero base time | ✅ |

### 9. `getWordBias` (3 tests)
| # | Test | Status |
|---|------|--------|
| 38 | Zero biases at base state | ✅ |
| 39 | Easy bias 0.25 from any protection tier | ✅ |
| 40 | Zero biases in challenge mode | ✅ |

### 10. `getSettlementMultipliers` (4 tests)
| # | Test | Status |
|---|------|--------|
| 41 | Base multipliers at start | ✅ |
| 42 | Base multipliers during protection | ✅ |
| 43 | Bonus multipliers during challenge tier 0 | ✅ |
| 44 | Bonus multipliers during challenge tier 1 | ✅ |

### 11. `reset` (3 tests)
| # | Test | Status |
|---|------|--------|
| 45 | Returns to initial state after protection | ✅ |
| 46 | Returns to initial state after challenge | ✅ |
| 47 | Can be used multiple times | ✅ |

### 12. Edge Cases (9 tests)
| # | Test | Status |
|---|------|--------|
| 48 | Alternating correct/wrong builds up then recovers | ✅ |
| 49 | Very large correct streak (1000) — capped at highest tier | ✅ |
| 50 | Very large mistake streak (100) — capped at highest tier | ✅ |
| 51 | `onAnswerCorrect` when both streaks 0 — mistake stays 0 | ✅ |
| 52 | `onAnswerWrong` when both streaks 0 — correct stays 0 | ✅ |
| 53 | Correct streak cannot go negative after many wrong answers | ✅ |
| 54 | Mistake streak cannot go negative after many correct answers | ✅ |
| 55 | `protectionLevel` uses indexOf — value equals matched tier index (0-based) | ✅ |
| 56 | `recalculate` is idempotent | ✅ |

---

## Key Findings

### Constructor Behavior
The constructor stores streak values but **does not call `recalculate()`**. This means constructing a controller with `{ mistakeStreak: 5, correctStreak: 0 }` results in `protectionLevel=0` and `currentModifiers=BASE`. Modifiers are only computed after `onAnswerCorrect()` or `onAnswerWrong()` is called.

### `protectionLevel` Semantics
`protectionLevel` is set via `PROTECTION_TIERS.indexOf(tier)`, which returns the **0-based index** of the highest matched tier:
- 0 mistakes → protectionLevel = 0 (no protection)
- 5 mistakes → protectionLevel = 0 (index of first tier)
- 8 mistakes → protectionLevel = 1 (index of second tier)
- 10 mistakes → protectionLevel = 2 (index of third tier)

### Protection Precedence
When `mistakeStreak >= 5`, the protection branch runs exclusively — the challenge branch (`correctStreak` thresholds) is **skipped entirely**. This is controlled by the `if (protectionLevel === 0)` guard in `recalculate()`.

### Cumulative Tier Application
Protection and challenge tiers are **cumulative**: later tiers extend earlier ones via spread merge (`{ ...mods, ...tier.mods }`). A tier's explicit values override the previous tier's, but values not specified in a later tier persist from the earlier one (e.g., `easyWordBias=0.25` from tier 0 carries into tiers 1 and 2).
