# Final Code Review — Bug Fixes

## Bug 1 — Wrong-answer flow breaks game (CRITICAL)
**Problem:** After answering wrong, `finishMonsterTurn()` did not reset `lastAnswerCorrect` or generate a new question, causing the battle to softlock at monster-turn phase with no question shown.

**Fix:**
- `src/stores/battleStore.ts` — `finishMonsterTurn()` now calls `monsterTurn()`, and if the battle continues (`status !== 'lost'`), generates a new question via `generateNextQuestion()` and resets `lastAnswerCorrect` to `null`.
- The dead-code `if (nextBattle.status === 'lost') {}` block was removed.

## Bug 2 — Double reward on victory (CRITICAL)
**Problem:** Gold/XP was awarded both per-correct-answer during the winning kill AND again via the victory screen (`handleVictoryContinue`), resulting in double rewards.

**Fix:**
- `src/stores/battleStore.ts` — Removed the XP reward blocks in `submitAnswer` and `useSkillAction` that checked `nextBattle.status === 'won'`. The victory screen (`BattlePage.tsx` `handleVictoryContinue`) already awards the proper victory gold (50 + lv×10) and XP (100). Per-correct-answer gold (+10) is retained.

## Bug 3 — Ranger passive never fires (IMPORTANT)
**Problem:** `isCrit()` was always called with `wasLastWrong=false` in `answerQuestion()`, so the ranger's 30%-crit-after-wrong passive never activated.

**Fix:**
- `src/core/engine/battle.ts` — Added `wasLastWrong: boolean` parameter to `answerQuestion()` (default `false`), and passes it to `isCrit()`.
- `src/stores/battleStore.ts` — `submitAnswer()` now reads `get().lastAnswerCorrect === false` and passes it as `wasLastWrong` to `answerQuestion()`.

## Verification
- ✅ `npx vitest run` — 69/69 tests pass
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npm run build` — production build succeeds
