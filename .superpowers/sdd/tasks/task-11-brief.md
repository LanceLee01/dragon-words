# Task 11: Create `core/engine/eventEngine.ts` — Event engine

**Files:**
- Create: `src/core/engine/eventEngine.ts`

**Interfaces:**
- Consumes: `RandomEvent`, `EventChoice`, `EventReward` from `../data/events`; `TriggerPoint` from `../data/types`
- Produces: `EventEngine` class with `checkTrigger()`, `executeChoice()`

## Implementation

Create `src/core/engine/eventEngine.ts`:

```typescript
import type { RandomEvent, EventChoice, EventReward } from '../data/events';
import type { TriggerPoint, EventResult } from '../data/types';
import { getEventsByTrigger } from '../data/events';
import { weightedRandom } from '../utils/random';

interface PlayerStateReader {
  level: number;
  hasItem: (id: string) => boolean;
  hasFlag: (flag: string) => boolean;
  gold: number;
  hp: number;
  shield: number;
}

interface RewardDispatcher {
  addGold: (n: number) => void;
  addXp: (n: number) => void;
  addShield: (n: number) => void;
  addItem: (id: string, amount: number) => void;
  addCosmetic: (id: string, amount: number) => void;
  takeDamage: (n: number) => void;
  spendGold: (n: number) => boolean;
  spendShield: (n: number) => boolean;
  spendItem: (id: string, amount: number) => boolean;
}

export class EventEngine {
  private events: RandomEvent[];
  private playerState: PlayerStateReader;
  private rewardDispatcher: RewardDispatcher;
  private globalFlags: Set<string>;
  private eventHistory: Array<{ id: string; timestamp: number; choice: string }>;
  private onSaveHistory: (history: Array<{ id: string; timestamp: number; choice: string }>) => void;

  constructor(params: {
    events: RandomEvent[];
    playerState: PlayerStateReader;
    rewardDispatcher: RewardDispatcher;
    globalFlags: Set<string>;
    eventHistory: Array<{ id: string; timestamp: number; choice: string }>;
    onSaveHistory: (history: Array<{ id: string; timestamp: number; choice: string }>) => void;
  }) {
    this.events = params.events;
    this.playerState = params.playerState;
    this.rewardDispatcher = params.rewardDispatcher;
    this.globalFlags = params.globalFlags;
    this.eventHistory = params.eventHistory;
    this.onSaveHistory = params.onSaveHistory;
  }

  checkTrigger(triggerPoint: TriggerPoint): RandomEvent | null {
    const candidates = this.events.filter(e =>
      e.weight > 0 &&
      (e.triggerPoints || []).includes(triggerPoint) &&
      this.checkRequirements(e) &&
      this.checkCooldown(e) &&
      this.checkOncePerRun(e) &&
      this.checkChapterRange(e)
    );
    if (!candidates.length) return null;
    return weightedRandom(candidates.map(e => ({ item: e, weight: e.weight })));
  }

  private checkRequirements(e: RandomEvent): boolean {
    const r = e.requirements;
    if (!r) return true;
    if (r.minLevel !== undefined && this.playerState.level < r.minLevel) return false;
    if (r.hasItem && !this.playerState.hasItem(r.hasItem)) return false;
    if (r.flag && !this.playerState.hasFlag(r.flag)) return false;
    return true;
  }

  private checkCooldown(e: RandomEvent): boolean {
    if (!e.cooldownDays) return true;
    const last = this.eventHistory
      .filter(h => h.id === e.id)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (!last) return true;
    const elapsed = Date.now() - last.timestamp;
    return elapsed > e.cooldownDays * 24 * 60 * 60 * 1000;
  }

  private checkOncePerRun(e: RandomEvent): boolean {
    if (!e.oncePerRun) return true;
    return !this.eventHistory.some(h => h.id === e.id);
  }

  private checkChapterRange(e: RandomEvent): boolean {
    // Chapter range is checked by the caller injecting current chapter
    // This is a no-op here; chapter filtering is done via trigger context
    return true;
  }

  async executeChoice(event: RandomEvent, choiceId: string): Promise<EventResult> {
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) throw new Error(`Choice ${choiceId} not found in event ${event.id}`);

    // Pay costs
    for (const cost of choice.cost || []) {
      const paid = this.payCost(cost);
      if (!paid) throw new Error(`Cannot afford ${cost.type} cost`);
    }

    let rewards: EventReward[] = [...event.rewards];
    let nextEvent: RandomEvent | null = null;

    if (choice.outcome === 'random') {
      const success = Math.random() < (choice.successRate || 0.5);
      if (success) {
        rewards = rewards.concat(choice.successRewards || []);
      } else {
        rewards = rewards.concat(choice.failPenalty || []);
      }
    } else if (choice.outcome === 'success') {
      rewards = rewards.concat(choice.successRewards || []);
    }

    this.grantRewards(rewards);

    if (choice.setFlag) this.globalFlags.add(choice.setFlag);

    if (choice.nextEventId) {
      nextEvent = this.events.find(e => e.id === choice.nextEventId) || null;
    }

    this.eventHistory.push({ id: event.id, timestamp: Date.now(), choice: choiceId });
    this.onSaveHistory(this.eventHistory);

    return { rewards, nextEvent, flags: Array.from(this.globalFlags) };
  }

  private payCost(cost: { type: string; amount: number; itemId?: string }): boolean {
    switch (cost.type) {
      case 'gold': return this.rewardDispatcher.spendGold(cost.amount);
      case 'hp': this.rewardDispatcher.takeDamage(cost.amount); return true;
      case 'shield': return this.rewardDispatcher.spendShield(cost.amount);
      case 'item': return this.rewardDispatcher.spendItem(cost.itemId || '', cost.amount);
      default: return true;
    }
  }

  private grantRewards(rewards: EventReward[]): void {
    for (const r of rewards) {
      switch (r.type) {
        case 'gold': this.rewardDispatcher.addGold(r.amount); break;
        case 'xp': this.rewardDispatcher.addXp(r.amount); break;
        case 'shield': this.rewardDispatcher.addShield(r.amount); break;
        case 'item': this.rewardDispatcher.addItem(r.id || '', r.amount); break;
        case 'cosmetic': this.rewardDispatcher.addCosmetic(r.id || '', r.amount); break;
      }
    }
  }

  getHistory(): Array<{ id: string; timestamp: number; choice: string }> {
    return [...this.eventHistory];
  }

  getFlags(): string[] {
    return Array.from(this.globalFlags);
  }
}
```

## Verification

- `npx tsc --noEmit --pretty` — zero errors

## Commit

```
git add src/core/engine/eventEngine.ts
git commit -m "feat(p1): implement EventEngine with checkTrigger and executeChoice"
```
