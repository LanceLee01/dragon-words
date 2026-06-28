// ---------------------------------------------------------------------------
// Battle Store — Zustand
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { BattleState, MonsterDef, Word, Question } from '@/core/data/types';
import { CHAPTERS } from '@/core/data/levels';
import { CHAPTER_MONSTERS, MONSTERS } from '@/core/data/monsters';
import { createBattle, answerQuestion, useSkill, monsterTurn } from '@/core/engine/battle';
import { generateQuestion, getQuestionTypeForRound } from '@/core/utils/question';
import { getTimeLimit } from '@/core/data/levels';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BattleStore {
  battle: BattleState | null;
  monster: MonsterDef | null;
  chapter: number;
  level: number;
  usedWordIds: Set<number>;
  currentQuestion: Question | null;
  lastAnswerCorrect: boolean | null;

  /** Initialise a new battle for the given chapter + level */
  initBattle: (ch: number, lv: number) => void;

  /** Player submits an answer (the selected option string). Returns true if correct. */
  submitAnswer: (selected: string) => boolean;

  /** Player uses a skill (0 = base, 1 = advanced). */
  useSkillAction: (idx?: 0 | 1) => void;

  /** Advance to the next round (generate a new question). */
  nextRound: () => void;

  /** Execute the monster's turn (after a wrong answer). */
  finishMonsterTurn: () => void;

  /** Reset battle state to null. */
  resetBattle: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the word pool for a given chapter.
 * Uses the chapter's wordCount and wordLevel to slice from a larger pool.
 * For now, pulls from the game store's word list filtered by level.
 */
function getWordPoolForChapter(ch: number): Word[] {
  const chapterDef = CHAPTERS[ch - 1];
  if (!chapterDef) return [];

  const allWords = useGameStore.getState().words;
  return allWords.filter((w) => w.level === chapterDef.wordLevel);
}

/**
 * Generate the next question for the current battle.
 */
function generateNextQuestion(
  ch: number,
  usedWordIds: Set<number>,
): Question | null {
  const wp = getWordPoolForChapter(ch);
  if (wp.length === 0) return null;

  const isBoss = useBattleStore.getState().battle?.isBoss ?? false;
  const timeLimit = getTimeLimit(ch, isBoss ? 'boss' : 'normal');

  return generateQuestion(wp, usedWordIds, timeLimit, ch);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,
  monster: null,
  chapter: 1,
  level: 1,
  usedWordIds: new Set<number>(),
  currentQuestion: null,
  lastAnswerCorrect: null,

  // -----------------------------------------------------------------------
  // initBattle
  // -----------------------------------------------------------------------

  initBattle: (ch, lv) => {
    const player = usePlayerStore.getState().player;

    // Look up the monster for this chapter/level
    const chMonsters = CHAPTER_MONSTERS[ch];
    if (!chMonsters) return;

    const isBossLevel = lv === 5;
    const monsterId = isBossLevel ? chMonsters.boss : chMonsters.normal;
    const monsterDef = MONSTERS[monsterId];
    if (!monsterDef) return;

    // Create the battle via the engine
    const battle = createBattle(player, monsterDef);

    // Generate first question
    const usedWordIds = new Set<number>();
    const question = generateNextQuestion(ch, usedWordIds);

    set({
      battle,
      monster: monsterDef,
      chapter: ch,
      level: lv,
      usedWordIds,
      currentQuestion: question,
      lastAnswerCorrect: null,
    });
  },

  // -----------------------------------------------------------------------
  // submitAnswer
  // -----------------------------------------------------------------------

  submitAnswer: (selected) => {
    const { battle, monster, currentQuestion } = get();
    if (!battle || !monster || !currentQuestion) return false;

    const player = usePlayerStore.getState().player;
    const correct = selected === currentQuestion.correctAnswer;

    // Process the answer through the battle engine
    const wasLastWrong = get().lastAnswerCorrect === false;
    const nextBattle = answerQuestion(battle, player, monster, correct, wasLastWrong);

    // Award gold for correct answer
    if (correct) {
      usePlayerStore.getState().addGold(10);
    }

    // Track which word was used
    const wordIndex = get().usedWordIds.size;

    set({
      battle: nextBattle,
      lastAnswerCorrect: correct,
      usedWordIds: new Set([...get().usedWordIds, wordIndex]),
    });

    return correct;
  },

  // -----------------------------------------------------------------------
  // useSkillAction
  // -----------------------------------------------------------------------

  useSkillAction: (idx = 0) => {
    const { battle, monster } = get();
    if (!battle || !monster) return;

    const player = usePlayerStore.getState().player;
    const nextBattle = useSkill(battle, player, monster, idx);

    set({ battle: nextBattle });
  },

  // -----------------------------------------------------------------------
  // nextRound
  // -----------------------------------------------------------------------

  nextRound: () => {
    const { chapter, usedWordIds, battle, monster } = get();
    if (!battle || !monster) return;

    // Generate next question
    const question = generateNextQuestion(chapter, usedWordIds);

    set({
      battle: { ...battle, phase: 'question' },
      currentQuestion: question,
      lastAnswerCorrect: null,
    });
  },

  // -----------------------------------------------------------------------
  // finishMonsterTurn
  // -----------------------------------------------------------------------

  finishMonsterTurn: () => {
    const { battle, monster } = get();
    if (!battle || !monster) return;

    const nextBattle = monsterTurn(battle, monster);

    set({ battle: nextBattle });

    // Generate next question if battle continues
    if (nextBattle.status !== 'lost') {
      const question = generateNextQuestion(get().chapter, get().usedWordIds);
      set({ currentQuestion: question, lastAnswerCorrect: null });
    }
  },

  // -----------------------------------------------------------------------
  // resetBattle
  // -----------------------------------------------------------------------

  resetBattle: () => {
    set({
      battle: null,
      monster: null,
      chapter: 1,
      level: 1,
      usedWordIds: new Set<number>(),
      currentQuestion: null,
      lastAnswerCorrect: null,
    });
  },
}));
