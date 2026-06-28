// ---------------------------------------------------------------------------
// Core Type Definitions & Static Data — pure TypeScript, no React
// ---------------------------------------------------------------------------

/** Top-level game phase enum */
export type GamePhase =
  | 'menu'
  | 'adventure'
  | 'battle'
  | 'reward'
  | 'gameover'
  | 'classSelect'
  | 'shop';

/** Kinds of questions the player can be asked */
export type QuestionType =
  | 'word-meaning'   // see English → pick Chinese
  | 'meaning-word'   // see Chinese → pick English
  | 'fill-blank'     // complete the English word
  | 'listening'      // hear word → pick meaning
  | 'spell'          // spell the word
  | 'pos'            // part of speech / collocation
  | 'match';         // match pairs

/** Base class identifiers */
export type ClassId =
  | 'warrior'
  | 'mage'
  | 'ranger'
  | 'paladin'
  | 'rogue'
  | 'druid';

/** Advanced class identifiers */
export type AdvancedClassId =
  | 'dragon-knight'
  | 'archmage'
  | 'elf-lord'
  | 'light-lord'
  | 'shadow-master'
  | 'nature-spirit';

/** Difficulty / phase of the game */
export type Difficulty = 'beginner' | 'intermediate' | 'challenge' | 'ultimate';

/** Which word bank a level draws from */
export type WordLevel = 'primary' | 'middle';

// ---------------------------------------------------------------------------
// Domain models
// ---------------------------------------------------------------------------

/** A single vocabulary word */
export interface Word {
  id: number;
  english: string;
  chinese: string;
  level: WordLevel;
  difficulty: 1 | 2 | 3;
  imagePath: string;
  correctCount: number;
  wrongCount: number;
  lastSeenAt: number;
  collocations?: string[];
  posVariants?: {
    noun?: string;
    verb?: string;
    adj?: string;
    adv?: string;
  };
}

/** A passive ability effect descriptor */
export interface PassiveEffect {
  type: string;   // e.g. 'attackPerk', 'comboStart', 'critAfterWrong', 'damageReduction', 'critBonus', 'regen', 'atkPlusDmgReduce', 'comboX2FreeSkill', 'critX3', 'dmgReduceRegen', 'critKillHeal', 'regenImmune'
  value: number;  // magnitude (percentage or flat)
  extra?: string; // optional extra description / sub-value
}

/** A skill definition */
export interface SkillDef {
  name: string;
  description: string;
  chargeNeeded: number;
  /** Multi-hit count for multi-hit skills (e.g. ranger's 连射 = 3) */
  hits?: number;
  /** Whether the skill can stun */
  stun?: boolean;
  /** Stun duration in turns */
  stunDuration?: number;
  /** Whether the skill can heal */
  heal?: boolean;
  /** Heal percentage (0-1) */
  healPercent?: number;
  /** Whether the skill can freeze */
  freeze?: boolean;
  /** Freeze duration in turns */
  freezeDuration?: number;
  /** Whether the skill provides a shield */
  shield?: boolean;
  /** Shield duration in turns */
  shieldDuration?: number;
  /** Whether the skill grants dodge */
  dodge?: boolean;
  /** Whether the skill marks target */
  mark?: boolean;
  /** Whether the skill can resurrect */
  resurrect?: boolean;
  /** Whether the skill deals damage over multiple turns */
  dot?: boolean;
  /** Damage over time duration */
  dotDuration?: number;
  /** Attack power multiplier */
  multiplier?: number;
}

/** Base class definition */
export interface ClassDef {
  id: ClassId;
  name: string;
  baseAttack: number;
  passive: PassiveEffect;
  skill: SkillDef;
  advancedTo: AdvancedClassId;
}

/** Advanced class definition */
export interface AdvancedClassDef {
  id: AdvancedClassId;
  name: string;
  baseAttackBonus: number;
  passive: PassiveEffect;
  skill: SkillDef;
}

/** Boss-specific skill */
export interface BossSkillDef {
  name: string;
  description: string;
  /** Damage multiplier (optional) */
  multiplier?: number;
  /** Whether it's an AoE attack */
  aoe?: boolean;
  /** Whether it can stun */
  stun?: boolean;
  /** Whether it can heal the boss */
  heal?: boolean;
  /** Whether it enrages the boss */
  enrage?: boolean;
  /** Whether it summons minions */
  summon?: boolean;
  /** Whether it shields the boss */
  shield?: boolean;
  /** Whether it poisons the player */
  poison?: boolean;
}

