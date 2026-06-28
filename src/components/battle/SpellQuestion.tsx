// ---------------------------------------------------------------------------
// SpellQuestion — virtual keyboard spelling component
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SpellQuestion as SpellQuestionType } from '@/core/data/types';

interface SpellQuestionProps {
  question: SpellQuestionType;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

/** QWERTY layout rows for the virtual keyboard (10-9-7) */
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function SpellQuestion({ question, onAnswer, disabled }: SpellQuestionProps) {
  const { targetLetters, maxLength, chineseHint, word } = question;

  const [inputLetters, setInputLetters] = useState<string[]>([]);

  // Count how many times each letter has been placed (to disable buttons when max reached)
  const letterCount: Record<string, number> = {};
  for (const c of inputLetters) {
    const u = c.toUpperCase();
    letterCount[u] = (letterCount[u] || 0) + 1;
  }
  const targetCount: Record<string, number> = {};
  for (const c of targetLetters) {
    const u = c.toUpperCase();
    targetCount[u] = (targetCount[u] || 0) + 1;
  }

  // Determine which letter slots are "active" (the one the player is about to fill)
  const activeIndex = inputLetters.length;

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const addLetter = useCallback(
    (letter: string) => {
      if (disabled) return;
      setInputLetters((prev) => {
        if (prev.length >= maxLength) return prev;
        const next = [...prev, letter.toUpperCase()];
        // Auto-submit when the word is complete
        if (next.length === maxLength) {
          // Use setTimeout to allow state to settle before calling onAnswer
          setTimeout(() => onAnswer(next.join('')), 0);
        }
        return next;
      });
    },
    [disabled, maxLength, onAnswer],
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setInputLetters((prev) => prev.slice(0, -1));
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (disabled || inputLetters.length === 0) return;
    onAnswer(inputLetters.join(''));
  }, [disabled, inputLetters, onAnswer]);

  // -----------------------------------------------------------------------
  // Physical keyboard support
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is inside an input element
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE' || key === 'DELETE') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'ENTER') {
        e.preventDefault();
        handleSubmit();
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        addLetter(key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, addLetter, handleBackspace, handleSubmit]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      {/* --- Word hint --- */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-lg font-semibold text-gray-300">
          ✍️ 拼写单词
        </p>
        <p className="rounded-lg bg-blue-900/40 px-4 py-1.5 text-base text-blue-200">
          {chineseHint}
        </p>
      </div>

      {/* --- Letter slots --- */}
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: maxLength }, (_, i) => {
          const filled = inputLetters[i];
          const isActive = i === activeIndex;
          return (
            <div
              key={`slot-${i}`}
              className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-xl font-bold uppercase transition-all ${
                filled
                  ? 'border-green-500 bg-green-900/30 text-green-300'
                  : isActive
                    ? 'border-blue-400 bg-blue-900/30 text-blue-200'
                    : 'border-gray-600 bg-gray-800/50 text-gray-500'
              }`}
            >
              {filled ?? '_'}
            </div>
          );
        })}
      </div>

      {/* --- Input display --- */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>已输入:</span>
        <span className="font-mono tracking-wider text-gray-300">
          {inputLetters.length === 0
            ? '—'
            : inputLetters.join(' ')}
        </span>
      </div>

      {/* --- Virtual keyboard --- */}
      <div className="flex flex-col items-center gap-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-1">
            {/* Left shift for QWERTY stagger */}
            {rowIdx === 1 && <div className="w-[18px]" />}
            {rowIdx === 2 && <div className="w-[36px]" />}
            {row.map((letter) => {
              const placed = letterCount[letter] || 0;
              const needed = targetCount[letter] || 0;
              const isMaxed = placed >= needed;
              const isDisabled = disabled || (needed > 0 && isMaxed);
              return (
                <motion.button
                  key={letter}
                  onClick={() => addLetter(letter)}
                  disabled={isDisabled}
                  className={`flex h-10 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    isDisabled
                      ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                      : 'bg-gray-600 text-white hover:bg-blue-600 active:bg-blue-500'
                  }`}
                  whileHover={isDisabled ? undefined : { scale: 1.1 }}
                  whileTap={isDisabled ? undefined : { scale: 0.9 }}
                >
                  {letter}
                </motion.button>
              );
            })}
            {/* Backspace on row 0, Submit on row 2 */}
            {rowIdx === 0 && (
              <motion.button
                onClick={handleBackspace}
                disabled={disabled || inputLetters.length === 0}
                className={`flex h-10 w-[52px] items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  disabled || inputLetters.length === 0
                    ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                    : 'bg-orange-700 text-white hover:bg-orange-600 active:bg-orange-500'
                }`}
                whileHover={disabled || inputLetters.length === 0 ? undefined : { scale: 1.05 }}
                whileTap={disabled || inputLetters.length === 0 ? undefined : { scale: 0.95 }}
                title="退格"
              >
                ←
              </motion.button>
            )}
            {rowIdx === KEYBOARD_ROWS.length - 1 && (
              <motion.button
                onClick={handleSubmit}
                disabled={disabled || inputLetters.length === 0}
                className={`flex h-10 w-[52px] items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  disabled || inputLetters.length === 0
                    ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                    : 'bg-green-700 text-white hover:bg-green-600 active:bg-green-500'
                }`}
                whileHover={disabled || inputLetters.length === 0 ? undefined : { scale: 1.05 }}
                whileTap={disabled || inputLetters.length === 0 ? undefined : { scale: 0.95 }}
                title="提交"
              >
                ✓
              </motion.button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
