# Task 3: Core Battle Engine & FSM

Create the pure TypeScript battle engine and finite state machine with test-driven development.

**Consumes:** types from `src/core/data/types.ts`, class data from `src/core/data/classes.ts`, monster data from `src/core/data/monsters.ts`

**Produces:** `createBattle`, `answerQuestion`, `useSkill`, `monsterTurn`, `calculateDamage`, `getComboMultiplier`, `getPlayerAttack`, `isCrit`, `GameFSM` class

## Files

### 1. `src/core/engine/battle.ts` — Functions:

**`createBattle(player: PlayerState, monster: MonsterDef, playerBoardAttack: number): BattleState`**
Returns BattleState with phase='question', monsterHp=monster.hp, playerHp=player.currentHp, all other fields initialized to 0/false.

**`calculateDamage(baseAttack: number, combo: number, isCrit: boolean, isSkill: boolean): number`**
- combo multiplier: 1 / 1.5 / 2 / 3 (combos ≥1/3/5/7)
- If crit, multiply by 2
- Return Math.round(result)

**`getComboMultiplier(combo: number): number`** — same mapping as above

**`getPlayerAttack(player: PlayerState): number`**
- Base class baseAttack + player.attack
- If advanced class, add baseAttackBonus

**`getEffectiveComboStart(player: PlayerState): number`** — 2 for archmage, 1 for mage, 0 otherwise

**`isCrit(player: PlayerState, wasLastWrong: boolean): boolean`**
- shadow-master: 30%
- elf-lord: 50%
- rogue: 15%
- ranger + wasLastWrong: 30%
- Otherwise false

**`answerQuestion(battle: BattleState, player: PlayerState, monster: MonsterDef, correct: boolean): BattleState`**
- If correct: combo++, skillCharge++ (max 5), deal damage via calculateDamage, check monsterHP≤0→victory
- If wrong: combo=0, skillCharge=0, phase='monster-turn'

**`useSkill(battle: BattleState, player: PlayerState, monster: MonsterDef, skillIndex: 0 | 1): BattleState`**
- skillCharge=0 after use
- Class-specific effects (see spec Table 4.3 for complete behavior):
  - warrior: damage×3 / dragon-knight×4 + shield1
  - mage: damage×2 + stun1 / archmage×3 + stun3
  - ranger: 3hits / elf-lord 5hits + dodge
  - paladin: heal40% / light-lord fullheal
  - rogue: instakill if monsterHP<50% / else ×2.5
  - druid: dmg×2 + stun2 / nature-spirit dmg3T + revive

**`monsterTurn(battle: BattleState, monster: MonsterDef): BattleState`**
- If stunned: decrement stun, skip attack
- If invulnerable: decrement invuln, skip attack  
- Otherwise: deal monster.attack damage to player, check defeat

### 2. `src/core/engine/fsm.ts` — GameFSM class:
- `phase: GamePhase` — current game phase
- `send(event: FSMEvent): GamePhase` — transition by event string
- `onEnterPhase(phase: GamePhase, handler: () => void)` — register callback
- `forcePhase(phase: GamePhase)` — direct set
- Valid transitions: home→START_GAME→class-select→SELECT_CLASS→adventure→START_BATTLE→battle→BATTLE_WIN→win→RETURN_MAP→adventure; battle→BATTLE_LOSE→lose→RETURN_MAP→adventure; adventure→OPEN_SHOP/GOHOME; shop→CLOSE_SHOP/GOHOME; win/lose→GOHOME
- Invalid transitions: silently return current phase

Type `FSMEvent = 'START_GAME' | 'SELECT_CLASS' | 'ENTER_MAP' | 'START_BATTLE' | 'BATTLE_WIN' | 'BATTLE_LOSE' | 'RETURN_MAP' | 'OPEN_SHOP' | 'CLOSE_SHOP' | 'GO_HOME'`

### 3. `src/core/engine/battle.test.ts` — Tests (TDD, write FIRST):
1. `createBattle` initializes with correct monster/player HP, combo=0, charge=0, phase='question'
2. `calculateDamage` returns base for combo=0, ×1.5 for combo=3, ×2 for combo=5, ×3 for combo=7+
3. `calculateDamage` doubles for crits
4. `answerQuestion` increments combo on correct, resets on wrong
5. `answerQuestion` deals damage to monster Hp
6. `answerQuestion` sets victory when monster HP≤0
7. `answerQuestion` sets defeat when player HP≤0 from monster counterattack

### 4. `src/core/engine/fsm.test.ts` — Tests (TDD):
1. Starts at 'home'
2. Full chain home→class-select→adventure→battle→win→adventure
3. Full chain battle→lose→adventure
4. Invalid transition silently stays
5. onEnterPhase callback triggers

## Steps
1. Write `battle.test.ts`
2. `npx vitest run src/core/engine/battle.test.ts` — FAIL
3. Write `battle.ts`
4. `npx vitest run src/core/engine/battle.test.ts` — PASS
5. Write `fsm.test.ts`
6. `npx vitest run src/core/engine/fsm.test.ts` — FAIL
7. Write `fsm.ts`
8. `npx vitest run src/core/engine/fsm.test.ts` — PASS
9. `npx tsc --noEmit` — zero errors
10. Commit: `feat: implement core battle engine and FSM with tests`

## Global Constraints
- Pure TypeScript — zero React imports in core/
- Test files must be side by side with their implementation
- All imports must use relative paths to tsconfig's `@/` alias or relative imports
