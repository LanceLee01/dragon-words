// ---------------------------------------------------------------------------
// QuestionRenderer — routes to the correct question component based on type
// ---------------------------------------------------------------------------
import type { Question } from '@/core/data/types';
import { QuestionCard } from './QuestionCard';
import { SpellQuestion } from './SpellQuestion';
import { MatchQuestion } from './MatchQuestion';

interface Props {
  question: Question;
  onAnswer: (answer: string | number) => void;
  onMatchConnect?: (leftWordId: number, rightWordId: number) => void;
  disabled: boolean;
}

export function QuestionRenderer({ question, onAnswer, onMatchConnect, disabled }: Props) {
  switch (question.type) {
    case 'spell':
      return <SpellQuestion question={question} onAnswer={onAnswer} disabled={disabled} />;
    case 'match':
      return <MatchQuestion question={question} onMatchConnect={onMatchConnect} disabled={disabled} />;
    default:
      // 'pos' and other translate-types go through QuestionCard
      return <QuestionCard question={question} onAnswer={onAnswer} disabled={disabled} />;
  }
}
