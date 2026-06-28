# Task 5 Report: MatchQuestion Component

## Summary

Replaced the stub placeholder in `src/components/battle/MatchQuestion.tsx` with a full implementation of the dual-pane click-to-connect matching question type.

## Implementation Details

### Component: `MatchQuestion`

**State:**
- `selectedLeftId: number | null` — tracks which left-side English word is highlighted
- `shakingRightId: number | null` — tracks which right-side item shakes on a wrong match
- `shuffledOrder: number[]` — stores the independently shuffled order for the right column, initialized once per question via Fisher-Yates shuffle

**Interaction Flow:**
1. Click a left-side English word → it becomes selected (blue border + shadow)
2. Click a right-side Chinese definition → `onMatchConnect(leftWordId, rightWordId)` is called
3. If `leftWordId === rightWordId` (same word), the store locks the pair
4. If mismatch, the clicked right item plays a shake animation (`x: [0, -5, 5, -5, 5, 0]`)
5. Clicking a different left word while one is selected switches the selection
6. Locked pairs display green border + background + ✅ checkmark and are unclickable

**Layout:**
- Header: ⚡ 极速配对 title, progress (x/5), timer
- CSS Grid (`grid-cols-2`) with left column (English words) and right column (Chinese definitions, shuffled independently)
- Footer: gold reward info (🪙 base/ pair, ✨ full-match multiplier)

**Visual States:**
| State | Border | Background | Text |
|---|---|---|---|
| Unselected | `border-gray-600` | `bg-white/5` | `text-white` |
| Selected (left) | `border-blue-500` | `bg-blue-900/20` + blue shadow | `text-white` |
| Locked (correct) | `border-green-500` | `bg-green-900/20` | `text-green-300` + ✅ |
| Wrong match (shake) | `border-red-500` | `bg-red-900/20` | `text-white` |

## Verification

- `npx tsc --noEmit` ✅ — no TypeScript errors
- `npx vitest run` ✅ — 79/79 tests pass across 4 test files

## Commit

```
b96b592 feat: MatchQuestion component with dual-pane click-to-connect
```
