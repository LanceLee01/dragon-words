# Task 2: Core Type Definitions & Static Data

Create all core type interfaces and static game data files. These files are pure TypeScript — no React imports allowed.

## Files to Create

### 1. `src/core/data/types.ts`
All TypeScript interfaces and type aliases from the exact code in the plan (`GamePhase`, `QuestionType`, `ClassId`, `AdvancedClassId`, `Difficulty`, `WordLevel`, `Word`, `ClassDef`, `AdvancedClassDef`, `MonsterDef`, `ChapterDef`, `Equipment`, `PlayerState`, `BattleState`, `Question`).

### 2. `src/core/data/classes.ts`
- `BASE_CLASSES: Record<string, ClassDef>` — 6 classes with exact data from the spec:
  - warrior: 战士, baseAttack=12, passive war-will +20%, skill 猛击 ×3
  - mage: 法师, baseAttack=8, passive combo-start ×1.5, skill 火球术 ×2+stun
  - ranger: 游侠, baseAttack=9, passive 30% crit-after-wrong, skill 连射 3 hits
  - paladin: 圣骑士, baseAttack=7, passive -30% damage, skill 圣光 heal 40%
  - rogue: 盗贼, baseAttack=10, passive +15% crit, skill 暗杀 insta<50%
  - druid: 德鲁伊, baseAttack=6, passive regen 5%/turn, skill 自然之怒 dmg+stun2
  - All classes have `advancedTo` matching spec Table 4.3
  - skill.chargeNeeded = 5 for all

- `ADVANCED_CLASSES: Record<string, AdvancedClassDef>` — 6 advanced with:
  - dragon-knight: +8 baseAtk, passive atk+30%+dmg-50%, skill ×4 + shield1
  - archmage: +7 baseAtk, passive combo×2+freeSkill, skill ×3+frz3
  - elf-lord: +6 baseAtk, passive 50%crit×3, skill 5hits+dodge
  - light-lord: +4 baseAtk, passive -50%+regen5%, skill fullheal+atkHalf3
  - shadow-master: +7 baseAtk, passive 30%crit+killHeal30%, skill mark+insta
  - nature-spirit: +5 baseAtk, passive regen10%+immune, skill dmg3T+resurrect

### 3. `src/core/data/monsters.ts`
- `MONSTERS: Record<string, MonsterDef>` — 30 monsters (15 normal + 15 boss):
  - Normal: goblin(40/6), skeleton(45/7), apprentice(50/8), shadowwolf(55/8), gargoyle(55/8), troglodyte(75/12), harpy(80/13), ghost(85/14), ogre(90/15), succubus(95/16), demonhound(100/17), fallenAngel(110/18), timeGhost(120/20), dragonborn(130/22), eliteGuard(150/25)
  - Bosses: goblinKing(50/8), deathKnight(55/9), archmage_boss(60/10), treantElder(65/11), lavaGiant(70/12), drowElf(100/15), wyvern(110/16), lichKing(120/18), stormGiant(140/20), darkKnight(160/22), abyssalLord(180/25), archangel(200/28), timeKeeper(230/30), dracolich(260/35), ancientRed(500/60)
  - Bosses have bossSkill with name+description matching spec Table 5.2
  - `CHAPTER_MONSTERS: Record<number, { normal: string; boss: string }>` mapping chapters 1-15

### 4. `src/core/data/levels.ts`
- `CHAPTERS: ChapterDef[]` — 15 chapters with names:
  1:森林小径,2:城堡大厅,3:魔法学院,4:精灵森林,5:矮人矿坑,6:幽暗地域,7:龙脊山脉,8:亡灵沼泽,9:巨人平原,10:终焉之塔,11:深渊裂口,12:天堂之门,13:时光回廊,14:龙之圣殿,15:龙王之巢
  - wordCount: ch1-5=101, ch6-14=110, ch15=108
  - wordLevel: ch1-5='primary', ch6-15='middle'
  - Each chapter has 5 levels (levels 1-4 normal, level 5 boss)
- Helper functions:
  - `getDifficultyPhase(chapter)`: 1-3=beginner, 4-7=intermediate, 8-12=challenge, 13-15=ultimate
  - `getTimeLimit(chapter, type)`: beginner 12/14, intermediate 10/12, challenge 9/10, ultimate 8/9
  - `getMonsterHpRange(chapter)`: phase-based ranges (30-50 → 60-100 → 120-180 → 200-300; ch15=500)
  - `getMonsterAttackRange(chapter)`: phase-based ranges (5-8 → 10-15 → 18-25 → 28-40; ch15=60)
  - `getXpForLevel(level)`: level * 100

### 5. `src/core/data/equipment.ts`
- `EQUIPMENT: Equipment[]` — 18 items (3 tiers × 6 classes):
  - Tier 1: cost 100, atk+3/def+0-2
  - Tier 2: cost 500, atk+7/def+1-5
  - Tier 3: cost 1500, atk+10-18/def+2-20
  - Each class gets: weapon names matching spec Table 6.3 with class-appropriate stat bonuses
  - Paladin shields are defense-focused, rogue daggers are attack-focused

## Steps
1. Write each file
2. `npx tsc --noEmit` — zero errors
3. `git add -A && git commit -m "feat: add core type definitions and static data"`

## Global Constraints
- Pure TypeScript — no React imports in `core/` directory
- All interfaces must exactly match the type signatures in the plan
- Use `Record<string, ...>` for lookup dictionaries
- All monster/class/equipment data must match spec values
