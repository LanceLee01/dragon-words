// ---------------------------------------------------------------------------
// Tests for localStorage persistence layer
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach } from 'vitest';
import type { PlayerState } from '@/core/data/types';
import {
  savePlayer,
  loadPlayer,
  saveProgress,
  loadProgress,
  saveSettings,
  loadSettings,
  saveWordStats,
  loadWordStats,
} from './storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

const DEFAULT_PLAYER = (): PlayerState => ({
  classId: 'warrior',
  advancedClassId: null,
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  baseAttack: 5,
  attack: 5,
  defense: 0,
  equipment: [],
  equippedWeaponId: null,
  currentChapter: 1,
  currentLevel: 1,
  gold: 0,
});

// ---------------------------------------------------------------------------
// Player save/load
// ---------------------------------------------------------------------------

describe('savePlayer / loadPlayer', () => {
  it('returns default player when nothing saved', () => {
    const result = loadPlayer();
    expect(result).toEqual(DEFAULT_PLAYER());
  });

  it('roundtrips a player state', () => {
    const player: PlayerState = {
      classId: 'mage',
      advancedClassId: 'archmage',
      level: 5,
      xp: 300,
      hp: 80,
      maxHp: 120,
      baseAttack: 8,
      attack: 15,
      defense: 3,
      equipment: [],
      equippedWeaponId: null,
      currentChapter: 3,
      currentLevel: 2,
      gold: 250,
    };

    savePlayer(player);
    const loaded = loadPlayer();
    expect(loaded).toEqual(player);
  });

  it('preserves modified fields across save/load', () => {
    const original = DEFAULT_PLAYER();
    savePlayer(original);

    // Modify and re-save
    const modified = { ...original, level: 10, gold: 999, hp: 50 };
    savePlayer(modified);

    const loaded = loadPlayer();
    expect(loaded.level).toBe(10);
    expect(loaded.gold).toBe(999);
    expect(loaded.hp).toBe(50);
    // Unchanged fields remain
    expect(loaded.classId).toBe('warrior');
    expect(loaded.maxHp).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Progress save/load
// ---------------------------------------------------------------------------

describe('saveProgress / loadProgress', () => {
  it('returns default progress when nothing saved', () => {
    const p = loadProgress();
    expect(p.completedLevels).toEqual([]);
    expect(p.completedChapters).toEqual([]);
  });

  it('roundtrips progress data', () => {
    const progress = {
      completedLevels: ['1-1', '1-2', '1-3'],
      completedChapters: [1],
    };
    saveProgress(progress);
    expect(loadProgress()).toEqual(progress);
  });
});

// ---------------------------------------------------------------------------
// Settings save/load
// ---------------------------------------------------------------------------

describe('saveSettings / loadSettings', () => {
  it('returns default settings when nothing saved', () => {
    const s = loadSettings();
    expect(s.volume).toBe(0.7);
    expect(s.speechRate).toBe(0.8);
  });

  it('roundtrips settings data', () => {
    const settings = { volume: 0.5, speechRate: 1.0 };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });
});

// ---------------------------------------------------------------------------
// Word stats save/load
// ---------------------------------------------------------------------------

describe('saveWordStats / loadWordStats', () => {
  it('returns empty record when nothing saved', () => {
    expect(loadWordStats()).toEqual({});
  });

  it('roundtrips word stats data', () => {
    const stats = {
      1: { correct: 5, wrong: 2 },
      2: { correct: 10, wrong: 1 },
    };
    saveWordStats(stats);
    expect(loadWordStats()).toEqual(stats);
  });
});
