// ---------------------------------------------------------------------------
// Tests for Story Resolver — ending resolution logic
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { resolveEnding, getEndingStoryBeat } from './storyResolver';
import type { StoryBeat } from '../data/story';

// ---------------------------------------------------------------------------
// resolveEnding
// ---------------------------------------------------------------------------
describe('resolveEnding', () => {
  it('returns "seal" when no flags are set', () => {
    expect(resolveEnding(new Set())).toBe('seal');
  });

  it('returns "seal" when only ending_choice_tame is set', () => {
    const flags = new Set<string>(['ending_choice_tame']);
    expect(resolveEnding(flags)).toBe('seal');
  });

  it('returns "seal" when only lore_dragon_1_read is set', () => {
    const flags = new Set<string>(['lore_dragon_1_read']);
    expect(resolveEnding(flags)).toBe('seal');
  });

  it('returns "tame" when both ending_choice_tame and lore_dragon_1_read are present', () => {
    const flags = new Set<string>(['ending_choice_tame', 'lore_dragon_1_read']);
    expect(resolveEnding(flags)).toBe('tame');
  });

  it('returns "tame" when both flags and extraneous flags are present', () => {
    const flags = new Set<string>([
      'ending_choice_tame',
      'lore_dragon_1_read',
      'some_other_flag',
      'story_ch15_boss',
    ]);
    expect(resolveEnding(flags)).toBe('tame');
  });
});

// ---------------------------------------------------------------------------
// getEndingStoryBeat
// ---------------------------------------------------------------------------
describe('getEndingStoryBeat', () => {
  const storyBeats: StoryBeat[] = [
    {
      id: 'ending_seal',
      chapter: 15,
      trigger: 'perfect_clear',
      format: 'narration',
      panels: [],
      rewards: [],
    },
    {
      id: 'ending_tame',
      chapter: 15,
      trigger: 'perfect_clear',
      format: 'narration',
      panels: [],
      rewards: [],
    },
  ];

  it('returns the correct beat for "seal" ending', () => {
    const beat = getEndingStoryBeat('seal', storyBeats);
    expect(beat).toBeDefined();
    expect(beat!.id).toBe('ending_seal');
    expect(beat!.chapter).toBe(15);
  });

  it('returns the correct beat for "tame" ending', () => {
    const beat = getEndingStoryBeat('tame', storyBeats);
    expect(beat).toBeDefined();
    expect(beat!.id).toBe('ending_tame');
    expect(beat!.chapter).toBe(15);
  });

  it('returns undefined when the ending beat is not found', () => {
    const beat = getEndingStoryBeat('seal', []);
    expect(beat).toBeUndefined();
  });

  it('returns undefined for an unknown ending type', () => {
    const beat = getEndingStoryBeat('seal', [
      { id: 'some_other_beat', chapter: 1, trigger: 'chapter_start', format: 'comic', panels: [], rewards: [] },
    ]);
    expect(beat).toBeUndefined();
  });
});
