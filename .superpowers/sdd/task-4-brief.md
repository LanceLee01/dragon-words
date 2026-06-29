# Task 4: Question Type Weight Adjustment

## Context

Adjust question type weights per user request: spell to 0.1%, match to 25%, and remove boss-level match exclusion.

## Requirements

**File to modify:** `src/core/data/balance.ts`

### 1. Update QUESTION_TYPE_WEIGHTS

Replace the current weights with:

```typescript
export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.104,
  'meaning-word': 0.303,
  'fill-blank':   0.057,
  'listening':    0.190,
  'spell':        0.001,   // 0.1%
  'pos':          0.095,
  'match':        0.250,   // 25%
};
// Sum: 0.104+0.303+0.057+0.190+0.001+0.095+0.250 = 1.000 ✓
```

### 2. Remove boss-level match exclusion

In `pickQuestionType`, change the filter:

Old:
```typescript
const available = Object.entries(weights).filter(
  ([type]) => !(isBoss && type === 'match'),
);
```

New:
```typescript
const available = Object.entries(weights);
```

The `isBoss` parameter can remain in the function signature for future use.

### Global constraints
- All changes must compile with `tsc -b` without errors
- No new dependencies
- Follow existing code patterns
- Keep all existing functionality working

## Deliverable

Apply both changes, verify `npx tsc --noEmit` passes, and commit:
```
git add src/core/data/balance.ts
git commit -m "feat: adjust question weights — spell 0.1%, match 25%, remove boss exclusion"
```
