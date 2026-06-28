# Task 6: UI Foundation — Shared Components & Hooks

**Status:** Completed

## Files Created

| File | Description |
|---|---|
| `src/hooks/useTimer.ts` | Countdown hook with `remaining`, `reset`, `isUrgent` |
| `src/components/shared/HealthBar.tsx` | Animated HP bar (Framer Motion spring width) |
| `src/components/shared/Timer.tsx` | Timer display with urgent pulsing |
| `src/components/shared/DamageNumber.tsx` | Floating damage/heal number (AnimatePresence) |
| `src/components/shared/ComboDisplay.tsx` | Combo tier labels + counter (spring animation) |

## File Modified

- `src/App.tsx` — routes for all 5 pages, store init (`usePlayerStore.init()`, `useGameStore.initWords()`), loading state, `bg-gray-900 text-white game-active` background

## Verification

- `npx tsc --noEmit` — **pass** (no errors; page imports guarded with `// @ts-ignore`)
- `npx vitest run` — **69 tests pass** (all existing tests)

## Shared Component Details

- **HealthBar:** `current`, `max`, `label`, optional `color` (default `bg-red-600`), optional `className`
- **Timer:** `remaining`, `isUrgent` — gold background normally, red + pulsing scale when ≤3s
- **DamageNumber:** `value`, `isCrit?`, `isHeal?`, `key` — floats up and fades over 0.8s; green for heal, yellow for crit, red for damage
- **ComboDisplay:** `combo` — tiered labels: 1→Nice!, 3→Great!!, 5→AMAZING!!!, 7+→LEGENDARY!!!!; spring scale animation
- **useTimer:** `initialSeconds`, `onExpire` callback — returns `{ remaining, reset, isUrgent }`
