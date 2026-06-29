# Task 9: Create IconBadge.tsx shared UI component

**Files:**
- Create: `src/components/ui/IconBadge.tsx`

**Interfaces:**
- Produces: `<IconBadge category size tooltip />`

## Implementation

Create `src/components/ui/IconBadge.tsx`:

```tsx
import { useState } from 'react';

interface IconBadgeProps {
  category: 'offense' | 'defense' | 'utility' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  offense: { color: 'bg-red-500', icon: '⚔️', label: '攻击' },
  defense: { color: 'bg-green-500', icon: '🛡️', label: '生存' },
  utility: { color: 'bg-blue-500', icon: '🔧', label: '功能' },
  legendary: { color: 'bg-yellow-500', icon: '⭐', label: '传说' },
};

const SIZE_MAP = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-7 h-7 text-sm',
  lg: 'w-9 h-9 text-base',
};

export function IconBadge({ category, size = 'md', tooltip }: IconBadgeProps) {
  const [showTip, setShowTip] = useState(false);
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.utility;

  return (
    <span className="relative inline-flex">
      <span
        className={`${SIZE_MAP[size]} ${config.color} inline-flex items-center justify-center rounded-full text-white shadow-sm`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {config.icon}
      </span>
      {showTip && tooltip && (
        <span className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow">
          {tooltip}
        </span>
      )}
    </span>
  );
}
```

## Verification

- `npx tsc --noEmit --pretty` — zero errors

## Commit

```
git add src/components/ui/IconBadge.tsx
git commit -m "feat(p1): add shared IconBadge component with category colors and tooltip"
```
