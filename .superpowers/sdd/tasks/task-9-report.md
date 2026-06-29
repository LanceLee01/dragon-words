# Task 9 Report: Create IconBadge.tsx

**Status:** ✅ Completed

## Summary

Created `src/components/ui/IconBadge.tsx` — a shared UI component that renders a category badge (offense/defense/utility/legendary) with an icon, color, and optional tooltip.

## Implementation Details

- **Props:** `category` (required), `size` (optional, default `'md'`), `tooltip` (optional)
- **Categories:** offense (red/⚔️/攻击), defense (green/🛡️/生存), utility (blue/🔧/功能), legendary (yellow/⭐/传说)
- **Sizes:** `sm` (w-5 h-5), `md` (w-7 h-7), `lg` (w-9 h-9)
- **Tooltip:** Shows on hover with a fade-in positioned above the badge

## Verification

- `npx tsc --noEmit --pretty` — **zero errors**

## Commit

```
e8f2078 feat(p1): add shared IconBadge component with category colors and tooltip
```
