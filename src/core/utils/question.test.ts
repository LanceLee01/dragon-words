// ---------------------------------------------------------------------------
// Tests for question engine
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import type { Word, Question } from '@/core/data/types';
import {
  getQuestionTypeForRound,
  generateOptions,
  generateQuestion,
} from './question';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWord(
  english: string,
  chinese: string,
  level: 'primary' | 'middle' = 'primary',
): Word {
  return { english, chinese, level };
}

const SAMPLE_WORDS: Word[] = [
  makeWord('apple', '苹果'),
  makeWord('book', '书'),
  makeWord('cat', '猫'),
  makeWord('dog', '狗'),
  makeWord('egg', '蛋'),
  makeWord('fish', '鱼'),
  makeWord('goat', '山羊'),
  makeWord('house', '房子'),
  makeWord('ice', '冰'),
  makeWord('juice', '果汁'),
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
  it('returns a valid Question with 4 options and timeLimit ≥ 8', () => {
    const question = generateQuestion(
      SAMPLE_WORDS,
      new Set<number>(),
      15,
      1,
    );
    expect(question).not.toBeNull();
    expect(question!.type).toMatch(/^(word-meaning|listening)$/);
    expect(question!.options).toHaveLength(4);
    expect(question!.correctAnswer).toBe(question!.word.chinese);
    expect(question!.timeLimit).toBeGreaterThanOrEqual(8);
    expect(question!.imagePath).toMatch(/^\/assets\/images\/word-images\/.+\.png$/);
  });

  it('returns null when the word pool is exhausted', () => {
    // Mark all 10 words as used
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
    // ~30% of 1000 = 300, allow 100-500 range
    expect(mistakePicks).toBeGreaterThan(50);
    expect(mistakePicks).toBeLessThan(500);
  });

  it('returns an imagePath matching the word', () => {
    const question = generateQuestion(
      [makeWord('hello', '你好')],
      new Set<number>(),
      10,
      1,
    );
    expect(question).not.toBeNull();
    expect(question!.imagePath).toBe('/assets/images/word-images/hello.png');
  });
});
