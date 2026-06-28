# Task 4 Report: Question Engine & Speech Engine

**Date:** 2026-06-18

## Summary

Implemented the pure TypeScript question generation system and the browser speech (TTS) engine for Dragon Words, following TDD methodology. All 60 tests pass (38 battle + 11 FSM + 11 question) with zero TypeScript errors.

## Files Created / Modified

### Modified: `src/core/data/types.ts`

Added `timeLimit: number` and `imagePath: string` fields to the `Question` interface — required by the question engine and Battle UI.

### `src/core/utils/question.ts` — Question Engine (pure TS, no React)

| Function | Description |
|---|---|
| `getQuestionTypeForRound(round)` | Seeded deterministic type: `(round * 2654435761) % 100 < 60` → 'word-meaning' (60%), else 'listening' (40%) |
| `generateOptions(allWords, correctChinese, excludeWordId)` | Filters distractors (excludes correct word + duplicate chinese), picks 3 randomly, pads with '???', shuffles result |
| `generateQuestion(wordPool, usedWordIds, timeLimit, chapter, mistakeWords?)` | 30% chance to pick from mistakeWords when available, otherwise picks unused word from pool. Assembles full Question with type, options, timeLimit, imagePath |

### `src/core/utils/speech.ts` — SpeechEngine

- **Constructor:** Checks `window.speechSynchronization`, sets `available` flag — safe for SSR/Node
- **`isAvailable()`:** Returns whether TTS is supported
- **`setRate(rate)`:** Clamps 0.5–1.5
- **`speak(word)`:** Returns Promise<void> wrapping `SpeechSynthesis.speak()` with `onend`/`onerror` handlers. Treats `'interrupted'` error as success (cancellation case)
- **`cancel()`:** Cancels any ongoing speech
- **Singleton:** `export const speechEngine = new SpeechEngine()`

### `src/hooks/useSpeech.ts` — React Hook

- **`speak(word)`:** `useCallback`-wrapped async function guarded by `speakingRef` to prevent overlapping TTS calls. Silently fails on error
- **`isAvailable`:** Derived from `speechEngine.isAvailable()` at render time

## Tests (`src/core/utils/question.test.ts`) — 11 tests

- `getQuestionTypeForRound` over 1000 rounds: word-meaning between 500-700 (60% ±10%), listening between 300-500 (40% ±10%)
- `generateOptions`: returns exactly 4 options, includes correct answer, no duplicates, pads with '???' when distractor pool < 3, excludes duplicate chinese entries
- `generateQuestion`: returns valid Question with 4 options + timeLimit ≥ 8, returns null when pool exhausted, picks from mistakeWords ~30% (tested over 1000 calls, range 50-500), imagePath matches word

## Verification

```
npx vitest run           → 3 files, 60 tests passed
npx tsc --noEmit         → zero errors
```

## Constraints Satisfied

- ✅ `question.ts`: pure TypeScript, zero React imports in `core/`
- ✅ `speech.ts`: browser-only with SSR-safe constructor guard
- ✅ Test files side by side with implementation
- ✅ All imports use `@/` path alias or relative paths
- ✅ TDD followed (tests written first, confirmed failing, then implemented)
