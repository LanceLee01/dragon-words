# Task 9 Report — Shop Page & Word Data Pipeline

**Date:** Completed

## Summary

Implemented the equipment shop page and word data build pipeline for Dragon Words.

## Files Created

### `src/pages/ShopPage.tsx`
- Dark gradient background (`linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)`)
- Header with ←Back button (uses `navigate(-1)`), 🏪 装备商店 title, and 💰 gold counter
- If no class selected: prompts user to go home
- Filters `EQUIPMENT` by player's class, showing all 3 tiers
- Each item card: icon, name, tier badge (I/II/III), stats (⚔ attack, 🛡 defense)
- Three states per item:
  - **已装备** (gold border + ✅) — currently equipped
  - **装备** button — owned but not equipped
  - **💰 cost** buy button — not owned (disabled if insufficient gold)

### `scripts/placeholder-words.md`
- 20 primary sample words + 20 middle sample words
- Format: `- english | chinese | difficulty` (difficulty 1=primary, 2=middle)

### `scripts/generate-words.ts`
- Node.js script using `tsx`
- Parses placeholder-words.md for primary and middle sections
- Pads to 1600 words total (ids 1-505 = primary, 506-1600 = middle)
- Generates `word_N` / `单词_N` placeholders for padding
- Writes `src/core/data/words.ts` with typed `WORDS: Word[]` export

### `src/core/data/words.ts` (auto-generated)
- 1600 words: 505 primary + 1095 middle

## Files Modified

### `src/stores/gameStore.ts`
- Added `import { WORDS } from '@/core/data/words'`
- Replaced `initWords()` stub with `set({ words: WORDS })`

### `src/core/data/types.ts`
- Added `equippedWeaponId: string | null` to `PlayerState` interface

### `src/stores/playerStore.ts`
- Added `equippedWeaponId: null` to `DEFAULT_PLAYER`
- Fixed `equipWeapon(id)` to properly set `equippedWeaponId` instead of creating dummy equipment
- Added `buyEquipment(item)` method: subtracts gold, adds item to equipment array, sets equipped

### `src/core/utils/storage.ts`
- Added `equippedWeaponId: null` to `DEFAULT_PLAYER`

### Test files
- `src/core/engine/battle.test.ts`: Added `equippedWeaponId: null` to `makePlayer()`
- `src/core/utils/storage.test.ts`: Added `equippedWeaponId: null` to test objects

## Verification

- `npx tsc --noEmit` — ✅ passes with zero errors
- `npm run build` — build errors are all pre-existing (unused variables, type issues in other files); none from our changes
- All pre-existing errors confirmed via `git stash` before/after comparison

## Git Commit

```
feat: implement Shop page and word data generation pipeline
```
