# Task 7: Pages — Home, Class Selection, Adventure Map

**Status:** Completed

## Files Created

| File | Description |
|---|---|
| `src/pages/HomePage.tsx` | Title screen with animated entrance, conditional action buttons, player stats |
| `src/pages/SelectClassPage.tsx` | 6-class selection grid with staggered animations, passive/skill cards |
| `src/pages/MapPage.tsx` | Adventure map showing all 15 chapters with level buttons, boss indicators, unlock tracking |

## Page Details

### HomePage
- Dark gradient background `linear-gradient(180deg, #0a0a2e → #1a0a2e → #2a1a0a)`
- Framer Motion entrance: dragon emoji (spring scale + rotate), gold title, subtitle fade-in
- If `player.classId !== null`: "继续冒险" → `/map`, "重新选择职业" → `/select-class`, "商店" → `/shop`
- If no save: "开始冒险" → `sendEvent('START_GAME')`, navigate to `/select-class`
- Stats bar: Lv, gold, highestCombo (0 placeholder), accuracy (0% placeholder)
- Action buttons use `motion.button` with hover/tap scale

### SelectClassPage
- Dark gradient `#1a0a2e → #0a0a2e`
- Title "选择你的职业"
- Responsive grid `1 col / sm:2 / lg:3` of 6 class cards from `BASE_CLASSES`
- Each card: emoji icon, Chinese name, one-line description, passive (green bg), skill (blue bg)
- Staggered entrance animation with `delay: i * 0.1`
- On click: `selectClass(id)`, `sendEvent('SELECT_CLASS')`, navigate to `/map`

### MapPage
- Dark gradient `#1a1a2e → #16213e`
- Header: `← Home`, Lv + gold stat display, `🏪 Shop`
- Title "冒险地图"
- 15 chapter cards, each showing: chapter name, word count, 5 level buttons
- **Boss level** (lv 5): crown emoji 👑 + boss name from `MONSTERS` via `CHAPTER_MONSTERS`
- **Unlock logic:** chapter 1 always open; subsequent chapters require previous chapter in `completedChapters`
- **Level unlock:** chapter must be unlocked, and previous level must be in `completedLevels`
- **Visual states:** completed (green bg), unlocked (gray bg, interactive), locked (dimmed, disabled)
- Level click: `sendEvent('START_BATTLE')`, navigate to `/battle/${ch}/${lv}`
- Progress loaded from `loadProgress()` on mount via `useEffect`

## Verification

- `npx tsc --noEmit` — **pass** (zero errors)
- All 3 pages import cleanly; `BattlePage` and `ShopPage` imports remain guarded with `// @ts-ignore` in App.tsx
