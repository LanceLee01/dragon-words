// ---------------------------------------------------------------------------
// Question-type weight configuration & weighted roulette picker
// ---------------------------------------------------------------------------
import type { QuestionType } from './types';

/** Probability weights for each question type (must sum to 1.0) */
export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.104,
  'meaning-word': 0.303,
  'fill-blank':   0.057,
  'listening':    0.190,
  'spell':        0.001,
  'pos':          0.095,
  'match':        0.250,
};

/**
 * Pick a question type using a deterministic pseudo-random value based on
 * the round number.  Uses the multiplicative LCG hash
 * `(round * 2654435761) % 1000 / 1000` for reproducibility.
 *
 * All question types are available on boss levels (match is no longer excluded).
 */
export function pickQuestionType(
  weights: Record<string, number>,
  round: number,
  isBoss: boolean,
): QuestionType {
  const available = Object.entries(weights);
  const rand = ((round * 2654435761) % 1000) / 1000;
  let cumulative = 0;
  for (const [type, weight] of available) {
    cumulative += weight;
    if (rand < cumulative) return type as QuestionType;
  }
  return 'word-meaning';
}
