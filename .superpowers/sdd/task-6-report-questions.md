# Task 6 Report: Integrate New Question Types into BattlePage

## Summary

Wired the three new question types (`spell`, `pos`, `match`) into `BattlePage.tsx` and updated `QuestionCard.tsx` to properly render `pos` type questions. All existing tests continue to pass.

## Files Modified

### 1. `src/pages/BattlePage.tsx`
- **Import swap**: `QuestionCard` → `QuestionRenderer` (which routes `spell` → SpellQuestion, `match` → MatchQuestion, others → QuestionCard)
- **Added** `matchConnect` store selector
- **Added** `handleMatchConnect(leftWordId, rightWordId)` callback — delegates to `battleStore.matchConnect`
- **Updated** `handleAnswer` to accept `string | number` (matching `QuestionRenderer`'s prop type); converts to `String(selected)` before calling `submitAnswer`
- **Replaced** `<QuestionCard>` usage with `<QuestionRenderer>` including `onMatchConnect` prop
- **Result section**: added pos-type branch showing `stem`, correct option (`options[correctIndex]`), and `explanation`
- **Monster-turn section**: added pos-type branch showing correct answer with stem → option, plus explanation

### 2. `src/components/battle/QuestionCard.tsx`
- **Type guard**: renamed `isTranslateQuestion` → `isSupportedQuestion`, now accepts both translate types and `'pos'`
- **New guard**: `isPosQuestion` predicate to narrow within the union
- **`onAnswer` prop**: changed type from `(selected: string)` to `(selected: string | number)` — matches parent `QuestionRenderer`'s interface
- **Option click**: for pos questions, passes `String(idx)` (option index) instead of the option string value; translate questions continue to pass the option string
- **Pos rendering**: when `isPos`:
  - Shows subtitle ("词语搭配" or "词性变形") instead of the word image
  - Displays `stem` in a purple-themed container
  - When `disabled` (after answering), shows `explanation` in a blue info box with fade-in animation
- **Sound**: pos questions skip the speak button (no audio needed)

### 3. `src/index.css`
- Added CSS variables for pos/match/spell accent colors:
  - `--color-pos-stem: #a78bfa`
  - `--color-pos-correct: #6ee7b7`
  - `--color-match-pair: #93c5fd`
  - `--color-spell-slot: #fde68a`

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ — 0 errors |
| `npx vitest run` | ✅ — 79/79 tests pass across 4 test files |

## Commit

```
6e490f9 feat: integrate new question types into BattlePage
```
