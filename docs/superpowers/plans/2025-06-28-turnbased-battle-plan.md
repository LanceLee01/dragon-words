# Turn-Based Battle System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace charge-based battle with turn-based flow: correct = skill, wrong = basic attack, monster always attacks back.

**Architecture:** Pure TS engine (`battle.ts`) unchanged in file structure; new skill logic uses class skill multipliers from spec. Store and page layer handle auto-advance timing and UI removal.

**Tech Stack:** TypeScript 5, React 18, Zustand, Framer Motion, Vite 5

## Global Constraints

- React 18 / TypeScript 5 / Vite 5 (not 19/6/8)
- All monster HP ×5, ATK ×2 from original values (spec Section 4)
- Class skill multipliers per spec Section 3
- Charge system removed entirely
- `lastDamageDealt` / `lastDamageTaken` fields kept on BattleState for UI animations
- Sound engine unchanged; trigger conditions updated in BattlePage

---

### Task 1: Monster Stat Rebalance

**Files:**
- Modify: `src/core/data/monsters.ts` — all 30 monster entries

**Interfaces:**
- Consumes: existing `MonsterDef` type
- Produces: updated `MONSTERS` record with HP ×5, ATK ×2

- [ ] **Step 1: Update all normal monster HP and ATK**

Replace every `hp:` and `attack:` value in normal monsters:

```typescript
// Original → New mapping
// goblin:     hp: 40→200,  attack: 6→12
// skeleton:   hp: 45→225,  attack: 7→14
// apprentice: hp: 50→250,  attack: 8→16
// shadowwolf: hp: 55→275,  attack: 8→16
// gargoyle:   hp: 55→275,  attack: 8→16
// troglodyte: hp: 75→375,  attack: 12→24
// harpy:      hp: 80→400,  attack: 13→26
// ghost:      hp: 85→425,  attack: 14→28
// ogre:       hp: 90→450,  attack: 15→30
// succubus:   hp: 95→475,  attack: 16→32
// demonhound:  hp: 100→500, attack: 17→34
// fallenAngel: hp: 110→550, attack: 18→36
// timeGhost:  hp: 120→600, attack: 20→40
// dragonborn: hp: 130→650, attack: 22→44
// eliteGuard: hp: 150→750, attack: 25→50
```

- [ ] **Step 2: Update all boss monster HP and ATK**

```typescript
// goblinKing:    hp: 50→250,  attack: 8→16
// deathKnight:   hp: 55→275,  attack: 9→18
// archmage_boss: hp: 60→300,  attack: 10→20
// treantElder:   hp: 65→325,  attack: 11→22
// lavaGiant:     hp: 70→350,  attack: 12→24
// drowElf:       hp: 100→500, attack: 15→30
// wyvern:        hp: 110→550, attack: 16→32
// lichKing:      hp: 120→600, attack: 18→36
// stormGiant:    hp: 140→700, attack: 20→40
// darkKnight:    hp: 160→800, attack: 22→44
// abyssalLord:   hp: 180→900, attack: 25→50
// archangel:     hp: 200→1000, attack: 28→56
// timeKeeper:    hp: 230→1150, attack: 30→60
// dracolich:     hp: 260→1300, attack: 35→70
// ancientRed:    hp: 500→2500, attack: 60→120
```

- [ ] **Step 3: Verify build still passes**

Run: `cd D:/reasonix/l9eng && npx tsc --noEmit`
Expected: zero errors (type structure unchanged)

- [ ] **Step 4: Commit**

```bash
git add src/core/data/monsters.ts && git commit -m "rebalance: monster HP×5, ATK×2 for turn-based system"
```

---

### Task 2: Battle Engine Rewrite — `answerQuestion` + skill logic

**Files:**
- Modify: `src/core/engine/battle.ts`

**Interfaces:**
- Consumes: `BattleState`, `PlayerState`, `MonsterDef`
- Produces: updated `answerQuestion()` with skill-on-correct logic; removed charge from correct branch; `useSkill()` removed or reduced to comment-only stub

