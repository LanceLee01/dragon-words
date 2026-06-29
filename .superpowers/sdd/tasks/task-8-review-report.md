# Task 8 Fix Review — FlyReward.tsx

**Verdict:** ✅ **PASS — Both issues resolved.**

## Issue 1: Unused `origin` prop

| Before | After | Status |
|---|---|---|
| `export function FlyReward({ rewards, onComplete }: FlyRewardProps)` — `origin` was silently ignored | `export function FlyReward({ rewards, origin, onComplete }: FlyRewardProps)` — `origin` is now destructured | ✅ Fixed |
| `initial={{ opacity: 0, y: 0, scale: 0.5 }}` — always started from `y: 0` | `initial={{ opacity: 0, y: origin?.y ?? 0, scale: 0.5 }}` — uses `origin.y` as initial vertical offset, falling back to `0` | ✅ Fixed |

## Issue 2: Missing `key` prop inside `AnimatePresence`

| Before | After | Status |
|---|---|---|
| `<div className="...">` — no `key`, so `AnimatePresence` couldn't track the element for exit animations | `<div key="fly-rewards" className="...">` — unique stable key added | ✅ Fixed |

## TypeScript Verification

```
$ npx tsc --noEmit --pretty
Exit code: 0  ✅  (zero errors)
```

## Summary

The fix in commit `2343e18` correctly addresses both issues:
1. **`origin` prop** — destructured and applied to the `initial` animation state as `origin?.y ?? 0`.
2. **`AnimatePresence` key** — `key="fly-rewards"` added to the root `<div>`, enabling proper exit animation tracking.

The file compiles cleanly with zero TypeScript errors. No regressions introduced.
