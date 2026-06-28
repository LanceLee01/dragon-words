// ---------------------------------------------------------------------------
// QuestionCard — displays a word question with 4 options in a 2x2 grid
// Supports translate types (word-meaning, meaning-word, fill-blank, listening)
// and pos type (collocation, wordForm)
// ---------------------------------------------------------------------------
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSpeech } from '@/hooks/useSpeech';
import type { Question, TranslateQuestion, PosQuestion } from '@/core/data/types';
import { addFlaggedImage } from '@/core/utils/storage';

function isSupportedQuestion(q: Question): q is TranslateQuestion | PosQuestion {
  return (
    q.type === 'word-meaning' ||
    q.type === 'meaning-word' ||
    q.type === 'fill-blank' ||
    q.type === 'listening' ||
    q.type === 'pos'
  );
}

function isPosQuestion(q: TranslateQuestion | PosQuestion): q is PosQuestion {
  return q.type === 'pos';
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (selected: string | number) => void;
  disabled: boolean;
}

export function QuestionCard({ question, onAnswer, disabled }: QuestionCardProps) {
  // Narrow to supported types — this component handles translate + pos
  if (!isSupportedQuestion(question)) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <span className="text-4xl">❓</span>
        <p className="mt-2">不支持的题目类型</p>
      </div>
    );
  }

  const isPos = isPosQuestion(question);

  const { speak, isAvailable } = useSpeech();
  const [imageError, setImageError] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleOptionClick = (option: string, idx: number) => {
    if (disabled) return;
    // For pos questions, pass the index as string; for translate, pass the option string
    onAnswer(isPos ? String(idx) : option);
  };

  const handlePlaySound = () => {
    if (!isAvailable || isPos) return;
    if (question.type === 'listening' && replayCount >= 1) return;
    speak(question.word.english);
    if (question.type === 'listening') {
      setReplayCount((c) => c + 1);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      {/* --- Word image or stem (for pos) --- */}
      {isPos ? (
        <div className="flex w-full max-w-md flex-col items-center gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            {question.subtype === 'collocation' ? '词语搭配' : '词性变形'}
          </p>
          <div className="w-full rounded-xl border border-purple-700/40 bg-purple-900/20 px-6 py-4 text-center">
            <p className="text-xl font-bold text-white">{question.stem}</p>
          </div>
          {/* Explanation shown after answering */}
          {disabled && question.explanation && (
            <motion.p
              className="mt-2 rounded-lg bg-blue-900/30 px-4 py-2 text-sm text-blue-200"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              💡 {question.explanation}
            </motion.p>
          )}
        </div>
      ) : (
        <>
          {/* --- Word image --- */}
          <div className="relative flex h-48 w-72 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            {imageError ? (
              <span className="text-5xl">📜</span>
            ) : (
              <img
                src={question.imagePath}
                alt={question.word.english}
                className="h-full w-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
            {/* Flag image button — top-right corner */}
            {!flagged ? (
              <button
                onClick={() => {
                  addFlaggedImage({
                    wordId: question.word.id,
                    english: question.word.english,
                    imagePath: question.imagePath,
                    level: question.word.level,
                    flaggedAt: Date.now(),
                  });
                  setFlagged(true);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }}
                className="absolute right-1 top-1 rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white/70 transition-colors hover:bg-black/70 hover:text-white"
                title="标记此图片不满意，后续重新生成"
              >
                🚩
              </button>
            ) : (
              <span className="absolute right-1 top-1 rounded-md bg-green-800/60 px-1.5 py-0.5 text-xs text-green-200">
                ✅ 已标记
              </span>
            )}
            {/* Confirmation toast */}
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-green-700/90 px-3 py-1 text-xs text-white shadow-lg"
              >
                已标记，后续将重新生成
              </motion.div>
            )}
          </div>

          {/* --- Question prompt --- */}
          <div className="flex flex-col items-center gap-3">
            {question.type === 'listening' ? (
              <>
                <p className="text-center text-lg text-gray-300">请选择你听到的单词意思：</p>
                <button
                  onClick={handlePlaySound}
                  disabled={!isAvailable || (question.type === 'listening' && replayCount >= 1)}
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-lg text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>🔊</span>
                  <span>{replayCount >= 1 ? '已播放' : '播放'}</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-center text-lg text-gray-300">请选择以下单词的意思：</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-white">{question.word.english}</span>
                  {isAvailable && (
                    <button
                      onClick={handlePlaySound}
                      className="rounded-lg bg-blue-700 p-2 text-lg text-white transition-colors hover:bg-blue-600"
                      title="再听一次"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* --- 2x2 option grid --- */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {question.options.map((option, idx) => (
          <motion.button
            key={`${idx}-${option}`}
            onClick={() => handleOptionClick(option, idx)}
            disabled={disabled}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
              disabled
                ? 'cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500'
                : 'border-gray-600 bg-white/5 text-white hover:border-blue-500 hover:bg-white/10 active:scale-95'
            }`}
            whileHover={disabled ? undefined : { scale: 1.03 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-blue-300">
              {optionLabels[idx]}
            </span>
            <span className="text-left leading-tight">{option}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