**Design:**
- `answerQuestion(correct=true)`: applies class skill multiplier from spec Section 3, sets `lastDamageDealt`, sets `phase='result'` (no charge increment)
- `answerQuestion(correct=false)`: applies basic attack (`getPlayerAttack(player)`) + sets `phase='monster-turn'` for the monster to attack
- `useSkill()`: remove entirely — skills auto-fire on correct answers now
- Remove `charge` refs: the correct branch no longer increments `charge`

- [ ] **Step 1: Remove `useSkill` and clean imports**

Remove the entire `useSkill` function (lines ~158-330), plus unused imports it depended on (`BASE_CLASSES`, `ADVANCED_CLASSES` if no longer used). Keep `calculateDamage`, `getPlayerAttack`, `isCrit`, `getComboMultiplier`.

- [ ] **Step 2: Rewrite `answerQuestion` for skill-on-correct + basic-on-wrong**

Replace current `answerQuestion` with:

```typescript
/**
 * Player answers a question.
 * correct=true → applies class skill (multiplied per spec)
 * correct=false → applies basic attack (weaker)
 * Monster always attacks back (handled by caller after this).
 */
export function answerQuestion(
  battle: BattleState,
  player: PlayerState,
  monster: MonsterDef,
  correct: boolean,
  wasLastWrong = false,
): BattleState {
  const next = { ...battle };

  if (correct) {
    // Apply class skill
    const classDef = BASE_CLASSES[player.classId];
    const advDef = player.advancedClassId
      ? ADVANCED_CLASSES[player.advancedClassId]
      : null;
    const base = getPlayerAttack(player);
    const crit = isCrit(player, wasLastWrong);

    let damage = 0;
    let skillName = '攻击';

    switch (player.classId) {
      case 'warrior': {
        skillName = '斩击';
        damage = calculateDamage(base * 1.5, next.combo, crit);
        break;
      }
      case 'mage': {
        skillName = '火球';
        damage = calculateDamage(base * 1.2, next.combo, crit);
        next.stunTimer = 1; // stun 1 turn
        break;
      }
      case 'ranger': {
        skillName = '射击';
        // 3 hits ×0.7 each
        damage = calculateDamage(base * 0.7 * 3, next.combo, crit);
        break;
      }
      case 'paladin': {
        skillName = '圣击';
        damage = calculateDamage(base * 1.0, next.combo, crit);
        const heal = Math.round(next.playerMaxHp * 0.15);
        next.playerHp = Math.min(next.playerHp + heal, next.playerMaxHp);
        break;
      }
      case 'rogue': {
        skillName = '背刺';
        const bonusDmg = Math.round(next.monsterHp * 0.1);
        damage = calculateDamage(base * 1.3, next.combo, crit) + bonusDmg;
        break;
      }
      case 'druid': {
        skillName = '藤蔓';
        damage = calculateDamage(base * 1.2, next.combo, crit);
        const druidHeal = Math.round(next.playerMaxHp * 0.05);
        next.playerHp = Math.min(next.playerHp + druidHeal, next.playerMaxHp);
        break;
      }
      default: {
        // Fallback basic attack
        damage = calculateDamage(base, next.combo, crit);
      }
    }

    next.lastDamageDealt = damage;
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.lastDamageTaken = 0;
    next.combo += 1;
    next.phase = 'result';

    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
  } else {
    // Wrong answer: basic attack only (weak), then monster gets its turn
    const base = getPlayerAttack(player);
    const crit = isCrit(player, wasLastWrong);
    const damage = calculateDamage(base, next.combo, crit);
    next.lastDamageDealt = damage;
    next.monsterHp = Math.max(0, next.monsterHp - damage);
    next.lastDamageTaken = 0;
    next.combo = 0;
    next.phase = 'monster-turn';

    if (next.monsterHp <= 0) {
      next.status = 'won';
    }
  }

  return next;
}
```

- [ ] **Step 3: Remove `charge` from `createBattle`**

