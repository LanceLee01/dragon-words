// ---------------------------------------------------------------------------
// AnswerLog — left panel: scrolling answer history
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

export function AnswerLog() {
  const log = useBattleStore((s) => s.battle?.log ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  if (log.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        暂无记录
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        📝 答题记录
      </h3>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {log.map((entry, i) => (
          <div
            key={i}
            className={`rounded px-2 py-1.5 text-xs ${
              entry.isCorrect
                ? 'border-l-4 border-green-500 bg-green-900/10'
                : 'border-l-4 border-red-500 bg-red-900/10'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">#{entry.turn}</span>
              <span className="font-medium text-white">{entry.wordEnglish}</span>
              <span className="text-gray-400">{entry.wordChinese}</span>
            </div>
            <div className="text-gray-400">
              {entry.isCorrect ? '✅ 正确' : '❌ 错误'}
              <span className="ml-2 text-gray-500">{entry.questionType}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
