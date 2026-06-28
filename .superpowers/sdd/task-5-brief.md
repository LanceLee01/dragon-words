# Task 5: Persistence Layer & Zustand Stores

Create localStorage persistence and 3 Zustand stores.

## Files

### 1. `src/core/utils/storage.ts`
Functions using localStorage (with try/catch fallback):
- `savePlayer/loadPlayer(PlayerState)` — key `dw_player`, default: classId=null, level=1, xp=0, gold=0, maxHp=100, attack=5, no equipment
- `saveProgress/loadProgress` — key `dw_progress`, { completedLevels, completedChapters }
- `saveSettings/loadSettings` — key `dw_settings`, { volume:0.7, speechRate:0.8 }
- `saveWordStats/loadWordStats` — key `dw_wordstats`, Record<number, {correct,wrong}>

### 2. `src/core/utils/storage.test.ts` 
Test save/load roundtrip for player (+ modified), default values when nothing saved.

### 3. `src/stores/playerStore.ts` — Zustand store
State: `player: PlayerState`, `loaded: boolean`
Actions: `init()`(load), `selectClass(id)`, `addGold(n)`, `addXp(n)`(auto level-up), `takeDamage(n)`, `healToFull()`, `completeLevel(key,ch)`, `equipWeapon(id)`, `promoteToAdvanced(id)`, `addMistakeWord(id)`, `recordAnswer(id,correct)`, `updateCombo(n)`.
All mutations call savePlayer().

### 4. `src/stores/gameStore.ts` — Zustand store
State: `phase: GamePhase`, `fsm: GameFSM`, `words: Word[]`
Actions: `setWords`, `sendEvent(event)`, `setPhase(phase)`, `initWords()`

### 5. `src/stores/battleStore.ts` — Zustand store
State: `battle: BattleState|null`, `monster: MonsterDef|null`, `chapter`, `level`, `usedWordIds: Set<number>`
Actions: `initBattle(ch, lv)`, `submitAnswer(selected)` → returns boolean, `useSkillAction(idx?)`, `nextRound()`, `finishMonsterTurn()`, `resetBattle()`
Integrates with playerStore (gold on correct, xp on victory) and gameStore (word pool).

## Global Constraints
- All stores use `zustand` (import { create } from 'zustand')
- core/utils/ has no React imports
- Path alias `@/` → `src/`

## Steps
1. Write storage.test.ts → npx vitest run → FAIL
2. Write storage.ts → npx vitest run → PASS
3. Write all 3 stores
4. npx tsc --noEmit → zero errors
5. Commit: "feat: implement storage layer and Zustand stores"