In `createBattle`, remove or set `charge: 0` (keep the field for compilation, but it won't be used):

```typescript
    charge: 0,
```

(Leave the field on `BattleState` type so existing code compiles; set but never read.)

- [ ] **Step 4: Run TypeScript check**

Run: `cd D:/reasonix/l9eng && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/core/engine/battle.ts && git commit -m "feat: answerQuestion uses class skills on correct, basic on wrong"
```

---

### Task 3: Battle Store Cleanup

**Files:**
- Modify: `src/stores/battleStore.ts`

**Interfaces:**
- Consumes: existing `battleStore` interface minus `useSkillAction`
- Produces: cleaned store with `submitAnswer` → new `answerQuestion`, removed `useSkillAction`, updated `nextRound`

- [ ] **Step 1: Remove `useSkillAction` from store interface and implementation**

Delete the `useSkillAction` declaration and its implementation (lines ~162-169). Also remove unused imports (`usePlayerStore` remains needed for `submitAnswer`).

- [ ] **Step 2: Verify `submitAnswer` handles new flow correctly**

Read current `submitAnswer` (lines ~130-156). It should work as-is because it calls `answerQuestion` which now handles the skill/basic logic. Only verify no references to `charge` or `useSkillAction`.

- [ ] **Step 3: Run TypeScript check**

Run: `cd D:/reasonix/l9eng && npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Run tests**

Run: `cd D:/reasonix/l9eng && npx vitest run`
Expected: tests may fail (they test old behavior) — that's expected for now. Record output.

- [ ] **Step 5: Commit**

```bash
git add src/stores/battleStore.ts && git commit -m "refactor: remove useSkillAction from battle store"
```

---

### Task 4: BattlePage UI — Auto-Advance + Result Screen + Remove Buttons

**Files:**
- Modify: `src/pages/BattlePage.tsx`

**Design changes:**
1. Remove `handleNextRound` callback + "下一题" button from result section
2. Remove `handleUseSkill` callback + skill button
3. Add auto-advance useEffect: when `phase === 'result'` and `lastAnswerCorrect === true` and `battle.status === 'ongoing'`, `setTimeout 2000ms → finishMonsterTurn()`
4. Replace static result display with rich info: ✅, word card (english+chinese), skill name + damage, combo, countdown
5. Change `playerHit` sound trigger from phase check to `lastDamageTaken > 0` check (since correct-answer path goes result→monsterTurn without entering 'monster-turn' phase)

- [ ] **Step 1: Remove skill button and `handleUseSkill`**

Delete `handleUseSkill` callback (lines ~190-192). Delete the skill button in the JSX (find and remove the button that shows when `battle.charge >= 5`).

- [ ] **Step 2: Remove `handleNextRound` and its button**

Delete `handleNextRound` callback (lines ~155-157). Replace the "下一题 →" button in the result section with the countdown display.

- [ ] **Step 3: Add auto-advance useEffect**

Add after the sound useEffect (after line ~184):

```typescript
// Auto-advance from result screen to monster turn after 2 seconds
useEffect(() => {
  if (!battle || !lastAnswerCorrect) return;
  if (battle.phase === 'result' && battle.status === 'ongoing') {
    const timer = setTimeout(() => finishMonsterTurn(), 2000);
    return () => clearTimeout(timer);
  }
}, [battle?.phase, battle?.status, lastAnswerCorrect, finishMonsterTurn]);
```

- [ ] **Step 4: Update `playerHit` sound trigger**

Replace the phase-based monster-turn sound with damage-based:

```typescript
// Play playerHit sound when monster deals damage
const prevDamageRef = useRef(battle?.lastDamageTaken);
useEffect(() => {
  if (!battle) return;
  const prev = prevDamageRef.current;
  prevDamageRef.current = battle.lastDamageTaken;
  if (battle.lastDamageTaken > 0 && prev === 0) {
    play('playerHit');
  }
}, [battle?.lastDamageTaken, play]);
```

- [ ] **Step 5: Update result section UI**

Replace the current result section (lines ~387-403) with:

```tsx
{isResult && (
  <motion.div
    key="result"
    className="flex flex-col items-center gap-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <span className="text-6xl">✅</span>
    <p className="text-2xl font-bold text-green-400">正确!</p>

    {/* Word card */}
    {currentQuestion && (
      <div className="w-full max-w-xs rounded-xl border border-green-800/40 bg-black/30 p-4 text-center">
        <p className="text-xl font-bold text-white">{currentQuestion.word.english}</p>
        <p className="mt-1 text-lg text-gray-400">{currentQuestion.word.chinese}</p>
      </div>
    )}

    {/* Damage info */}
    {battle.lastDamageDealt > 0 && (
      <p className="text-lg text-yellow-300">
        ⚔️ 造成 <span className="font-bold text-white">{battle.lastDamageDealt}</span> 点伤害
      </p>
    )}

    {/* Combo */}
    <p className={`text-lg ${battle.combo >= 3 ? 'font-bold text-orange-400' : 'text-gray-400'}`}>
      🔥 连击 x{battle.combo}
    </p>

    {/* Countdown */}
    <p className="text-sm text-gray-500">2秒后自动继续...</p>
  </motion.div>
)}
```

- [ ] **Step 6: Remove `handleUseSkill` import if no longer referenced**

Check that `useSkillAction` is no longer destructured from the store or called.

- [ ] **Step 7: Remove the monster-turn phase-based sound check**

In the sound useEffect, remove or comment out the `playerHit` block that checks `battle.phase === 'monster-turn'`.

- [ ] **Step 8: Run TypeScript check + build**

Run: `cd D:/reasonix/l9eng && npx tsc --noEmit && npx vite build`
Expected: zero errors, build succeeds

- [ ] **Step 9: Commit**

```bash
git add src/pages/BattlePage.tsx && git commit -m "feat: result screen auto-advance, remove skill/next buttons, damage-based sound"
```

---

### Task 5: Update Tests

**Files:**
- Modify: `src/core/engine/battle.test.ts`

- [ ] **Step 1: Update answerQuestion tests for skill-on-correct**

Update the test "increments combo and charge on correct answer" — it should now check that phase='result' (already done), but also that `charge` is no longer incremented (or doesn't matter):

```typescript
it('applies class skill on correct answer (warrior ×1.5)', () => {
  const player = createTestPlayer('warrior');
  const monster = createTestMonster('goblin');
  const battle = createBattle(player, monster);
  const result = answerQuestion(battle, player, monster, true);
  // Warrior skill: with level 1 warrior, combo=1, no crit → damage ≈ (12+5)×1.5 = 25.5 → 26
  expect(result.lastDamageDealt).toBeGreaterThanOrEqual(20);
  expect(result.lastDamageDealt).toBeLessThanOrEqual(30);
  expect(result.phase).toBe('result');
  expect(result.combo).toBe(1);
});
```

- [ ] **Step 2: Update wrong-answer test for basic attack**

```typescript
it('deals basic attack on wrong answer', () => {
  const player = createTestPlayer('warrior');
  const monster = createTestMonster('goblin');
  const battle = createBattle(player, monster);
  const result = answerQuestion(battle, player, monster, false);
  // Basic attack: (12+5) = 17 (no combo multiplier since wrong resets combo)
  expect(result.lastDamageDealt).toBe(17);
  expect(result.phase).toBe('monster-turn');
  expect(result.combo).toBe(0);
});
```

- [ ] **Step 3: Remove or update tests for `useSkill`**

Delete or skip tests that call `useSkill` since the function is removed. Update any test that references `charge` behavior.

- [ ] **Step 4: Run all tests**

Run: `cd D:/reasonix/l9eng && npx vitest run`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/core/engine/battle.test.ts && git commit -m "test: update for turn-based skill/basic battle system"
```

---

### Final Integration Check

- [ ] **Step 1: Full build + test**

Run: `cd D:/reasonix/l9eng && npx tsc --noEmit && npx vitest run && npm run build`
Expected: zero errors, all tests pass, production build succeeds

- [ ] **Step 2: Push**

```bash
git push
```
