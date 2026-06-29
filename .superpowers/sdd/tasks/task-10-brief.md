# Task 10: Create `core/data/events.ts` — Event data layer

**Files:**
- Create: `src/core/data/events.ts`

**Interfaces:**
- Consumes: nothing (standalone data file)
- Produces: `RandomEvent`, `EventChoice`, `EventReward` interfaces + default event pool

## Implementation

Create `src/core/data/events.ts` with:

### 1. Type definitions

```typescript
import type { TriggerPoint } from './types';

export interface EventReward {
  type: 'gold' | 'xp' | 'shield' | 'item' | 'cosmetic';
  id?: string;
  amount: number;
  weight?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  icon?: string;
  cost?: { type: 'gold' | 'hp' | 'shield' | 'item'; amount: number; itemId?: string }[];
  outcome: 'success' | 'fail' | 'random';
  successRate?: number;
  successRewards?: EventReward[];
  failPenalty?: EventReward[];
  nextEventId?: string;
  setFlag?: string;
}

export interface RandomEvent {
  id: string;
  weight: number;
  category: 'merchant' | 'puzzle' | 'elite' | 'chest' | 'lore';
  minChapter?: number;
  maxChapter?: number;
  cooldownDays?: number;
  oncePerRun?: boolean;
  requirements?: {
    minLevel?: number;
    hasItem?: string;
    flag?: string;
  };
  triggerPoints?: TriggerPoint[];
  title: string;
  description: string;
  illustration: string;
  choices: EventChoice[];
  rewards: EventReward[];
  internalState?: Record<string, any>;
}
```

### 2. Default event pool

Include all 5 event templates from the design spec (流浪商人, 古老谜题, 精英怪挑战, 神秘宝箱, 剧情片段). Use the JSON structures from `p1-detailed-design.md` Section 1.3, converted to TypeScript objects.

Each event should:
- Have proper `triggerPoints` array (e.g. merchant has `['boss_victory', 'daily_login']`)
- Use realistic weight values matching the design
- Include at least 2-3 variations for merchant category (different appearances)
- Export as `const EVENT_POOL: RandomEvent[]`

Also export a helper:
```typescript
export function getEventsByTrigger(point: TriggerPoint): RandomEvent[] {
  return EVENT_POOL.filter(e => e.triggerPoints?.includes(point));
}
```

## Verification

- `npx tsc --noEmit --pretty` — zero errors

## Commit

```
git add src/core/data/events.ts
git commit -m "feat(p1): add event data types and default event pool"
```