/** Definition for a monster (normal or boss) */
export interface MonsterDef {
  id: string;
  name: string;
  hp: number;
  attack: number;
  isBoss: boolean;
  bossSkill?: BossSkillDef;
}

/** A single level inside a chapter */
export interface ChapterLevel {
  level: number;       // 1-5 (5 = boss)
  monsterId: string;
  isBoss: boolean;
}

/** Chapter / level-set definition */
export interface ChapterDef {
  id: number;          // 1-15
  name: string;
  wordCount: number;
  wordLevel: WordLevel;
  levels: ChapterLevel[];
}

/** Equipment item */
export interface Equipment {
  id: string;
  name: string;
  tier: number;        // 1-3
  cost: number;
  classId: ClassId;
  attack: number;
  defense: number;
}

// ---------------------------------------------------------------------------
// Runtime state interfaces (consumed by stores and battle engine)
// ---------------------------------------------------------------------------

/** Persistent player state */
export interface PlayerState {
  classId: ClassId;
  advancedClassId: AdvancedClassId | null;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  baseAttack: number;
  attack: number;
  defense: number;
  equipment: Equipment[];
  equippedWeaponId: string | null;
  currentChapter: number;
  currentLevel: number;
  gold: number;
}

/** Phase within an active battle */
export type BattlePhase = 'question' | 'result' | 'monster-turn' | 'victory' | 'defeat';

/** Snapshot of an active battle (runtime state for the battle engine) */
export interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  monsterId: string;
  monsterHp: number;
  monsterMaxHp: number;
  turn: number;
  charge: number;
  combo: number;
  phase: BattlePhase;
  stunTimer: number;
  invulnerable: number;
  isBoss: boolean;
  status: 'ongoing' | 'won' | 'lost';
  /** Status effects on player */
  playerEffects: string[];
  /** Status effects on monster */
  monsterEffects: string[];
  /** Damage dealt to monster in last action (for UI floating number) */
  lastDamageDealt: number;
  /** Damage taken by player in last monster action (for UI floating number) */
  lastDamageTaken: number;
  /** Whether the last attack was a critical hit */
  lastCrit: boolean;
  /** Battle log entries accumulated during the fight */
  log: BattleLogEntry[];
}

/** A single entry in the battle log */
export interface BattleLogEntry {
  turn: number;
  wordEnglish: string;
  wordChinese: string;
  questionType: string;
  isCorrect: boolean;
  damageDealt: number;
  damageTaken: number;
  lastCombo: number;
  isCrit: boolean;
  monsterHpAfter: number;
  monsterMaxHp: number;
  playerHpAfter: number;
  playerMaxHp: number;
  monsterName: string;
}

/** Base question fields shared by all question types */
export interface BaseQuestion {
  type: QuestionType;
  timeLimit: number;
}

/** Translate-type question (word-meaning, meaning-word, listening, fill-blank) */
export interface TranslateQuestion extends BaseQuestion {
  type: 'word-meaning' | 'meaning-word' | 'listening' | 'fill-blank';
  word: Word;
  options: string[];
  correctAnswer: string;
  imagePath: string;
}

/** Spelling question */
export interface SpellQuestion extends BaseQuestion {
  type: 'spell';
  word: Word;
  targetLetters: string[];
  maxLength: number;
  chineseHint: string;
  audioPath?: string;
}

/** Part-of-speech question (collocation or wordForm) */
export interface PosQuestion extends BaseQuestion {
  type: 'pos';
  subtype: 'collocation' | 'wordForm';
  word: Word;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** A single match pair for the match question type */
export interface MatchPair {
  id: string;
  left: { type: 'text'; content: string; wordId: number };
  right: { type: 'text' | 'image'; content: string; wordId: number };
  locked: boolean;
}

/** Match question */
export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  pairs: MatchPair[];
  reward: { goldBase: number; goldMultiplier: number; shieldBonus: number };
}

/** A question presented to the player during battle (discriminated union) */
export type Question =
  | TranslateQuestion
  | SpellQuestion
  | PosQuestion
  | MatchQuestion;
