// ---------------------------------------------------------------------------
// Question Engine — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { Word, Question, QuestionType } from '@/core/data/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fisher-Yates shuffle (in-place, returns same array).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random element from an array.
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine the question type for a given round number.
 * Returns 'word-meaning' ~60% of the time, 'listening' ~40%.
 * Uses a seeded approach: (round * 2654435761) % 100 < 60
 */
export function getQuestionTypeForRound(round: number): QuestionType {
  return (round * 2654435761) % 100 < 60 ? 'word-meaning' : 'listening';
}

/**
 * Generate 4 answer options (1 correct + 3 distractors) and shuffle them.
 *
 * @param allWords       Full word pool to draw distractors from.
 * @param correctChinese The correct Chinese translation.
 * @param excludeWordId  Index of the correct word in allWords (excluded from distractors).
 * @returns A shuffled array of 4 strings.
 */
export function generateOptions(
  allWords: Word[],
  correctChinese: string,
  excludeWordId: number,
): string[] {
  // Build distractor pool: exclude the correct word + any word with
  // the same Chinese translation (duplicates).
  const distractors = allWords.filter(
    (w, i) => i !== excludeWordId && w.chinese !== correctChinese,
  );

  // Randomly select up to 3
  shuffle(distractors);
  const selected = distractors.slice(0, 3).map(w => w.chinese);

  // Pad with '???' if fewer than 3 distractors
  while (selected.length < 3) {
    selected.push('???');
  }

  // Combine correct answer + 3 distractors, shuffle, return
  return shuffle([correctChinese, ...selected]);
}

/**
 * Generate a question for the current battle round.
 *
 * @param wordPool      The pool of available words for this chapter.
 * @param usedWordIds   Set of word indices already used (from wordPool).
 * @param timeLimit     Time limit in seconds for answering.
 * @param chapter       Current chapter number (reserved for future use).
 * @param mistakeWords  Words previously answered incorrectly (optional).
 * @returns A Question object, or null if the word pool is exhausted.
 */
export function generateQuestion(
  wordPool: Word[],
  usedWordIds: Set<number>,
  timeLimit: number,
  chapter: number,
  mistakeWords?: Word[],
): Question | null {
  // Determine which word to use
  let word: Word;
  let wordIndex: number;

  const useMistake =
    mistakeWords !== undefined &&
    mistakeWords.length > 0 &&
    Math.random() < 0.3;

  if (useMistake) {
    // Pick a random word from mistakeWords
    word = pickRandom(mistakeWords);
    wordIndex = -1; // not applicable
  } else {
    // Find an unused word from wordPool
    const available = wordPool
      .map((w, i) => ({ word: w, index: i }))
      .filter(({ index }) => !usedWordIds.has(index));

    if (available.length === 0) return null;

    const picked = pickRandom(available);
    word = picked.word;
    wordIndex = picked.index;
  }

  // Determine the question type
  const type = getQuestionTypeForRound(usedWordIds.size);

  // Generate options
  const options = generateOptions(wordPool, word.chinese, wordIndex);

  // Build the question
  return {
    type,
    word,
    options,
    correctAnswer: word.chinese,
    timeLimit,
    imagePath: `/assets/images/word-images/${word.english}.png`,
  };
}
