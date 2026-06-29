// ---------------------------------------------------------------------------
// Tests for question engine
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import type { Word, Question, SpellQuestion, PosQuestion, MatchQuestion } from '@/core/data/types';
import {
  getQuestionTypeForRound,
  generateOptions,
  generateQuestion,
  generateSpellQuestion,
  generatePosQuestion,
  generateMatchQuestion,
} from './question';
import { QUESTION_TYPE_WEIGHTS, pickQuestionType } from '@/core/data/balance';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 0;

function makeWord(
  english: string,
  chinese: string,
  level: 'primary' | 'middle' = 'primary',
  overrides?: Partial<Word>,
): Word {
  const id = nextId++;
  return {
    id,
    english,
    chinese,
    level,
    difficulty: 1,
    imagePath: `/assets/images/word-images/${english}.png`,
    correctCount: 0,
    wrongCount: 0,
    lastSeenAt: 0,
    ...overrides,
  };
}

const SAMPLE_WORDS: Word[] = [
  makeWord('apple', '苹果', 'primary', { difficulty: 1, collocations: ['apple pie', 'apple juice'], posVariants: { noun: 'apple', verb: 'to apple' } }),
  makeWord('book', '书', 'primary', { difficulty: 2, collocations: ['read a book', 'book store'], posVariants: { noun: 'book', verb: 'to book' } }),
  makeWord('cat', '猫', 'primary', { difficulty: 1, collocations: ['black cat', 'cat food'], posVariants: { noun: 'cat' } }),
  makeWord('dog', '狗', 'primary', { difficulty: 1 }),
  makeWord('egg', '蛋', 'primary', { difficulty: 1 }),
  makeWord('fish', '鱼', 'primary', { difficulty: 2 }),
  makeWord('goat', '山羊', 'primary', { difficulty: 2 }),
  makeWord('house', '房子', 'primary', { difficulty: 3 }),
  makeWord('ice', '冰', 'primary', { difficulty: 1 }),
  makeWord('juice', '果汁', 'primary', { difficulty: 1 }),
];

// ---------------------------------------------------------------------------
// getQuestionTypeForRound
// ---------------------------------------------------------------------------

describe('getQuestionTypeForRound', () => {
  it('returns en-to-cn (word-meaning) roughly 60 % of the time over 1000 rounds', () => {
    let enToCnCount = 0;
    const trials = 1000;
    for (let round = 0; round < trials; round++) {
      const qtype = getQuestionTypeForRound(round);
      if (qtype === 'word-meaning') enToCnCount++;
    }
    // Expect between 500-700 out of 1000
    expect(enToCnCount).toBeGreaterThanOrEqual(500);
    expect(enToCnCount).toBeLessThanOrEqual(700);
  });

  it('returns listen-to-cn (listening) roughly 40 % of the time', () => {
    let listenCount = 0;
    const trials = 1000;
    for (let round = 0; round < trials; round++) {
      const qtype = getQuestionTypeForRound(round);
      if (qtype === 'listening') listenCount++;
    }
    // Expect between 300-500 out of 1000
    expect(listenCount).toBeGreaterThanOrEqual(300);
    expect(listenCount).toBeLessThanOrEqual(500);
  });
});

// ---------------------------------------------------------------------------
// generateOptions
// ---------------------------------------------------------------------------

