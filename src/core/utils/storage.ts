// ---------------------------------------------------------------------------
// localStorage Persistence Layer — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { PlayerState } from '@/core/data/types';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const KEYS = {
  PLAYER: 'dw_player',
  PROGRESS: 'dw_progress',
  SETTINGS: 'dw_settings',
  WORD_STATS: 'dw_wordstats',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently ignore storage errors (quota exceeded, incognito mode, etc.)
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PLAYER: PlayerState = {
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
  currentChapter: 1,
  currentLevel: 1,
  gold: 0,
};

const DEFAULT_PROGRESS = {
  completedLevels: [] as string[],
  completedChapters: [] as number[],
};

const DEFAULT_SETTINGS = {
  volume: 0.7,
  speechRate: 0.8,
};

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export function savePlayer(player: PlayerState): void {
  safeSetItem(KEYS.PLAYER, player);
}

export function loadPlayer(): PlayerState {
  return safeGetItem(KEYS.PLAYER, DEFAULT_PLAYER);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface GameProgress {
  completedLevels: string[];
  completedChapters: number[];
}

export function saveProgress(progress: GameProgress): void {
  safeSetItem(KEYS.PROGRESS, progress);
}

export function loadProgress(): GameProgress {
  return safeGetItem(KEYS.PROGRESS, DEFAULT_PROGRESS);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface GameSettings {
  volume: number;
  speechRate: number;
}

export function saveSettings(settings: GameSettings): void {
  safeSetItem(KEYS.SETTINGS, settings);
}

export function loadSettings(): GameSettings {
  return safeGetItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

// ---------------------------------------------------------------------------
// Word Stats
// ---------------------------------------------------------------------------

export interface WordStats {
  [wordId: number]: { correct: number; wrong: number };
}

export function saveWordStats(stats: WordStats): void {
  safeSetItem(KEYS.WORD_STATS, stats);
}

export function loadWordStats(): WordStats {
  return safeGetItem(KEYS.WORD_STATS, {});
}
