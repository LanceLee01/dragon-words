// ---------------------------------------------------------------------------
// Game Store — Zustand
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { GamePhase, Word } from '@/core/data/types';
import { WORDS } from '@/core/data/words';
import { GameFSM, type FSMEvent } from '@/core/engine/fsm';

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
    globalFlags: new Set<string>(),
    storyProgress: {
      unlockedBeats: new Set<string>(),
      galleryEntries: new Set<string>(),
    },

    addEventToHistory: (entry) => set((s) => ({
      eventHistory: [...s.eventHistory, { ...entry, timestamp: Date.now() }],
    })),

    setFlag: (flag) => set((s) => ({
      globalFlags: new Set(s.globalFlags).add(flag),
    })),

    hasFlag: (flag) => get().globalFlags.has(flag),

    unlockStoryBeat: (beatId) => set((s) => ({
      storyProgress: {
        ...s.storyProgress,
        unlockedBeats: new Set(s.storyProgress.unlockedBeats).add(beatId),
      },
    })),

    unlockGalleryEntry: (entryId) => set((s) => ({
      storyProgress: {
        ...s.storyProgress,
        galleryEntries: new Set(s.storyProgress.galleryEntries).add(entryId),
      },
    })),
  };
});
