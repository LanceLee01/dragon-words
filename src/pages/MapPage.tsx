// ---------------------------------------------------------------------------
// MapPage — adventure map showing all 15 chapters with level buttons
// ---------------------------------------------------------------------------
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { CHAPTERS } from '@/core/data/levels';
import type { ChapterDef } from '@/core/data/types';
import { CHAPTER_MONSTERS, MONSTERS } from '@/core/data/monsters';
import { loadProgress, type GameProgress } from '@/core/utils/storage';
import type { MonsterDef } from '@/core/data/types';
import { EventEngine } from '@/core/engine/eventEngine';
import { EVENT_POOL } from '@/core/data/events';
import type { RandomEvent } from '@/core/data/events';
import { EventModal } from '@/components/adventure/EventModal';

export default function MapPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const sendEvent = useGameStore((s) => s.sendEvent);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const addEventToHistory = useGameStore((s) => s.addEventToHistory);
  const globalFlags = useGameStore((s) => s.globalFlags);

  const [progress, setProgress] = useState<GameProgress>({
    completedLevels: [],
    completedChapters: [],
  });

  const [chapterEvent, setChapterEvent] = useState<RandomEvent | null>(null);
  const [showChapterEvent, setShowChapterEvent] = useState(false);
  const eventCheckedRef = useRef(new Set<number>());

  // Check for newly completed chapters → trigger chapter_first_clear event
  useEffect(() => {
    for (const ch of progress.completedChapters) {
      if (eventCheckedRef.current.has(ch)) continue;
      eventCheckedRef.current.add(ch);

      // Only trigger if the chapter has levels with star rating >= 3
      // (simplified: just trigger once per chapter completion)
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
          addGold: (n) => {},
          addXp: (n) => {},
          addShield: () => {},
          addItem: () => {},
          addCosmetic: () => {},
          takeDamage: () => {},
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

      const triggered = engine.checkTrigger('chapter_first_clear');
      if (triggered) {
        setChapterEvent(triggered);
        setShowChapterEvent(true);
      }
    }
  }, [progress.completedChapters]);

  const handleChapterChoice = useCallback(async (choiceId: string) => {
    if (!chapterEvent) return;
    const engine = new EventEngine({
      events: EVENT_POOL,
      playerState: { level: player.level, hasItem: () => false, hasFlag: (flag) => globalFlags.has(flag), gold: player.gold, hp: player.hp, shield: 0 },
      rewardDispatcher: { addGold: () => {}, addXp: () => {}, addShield: () => {}, addItem: () => {}, addCosmetic: () => {}, takeDamage: () => {}, spendGold: () => true, spendShield: () => true, spendItem: () => true },
      globalFlags,
      eventHistory,
      onSaveHistory: (history) => { if (history.length > 0) { const last = history[history.length - 1]; addEventToHistory({ id: last.id, choice: last.choice }); } },
    });
    await engine.executeChoice(chapterEvent, choiceId);
    setShowChapterEvent(false);
    setChapterEvent(null);
  }, [chapterEvent, player, globalFlags, eventHistory, addEventToHistory]);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const levelKey = (ch: number, lv: number) => `${ch}-${lv}`;

  // Filter chapters by player's chosen word level  
  const filteredChapters = CHAPTERS.filter((ch) => ch.wordLevel === player.wordLevel);

  /** A chapter is unlocked if it's the first visible chapter or the previous chapter is completed. */
  const isChapterUnlocked = (ch: number) =>
    ch === 1 || progress.completedChapters.includes(ch - 1);

  /** A level is unlocked if the chapter is unlocked and (it's lv 1 or the previous level is completed). */
  const isLevelUnlocked = (ch: number, lv: number) => {
    if (!isChapterUnlocked(ch)) return false;
    if (lv === 1) return true;
    return progress.completedLevels.includes(levelKey(ch, lv - 1));
  };

  const isLevelCompleted = (ch: number, lv: number) =>
    progress.completedLevels.includes(levelKey(ch, lv));

  const handleLevelClick = (ch: number, lv: number) => {
    if (!isLevelUnlocked(ch, lv)) return;
    sendEvent('START_BATTLE');
    navigate(`/battle/${ch}/${lv}`);
  };

  const handleHome = () => navigate('/');
  const handleShop = () => navigate('/shop');

  /** Get the boss monster for a given chapter. */
  const getBoss = (ch: number): MonsterDef | undefined => {
    const mapping = CHAPTER_MONSTERS[ch];
    if (!mapping) return undefined;
    return MONSTERS[mapping.boss];
  };

  return (
    <>
      {showChapterEvent && chapterEvent && (
        <EventModal
          event={chapterEvent}
          open={showChapterEvent}
          onChoice={handleChapterChoice}
          onClose={() => setShowChapterEvent(false)}
        />
      )}
      <div
      className="min-h-screen px-4 py-6"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      {/* --- Header --- */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <button
          onClick={handleHome}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
        >
          <span className="text-lg">←</span> Home
        </button>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-300">
            Lv.<strong className="text-amber-400">{player.level}</strong>
          </span>
          <span className="text-gray-300">
            🪙 <strong className="text-amber-400">{player.gold}</strong>
          </span>
        </div>

        <button
          onClick={handleShop}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
        >
          🏪 Shop
        </button>
      </div>

      {/* --- Title --- */}
      <motion.h1
        className="mb-8 text-center text-2xl font-bold tracking-widest text-white sm:text-3xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        冒险地图
      </motion.h1>

      {/* --- Chapter list --- */}
      <div className="mx-auto max-w-3xl space-y-6">
        {filteredChapters.map((chapter, ci) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            boss={getBoss(chapter.id)}
            unlocked={isChapterUnlocked(chapter.id)}
            completedLevels={progress.completedLevels}
            isLevelUnlocked={(lv) => isLevelUnlocked(chapter.id, lv)}
            isLevelCompleted={(lv) => isLevelCompleted(chapter.id, lv)}
            onLevelClick={(lv) => handleLevelClick(chapter.id, lv)}
            index={ci}
          />
        ))}
      </div>
    </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Chapter card
// ---------------------------------------------------------------------------

function ChapterCard({
  chapter,
  boss,
  unlocked,
  completedLevels,
  isLevelUnlocked,
  isLevelCompleted,
  onLevelClick,
  index,
}: {
  chapter: ChapterDef;
  boss: MonsterDef | undefined;
  unlocked: boolean;
  completedLevels: string[];
  isLevelUnlocked: (lv: number) => boolean;
  isLevelCompleted: (lv: number) => boolean;
  onLevelClick: (lv: number) => void;
  index: number;
}) {
  const levelKey = (lv: number) => `${chapter.id}-${lv}`;

  return (
    <motion.div
      className={`rounded-xl border p-5 ${
        unlocked
          ? 'border-gray-700 bg-white/5'
          : 'border-gray-800 bg-white/[0.02] opacity-50'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
    >
      {/* Chapter header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {unlocked ? (
            `第${chapter.id}章 · ${chapter.name}`
          ) : (
            <>
              <span className="mr-2">🔒</span>
              第{chapter.id}章 · ????
            </>
          )}
        </h2>
        {unlocked && (
          <span className="text-xs text-gray-500">{chapter.wordCount} 词</span>
        )}
      </div>

      {/* Level buttons */}
      {unlocked && (
        <div className="flex flex-wrap gap-2">
          {chapter.levels.map((lvDef) => {
            const lv = lvDef.level;
            const completed = isLevelCompleted(lv);
            const unlockedLv = isLevelUnlocked(lv);
            const isBoss = lvDef.isBoss;

            return (
              <motion.button
                key={lv}
                onClick={() => onLevelClick(lv)}
                disabled={!unlockedLv}
                className={`relative flex min-w-[80px] flex-col items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  completed
                    ? 'bg-green-700 text-white'
                    : unlockedLv
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'cursor-not-allowed bg-gray-800 text-gray-600'
                }`}
                whileHover={unlockedLv ? { scale: 1.08 } : undefined}
                whileTap={unlockedLv ? { scale: 0.95 } : undefined}
              >
                {isBoss ? (
                  <>
                    <span className="text-base">👑 Boss</span>
                    {boss && (
                      <span className="mt-0.5 text-[10px] text-amber-300">
                        {boss.name}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span>Level {lv}</span>
                    {completed && (
                      <span className="mt-0.5 text-[10px] text-green-300">✓</span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
