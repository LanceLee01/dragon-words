// ---------------------------------------------------------------------------
// App — root component with routing and store initialisation
// ---------------------------------------------------------------------------
import { useEffect, useRef, useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { EventEngine } from '@/core/engine/eventEngine';
import { EVENT_POOL } from '@/core/data/events';
import { EventModal } from '@/components/adventure/EventModal';
import type { RandomEvent } from '@/core/data/events';

// @ts-ignore — page modules created in later tasks
import HomePage from '@/pages/HomePage';
// @ts-ignore — page modules created in later tasks
import SelectClassPage from '@/pages/SelectClassPage';
// @ts-ignore — page modules created in later tasks
import MapPage from '@/pages/MapPage';
// @ts-ignore — page modules created in later tasks
import BattlePage from '@/pages/BattlePage';
// @ts-ignore — page modules created in later tasks
import ShopPage from '@/pages/ShopPage';

export default function App() {
  const initPlayer = usePlayerStore((s) => s.init);
  const loaded = usePlayerStore((s) => s.loaded);
  const initWords = useGameStore((s) => s.initWords);

  useEffect(() => {
    initPlayer();
    initWords();
  }, [initPlayer, initWords]);

  const eventHistory = useGameStore((s) => s.eventHistory);
  const addEventToHistory = useGameStore((s) => s.addEventToHistory);
  const globalFlags = useGameStore((s) => s.globalFlags);
  const checkDailyLogin = useGameStore((s) => s.checkDailyLogin);
  const player = usePlayerStore((s) => s.player);
  const addGold = usePlayerStore((s) => s.addGold);
  const addXp = usePlayerStore((s) => s.addXp);
  const takeDamage = usePlayerStore((s) => s.takeDamage);

  const [loginEvent, setLoginEvent] = useState<RandomEvent | null>(null);
  const [showLoginEvent, setShowLoginEvent] = useState(false);
  const loginCheckedRef = useRef(false);

  // Daily login event trigger (runs once after player loads)
  useEffect(() => {
    if (!loaded || loginCheckedRef.current) return;
    loginCheckedRef.current = true;

    const loginResult = checkDailyLogin();
    if (loginResult === 'already_checked') return;

    // Determine trigger point based on streak
    const loginStreak = useGameStore.getState().loginStreak;
    let triggerPoint = 'daily_login' as const;
    if (loginStreak >= 3) {
      triggerPoint = 'login_streak' as const;
    }

    const engine = new EventEngine({
      events: EVENT_POOL,
      playerState: {
        level: player.level,
        hasItem: () => false,
        hasFlag: (flag) => globalFlags.has(flag),
        gold: player.gold,
        hp: player.hp,
        shield: 0,
      },
      rewardDispatcher: {
        addGold: (n) => addGold(n),
        addXp: (n) => addXp(n),
        addShield: () => {},
        addItem: () => {},
        addCosmetic: () => {},
        takeDamage: (n) => takeDamage(n),
        spendGold: () => true,
        spendShield: () => true,
        spendItem: () => true,
      },
      globalFlags,
      eventHistory,
      onSaveHistory: (history) => {
        if (history.length > 0) {
          const last = history[history.length - 1];
          addEventToHistory({ id: last.id, choice: last.choice });
        }
      },
    });

    const triggered = engine.checkTrigger(triggerPoint);
    if (triggered) {
      setLoginEvent(triggered);
      setShowLoginEvent(true);
    }
  }, [loaded]);

  const handleLoginChoice = useCallback(async (choiceId: string) => {
    if (!loginEvent) return;
    const engine = new EventEngine({
      events: EVENT_POOL,
      playerState: { level: player.level, hasItem: () => false, hasFlag: (flag) => globalFlags.has(flag), gold: player.gold, hp: player.hp, shield: 0 },
      rewardDispatcher: { addGold: (n) => addGold(n), addXp: (n) => addXp(n), addShield: () => {}, addItem: () => {}, addCosmetic: () => {}, takeDamage: (n) => takeDamage(n), spendGold: () => true, spendShield: () => true, spendItem: () => true },
      globalFlags,
      eventHistory,
      onSaveHistory: (history) => { if (history.length > 0) { const last = history[history.length - 1]; addEventToHistory({ id: last.id, choice: last.choice }); } },
    });
    await engine.executeChoice(loginEvent, choiceId);
    setShowLoginEvent(false);
    setLoginEvent(null);
  }, [loginEvent, player, globalFlags, eventHistory, addGold, addXp, addEventToHistory, takeDamage]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Loading…</p>
      </div>
    );
  }

  return (
    <>
      {showLoginEvent && loginEvent && (
        <EventModal
          event={loginEvent}
          open={showLoginEvent}
          onChoice={handleLoginChoice}
          onClose={() => setShowLoginEvent(false)}
        />
      )}
      <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white game-active">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/select-class" element={<SelectClassPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/battle/:chapter/:level" element={<BattlePage />} />
          <Route path="/shop" element={<ShopPage />} />
        </Routes>
      </div>
    </BrowserRouter>
    </>
  );
}
