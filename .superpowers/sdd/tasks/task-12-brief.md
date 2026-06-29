# Task 12: Create `components/adventure/EventModal.tsx` — Event UI

**Files:**
- Create: `src/components/adventure/EventModal.tsx`

**Interfaces:**
- Consumes: `RandomEvent` from `core/data/events`, `Modal` from `components/ui/Modal`, `TypewriterText` from `components/ui/TypewriterText`
- Produces: `<EventModal event onChoice onClose />`

## Implementation

Create `src/components/adventure/EventModal.tsx`:

```tsx
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { FlyReward } from '@/components/ui/FlyReward';
import type { RandomEvent, EventChoice, EventReward } from '@/core/data/events';

interface EventModalProps {
  event: RandomEvent;
  open: boolean;
  onChoice: (choiceId: string) => void;
  onClose: () => void;
  showRewards?: EventReward[];
}

export function EventModal({ event, open, onChoice, onClose, showRewards }: EventModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleChoice = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowResult(true);
    // Briefly show the choice animation, then notify parent
    setTimeout(() => {
      onChoice(choiceId);
    }, 800);
  };

  const canAfford = (choice: EventChoice): boolean => {
    // Basic cost check — parent engine handles the real validation
    if (!choice.cost || choice.cost.length === 0) return true;
    return choice.cost.every(c => {
      if (c.type === 'gold') return true; // parent validates
      return true;
    });
  };

  return (
    <Modal open={open} onClose={onClose} variant="fullscreen">
      <div className="flex flex-col items-center gap-6">
        {/* Illustration placeholder */}
        <div className="h-48 w-full rounded-lg bg-gray-800 flex items-center justify-center text-6xl">
          {event.category === 'merchant' && '🧙'}
          {event.category === 'puzzle' && '📜'}
          {event.category === 'elite' && '👹'}
          {event.category === 'chest' && '📦'}
          {event.category === 'lore' && '📖'}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white">{event.title}</h2>

        {/* Description with typewriter */}
        <div className="max-w-lg text-center text-gray-300">
          <TypewriterText text={event.description} speed={25} />
        </div>

        {/* Choices */}
        {!showResult && (
          <div className="flex flex-col gap-3 w-full max-w-md">
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                disabled={!canAfford(choice)}
                className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-left text-white transition hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {choice.icon && <span className="text-xl">{choice.icon}</span>}
                <div className="flex-1">
                  <span>{choice.text}</span>
                  {choice.cost && choice.cost.length > 0 && (
                    <div className="mt-1 flex gap-2 text-xs text-gray-400">
                      {choice.cost.map((c, i) => (
                        <span key={i}>
                          {c.type === 'gold' && '🪙'}
                          {c.type === 'hp' && '❤️'}
                          {c.type === 'shield' && '🛡️'}
                          {c.type === 'item' && '📦'}
                          {c.amount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-500">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Reward fly-in */}
        {showRewards && showRewards.length > 0 && (
          <FlyReward
            rewards={showRewards.map(r => ({
              type: r.type,
              amount: r.amount,
              icon: r.type === 'gold' ? '🪙' : r.type === 'xp' ? '⚡' : undefined,
            }))}
            onComplete={() => {}}
          />
        )}
      </div>
    </Modal>
  );
}
```

## Verification

- `npx tsc --noEmit --pretty` — zero errors

## Commit

```
git add src/components/adventure/EventModal.tsx
git commit -m "feat(p1): add EventModal component with typewriter description and choice buttons"
```
