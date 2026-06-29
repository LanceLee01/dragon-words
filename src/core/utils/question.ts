// ---------------------------------------------------------------------------
// Question Engine — pure TypeScript, no React
// ---------------------------------------------------------------------------
import type { Word, Question, QuestionType, MatchPair, SpellQuestion, PosQuestion, MatchQuestion } from '@/core/data/types';
import { QUESTION_TYPE_WEIGHTS, pickQuestionType } from '@/core/data/balance';

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

/**
 * Generate 4 English-word answer options (1 correct + 3 distractors) and shuffle them.
 * Used for meaning-word (看中文选英文) questions.
 */
function generateEnglishOptions(
  allWords: Word[],
  correctEnglish: string,
  excludeWordId: number,
): string[] {
  const distractors = allWords.filter(
    (w, i) => i !== excludeWordId && w.english !== correctEnglish,
  );
  shuffle(distractors);
  const selected = distractors.slice(0, 3).map(w => w.english);
  while (selected.length < 3) {
    selected.push('???');
  }
  return shuffle([correctEnglish, ...selected]);
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

// ---------------------------------------------------------------------------
// New generators (Task 2)
// ---------------------------------------------------------------------------

/**
 * Generate a spelling question for the given word.
 *
 * The number of target letters depends on the word's difficulty:
 *   difficulty 1 → 3 letters, 2 → 4 letters, 3 → 5 letters.
 * If the word is shorter than the target length the full word is used.
 */
export function generateSpellQuestion(word: Word, timeLimit: number): SpellQuestion {
  const lenMap = { 1: 3, 2: 4, 3: 5 } as const;
  const targetLen = Math.min(lenMap[word.difficulty ?? 2], word.english.length);
  return {
    type: 'spell',
    word,
    targetLetters: word.english.slice(0, targetLen).toUpperCase().split(''),
    maxLength: targetLen,
    chineseHint: word.chinese,
    timeLimit: timeLimit + 2,
  };
}

/**
 * Generate a part-of-speech question (collocation or wordForm).
 *
 * - 60 % chance of collocation, 40 % wordForm.
 * - If `word.collocations` is empty/undefined the function returns `null`,
 *   and the caller should fall back to a `word-meaning` question.
 *
 * Collocation distractors are built from other words in the pool.
 * WordForm distractors cycle through the available POS variants.
 */
export function generatePosQuestion(
  word: Word,
  wordPool: Word[],
  timeLimit: number,
): PosQuestion | null {
  const isCollocation = Math.random() < 0.6;

  if (isCollocation) {
    if (!word.collocations || word.collocations.length === 0) return null;
    const correct = pickRandom(word.collocations);
    // Build distractors from other words' collocations
    const otherCollocations = wordPool
      .filter(w => w.id !== word.id && w.collocations)
      .flatMap(w => w.collocations!);
    shuffle(otherCollocations);
    const distractors = otherCollocations
      .filter(c => c !== correct)
      .slice(0, 3);
    // Pad if needed
    while (distractors.length < 3) distractors.push('???');
    const options = shuffle([correct, ...distractors]);
    return {
      type: 'pos',
      subtype: 'collocation',
      word,
      stem: `Choose the correct collocation for "${word.english}":`,
      options,
      correctIndex: options.indexOf(correct),
      explanation: `"${correct}" is a common collocation with "${word.english}".`,
    };
  } else {
    // WordForm question
    if (!word.posVariants) return null;
    const variants = word.posVariants as Record<string, string>;
    const entries = Object.entries(variants).filter(([, v]) => v);
    if (entries.length < 2) return null; // need at least 2 forms
    const correctEntry = pickRandom(entries);
    const [correctKey, correctValue] = correctEntry;
    const distractors = entries
      .filter(([k]) => k !== correctKey)
      .map(([, v]) => v)
      .slice(0, 3);
    while (distractors.length < 3) distractors.push('???');
    const options = shuffle([correctValue, ...distractors]);
    return {
      type: 'pos',
      subtype: 'wordForm',
      word,
      stem: `Choose the correct ${correctKey} form of "${word.english}":`,
      options,
      correctIndex: options.indexOf(correctValue),
      explanation: `"${correctValue}" is the ${correctKey} form of "${word.english}".`,
    };
  }
}

/**
 * Generate a match-the-pairs question from a random selection of 5 words
 * in the pool.
 */
export function generateMatchQuestion(wordPool: Word[], timeLimit: number): MatchQuestion {
  const selected = shuffle([...wordPool]).slice(0, 5);
  const pairs: MatchPair[] = selected.map((w, i) => ({
    id: `pair_${i}`,
    left: { type: 'text', content: w.english, wordId: w.id },
    right: { type: 'text', content: w.chinese, wordId: w.id },
    locked: false,
  }));
  return {
    type: 'match',
    pairs: shuffle(pairs),
    timeLimit: 30,
    reward: { goldBase: 10, goldMultiplier: 1.5, shieldBonus: 1 },
  };
}

// ---------------------------------------------------------------------------
// Dispatching generateQuestion
// ---------------------------------------------------------------------------

/**
 * Generate a question for the current battle round.
 *
 * 1. Pick a word (30 % chance from mistake pool if available)
 * 2. Use `pickQuestionType` to determine the question type (pass round + isBoss)
 * 3. Dispatch to the appropriate generator.
 * 4. If the generator returns null (e.g. POS data unavailable), fall back to
 *    `word-meaning`.
 *
 * @param wordPool      The pool of available words for this chapter.
 * @param usedWordIds   Set of word indices already used (from wordPool).
 * @param timeLimit     Time limit in seconds for answering.
 * @param chapter       Current chapter number (reserved for future use).
 * @param mistakeWords  Words previously answered incorrectly (optional).
 * @param isBoss        Whether this is a boss level (default false).
 * @returns A Question object, or null if the word pool is exhausted.
 */
export function generateQuestion(
  wordPool: Word[],
  usedWordIds: Set<number>,
  timeLimit: number,
  chapter: number,
  mistakeWords?: Word[],
  isBoss?: boolean,
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

  // Determine the question type via weighted roulette
  const round = usedWordIds.size;
  const boss = isBoss ?? false;

  const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, round, boss);

  // Dispatch to the appropriate generator
  switch (type) {
    case 'spell':
      return generateSpellQuestion(word, timeLimit);

    case 'pos': {
      const posQ = generatePosQuestion(word, wordPool, timeLimit);
      if (posQ !== null) return posQ;
      // Fall back to word-meaning
      const options = generateOptions(wordPool, word.chinese, wordIndex);
      return {
        type: 'word-meaning',
        word,
        options,
        correctAnswer: word.chinese,
        timeLimit,
        imagePath: word.imagePath,
      } as Question;
    }

    case 'match':
      return generateMatchQuestion(wordPool, timeLimit);

    case 'meaning-word': {
      const engOptions = generateEnglishOptions(wordPool, word.english, wordIndex);
      return {
        type: 'meaning-word',
        word,
        options: engOptions,
        correctAnswer: word.english,
        timeLimit,
        imagePath: word.imagePath,
      } as Question;
    }

    default: {
      // word-meaning, meaning-word, fill-blank, listening
      const options = generateOptions(wordPool, word.chinese, wordIndex);
      return {
        type,
        word,
        options,
        correctAnswer: word.chinese,
        timeLimit,
        imagePath: word.imagePath,
      } as Question;
    }
  }
}
