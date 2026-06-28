# Task 9: Shop Page & Word Data Pipeline

Create the equipment shop page and word data build pipeline.

## Files

### 1. `src/pages/ShopPage.tsx`
- Dark gradient: `linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)`
- Header: ←Back, "🏪 装备商店", 💰 gold count
- If no class selected: prompt to go home
- Show player's class-specific equipment (3 tiers from EQUIPMENT)
- Each item card: icon, name, tier badge(I/II/III), description, stats(⚔ +attack, 🛡 +defense)
- States: "已装备"(gold border+✅), "装备" button(owned but not equipped), "💰 cost" buy button
- Use navigate(-1) for back button

### 2. `scripts/placeholder-words.md`
Markdown with `## Primary` and `## Middle` sections. Format: `- english | chinese | difficulty`. Include 20 primary + 20 middle sample words.

### 3. `scripts/generate-words.ts`
Node.js script that:
- Reads placeholder-words.md
- Parses `english | chinese | difficulty` lines
- Pads to 1600 words (ids 1-505 = primary, 506-1600 = middle, generated 'word_N' english)
- Writes `src/core/data/words.ts` exporting `WORDS: Word[]`

### 4. Update `src/stores/gameStore.ts`
Add `initWords()` action that calls `set({ words: WORDS })` importing WORDS from data/words

## Steps
1. Write shop page
2. Write placeholder words
3. Write generator script
4. Run: `npx tsx scripts/generate-words.ts`
5. Update gameStore
6. npx tsc --noEmit
7. npm run build (verify builds)
8. Commit: "feat: implement Shop page and word data generation pipeline"
