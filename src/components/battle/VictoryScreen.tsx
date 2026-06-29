// ---------------------------------------------------------------------------
// VictoryScreen — animated battle victory overlay with rewards
// Also handles boss_victory random event trigger (P1)
// ---------------------------------------------------------------------------
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EventEngine } from '@/core/engine/eventEngine';
import { EVENT_POOL } from '@/core/data/events';
import type { RandomEvent } from '@/core/data/events';
import { EventModal } from '@/components/adventure/EventModal';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';

interface VictoryScreenProps {
  gold: number;
  xp: number;
  isBoss: boolean;
  onContinue: () => void;
  onStartBattle?: (chapter: number, level: number) => void;
}

export function VictoryScreen({ gold, xp, isBoss, onContinue }: VictoryScreenProps) {
  const player = usePlayerStore((s) => s.player);
  const addGold = usePlayerStore((s) => s.addGold);
  const addXpStore = usePlayerStore((s) => s.addXp);
  const takeDamage = usePlayerStore((s) => s.takeDamage);

  const globalFlags = useGameStore((s) => s.globalFlags);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const addEventToHistory = useGameStore((s) => s.addEventToHistory);

  const [pendingEvent, setPendingEvent] = useState<RandomEvent | null>(null);
  const [showEvent, setShowEvent] = useState(false);
  const eventCheckedRef = useRef(false);
  const engineRef = useRef<EventEngine | null>(null);

  // ── On mount (boss victory), check for trigger ─────────────────────────
  useEffect(() => {
    if (!isBoss || eventCheckedRef.current) return;
    eventCheckedRef.current = true;

    const engine = new EventEngine({
      events: EVENT_POOL,
      playerState: {
        level: player.level,
        hasItem: () => false, // stub — inventory not yet implemented
        hasFlag: (flag) => globalFlags.has(flag),
        gold: player.gold,
        hp: player.hp,
        shield: 0, // stub — shield field not present in PlayerState yet
      },
      rewardDispatcher: {
        addGold: (n) => addGold(n),
        addXp: (n) => addXpStore(n),
        addShield: () => { /* stub */ },
        addItem: () => { /* stub */ },
        addCosmetic: () => { /* stub */ },
        takeDamage: (n) => takeDamage(n),
        spendGold: () => true, // stub
        spendShield: () => true, // stub
        spendItem: () => true, // stub
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
    engineRef.current = engine;

    const triggered = engine.checkTrigger('boss_victory');
    if (triggered) {
      setPendingEvent(triggered);
      setShowEvent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBoss]);

  // ── Handle player choice in the event modal ────────────────────────────
  const handleChoice = useCallback(
    async (choiceId: string) => {
      if (!engineRef.current || !pendingEvent) return;
      // Check if the chosen action triggers a battle
      const choice = pendingEvent.choices.find(c => c.id === choiceId);
      if (choice?.action === 'battle' && choice.actionPayload) {
        // Execute side effects (rewards, flags) but close event and start battle
        await engineRef.current.executeChoice(pendingEvent, choiceId);
        setShowEvent(false);
        setPendingEvent(null);
        onStartBattle?.(choice.actionPayload.chapter, choice.actionPayload.level);
        return;
      }
      await engineRef.current.executeChoice(pendingEvent, choiceId);
      setShowEvent(false);
      setPendingEvent(null);
    },
    [pendingEvent, onStartBattle],
  );

  return (
    <>
      {/* Boss-victory event modal (fullscreen overlay) */}
      {showEvent && pendingEvent && (
        <EventModal
          event={pendingEvent}
          open={showEvent}
          onChoice={handleChoice}
          onClose={() => setShowEvent(false)}
        />
      )}

      {/* Normal victory display */}
      <motion.div
        className="flex flex-col items-center justify-center gap-6 px-6 py-12"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
      >
        {/* Trophy */}
        <motion.span
          className="text-7xl"
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 12 }}
        >
          🏆
        </motion.span>

        {/* Title */}
        <motion.h2
          className="text-4xl font-extrabold text-yellow-400 drop-shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          胜利!
        </motion.h2>

        {/* Rewards */}
        <motion.div
          className="flex flex-col items-center gap-3 rounded-2xl border border-yellow-700/50 bg-yellow-900/20 px-8 py-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 text-xl">
            <span>🪙</span>
            <span className="font-bold text-amber-300">+{gold}</span>
            <span className="text-gray-400">金币</span>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <span>⚡</span>
            <span className="font-bold text-purple-300">+{xp}</span>
            <span className="text-gray-400">经验</span>
          </div>
        </motion.div>

        {/* Continue button */}
        <motion.button
          onClick={onContinue}
          className="rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 px-10 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          继续冒险 →
        </motion.button>
      </motion.div>
    </>
  );
}
