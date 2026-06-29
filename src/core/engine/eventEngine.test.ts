// @vitest-environment node
// ---------------------------------------------------------------------------
// EventEngine — comprehensive unit tests
// ---------------------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest';
import { EventEngine } from './eventEngine';
import { EVENT_POOL } from '../data/events';
import type { RandomEvent } from '../data/events';
import type { TriggerPoint } from '../data/types';

function makeEvent(overrides: Partial<RandomEvent> = {}): RandomEvent {
  return {
    id: 'test_event',
    weight: 100,
    category: 'merchant',
    triggerPoints: ['boss_victory'],
    title: 'Test Event',
    description: 'A test event',
    illustration: 'test.png',
    choices: [{ id: 'accept', text: 'Accept', outcome: 'success', successRewards: [{ type: 'gold', amount: 50 }] }],
    rewards: [],
    ...overrides,
  };
}

function makePlayerState() {
  return { level: 5, hasItem: () => false, hasFlag: () => false, gold: 100, hp: 50, shield: 1 };
}

function makeRewardDispatcher() {
  let gold = 0, xp = 0;
  return {
    addGold: (n: number) => { gold += n; },
    addXp: (n: number) => { xp += n; },
    addShield: () => {},
    addItem: () => {},
    addCosmetic: () => {},
    takeDamage: () => {},
    spendGold: () => true,
    spendShield: () => true,
    spendItem: () => true,
    getGold: () => gold,
    getXp: () => xp,
  };
}

function createEngine(events: RandomEvent[], extra?: any) {
  const d = extra?.dispatcher || makeRewardDispatcher();
  return {
    engine: new EventEngine({
      events,
      playerState: makePlayerState(),
      rewardDispatcher: d,
      globalFlags: extra?.flags || new Set<string>(),
      eventHistory: extra?.history || [],
      onSaveHistory: extra?.onSave || (() => {}),
    }),
    dispatcher: d,
  };
}

const VALID_TP: TriggerPoint[] = [
  'boss_victory', 'daily_login', 'login_streak', 'chapter_first_clear', 'achievement', 'game_start',
];

describe('EVENT_POOL data integrity', () => {
  it('every event has valid triggerPoints', () => {
    for (const event of EVENT_POOL) {
      for (const tp of event.triggerPoints || []) {
        expect(VALID_TP).toContain(tp);
      }
    }
  });

  it('every event has at least 1 choice', () => {
    for (const event of EVENT_POOL) {
      expect(event.choices.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('choice IDs are unique within each event', () => {
    for (const event of EVENT_POOL) {
      const ids = event.choices.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every event has positive weight', () => {
    for (const event of EVENT_POOL) {
      expect(event.weight).toBeGreaterThan(0);
    }
  });

  it('every event has valid category', () => {
    const cats = ['merchant', 'puzzle', 'elite', 'chest', 'lore'];
    for (const event of EVENT_POOL) {
      expect(cats).toContain(event.category);
    }
  });
});

describe('checkTrigger', () => {
  it('returns null when no events match', () => {
    const { engine } = createEngine([makeEvent({ triggerPoints: ['daily_login'] })]);
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('returns event when match found', () => {
    const { engine } = createEngine([makeEvent()]);
    expect(engine.checkTrigger('boss_victory')).not.toBeNull();
  });

  it('returns null when all have zero weight', () => {
    const { engine } = createEngine([makeEvent({ weight: 0 })]);
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('respects cooldown', () => {
    const { engine } = createEngine([makeEvent({ cooldownDays: 1 })], {
      history: [{ id: 'test_event', timestamp: Date.now(), choice: 'accept' }],
    });
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('allows after cooldown expired', () => {
    const { engine } = createEngine([makeEvent({ cooldownDays: 1 })], {
      history: [{ id: 'test_event', timestamp: Date.now() - 2 * 86400000, choice: 'accept' }],
    });
    expect(engine.checkTrigger('boss_victory')).not.toBeNull();
  });

  it('oncePerRun blocks re-trigger', () => {
    const { engine } = createEngine([makeEvent({ oncePerRun: true })], {
      history: [{ id: 'test_event', timestamp: Date.now(), choice: 'accept' }],
    });
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('minLevel blocks when too low', () => {
    const { engine } = createEngine([makeEvent({ requirements: { minLevel: 10 } })]);
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });
});

describe('executeChoice', () => {
  it('pays cost and grants rewards', async () => {
    const d = makeRewardDispatcher();
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'buy', text: 'Buy', outcome: 'success', cost: [{ type: 'gold', amount: 30 }], successRewards: [{ type: 'xp', amount: 100 }] }],
    })], { dispatcher: d });
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'buy');
    expect(d.getXp()).toBe(100);
  });

  it('sets flag on choice', async () => {
    const flags = new Set<string>();
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'read', text: 'Read', outcome: 'success', setFlag: 'lore_read' }],
    })], { flags });
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'read');
    expect(flags.has('lore_read')).toBe(true);
  });

  it('chains nextEvent', async () => {
    const e2 = makeEvent({ id: 'next_event', triggerPoints: ['daily_login'] });
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'go', text: 'Go', outcome: 'success', nextEventId: 'next_event' }],
    }), e2]);
    const result = await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'go');
    expect(result.nextEvent?.id).toBe('next_event');
  });

  it('random success triggers rewards', async () => {
    const d = makeRewardDispatcher();
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'gamble', text: 'Gamble', outcome: 'random', successRate: 0.8, successRewards: [{ type: 'gold', amount: 200 }], failPenalty: [{ type: 'xp', amount: -50 }] }],
    })], { dispatcher: d });
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'gamble');
    expect(d.getGold()).toBe(200);
    vi.restoreAllMocks();
  });

  it('random failure applies penalty', async () => {
    const d = makeRewardDispatcher();
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'gamble', text: 'Gamble', outcome: 'random', successRate: 0.2, successRewards: [{ type: 'gold', amount: 200 }], failPenalty: [{ type: 'xp', amount: -30 }] }],
    })], { dispatcher: d });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'gamble');
    expect(d.getGold()).toBe(0);
    vi.restoreAllMocks();
  });

  it('records history', async () => {
    let saved: any[] = [];
    const { engine } = createEngine([makeEvent()], {
      onSave: (h: any) => { saved = h; },
    });
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'accept');
    expect(saved.length).toBe(1);
    expect(saved[0].choice).toBe('accept');
  });

  it('throws on unknown choice', async () => {
    const { engine } = createEngine([makeEvent()]);
    await expect(engine.executeChoice(engine.checkTrigger('boss_victory')!, 'x')).rejects.toThrow();
  });
});

describe('edge cases', () => {
  it('empty pool returns null', () => {
    const { engine } = createEngine([]);
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('no triggerPoints returns null', () => {
    const { engine } = createEngine([makeEvent({ triggerPoints: [] })]);
    expect(engine.checkTrigger('boss_victory')).toBeNull();
  });

  it('getHistory returns copy', async () => {
    const { engine } = createEngine([makeEvent()]);
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'accept');
    const h = engine.getHistory();
    h.pop();
    expect(engine.getHistory()).toHaveLength(1);
  });

  it('getFlags returns current flags', async () => {
    const flags = new Set<string>();
    const { engine } = createEngine([makeEvent({
      choices: [{ id: 'c', text: 'C', outcome: 'success', setFlag: 'f1' }],
    })], { flags });
    await engine.executeChoice(engine.checkTrigger('boss_victory')!, 'c');
    expect(engine.getFlags()).toContain('f1');
  });
});
