# Task 4 Report — Question Type Weight Adjustment

## Status: DONE ✅

## Changes applied to `src/core/data/balance.ts`

### 1. Updated `QUESTION_TYPE_WEIGHTS`

New weights (sum = 1.0):

| Type           | Weight |
|----------------|--------|
| word-meaning   | 0.104  |
| meaning-word   | 0.303  |
| fill-blank     | 0.057  |
| listening      | 0.190  |
| spell          | 0.001  (0.1%) |
| pos            | 0.095  |
| match          | 0.250  (25%) |

### 2. Removed boss-level match exclusion

The `.filter(([type]) => !(isBoss && type === 'match'))` line was removed from `pickQuestionType`. The `isBoss` parameter remains in the function signature for future use. The JSDoc note about boss levels was intentionally left unchanged per brief.

## Verification

- `npx tsc --noEmit` passed with zero errors.
- Git commit: `56acb77` — message: "feat: adjust question weights — spell 0.1%, match 25%, remove boss exclusion"
