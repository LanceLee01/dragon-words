// ---------------------------------------------------------------------------
// MatchQuestion — dual-pane click-to-connect pairing
// Left column: English words, right column: Chinese definitions (shuffled)
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MatchQuestion as MatchQuestionType } from '@/core/data/types';

interface MatchQuestionProps {
  question: MatchQuestionType;
  onMatchConnect?: (leftWordId: number, rightWordId: number) => void;
  disabled: boolean;
}

/** Fisher-Yates shuffle (returns a new array) */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchQuestion({ question, onMatchConnect, disabled }: MatchQuestionProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);
  const [shakingRightId, setShakingRightId] = useState<number | null>(null);

  // Shuffle the right-column order once per question instance.
  // We key off the stable pair identity (id + left wordId) so that lock
  // updates don't cause a reshuffle, but a genuinely new question does.
  const [shuffledOrder, setShuffledOrder] = useState<number[]>(() =>
    shuffleArray(Array.from({ length: question.pairs.length }, (_, i) => i)),
  );

  useEffect(() => {
    setShuffledOrder(
      shuffleArray(Array.from({ length: question.pairs.length }, (_, i) => i)),
    );
    setSelectedLeftId(null);
    setShakingRightId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.pairs.map(p => `${p.id}-${p.left.wordId}`).join('|')]);

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------

  const lockedCount = question.pairs.filter(p => p.locked).length;
  const totalPairs = question.pairs.length;

  const isLeftLocked = (wordId: number) =>
    question.pairs.some(p => p.left.wordId === wordId && p.locked);

  const isRightLocked = (wordId: number) =>
    question.pairs.some(p => p.right.wordId === wordId && p.locked);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleLeftClick = (wordId: number) => {
    if (disabled || isLeftLocked(wordId)) return;
    setSelectedLeftId(prev => (prev === wordId ? null : wordId));
  };

  const handleRightClick = (wordId: number) => {
    if (disabled || isRightLocked(wordId) || selectedLeftId === null) return;
    if (isLeftLocked(selectedLeftId)) {
      setSelectedLeftId(null);
      return;
    }

    // Correct match: both sides share the same wordId
    if (selectedLeftId === wordId) {
      onMatchConnect?.(selectedLeftId, wordId);
      setSelectedLeftId(null);
    } else {
      // Wrong match — show shake animation, still call onMatchConnect
      setShakingRightId(wordId);
      onMatchConnect?.(selectedLeftId, wordId);
      setTimeout(() => setShakingRightId(null), 500);
      setSelectedLeftId(null);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-4">
      {/* ---- Header ---- */}
      <div className="flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-bold text-white">极速配对</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>
            进度:{' '}
            <span className="font-semibold text-yellow-400">{lockedCount}</span>
            /{totalPairs}
          </span>
          <span className="font-mono">⏱️ {question.timeLimit}s</span>
        </div>
      </div>

      {/* ---- Main grid: left = English, right = Chinese (shuffled) ---- */}
      <div className="grid w-full max-w-lg grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          {question.pairs.map(pair => {
            const locked = pair.locked;
            const selected = selectedLeftId === pair.left.wordId;
            return (
              <motion.button
                key={`left-${pair.left.wordId}`}
                onClick={() => handleLeftClick(pair.left.wordId)}
                disabled={disabled || locked}
                className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-lg font-semibold transition-all ${
                  locked
                    ? 'cursor-not-allowed border-green-500 bg-green-900/20 text-green-300'
                    : selected
                      ? 'border-blue-500 bg-blue-900/20 text-white shadow-lg shadow-blue-500/20'
                      : 'border-gray-600 bg-white/5 text-white hover:border-blue-400 hover:bg-white/10'
                } ${disabled && !locked ? 'opacity-50' : ''}`}
                whileHover={!disabled && !locked ? { scale: 1.03 } : undefined}
                whileTap={!disabled && !locked ? { scale: 0.97 } : undefined}
              >
                <span>{pair.left.content}</span>
                {locked && <span className="text-green-400">✅</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Right column (shuffled order) */}
        <div className="flex flex-col gap-3">
          {shuffledOrder.map(idx => {
            const right = question.pairs[idx].right;
            const locked = isRightLocked(right.wordId);
            const isShaking = shakingRightId === right.wordId;
            return (
              <motion.button
                key={`right-${right.wordId}`}
                onClick={() => handleRightClick(right.wordId)}
                disabled={disabled || locked}
                animate={isShaking ? { x: [0, -5, 5, -5, 5, 0] } : undefined}
                transition={isShaking ? { duration: 0.4 } : undefined}
                className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-all ${
                  locked
                    ? 'cursor-not-allowed border-green-500 bg-green-900/20 text-green-300'
                    : isShaking
                      ? 'border-red-500 bg-red-900/20 text-white'
                      : 'border-gray-600 bg-white/5 text-white hover:border-blue-400 hover:bg-white/10'
                } ${disabled && !locked ? 'opacity-50' : ''}`}
                whileHover={!disabled && !locked ? { scale: 1.03 } : undefined}
                whileTap={!disabled && !locked ? { scale: 0.97 } : undefined}
              >
                <span>{right.content}</span>
                {locked && <span className="text-green-400">✅</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ---- Footer: reward info ---- */}
      <div className="flex w-full max-w-lg items-center justify-center gap-6 text-sm text-gray-400">
        <span>🪙 基础 {question.reward.goldBase}/对</span>
        <span>✨ 全对 ×{question.reward.goldMultiplier}</span>
      </div>
    </div>
  );
}
