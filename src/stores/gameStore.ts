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
  };
});
