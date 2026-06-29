// ---------------------------------------------------------------------------
// Random Event Type Definitions — data-driven event system
// ---------------------------------------------------------------------------

/** A single random event that can trigger at various points in the game */
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
  title: string;
  description: string;
  illustration: string;
  choices: EventChoice[];
  rewards: EventReward[];
  internalState?: Record<string, unknown>;
}

/** A choice the player can make within a random event */
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

/** A reward or penalty granted by an event choice */
export interface EventReward {
  type: 'gold' | 'xp' | 'shield' | 'item' | 'cosmetic';
  id?: string;
  amount: number;
  weight?: number;
}
