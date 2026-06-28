# Turn-Based Battle System — Design Spec

**Date:** 2025-06-28
**Project:** Dragon Words (龙与地下城背单词 RPG)
**Status:** Draft

---

## 1. Overview

Replace the current charge-based battle system with a true turn-based flow: every round the player answers a vocabulary question, then the monster always attacks back. Correct answers trigger a class skill (strong effect); wrong answers deal a basic attack (weak). The goal is that ~70-80% accuracy is required to survive a 10-round battle.

---

## 2. Battle Flow

```
[Phase: question]  →  Player answers
    ├─ Correct  →  RESULT screen (2 sec)  →  Monster attacks  →  [Phase: question]
    └─ Wrong    →  MONSTER-TURN screen    →  Monster attacks  →  [Phase: question]

Monster HP ≤ 0  →  Victory screen → rewards → map
Player HP  ≤ 0  →  Defeat screen  → retry/map
```

### Key changes from current system

| Aspect | Before | After |
|--------|--------|-------|
| Correct answer | Basic attack + charge +1 | Class skill (immediate, no charge) |
| Wrong answer | Skip player turn, monster attacks | Basic attack (weak) + monster attacks |
| Monster behavior | Only attacks on wrong answer | Attacks every round |
| Charge system | 5 charges → manual skill button | **Removed** (skills auto-fire on correct) |
| Skill button | Manual press at charge=5 | **Removed** |
| Result screen | Manual "下一题" button | Auto-advance after 2 sec |
| Monster-turn screen | Manual "继续" button (wrong only) | **Kept** for wrong answers |

---

## 3. Skill System (Correct Answer)

### Class skill list

| Class | Skill Name | Effect |
|-------|-----------|--------|
| Warrior | 斩击 | ×1.5 basic attack damage |
| Mage | 火球 | ×1.2 + stun monster 1 turn |
| Ranger | 射击 | 3 hits ×0.7 basic attack |
| Paladin | 圣击 | Attack + heal 15% max HP |
| Rogue | 背刺 | ×1.3 + bonus 10% monster current HP |
| Druid | 藤蔓 | ×1.2 + heal 5% max HP |

### Skill multiplier per class

| Class | Skill Multiplier | Special |
|-------|-----------------|---------|
| Warrior | ×1.5 | — |
| Mage | ×1.2 | stun 1 turn |
| Ranger | ×0.7 × 3 hits | total ×2.1, hits separately |
| Paladin | ×1.0 | +heal 15% |
| Rogue | ×1.3 | +10% of monster current HP as bonus |
| Druid | ×1.2 | +heal 5% |

### Basic attack (wrong answer)

Formula: `baseAttack = class.baseAttack + player.attack + class.baseAttackBonus`

Standard basic attack, no special effects.

---

## 4. Monster Stat Rebalance

### Formula

```
New HP  = Original HP × 5
New ATK = Original ATK × 2
```

### All monsters

#### Normal monsters

| Ch | Monster | Original HP | Original ATK | New HP | New ATK |
|----|---------|-------------|--------------|--------|---------|
| 1  | 哥布林 | 40 | 6 | **200** | **12** |
| 2  | 骷髅兵 | 45 | 7 | **225** | **14** |
| 3  | 学徒法师 | 50 | 8 | **250** | **16** |
| 4  | 影狼 | 55 | 8 | **275** | **16** |
| 5  | 石像鬼 | 55 | 8 | **275** | **16** |
| 6  | 穴居人 | 75 | 12 | **375** | **24** |
| 7  | 鹰身女妖 | 80 | 13 | **400** | **26** |
| 8  | 幽灵 | 85 | 14 | **425** | **28** |
| 9  | 食人魔 | 90 | 15 | **450** | **30** |
| 10 | 魅魔 | 95 | 16 | **475** | **32** |
| 11 | 地狱猎犬 | 100 | 17 | **500** | **34** |
| 12 | 堕天使 | 110 | 18 | **550** | **36** |
| 13 | 时光幽灵 | 120 | 20 | **600** | **40** |
| 14 | 龙裔 | 130 | 22 | **650** | **44** |
| 15 | 精英卫兵 | 150 | 25 | **750** | **50** |

#### Boss monsters

