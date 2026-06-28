// ---------------------------------------------------------------------------
// MatchQuestion — stub placeholder (will be implemented in Task 5)
// ---------------------------------------------------------------------------
import type { MatchQuestion as MatchQuestionType } from '@/core/data/types';

interface MatchQuestionProps {
  question: MatchQuestionType;
  onMatchConnect?: (leftWordId: number, rightWordId: number) => void;
  disabled: boolean;
}

export function MatchQuestion(_props: MatchQuestionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <span className="text-4xl">🔗</span>
      <p className="mt-2">配对题（开发中）</p>
    </div>
  );
}
