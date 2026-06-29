// ---------------------------------------------------------------------------
// Question-type weight configuration & weighted roulette picker
// ---------------------------------------------------------------------------
import type { QuestionType } from './types';

/** Probability weights for each question type (must sum to 1.0) */
export const QUESTION_TYPE_WEIGHTS: Record<QuestionType, number> = {
  'word-meaning': 0.139,
  'meaning-word': 0.404,
  'fill-blank':   0.076,
  'listening':    0.254,
  'spell':        0.000,
  'pos':          0.127,
  'match':        0.000,
};

/**
 * Pick a question type using a deterministic pseudo-random value based on
 * the round number.  Uses the multiplicative LCG hash
 * `(round * 2654435761) % 1000 / 1000` for reproducibility.
 *
 * spell and match have weight 0 and are no longer generated.
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
