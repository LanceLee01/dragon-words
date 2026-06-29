# Task 8 Report: FlyReward.tsx

**Status:** ✅ Completed

## Summary

Created `src/components/ui/FlyReward.tsx` — a shared UI component that displays rewards with a parabolic fly-in animation using Framer Motion.

## Implementation Details

- **Component:** `FlyReward` — renders reward items (`FlyRewardItem[]`) with animated entrance via `motion.div`
- **Props:** `rewards` (array of `{type, amount, icon?}`), `origin` (optional start position), `onComplete` (callback after animation ends)
- **Animation:** Each reward item flies upward with a staggered delay, scaling in and fading out over 0.8s
- **Icons:** Built-in map (`TYPE_ICONS`) for `gold`, `xp`, `shield`, `item`, `cosmetic` types; falls back to `🎁`
- **Timing:** Auto-dismisses after `rewards.length * 300 + 600` ms; calls `onComplete` when done

## Verification

- `npx tsc --noEmit --pretty` — **zero errors**

## Commit

```
f72a46d feat(p1): add shared FlyReward component with parabolic fly-in animation
```

## Fixes Applied

### 1. Unused `origin` prop
- Destructured `origin` from props (was silently ignored)
- Applied `origin?.y ?? 0` as the initial `y` offset in the animation's `initial` state, so rewards start at the specified origin position instead of always from `y: 0`

### 2. Missing `key` prop inside `AnimatePresence`
- Added `key="fly-rewards"` to the wrapping `<div>` inside `AnimatePresence` so exit animations work correctly

### Verification
- `npx tsc --noEmit --pretty` — **zero errors** (passed cleanly)

### Commit
```
2343e18 fix(p1): use origin prop and add key to FlyReward AnimatePresence
```
