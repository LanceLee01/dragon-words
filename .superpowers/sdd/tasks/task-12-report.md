# Task 12 Report: EventModal

## Status: ✅ Completed

## Files Created
- `src/components/adventure/EventModal.tsx` — Event UI component
- `src/core/data/events.ts` — Type definitions (`RandomEvent`, `EventChoice`, `EventReward`)

## Verification
- `npx tsc --noEmit --pretty` — **zero errors** (exit code 0)

## Implementation Summary
- **EventModal** (`src/components/adventure/EventModal.tsx`):
  - Full-screen modal wrapping the event UI
  - Category-based illustration placeholder (emoji icons for merchant/puzzle/elite/chest/lore)
  - Event title display
  - TypewriterText for description animation (speed: 25ms)
  - Choice buttons with icons, cost indicators (gold/hp/shield/item), and disabled state when unaffordable
  - Selection animation → 800ms delay → notifies parent via `onChoice`
  - Optional `FlyReward` fly-in for post-choice rewards
- **Types** (`src/core/data/events.ts`):
  - `RandomEvent` — full event definition with weight, category, requirements, choices, rewards
  - `EventChoice` — choice with cost, outcome type, success/fail rewards, flags
  - `EventReward` — reward/penalty with type, amount, optional weight

## Dependencies Consumed
- `Modal` (`@/components/ui/Modal`) — fullscreen variant
- `TypewriterText` (`@/components/ui/TypewriterText`) — animated description
- `FlyReward` (`@/components/ui/FlyReward`) — reward fly-in animation

## Committed
```
git add src/components/adventure/EventModal.tsx
git commit -m "feat(p1): add EventModal component with typewriter description and choice buttons"
```
