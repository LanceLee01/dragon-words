# Task 2: Core Type Definitions & Static Data — Report

**Status:** DONE

## Summary

Successfully created all 5 core data files with type definitions and static game data matching the specification.

## Files Created

### 1. `src/core/data/types.ts`
All TypeScript interfaces and type aliases:
- `GamePhase`, `QuestionType`, `ClassId`, `AdvancedClassId`, `Difficulty`, `WordLevel` — string union types
- `Word`, `PassiveEffect`, `SkillDef`, `BossSkillDef` — supporting model types
- `ClassDef`, `AdvancedClassDef`, `MonsterDef`, `ChapterDef`, `ChapterLevel`, `Equipment` — game data interfaces
- `PlayerState`, `BattleState`, `Question` — runtime state interfaces

### 2. `src/core/data/classes.ts`
- **`BASE_CLASSES`** — 6 classes with exact spec values:
  - warrior (战士, +20% atk passive, 猛击 ×3 skill)
  - mage (法师, combo-start ×1.5 passive, 火球术 ×2+stun skill)
  - ranger (游侠, 30% crit-after-wrong passive, 连射 3 hits skill)
  - paladin (圣骑士, -30% dmg passive, 圣光 heal 40% skill)
  - rogue (盗贼, +15% crit passive, 暗杀 insta<50% skill)
  - druid (德鲁伊, regen 5%/turn passive, 自然之怒 dmg+stun2 skill)
  - All have `advancedTo` matching spec Table 4.3, `chargeNeeded: 5`

- **`ADVANCED_CLASSES`** — 6 advanced classes with exact spec values:
  - dragon-knight (+8 atk, +30% atk + -50% dmg passive, ×4 + shield1 skill)
  - archmage (+7 atk, combo×2+freeSkill passive, ×3+frz3 skill)
  - elf-lord (+6 atk, 50% crit×3 passive, 5hits+dodge skill)
  - light-lord (+4 atk, -50%+regen5% passive, fullheal+atkHalf3 skill)
  - shadow-master (+7 atk, 30% crit+killHeal30% passive, mark+insta skill)
  - nature-spirit (+5 atk, regen10%+immune passive, dmg3T+resurrect skill)

### 3. `src/core/data/monsters.ts`
- **`MONSTERS`** — 30 monsters (15 normal + 15 boss) with exact HP/attack values
- **`CHAPTER_MONSTERS`** — mapping chapters 1-15 to normal/boss monster IDs
- All bosses have `bossSkill` with name+description

### 4. `src/core/data/levels.ts`
- **`CHAPTERS`** — 15 chapters with names, wordCount, wordLevel, and 5 levels each
  - Chapters 1-5: wordCount=101, wordLevel='primary'
  - Chapters 6-14: wordCount=110, wordLevel='middle'
  - Chapter 15: wordCount=108, wordLevel='middle'
- **Helper functions:**
  - `getDifficultyPhase(chapter)` — phase ranges per spec
  - `getTimeLimit(chapter, type)` — beginner 12/14, intermediate 10/12, challenge 9/10, ultimate 8/9
  - `getMonsterHpRange(chapter)` — phase-based ranges (ch15=500)
  - `getMonsterAttackRange(chapter)` — phase-based ranges (ch15=60)
  - `getXpForLevel(level)` — level * 100

### 5. `src/core/data/equipment.ts`
- **`EQUIPMENT`** — 18 items (3 tiers × 6 classes)
  - Tier 1: cost 100, atk+3, def 0-2
  - Tier 2: cost 500, atk+7, def 1-5
  - Tier 3: cost 1500, atk 10-18, def 2-20
  - Paladin shields are defense-focused (def up to 20); rogue daggers are attack-focused (atk up to 18)

## Verification

- `npx tsc --noEmit` — **zero errors** ✅
- All files are pure TypeScript — no React imports in `core/` directory

## Commit

```
git add -A && git commit -m "feat: add core type definitions and static data"
```
