// ---------------------------------------------------------------------------
// QuestionCard — displays a word question with 4 options in a 2x2 grid
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSpeech } from '@/hooks/useSpeech';
import type { Question, TranslateQuestion } from '@/core/data/types';

function isTranslateQuestion(q: Question): q is TranslateQuestion {
  return (
    q.type === 'word-meaning' ||
    q.type === 'meaning-word' ||
    q.type === 'fill-blank' ||
    q.type === 'listening'
  );
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (selected: string) => void;
  disabled: boolean;
}

export function QuestionCard({ question, onAnswer, disabled }: QuestionCardProps) {
  // Narrow to TranslateQuestion — this component only supports translate-type questions
  if (!isTranslateQuestion(question)) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <span className="text-4xl">❓</span>
        <p className="mt-2">不支持的题目类型</p>
      </div>
    );
  }

  const { speak, isAvailable } = useSpeech();
  const [imageError, setImageError] = useState(false);
  const [replayCount, setReplayCount] = useState(0);

  const handleOptionClick = (option: string) => {
    if (disabled) return;
    onAnswer(option);
  };

  const handlePlaySound = () => {
    if (!isAvailable) return;
    if (question.type === 'listening' && replayCount >= 1) return;
    speak(question.word.english);
    if (question.type === 'listening') {
      setReplayCount((c) => c + 1);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      {/* --- Word image --- */}
      <div className="flex h-40 w-56 items-center justify-center overflow-hidden rounded-xl bg-white/10">
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

      {/* --- 2x2 option grid --- */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {question.options.map((option, idx) => (
          <motion.button
            key={`${idx}-${option}`}
            onClick={() => handleOptionClick(option)}
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
