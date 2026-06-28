# Task 8: Battle Page — Full Combat UI

The most complex UI task — the battle screen with question cards, HUD, and win/lose screens.

## Files

### 1. `src/pages/BattlePage.tsx`
The main battle page. Parse chapter/level from useParams. On mount: `battleStore.initBattle(ch,lv)`.

**Layout (top to bottom):**
- Top HUD: HealthBar(player) | Timer | HealthBar(monster)
- ComboDisplay in center
- Main content area (changes by phase):
  - 'question': QuestionCard + skill button at bottom
  - 'result': "✅ 正确!" + "下一题 →" button calling nextRound
  - 'monster-turn': "❌ 答错了!" + correct answer + monster attacks + continue
  - 'victory': VictoryScreen with gold/xp/rewards
  - 'defeat': DefeatScreen with retry/leave

**Timer:** synced to current question's timeLimit, reset on new question. On expire: auto-submit wrong answer.

**Skill button:** shown when battle.skillCharge >= 5, purple pulsing, calls useSkillAction(0)

**On victory:** addGold(50+lv*10), addXp(100), completeLevel, healToFull, sendEvent('BATTLE_WIN'), navigate('/map')

**On retry:** resetBattle, initBattle(ch, lv)

### 2. `src/components/battle/QuestionCard.tsx`
Props: `question, onAnswer, disabled`
- Word image (with 📜 fallback on error)
- If listen-to-cn: 🔊 play button + "再听一次" (max 1 replay)
- If en-to-cn: large English word + 🔊 button
- 2x2 grid of 4 option buttons (A/B/C/D), disabled when answered

### 3. `src/components/battle/VictoryScreen.tsx`
Props: `gold, xp, onContinue`
- Animated entrance: 🏆, "胜利!", gold +xp display, continue button

### 4. `src/components/battle/DefeatScreen.tsx`
Props: `onRetry, onLeave`
- 💀, "战败...", encouragement, retry + leave buttons

## Global Constraints
- Import battle store: `@/stores/battleStore`
- Import player store: `@/stores/playerStore`
- Import game store: `@/stores/gameStore`
- Import shared: `@/components/shared/HealthBar`, `Timer`, `ComboDisplay`
- Import hooks: `@/hooks/useTimer`, `@/hooks/useSpeech`

## Steps
Write all 4 files, `npx tsc --noEmit`, `npx vitest run` (no new tests), commit: "feat: implement Battle page with question, victory, and defeat screens"
