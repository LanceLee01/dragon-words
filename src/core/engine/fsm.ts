// ---------------------------------------------------------------------------
// Game Finite State Machine — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { GamePhase } from '@/core/data/types';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type FSMEvent =
  | 'START_GAME'
  | 'SELECT_CLASS'
  | 'ENTER_MAP'
  | 'START_BATTLE'
  | 'BATTLE_WIN'
  | 'BATTLE_LOSE'
  | 'RETURN_MAP'
  | 'OPEN_SHOP'
  | 'CLOSE_SHOP'
  | 'GO_HOME';

// ---------------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------------

/**
 * Transition map: current phase → event → next phase (or undefined = invalid).
 */
const TRANSITIONS: Record<GamePhase, Partial<Record<FSMEvent, GamePhase>>> = {
  menu: {
    START_GAME: 'classSelect',
  },
  classSelect: {
    SELECT_CLASS: 'adventure',
  },
  adventure: {
    START_BATTLE: 'battle',
    OPEN_SHOP: 'shop',
    GO_HOME: 'menu',
  },
  battle: {
    BATTLE_WIN: 'reward',
    BATTLE_LOSE: 'gameover',
  },
  reward: {
    RETURN_MAP: 'adventure',
    GO_HOME: 'menu',
  },
  gameover: {
    RETURN_MAP: 'adventure',
    GO_HOME: 'menu',
  },
  shop: {
    CLOSE_SHOP: 'adventure',
    GO_HOME: 'menu',
  },
};

// ---------------------------------------------------------------------------
// GameFSM
// ---------------------------------------------------------------------------

export class GameFSM {
  private _phase: GamePhase;
  private _callbacks: Map<GamePhase, Array<() => void>> = new Map();

  constructor() {
    this._phase = 'menu';
  }

  /** Current game phase */
  get phase(): GamePhase {
    return this._phase;
  }

  /**
   * Send an event to attempt a transition.
   * Returns the new phase if valid, or the current phase if the transition
   * is not permitted (invalid transitions are silently ignored).
   */
  send(event: FSMEvent): GamePhase {
    const allowed = TRANSITIONS[this._phase];
    const next = allowed?.[event];
    if (next !== undefined) {
      this._phase = next;
      this._fireCallbacks(next);
    }
    return this._phase;
  }

  /**
   * Register a callback that fires whenever the FSM enters a given phase.
   */
  onEnterPhase(phase: GamePhase, handler: () => void): void {
    const existing = this._callbacks.get(phase) ?? [];
    existing.push(handler);
    this._callbacks.set(phase, existing);
  }

  /**
   * Force-set the phase directly (bypasses transition rules).
   * Fires onEnterPhase callbacks.
   */
  forcePhase(phase: GamePhase): void {
    this._phase = phase;
    this._fireCallbacks(phase);
  }

  private _fireCallbacks(phase: GamePhase): void {
    const handlers = this._callbacks.get(phase);
    if (handlers) {
      for (const h of handlers) {
        h();
      }
    }
  }
}
