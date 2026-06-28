# Task 7: Pages — Home, Class Selection, Adventure Map

Create 3 page components. All use `useNavigate` from react-router-dom and the existing stores.

## Files

### 1. `src/pages/HomePage.tsx`
- Dark gradient background `linear-gradient(180deg, #0a0a2e 0%, #1a0a2e 50%, #2a1a0a 100%)`
- Animated entrance: dragon emoji, "Dragon Words" title (text-gold), subtitle "龙与地下城 · 背单词冒险"
- If player has save (player.classId !== null): "继续冒险" button → navigate('/map'), "重新选择职业" → navigate('/select-class'), "商店" → navigate('/shop')
- If no save: "开始冒险" button → sendEvent('START_GAME'), navigate('/select-class')
- Show player stats if loaded: Lv, gold, highestCombo, accuracy
- Use Framer Motion for entrance animations

### 2. `src/pages/SelectClassPage.tsx`
- Dark gradient `#1a0a2e → #0a0a2e`
- Title "选择你的职业"
- Grid (1 col sm:2 lg:3) of 6 class cards from BASE_CLASSES
- Each card: icon, name, description, passive (green), skill (blue)
- Staggered entrance animation (delay: i * 0.1)
- On click: selectClass(id), sendEvent('SELECT_CLASS'), navigate('/map')

### 3. `src/pages/MapPage.tsx`
- Dark gradient `#1a1a2e → #16213e`
- Header: ←Home, Lv+gold, 🏪Shop
- Title "冒险地图"
- Vertical list of 15 CHAPTERS
- Each chapter card: name, word count, 5 level buttons
- Boss level (lv 5): shown with 👑 and boss name from MONSTERS
- Unlocked: chapter 1 always open; others require prev chapter completed
- Completed levels: green bg, locked: dimmed
- Level click: sendEvent('START_BATTLE'), navigate(`/battle/${ch}/${lv}`)
- Import: CHAPTERS, CHAPTER_MONSTERS, MONSTERS

## Steps
Write all 3 files, `npx tsc --noEmit`, commit: "feat: implement Home, Class Selection, and Adventure Map pages"