| Ch | Boss | Original HP | Original ATK | New HP | New ATK |
|----|------|-------------|--------------|--------|---------|
| 1  | 哥布林王 | 50 | 8 | **250** | **16** |
| 2  | 死亡骑士 | 55 | 9 | **275** | **18** |
| 3  | 大法师 | 60 | 10 | **300** | **20** |
| 4  | 树精长老 | 65 | 11 | **325** | **22** |
| 5  | 熔岩巨人 | 70 | 12 | **350** | **24** |
| 6  | 黑暗精灵 | 100 | 15 | **500** | **30** |
| 7  | 双足飞龙 | 110 | 16 | **550** | **32** |
| 8  | 巫妖王 | 120 | 18 | **600** | **36** |
| 9  | 风暴巨人 | 140 | 20 | **700** | **40** |
| 10 | 暗黑骑士 | 160 | 22 | **800** | **44** |
| 11 | 深渊领主 | 180 | 25 | **900** | **50** |
| 12 | 大天使 | 200 | 28 | **1000** | **56** |
| 13 | 时空守护者 | 230 | 30 | **1150** | **60** |
| 14 | 龙巫妖 | 260 | 35 | **1300** | **70** |
| 15 | 远古红龙 | 500 | 60 | **2500** | **120** |

### Balance verification (Chapter 1)

**Warrior at level 1**: class base 12 + player base 5 = 17 attack
- Skill (correct): 17 × 1.5 = **26 damage**
- Basic (wrong): **17 damage**
- Player HP: **100**

| Accuracy | Rounds to kill | Monster hits | Player HP remaining |
|----------|---------------|--------------|-------------------|
| 80% (8/10) | ~8 | 8×12=96 | **4** (barely survive) |
| 70% (7/10) | ~9 | 9×12=108 | **-8** (dead) |
| 50% (5/10) | ~10 | 10×12=120 | **-20** (dead) |

**Result**: ~75% accuracy threshold matches the design goal of "die at 50%, barely survive at 80%".

---

## 5. UI Changes

### Result screen (correct answer) — 2 second auto-display

```
┌─────────────────────────┐
│         ✅ 正确!         │
│                         │
│    ┌─── 单词卡片 ───┐    │
│    │ courage         │    │
│    │ 勇气，勇敢       │    │
│    └─────────────────┘    │
│                         │
│    ⚔️ 斩击 — 造成 26 点伤害 │
│    🔥 连击 x3
│
│    <span class="text-sm text-gray-400">2秒后自动继续...</span>
└─────────────────────────┘
```

Elements:
1. ✅ 正确! — green title
2. Word card — English + Chinese translation (from currentQuestion)
3. Damage line — class attack name + damage number
4. Combo — current combo value (highlights when ≥3)
5. Countdown — "2秒后自动继续..."

### Monster-turn screen (wrong answer) — manual continue button

Kept as-is: shows ❌ 答错了! + 继续 button.

### Removed UI elements

- The 下一题 button on result screen (replaced with auto-advance)
- The skill button (skills auto-fire on correct answers)
- The charge indicator as interactive element (kept as visual only)

---

## 6. Sound Effects

No changes to the sound engine. Sound triggers update to match new flow:

| Trigger | Sound | Mechanism |
|---------|-------|-----------|
| Phase: question → result (correct) | `playAttackSequence()` | Existing useEffect, unchanged |
| Phase: question → monster-turn (wrong) | `play('playerHit')` | Changed to watch `lastDamageTaken > 0` |
| Status: won | `play('victory')` | Unchanged |
| Status: lost | `play('defeat')` | Unchanged |
| Combo ≥ 3 | `play('combo')` | Unchanged |

---

## 7. Files Changed

| File | Change |
|------|--------|
| `src/core/data/monsters.ts` | Update HP ×5, ATK ×2 for all 30 monsters |
| `src/core/engine/battle.ts` | Skill-on-correct logic, basic attack on wrong + monster always attacks, remove charge |
| `src/stores/battleStore.ts` | Remove charge/skill-button logic; unified monster-turn handling |
| `src/pages/BattlePage.tsx` | Result screen redesign (2 sec auto-advance), remove 下一题 button, remove skill button, unified monster-turn flow |
| `src/core/data/monsters.ts` | HP ×5, ATK ×2 for all 30 monsters |
| Tests (`battle.test.ts`) | Update for new flow |

---

## 8. Open Questions / Future

- **Phonetic transcription**: Word data has no phonetic field; added to future wishlist
- **Player stat scaling**: Currently level-ups don't increase HP/attack; separate feature
- **Equipment impact**: Weapons boost attack by +3 to +18; factored into base formula
- **Boss skills**: `bossSkill` definitions exist but not yet implemented; unchanged by this design
