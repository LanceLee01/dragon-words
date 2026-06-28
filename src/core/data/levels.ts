// ---------------------------------------------------------------------------
// Level / Chapter definitions and helper functions
// ---------------------------------------------------------------------------
import type { ChapterDef, Difficulty, WordLevel } from './types';
import { CHAPTER_MONSTERS } from './monsters';

// ---------------------------------------------------------------------------
// 15 chapters
// ---------------------------------------------------------------------------

const CHAPTER_NAMES: string[] = [
  '森林小径',
  '城堡大厅',
  '魔法学院',
  '精灵森林',
  '矮人矿坑',
  '幽暗地域',
  '龙脊山脉',
  '亡灵沼泽',
  '巨人平原',
  '终焉之塔',
  '深渊裂口',
  '天堂之门',
  '时光回廊',
  '龙之圣殿',
  '龙王之巢',
];

function buildChapters(): ChapterDef[] {
  const chapters: ChapterDef[] = [];

  for (let i = 1; i <= 15; i++) {
    const priPerCh = Math.ceil(499 / 5); // primary: 100/chapter
    const midPerCh = Math.ceil(2018 / 10); // middle: 202/chapter
    const wordCount = i <= 5 ? priPerCh : midPerCh;
    const wordLevel: WordLevel = i <= 5 ? 'primary' : 'middle';
    const monsterEntry = CHAPTER_MONSTERS[i];

    const levels = [];
    // Levels 1-4: normal monsters
    for (let lvl = 1; lvl <= 4; lvl++) {
      levels.push({
        level: lvl,
        monsterId: monsterEntry.normal,
        isBoss: false,
      });
    }
    // Level 5: boss
    levels.push({
      level: 5,
      monsterId: monsterEntry.boss,
      isBoss: true,
    });

    chapters.push({
      id: i,
      name: CHAPTER_NAMES[i - 1],
      wordCount,
      wordLevel,
      levels,
    });
  }

  return chapters;
}

export const CHAPTERS: ChapterDef[] = buildChapters();

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Determine the difficulty phase based on chapter number.
 * Chapters 1-3:  beginner
 * Chapters 4-7:  intermediate
 * Chapters 8-12: challenge
 * Chapters 13-15: ultimate
 */
export function getDifficultyPhase(chapter: number): Difficulty {
  if (chapter >= 1 && chapter <= 3) return 'beginner';
  if (chapter >= 4 && chapter <= 7) return 'intermediate';
  if (chapter >= 8 && chapter <= 12) return 'challenge';
  return 'ultimate';
}

/**
 * Get the time limit (in seconds) for answering a question.
 * Normal/boss time limits differ by phase.
 *   beginner:      12 / 14
 *   intermediate:  10 / 12
 *   challenge:      9 / 10
 *   ultimate:       8 / 9
 */
export function getTimeLimit(chapter: number, type: 'normal' | 'boss'): number {
  const phase = getDifficultyPhase(chapter);
  const limits: Record<Difficulty, { normal: number; boss: number }> = {
    beginner:     { normal: 12, boss: 14 },
    intermediate: { normal: 10, boss: 12 },
    challenge:    { normal: 9,  boss: 10 },
    ultimate:     { normal: 8,  boss: 9 },
  };
  return limits[phase][type];
}

/**
 * Get the HP range for normal monsters in a given chapter (phase-based).
 *   beginner:      30-50
 *   intermediate:  60-100
 *   challenge:     120-180
 *   ultimate:      200-300  (ch15 → 500)
 */
export function getMonsterHpRange(chapter: number): [number, number] {
  if (chapter === 15) return [500, 500];
  const phase = getDifficultyPhase(chapter);
  const ranges: Record<Difficulty, [number, number]> = {
    beginner:     [30, 50],
    intermediate: [60, 100],
    challenge:    [120, 180],
    ultimate:     [200, 300],
  };
  return ranges[phase];
}

/**
 * Get the attack range for normal monsters in a given chapter (phase-based).
 *   beginner:      5-8
 *   intermediate:  10-15
 *   challenge:     18-25
 *   ultimate:      28-40  (ch15 → 60)
 */
export function getMonsterAttackRange(chapter: number): [number, number] {
  if (chapter === 15) return [60, 60];
  const phase = getDifficultyPhase(chapter);
  const ranges: Record<Difficulty, [number, number]> = {
    beginner:     [5, 8],
    intermediate: [10, 15],
    challenge:    [18, 25],
    ultimate:     [28, 40],
  };
  return ranges[phase];
}

/**
 * Get the XP required to reach a given player level.
 * Formula: level * 100
 */
export function getXpForLevel(level: number): number {
  return level * 100;
}
