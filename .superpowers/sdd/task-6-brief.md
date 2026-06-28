# Task 6: UI Foundation — Shared Components & Hooks

## Files

### 1. `src/hooks/useTimer.ts`
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
export function useTimer(initialSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const reset = useCallback((seconds?: number) => setRemaining(seconds ?? initialSeconds), [initialSeconds]);
  useEffect(() => {
    if (remaining <= 0) { onExpireRef.current(); return; }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  return { remaining, reset, isUrgent: remaining <= 3 && remaining > 0 };
}
```

### 2. `src/components/shared/HealthBar.tsx`
Props: `current, max, label, color?='bg-red-600', className?=''`
Renders: div with Framer Motion animated width bar, label, current/max text

### 3. `src/components/shared/Timer.tsx`
Props: `remaining, isUrgent`
Renders: "⏱ {remaining}s" in gold, red+pulsing when urgent

### 4. `src/components/shared/DamageNumber.tsx`
Props: `value, isCrit?, isHeal?, key(string)`
Renders: Framer Motion AnimatePresence floating number that goes up and fades

### 5. `src/components/shared/ComboDisplay.tsx`
Props: `combo: number`
Renders: "Nice!"(1), "Great!!"(3), "AMAZING!!!"(5), "LEGENDARY!!!!"(7+) with spring animation + "x Combo!" counter

### 6. Update `src/App.tsx`
Routes: `/`→HomePage, `/select-class`→SelectClassPage, `/map`→MapPage, `/battle/:chapter/:level`→BattlePage, `/shop`→ShopPage
On mount: `usePlayerStore.init()` + `useGameStore.initWords()`. Loading state while not loaded.
Background: `bg-gray-900 text-white game-active`

## Global Constraints
- All shared components in src/components/shared/
- useTimer in src/hooks/
- Framer Motion (import { motion } from 'framer-motion')
- Path alias `@/`

## Steps
Write all files, npx tsc --noEmit, commit: "feat: add shared UI components, timer hook, and route setup"
