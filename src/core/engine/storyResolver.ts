// ---------------------------------------------------------------------------
// Story Resolver — ending resolution logic
// ---------------------------------------------------------------------------
import type { StoryBeat } from '../data/story';

/**
 * Resolve which ending to show based on player flags.
 * seal: default - player chose to seal the dragon
 * tame: player has 'ending_choice_tame' flag AND 'lore_dragon_1_read' flag
 */
export function resolveEnding(flags: Set<string>): 'seal' | 'tame' {
  if (flags.has('ending_choice_tame') && flags.has('lore_dragon_1_read')) {
    return 'tame';
  }
  return 'seal';
}

/**
 * Get the story beat for the final ending based on resolved ending type.
 */
export function getEndingStoryBeat(ending: 'seal' | 'tame', storyBeats: StoryBeat[]): StoryBeat | undefined {
  return storyBeats.find(b => b.id === `ending_${ending}`);
}
