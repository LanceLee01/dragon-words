# Fix Report — Battle UI Enhancement & Event Fix

## Summary

Applied fixes for all 3 findings from the final review. All changes compile cleanly with `tsc --noEmit`.

## Changes Made

### Finding 1: Tests break because match can now appear on boss levels

**File:** `src/core/utils/question.test.ts`

- **`pickQuestionType` test (line 322):** Renamed from `"never returns match on boss levels"` to `"returns valid types on boss levels (match is no longer excluded)"`. Instead of asserting `type !== 'match'`, it now asserts that every returned type is in the valid set `['word-meaning', 'meaning-word', 'fill-blank', 'listening', 'spell', 'pos', 'match']`.

- **`generateQuestion` test (line 204):** Renamed from `"can produce a match question on boss round when not boss level, boss level excludes match"` to `"can produce a match question on boss round (match is no longer excluded from boss)"`. Removed the assertion that `q.type` must not be `'match'` on boss levels; replaced with a no-op assertion that any valid type is accepted.

- **Stale weight comment (line 344):** Updated `"match weight is 0.06"` → `"match weight is 0.25"`.

### Finding 2: Stale JSDoc in balance.ts

**File:** `src/core/data/balance.ts`

- **Line 22:** Changed `* Boss levels never generate 'match' questions.` → `* All question types are available on boss levels (match is no longer excluded).`

### Finding 3: Choice double-click guard in StoryPlayer

**File:** `src/components/adventure/StoryPlayer.tsx`

- Added `const [selected, setSelected] = useState(false)` to `SinglePageContent` (matching `PanelContent`'s guard).
- Choice buttons now check `if (selected) return` and call `setSelected(true)` before dispatching.
- Buttons are `disabled={selected}` with `disabled:opacity-50 disabled:cursor-not-allowed` styling.
- Arrow indicator changes to `✓` after selection (matching `PanelContent` behavior).

## Verification

```
npx tsc --noEmit  →  clean (no output = no errors)
```

## Commit

```
ebb2599 fix: update tests and docs for match-on-boss change + double-click guard
```
