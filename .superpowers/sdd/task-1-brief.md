# Task 1: EventModal Action Navigation Fix

## Context

Part of Battle UI Enhancement & Event Fix. This task fixes the EventModal so that when a user selects a choice with `action: 'battle'` (e.g., elite monster fights), the app navigates to the battle page instead of just closing the modal.

## Requirements

**File to modify:** `src/App.tsx` — `handleLoginChoice` callback (lines 96-109)

**Current code:**
```typescript
const handleLoginChoice = useCallback(async (choiceId: string) => {
  if (!loginEvent) return;
  const engine = new EventEngine({
    events: EVENT_POOL,
    playerState: { level: player.level, hasItem: () => false, hasFlag: (flag) => globalFlags.has(flag), gold: player.gold, hp: player.hp, shield: 0 },
    rewardDispatcher: { addGold: (n) => addGold(n), addXp: (n) => addXp(n), addShield: () => {}, addItem: () => {}, addCosmetic: () => {}, takeDamage: (n) => takeDamage(n), spendGold: () => true, spendShield: () => true, spendItem: () => true },
    globalFlags,
    eventHistory,
    onSaveHistory: (history) => { if (history.length > 0) { const last = history[history.length - 1]; addEventToHistory({ id: last.id, choice: last.choice }); } },
  });
  await engine.executeChoice(loginEvent, choiceId);
  setShowLoginEvent(false);
  setLoginEvent(null);
}, [loginEvent, player, globalFlags, eventHistory, addGold, addXp, addEventToHistory, takeDamage]);
```

**Expected change:**
After `engine.executeChoice()`, find the selected choice by `choiceId`, check `selectedChoice?.action === 'battle' && selectedChoice.actionPayload`. If true, navigate to `/battle/${chapter}/${level}${params}` where params = `?monster=${monsterId}` when monsterId exists. Otherwise close the modal as before. Add `navigate` to the dependency array.

**Types used:** `EventChoice` from `@/core/data/events` — has `action?: 'battle'` and `actionPayload?: { chapter: number; level: number; monsterId?: string }`.

**`navigate` is already imported** from `react-router-dom` at line 4 of App.tsx.

**Global constraints:**
- All changes must compile with `tsc -b` without errors
- No new dependencies
- Follow existing code patterns
- Keep all existing functionality working

## Deliverable

Write the fix, verify `npx tsc --noEmit` passes, and commit:
```
git add src/App.tsx
git commit -m "fix: EventModal battle action now navigates to battle page"
```
