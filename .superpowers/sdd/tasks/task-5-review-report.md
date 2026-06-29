# Task 5 Review Report: `core/utils/random.ts`

## Verdict

| Criterion | Result |
|---|---|
| **Spec compliance** | ✅ All requirements met |
| **Code quality** | ✅ Approved |
| **Tests pass** | ✅ 9/9 passing |

---

## Spec Compliance (✅)

| Requirement | Status | Notes |
|---|---|---|
| Create `src/core/utils/random.ts` | ✅ | Exists, matches brief |
| Create `src/core/utils/random.test.ts` | ✅ | Exists, matches brief |
| Export `weightedRandom<T>()` | ✅ | Signature, logic, error handling all match brief exactly |
| Export `pickRandom<T>()` | ✅ | Signature, logic, error handling all match brief exactly |
| All 9 tests from brief present | ✅ | 5 `weightedRandom` + 4 `pickRandom` — identical to spec |
| TDD (tests before impl) | ✅ | Report confirms red-green cycle; commit `32ed1b5` includes both files |
| All utility functions have tests | ✅ | Co-located `.test.ts` file with full coverage |

## Code Quality (✅ Approved)

**Strengths:**
- Clean, well-typed TypeScript with JSDoc documentation on both exports
- Edge cases handled correctly:
  - Empty array → throws descriptive error
  - All-zero (or all-negative) weights → returns first item (degenerate-case guard)
  - Negative weights clamped to 0 via `Math.max(0, weight)`
  - Floating-point fallthrough guard: `return items[items.length - 1].item`
- `pickRandom` correctly filters `usedIds` before selection; rejection sampling ensures uniqueness
- Zero TypeScript or lint errors (`npx tsc --noEmit` clean)
- All 9 tests pass

**Minor observations (no action required):**
- Line 33 `let available` could be `const` (only assigned once); matches the brief's own code, so per-spec
- No test for negative-weight clamping (brief didn't require one; the clamping is a free quality bonus)

## Issues

None.

## Summary

Task 5 is fully compliant with the specification and ready for consumption by later phases. Both `weightedRandom<T>` and `pickRandom<T>` are implemented exactly per the brief, with 9 co-located unit tests all passing. Code quality is clean, well-typed, and properly handles edge cases.
