// ---------------------------------------------------------------------------
// App — root component with routing and store initialisation
// ---------------------------------------------------------------------------
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';

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

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Loading…</p>
      </div>
    );
  }

  return (
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
  );
}
