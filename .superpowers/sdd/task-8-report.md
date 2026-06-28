# Task 8: Battle Page — Full Combat UI

## Completed

All 4 files implemented, type-checked, and tested.

## Files

### 1. `src/pages/BattlePage.tsx`
The main battle page component:
- **URL params:** Parses `chapter` and `level` from `/battle/:chapter/:level`
- **Init:** Calls `initBattle(ch, lv)` on mount, `resetBattle()` on unmount
- **Top HUD:** Player `HealthBar` (left) | `Timer` (center) | Monster `HealthBar` (right)
- **Combo Display:** Center section shows combo tier label
- **Timer:** Synced to `currentQuestion.timeLimit`, resets on new question. Auto-submits wrong answer on expiry (guarded against double-submit via `answeredRef`)
- **Display phases** (via `AnimatePresence` for transitions):
  - **'question':** `QuestionCard` with 4-option grid
  - **'result':** ✅ 正确! + "下一题 →" button → calls `nextRound()`
  - **'monster-turn':** ❌ 答错了! + correct answer + monster attack info + "继续 →" → calls `finishMonsterTurn()`
  - **'victory':** `VictoryScreen` → awards gold (50+lv×10), xp (100), `completeLevel`, `healToFull`, `sendEvent('BATTLE_WIN')`, navigates to `/map`
  - **'defeat':** `DefeatScreen` → retry resets battle, leave navigates to `/map`
- **Skill button:** Purple pulsing button when `battle.charge >= 5`, calls `useSkillAction(0)`

### 2. `src/components/battle/QuestionCard.tsx`
Props: `question`, `onAnswer`, `disabled`
- Word image with `📜` fallback on error
- **Listening type:** 🔊 play button + "再听一次" (max 1 replay via `replayCount`)
- **Word-meaning type:** Large English word + 🔊 button
- **2×2 grid** of 4 option buttons (A/B/C/D), disabled when answered
- Uses `useSpeech` hook for TTS

### 3. `src/components/battle/VictoryScreen.tsx`
Props: `gold`, `xp`, `onContinue`
- Animated entrance: 🏆 trophy, "胜利!" title, gold + xp rewards display, "继续冒险 →" button
- All elements have staggered spring animations

### 4. `src/components/battle/DefeatScreen.tsx`
Props: `onRetry`, `onLeave`
- 💀 skull, "战败..." title, encouragement text, "🔄 再来一次" (retry) + "🏠 返回地图" (leave) buttons

## Verification
- `npx tsc --noEmit` — ✅ no errors
- `npx vitest run` — ✅ 69 tests pass (4 test files)

## Commit
```
feat: implement Battle page with question, victory, and defeat screens
```
