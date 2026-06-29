// ---------------------------------------------------------------------------
// Game Store — Zustand
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { GamePhase, Word } from '@/core/data/types';
import { WORDS } from '@/core/data/words';
import { GameFSM, type FSMEvent } from '@/core/engine/fsm';
import { loadGameState, saveGameState } from '@/core/utils/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameStore {
  phase: GamePhase;
  fsm: GameFSM;
  words: Word[];

  /** Set the current word pool */
  setWords: (words: Word[]) => void;

  /** Send an FSM event — updates phase reactively */
  sendEvent: (event: FSMEvent) => void;

  /** Force-set a phase (bypasses transitions) */
  setPhase: (phase: GamePhase) => void;

  /** Initialize the word pool (empty by default — caller fills) */
  initWords: () => void;

  // === P1: Random Events & Story Progress ===
  eventHistory: Array<{ id: string; timestamp: number; choice: string }>;
  globalFlags: Set<string>;
  storyProgress: {
    unlockedBeats: Set<string>;
    galleryEntries: Set<string>;
  };

  addEventToHistory: (entry: { id: string; choice: string }) => void;
  setFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  unlockStoryBeat: (beatId: string) => void;
  unlockGalleryEntry: (entryId: string) => void;

  // === P1: Login Tracking ===
  lastLoginDate: string | null;  // YYYY-MM-DD format
  loginStreak: number;

  checkDailyLogin: () => 'first_today' | 'streak_continue' | 'streak_broken' | 'already_checked';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => {
  const fsm = new GameFSM();

  // Subscribe to FSM phase changes so Zustand state stays in sync
  // We hook into every possible phase to propagate to React
  const phases: GamePhase[] = [
    'menu', 'classSelect', 'adventure', 'battle',
    'reward', 'gameover', 'shop',
  ];
  for (const p of phases) {
    fsm.onEnterPhase(p, () => {
      set({ phase: fsm.phase });
    });
  }

  /** Persist game state (flags + story progress) to localStorage */
  function persistGameState(flags: Set<string>, sp: GameStore['storyProgress']) {
    saveGameState({
      globalFlags: Array.from(flags),
      unlockedBeats: Array.from(sp.unlockedBeats),
      galleryEntries: Array.from(sp.galleryEntries),
    });
  }

  return {
    phase: fsm.phase,
    fsm,
    words: [],

    setWords: (words) => {
      set({ words });
    },

    sendEvent: (event) => {
      get().fsm.send(event);
      // The callback above already sets phase, but ensure consistency
      set({ phase: get().fsm.phase });
    },

    setPhase: (phase) => {
      get().fsm.forcePhase(phase);
      set({ phase: get().fsm.phase });
    },

    initWords: () => {
      set({ words: WORDS });
    },

    // === P1: Random Events & Story Progress ===
    eventHistory: [],
    globalFlags: new Set<string>(loadGameState().globalFlags),
    storyProgress: {
      unlockedBeats: new Set<string>(loadGameState().unlockedBeats),
      galleryEntries: new Set<string>(loadGameState().galleryEntries),
    },

    addEventToHistory: (entry) => set((s) => ({
      eventHistory: [...s.eventHistory, { ...entry, timestamp: Date.now() }],
    })),

    setFlag: (flag) => set((s) => {
      const next = new Set(s.globalFlags).add(flag);
      persistGameState(next, s.storyProgress);
      return { globalFlags: next };
    }),

    hasFlag: (flag) => get().globalFlags.has(flag),

    unlockStoryBeat: (beatId) => set((s) => {
      const next = new Set(s.storyProgress.unlockedBeats).add(beatId);
      const sp = { ...s.storyProgress, unlockedBeats: next };
      persistGameState(s.globalFlags, sp);
      return { storyProgress: sp };
    }),

    unlockGalleryEntry: (entryId) => set((s) => {
      const next = new Set(s.storyProgress.galleryEntries).add(entryId);
      const sp = { ...s.storyProgress, galleryEntries: next };
      persistGameState(s.globalFlags, sp);
      return { storyProgress: sp };
    }),

    // === P1: Login Tracking ===
    lastLoginDate: localStorage.getItem('dw_last_login'),
    loginStreak: Number(localStorage.getItem('dw_login_streak') || 0),

    checkDailyLogin: () => {
      const state = get();
      const today = new Date().toISOString().slice(0, 10);
      if (state.lastLoginDate === today) return 'already_checked';
      
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let newStreak = 1;
      let result = 'first_today';
      
      if (state.lastLoginDate === yesterday) {
        newStreak = state.loginStreak + 1;
        result = 'streak_continue';
      } else if (state.lastLoginDate !== null) {
        result = 'streak_broken';
      }
      
      localStorage.setItem('dw_last_login', today);
      localStorage.setItem('dw_login_streak', String(newStreak));
      
      set({ lastLoginDate: today, loginStreak: newStreak });
      return result as 'first_today' | 'streak_continue' | 'streak_broken' | 'already_checked';
    },
  };
});
