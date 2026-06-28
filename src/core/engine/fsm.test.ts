// ---------------------------------------------------------------------------
// Tests for GameFSM — state machine for game phase transitions
// ---------------------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest';
import { GameFSM, type FSMEvent } from './fsm';

describe('GameFSM', () => {
  it('starts at menu (home)', () => {
    const fsm = new GameFSM();
    expect(fsm.phase).toBe('menu');
  });

  it('full chain: menu → classSelect → adventure → battle → reward → adventure', () => {
    const fsm = new GameFSM();
    expect(fsm.send('START_GAME')).toBe('classSelect');
    expect(fsm.send('SELECT_CLASS')).toBe('adventure');
    expect(fsm.send('START_BATTLE')).toBe('battle');
    expect(fsm.send('BATTLE_WIN')).toBe('reward');
    expect(fsm.send('RETURN_MAP')).toBe('adventure');
  });

  it('full chain: battle → gameover → adventure (RETURN_MAP)', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');  // → classSelect
    fsm.send('SELECT_CLASS'); // → adventure
    fsm.send('START_BATTLE'); // → battle
    expect(fsm.send('BATTLE_LOSE')).toBe('gameover');
    expect(fsm.send('RETURN_MAP')).toBe('adventure');
  });

  it('invalid transition silently returns current phase', () => {
    const fsm = new GameFSM();
    // menu cannot receive SELECT_CLASS directly
    expect(fsm.send('SELECT_CLASS')).toBe('menu');
    // After START_GAME we should be at classSelect
    fsm.send('START_GAME');
    // classSelect cannot receive START_BATTLE
    expect(fsm.send('START_BATTLE')).toBe('classSelect');
  });

  it('onEnterPhase callback triggers when phase changes', () => {
    const fsm = new GameFSM();
    const handler = vi.fn();
    fsm.onEnterPhase('classSelect', handler);

    // Send event that transitions to classSelect
    fsm.send('START_GAME');
    expect(handler).toHaveBeenCalledTimes(1);

    // Send an invalid event — handler should NOT fire again
    fsm.send('START_GAME');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('forcePhase directly sets the phase and triggers callbacks', () => {
    const fsm = new GameFSM();
    const handler = vi.fn();
    fsm.onEnterPhase('shop', handler);
    fsm.forcePhase('shop');
    expect(fsm.phase).toBe('shop');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('GO_HOME from adventure returns to menu', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');  // → classSelect
    fsm.send('SELECT_CLASS'); // → adventure
    expect(fsm.send('GO_HOME')).toBe('menu');
  });

  it('GO_HOME from reward returns to menu', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');   // → classSelect
    fsm.send('SELECT_CLASS'); // → adventure
    fsm.send('START_BATTLE'); // → battle
    fsm.send('BATTLE_WIN');   // → reward
    expect(fsm.send('GO_HOME')).toBe('menu');
  });

  it('GO_HOME from gameover returns to menu', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');    // → classSelect
    fsm.send('SELECT_CLASS');  // → adventure
    fsm.send('START_BATTLE');  // → battle
    fsm.send('BATTLE_LOSE');   // → gameover
    expect(fsm.send('GO_HOME')).toBe('menu');
  });

  it('shop transitions: adventure → OPEN_SHOP → shop → CLOSE_SHOP → adventure', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');   // → classSelect
    fsm.send('SELECT_CLASS'); // → adventure
    expect(fsm.send('OPEN_SHOP')).toBe('shop');
    expect(fsm.send('CLOSE_SHOP')).toBe('adventure');
  });

  it('GO_HOME from shop returns to menu', () => {
    const fsm = new GameFSM();
    fsm.send('START_GAME');   // → classSelect
    fsm.send('SELECT_CLASS'); // → adventure
    fsm.send('OPEN_SHOP');    // → shop
    expect(fsm.send('GO_HOME')).toBe('menu');
  });
});