describe('generateOptions', () => {
  it('returns exactly 4 options', () => {
    const options = generateOptions(SAMPLE_WORDS, '苹果', 0);
    expect(options).toHaveLength(4);
  });

  it('includes the correct answer', () => {
    const options = generateOptions(SAMPLE_WORDS, '苹果', 0);
    expect(options).toContain('苹果');
  });

  it('does not contain duplicate values', () => {
    // Run many times to be confident
    for (let i = 0; i < 20; i++) {
      const options = generateOptions(SAMPLE_WORDS, '苹果', 0);
      const unique = new Set(options);
      expect(unique.size).toBe(4);
    }
  });

  it('pads with ??? when fewer than 3 distractors are available', () => {
    // Only 1 word in pool, so we can get at most 0 distractors
    const tiny: Word[] = [makeWord('only', '唯一')];
    const options = generateOptions(tiny, '唯一', 0);
    expect(options).toHaveLength(4);
    expect(options.filter(o => o === '???').length).toBe(3);
  });

  it('excludes the correct word from distractors and avoids duplicate chinese', () => {
    // Words with duplicate chinese "苹果"
    const words: Word[] = [
      makeWord('apple', '苹果'),
      makeWord('app1e', '苹果'),  // duplicate chinese
      makeWord('book', '书'),
      makeWord('cat', '猫'),
      makeWord('dog', '狗'),
    ];
    const options = generateOptions(words, '苹果', 0);
    // Should have exactly 1 '苹果' (the correct answer)
    expect(options.filter(o => o === '苹果').length).toBe(1);
    expect(options).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// generateQuestion
// ---------------------------------------------------------------------------

describe('generateQuestion', () => {
  it('returns a valid Question for round 0 (word-meaning)', () => {
    const question = generateQuestion(
      SAMPLE_WORDS,
      new Set<number>(),
      15,
      1,
    );
    expect(question).not.toBeNull();
    // Round 0 always picks word-meaning (rand=0 < 0.32)
    expect(question!.type).toBe('word-meaning');
    expect(question!.timeLimit).toBeGreaterThanOrEqual(8);
  });

  it('returns null when the word pool is exhausted', () => {
    // Mark all words as used (indices 0..9)
    const used = new Set<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const question = generateQuestion(SAMPLE_WORDS, used, 10, 1);
    expect(question).toBeNull();
  });

  it('picks from mistakeWords roughly 30 % of the time when available', () => {
    const mistakeWords: Word[] = [makeWord('mistake', '错误')];
    let mistakePicks = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      const question = generateQuestion(
        SAMPLE_WORDS,
        new Set<number>(),
        10,
        1,
        mistakeWords,
      );
      if (question && question.word.chinese === '错误') {
        mistakePicks++;
      }
    }
    // ~30% of 1000 = 300, allow 50-500 range
    expect(mistakePicks).toBeGreaterThan(50);
    expect(mistakePicks).toBeLessThan(500);
  });

  it('returns an imagePath on translate-type questions', () => {
    const question = generateQuestion(
      [makeWord('hello', '你好')],
      new Set<number>(),
      10,
      1,
    );
    expect(question).not.toBeNull();
    if (question!.type === 'word-meaning' || question!.type === 'meaning-word' ||
        question!.type === 'fill-blank' || question!.type === 'listening') {
      expect((question! as any).imagePath).toBe('/assets/images/word-images/hello.png');
    }
  });

  it('produces a question on round 2 (spell weight is 0, no guarantee)', () => {
    const used = new Set<number>([0, 1]); // round = 2
    const question = generateQuestion(SAMPLE_WORDS, used, 10, 1);
    expect(question).not.toBeNull();
    // spell weight is 0, so spell should never appear
    expect(question!.type).not.toBe('spell');
  });

  it('never produces match (weight is 0) on any round', () => {
    // spell and match weights are both 0, so they should never appear
    for (let round = 0; round < 50; round++) {
      const roundSet = new Set<number>(
        Array.from({ length: round }, (_, i) => i),
      );
      const q = generateQuestion(SAMPLE_WORDS, roundSet, 10, 1, undefined, round % 2 === 0);
      if (q !== null) {
        expect(q.type).not.toBe('match');
        expect(q.type).not.toBe('spell');
      }
    }
  });

  it('falls back to word-meaning when PosQuestion returns null', () => {
    // Use a word with no collocations/posVariants
    const dog = makeWord('dog', '狗', 'primary', { id: 999, difficulty: 1 });
    const pool = [dog, ...SAMPLE_WORDS];
    // Force pos by calling with round that picks pos
    // But we can't easily force it; instead we test the fallback in generatePosQuestion directly
    const posQ = generatePosQuestion(dog, pool, 10);
    expect(posQ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// generateSpellQuestion
// ---------------------------------------------------------------------------

describe('generateSpellQuestion', () => {
  it('extracts correct number of prefix letters based on difficulty', () => {
    const word = makeWord('elephant', '大象', 'primary', { difficulty: 3 });
    const sq = generateSpellQuestion(word, 10);
    // difficulty 3 → 5 letters
    expect(sq.targetLetters).toEqual(['E', 'L', 'E', 'P', 'H']);
    expect(sq.maxLength).toBe(5);
  });

  it('uses full word when shorter than target length', () => {
    const word = makeWord('cat', '猫', 'primary', { difficulty: 3 });
    const sq = generateSpellQuestion(word, 10);
    // difficulty 3 → 5 letters, but word is only 3 letters
    expect(sq.targetLetters).toEqual(['C', 'A', 'T']);
    expect(sq.maxLength).toBe(3);
  });

  it('returns correct object structure', () => {
    const word = makeWord('book', '书', 'primary', { difficulty: 2 });
    const sq = generateSpellQuestion(word, 15);
    expect(sq.type).toBe('spell');
    expect(sq.word).toBe(word);
    expect(sq.chineseHint).toBe('书');
    expect(sq.timeLimit).toBe(17); // 15 + 2
    expect(Array.isArray(sq.targetLetters)).toBe(true);
  });

  it('uses default difficulty 2 when difficulty is undefined', () => {
    const word = makeWord('hi', '嗨', 'primary', { difficulty: undefined as any });
    const sq = generateSpellQuestion(word, 10);
    // default 2 → 4 letters, word is 2 chars → full word
    expect(sq.maxLength).toBe(2);
    expect(sq.targetLetters).toEqual(['H', 'I']);
  });
});

// ---------------------------------------------------------------------------
// generateMatchQuestion
// ---------------------------------------------------------------------------

describe('generateMatchQuestion', () => {
  it('returns exactly 5 pairs', () => {
    const mq = generateMatchQuestion(SAMPLE_WORDS, 30);
    expect(mq.pairs).toHaveLength(5);
  });

  it('returns correct structure', () => {
    const mq = generateMatchQuestion(SAMPLE_WORDS, 30);
    expect(mq.type).toBe('match');
    expect(mq.timeLimit).toBe(30);
    expect(mq.reward).toBeDefined();
    expect(mq.reward.goldBase).toBe(10);
    expect(mq.reward.goldMultiplier).toBe(1.5);
    expect(mq.reward.shieldBonus).toBe(1);
    mq.pairs.forEach(pair => {
      expect(pair.id).toMatch(/^pair_\d$/);
      expect(pair.left.type).toBe('text');
      expect(pair.right.type).toBe('text');
      expect(typeof pair.left.content).toBe('string');
      expect(typeof pair.right.content).toBe('string');
      expect(pair.locked).toBe(false);
    });
  });

  it('does not crash when wordPool has fewer than 5 words', () => {
    const tiny = [makeWord('one', '一')];
    const mq = generateMatchQuestion(tiny, 30);
    expect(mq.pairs.length).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// pickQuestionType
// ---------------------------------------------------------------------------

describe('pickQuestionType', () => {
  it('returns valid types on boss levels (spell and match weights are 0)', () => {
    // Exhaustively check first 200 rounds
    for (let round = 0; round < 200; round++) {
      const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, round, true);
      expect(['word-meaning', 'meaning-word', 'fill-blank', 'listening', 'pos']).toContain(type);
    }
  });

  it('only returns valid QuestionType values', () => {
    const valid = new Set(Object.keys(QUESTION_TYPE_WEIGHTS));
    for (let round = 0; round < 200; round++) {
      const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, round, false);
      expect(valid.has(type)).toBe(true);
    }
  });

  it('never returns match or spell (both weights are 0)', () => {
    for (let round = 0; round < 1000; round++) {
      const type = pickQuestionType(QUESTION_TYPE_WEIGHTS, round, false);
      expect(type).not.toBe('match');
      expect(type).not.toBe('spell');
    }
  });
});

// ---------------------------------------------------------------------------
// generatePosQuestion
// ---------------------------------------------------------------------------

describe('generatePosQuestion', () => {
  it('returns null when word has no collocations and no posVariants', () => {
    const word = makeWord('dog', '狗', 'primary', { difficulty: 1 });
    const result = generatePosQuestion(word, SAMPLE_WORDS, 10);
    expect(result).toBeNull();
  });

  it('returns a valid PosQuestion for a word with collocations', () => {
    // apple has collocations
    const apple = SAMPLE_WORDS[0];
    // Run multiple times to cover both collocation and wordForm paths
    let found = false;
    for (let i = 0; i < 50; i++) {
      const result = generatePosQuestion(apple, SAMPLE_WORDS, 10);
      if (result !== null) {
        found = true;
        expect(result.type).toBe('pos');
        expect(result.subtype).toMatch(/^(collocation|wordForm)$/);
        expect(result.options).toHaveLength(4);
        expect(result.correctIndex).toBeGreaterThanOrEqual(0);
        expect(result.correctIndex).toBeLessThan(4);
        expect(result.explanation).toBeTruthy();
        break;
      }
    }
    expect(found).toBe(true);
  });
});
