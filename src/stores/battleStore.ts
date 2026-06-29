// ---------------------------------------------------------------------------
// Battle Store — Zustand
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { BattleState, MonsterDef, Word, Question, TranslateQuestion, SpellQuestion, PosQuestion, MatchQuestion, MatchPair, BattleLogEntry } from '@/core/data/types';
import { CHAPTERS } from '@/core/data/levels';
import { CHAPTER_MONSTERS, MONSTERS } from '@/core/data/monsters';
import { createBattle, answerQuestion, monsterTurn } from '@/core/engine/battle';
import { generateQuestion, getQuestionTypeForRound } from '@/core/utils/question';
import { getTimeLimit } from '@/core/data/levels';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { soundEngine } from '@/core/utils/sound';

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

  /** Advance to the next round (generate a new question). */
  nextRound: () => void;

  /** Execute the monster's turn (after a wrong answer). */
  finishMonsterTurn: () => void;

  /** Connect a left-right pair in a Match question. */
  matchConnect: (leftWordId: number, rightWordId: number) => void;

  /** Reset battle state to null. */
  resetBattle: () => void;

  // === P1: DDA State ===
  ddaState: {
    mistakeStreak: number;
    correctStreak: number;
    protectionLevel: number;
    challengeMode: boolean;
  };

  updateDDA: (correct: boolean) => void;
  resetDDA: () => void;
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

  return generateQuestion(wp, usedWordIds, timeLimit, ch, undefined, isBoss);
}

/**
 * Evaluate whether the given answer is correct for the given question.
 * Handles all question types through discriminated union dispatch.
 */
function evaluateAnswer(question: Question, answer: string | number): boolean {
  switch (question.type) {
    case 'spell':
      return answer === (question as SpellQuestion).targetLetters.join('');
    case 'pos':
      return Number(answer) === (question as PosQuestion).correctIndex;
    default:
      // word-meaning, meaning-word, fill-blank, listening
      return answer === (question as TranslateQuestion).correctAnswer;
  }
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
    const correct = evaluateAnswer(currentQuestion, selected);

    // Process the answer through the battle engine
    const wasLastWrong = get().lastAnswerCorrect === false;
    const nextBattle = answerQuestion(battle, player, monster, correct, wasLastWrong);

    // Monster attacks every round (both correct and wrong answers)
    const afterMonster = monsterTurn(nextBattle, monster);
    nextBattle.lastDamageTaken = afterMonster.lastDamageTaken;
    nextBattle.playerHp = afterMonster.playerHp;
    nextBattle.turn = afterMonster.turn;
    nextBattle.status = afterMonster.status;
    nextBattle.lastMonsterSkillName = afterMonster.lastMonsterSkillName;
    // Keep phase as 'result' for correct, 'monster-turn' for wrong
    // (monsterTurn sets phase to 'question', so restore it)
    if (correct) nextBattle.phase = 'result';
    else nextBattle.phase = 'monster-turn';

    // Build battle log entry
    const entry: BattleLogEntry = {
      turn: nextBattle.turn,
      wordEnglish: currentQuestion.word?.english || '',
      wordChinese: currentQuestion.word?.chinese || '',
      questionType: currentQuestion.type,
      isCorrect: correct,
      damageDealt: nextBattle.lastDamageDealt,
      damageTaken: nextBattle.lastDamageTaken,
      lastCombo: battle.combo,
      isCrit: nextBattle.lastCrit,
      monsterHpAfter: nextBattle.monsterHp,
      monsterMaxHp: nextBattle.monsterMaxHp,
      playerHpAfter: nextBattle.playerHp,
      playerMaxHp: nextBattle.playerMaxHp,
      monsterName: monster.name,
      skillName: correct ? nextBattle.lastSkillName : '',
      monsterSkillName: nextBattle.lastMonsterSkillName,
    };
    nextBattle.log = [...nextBattle.log, entry];

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
    const { battle } = get();
    if (!battle) return;

    // Monster damage was already processed in submitAnswer.
    // Just advance to next round.
    const nextBattle = { ...battle, phase: 'question' as const };

    set({ battle: nextBattle });

    // Generate next question if battle continues
    if (nextBattle.status !== 'lost') {
      const question = generateNextQuestion(get().chapter, get().usedWordIds);
      set({ currentQuestion: question, lastAnswerCorrect: null });
    }
  },

  // -----------------------------------------------------------------------
  // matchConnect
  // -----------------------------------------------------------------------

  matchConnect: (leftWordId, rightWordId) => {
    const { currentQuestion, battle, monster } = get();
    if (!currentQuestion || currentQuestion.type !== 'match' || !battle || !monster) return;

    const q = currentQuestion as MatchQuestion;
    const pairIndex = q.pairs.findIndex(p => p.left.wordId === leftWordId);
    if (pairIndex === -1) return;

    const pair = q.pairs[pairIndex];
    if (pair.locked) return; // already matched

    if (leftWordId === rightWordId) {
      // Correct connection — lock this pair
      const updatedPairs = q.pairs.map((p, i) =>
        i === pairIndex ? { ...p, locked: true } : p
      ) as MatchPair[];

      const allLocked = updatedPairs.every(p => p.locked);

      if (allLocked) {
        // --- settlement: all pairs matched ---
        const completedPairs = updatedPairs.filter(p => p.locked).length;
        const allCorrect = completedPairs === updatedPairs.length;
        const goldAmount = q.reward.goldBase * completedPairs * (allCorrect ? q.reward.goldMultiplier : 1);

        // Award gold
        usePlayerStore.getState().addGold(goldAmount);

        // Process through battle engine as a correct answer
        const player = usePlayerStore.getState().player;
        const wasLastWrong = get().lastAnswerCorrect === false;
        const nextBattle = answerQuestion(battle, player, monster, true, wasLastWrong);

        // Extra combo for each pair beyond the first (answerQuestion already adds 1)
        nextBattle.combo += (completedPairs - 1);

        // Shield bonus if all correct
        if (allCorrect) {
          nextBattle.invulnerable += q.reward.shieldBonus;
        }

        // Track used word index (same pattern as submitAnswer)
        const wordIndex = get().usedWordIds.size;

        set({
          battle: nextBattle,
          currentQuestion: { ...q, pairs: updatedPairs },
          lastAnswerCorrect: true,
          usedWordIds: new Set([...get().usedWordIds, wordIndex]),
        });

        // Play settlement sound
        soundEngine.play('coin');

        // Advance to next round
        get().nextRound();
      } else {
        // Not all locked yet — just update the pairs in place
        set({ currentQuestion: { ...q, pairs: updatedPairs } });
        soundEngine.play('combo');
      }
    } else {
      // Wrong connection — do not lock, play feedback sound
      soundEngine.play('click');
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

  // === P1: DDA State ===
  ddaState: {
    mistakeStreak: 0,
    correctStreak: 0,
    protectionLevel: 0,
    challengeMode: false,
  },

  updateDDA: (correct) => set((s) => {
    const next = { ...s.ddaState };
    if (correct) {
      next.mistakeStreak = Math.max(0, next.mistakeStreak - 2);
      next.correctStreak++;
    } else {
      next.correctStreak = Math.max(0, next.correctStreak - 5);
      next.mistakeStreak++;
    }
    return { ddaState: next };
  }),

  resetDDA: () => set({
    ddaState: { mistakeStreak: 0, correctStreak: 0, protectionLevel: 0, challengeMode: false },
  }),
}));
