# Task 3: Question Card Text Enlargement

## Context

Enlarge the question card UI text 2-3x (moderate enlargement per user request). Only CSS class changes — no logic modifications.

## Requirements

**File to modify:** `src/components/battle/QuestionCard.tsx`

### Exact changes (Old → New classNames):

**1. Option buttons** (line ~188):
Old: `px-4 py-3 text-sm font-medium`
New: `px-6 py-5 text-2xl font-medium`

**2. Option label circles (A/B/C/D)** (line ~196):
Old: `h-7 w-7 text-xs`
New: `h-10 w-10 text-lg`

**3. Question prompt text** (line ~158):
Old: `text-center text-lg text-gray-300`
New: `text-center text-3xl text-gray-300`

**4. Main word display** (line ~162):
Old: `text-3xl font-bold text-white`
New: `text-5xl font-bold text-white`

**5. POS stem display** (line ~77):
Old: `text-xl font-bold text-white`
New: `text-3xl font-bold text-white`

**6. POS subtype label** (line ~73):
Old: `text-sm font-semibold uppercase tracking-wider`
New: `text-xl font-semibold uppercase tracking-wider`

**7. POS explanation** (line ~81):
Old: `text-sm text-blue-200`
New: `text-xl text-blue-200`

**8. Word image container** (line ~93):
Old: `h-56 w-56`
New: `h-64 w-64`

**9. Main container gap** (line ~69):
Old: `gap-6`
New: `gap-8`

### Global constraints
- All changes must compile with `tsc -b` without errors
- No new dependencies
- Follow existing code patterns
- Keep all existing functionality working

## Deliverable

Apply all 9 CSS changes, verify `npx tsc --noEmit` passes, and commit:
```
git add src/components/battle/QuestionCard.tsx
git commit -m "feat: enlarge question card text 2-3x"
```
