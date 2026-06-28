// ---------------------------------------------------------------------------
// Player Store — Zustand
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { PlayerState, ClassId, AdvancedClassId, Equipment, WordLevel } from '@/core/data/types';
import { loadPlayer, savePlayer, loadProgress, saveProgress } from '@/core/utils/storage';
import { getXpForLevel } from '@/core/data/levels';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerStore {
  player: PlayerState;
  loaded: boolean;

  /** Load player from localStorage */
  init: () => void;

  /** Select a base class (resets advanced class) */
  selectClass: (id: ClassId) => void;
  selectWordLevel: (level: WordLevel) => void;

  /** Add gold */
  addGold: (n: number) => void;

  /** Add XP, auto level-up if threshold reached */
  addXp: (n: number) => void;

  /** Reduce HP (clamped to 0) */
  takeDamage: (n: number) => void;

  /** Restore HP to maxHp */
  healToFull: () => void;

  /** Record a completed level and update chapter/level progression */
  completeLevel: (key: string, chapter: number) => void;

  /** Equip a weapon by ID */
  equipWeapon: (id: string) => void;

  /** Buy equipment (subtract gold, add to inventory, auto-equip) */
  buyEquipment: (item: Equipment) => void;

  /** Promote to an advanced class */
  promoteToAdvanced: (id: AdvancedClassId) => void;

  /** Add a word ID to the mistake list */
  addMistakeWord: (id: number) => void;

  /** Record whether the player answered a word correctly */
  recordAnswer: (id: number, correct: boolean) => void;

  /** Update the combo counter */
  updateCombo: (n: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * PlayerState fields that are persisted but not meaningful for the
 * "no class selected" default sentinel.
 */
const DEFAULT_PLAYER: PlayerState = {
  classId: 'warrior',
  advancedClassId: null,
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  baseAttack: 5,
  attack: 5,
  defense: 0,
  equipment: [],
  equippedWeaponId: null,
  currentChapter: 1,
  currentLevel: 1,
  gold: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlayerStore = create<PlayerStore>((set) => ({
  player: { ...DEFAULT_PLAYER },
  loaded: false,

  init: () => {
    const player = loadPlayer();
    set({ player, loaded: true });
  },

  selectClass: (id) => {
    set((s) => {
      const next: PlayerState = {
        ...s.player,
        classId: id,
        advancedClassId: null,
      };
      savePlayer(next);
      return { player: next };
    });
  },

  selectWordLevel: (level) => {
    set((s) => {
      const next: PlayerState = { ...s.player, wordLevel: level };
      savePlayer(next);
      return { player: next };
    });
  },

  addGold: (n) => {
    set((s) => {
      const next: PlayerState = { ...s.player, gold: s.player.gold + n };
      savePlayer(next);
      return { player: next };
    });
  },

  addXp: (n) => {
    set((s) => {
      let { xp, level } = s.player;
      xp += n;
      // Auto level-up: check threshold repeatedly
      while (xp >= getXpForLevel(level)) {
        xp -= getXpForLevel(level);
        level += 1;
      }
      const next: PlayerState = { ...s.player, xp, level };
      savePlayer(next);
      return { player: next };
    });
  },

  takeDamage: (n) => {
    set((s) => {
      const hp = Math.max(0, s.player.hp - n);
      const next: PlayerState = { ...s.player, hp };
      savePlayer(next);
      return { player: next };
    });
  },

  healToFull: () => {
    set((s) => {
      const next: PlayerState = { ...s.player, hp: s.player.maxHp };
      savePlayer(next);
      return { player: next };
    });
  },

  completeLevel: (key, chapter) => {
    set((s) => {
      // Update PlayerState
      const next: PlayerState = {
        ...s.player,
        currentChapter: chapter,
        currentLevel: s.player.currentLevel + 1,
      };
      savePlayer(next);

      // Also update GameProgress (MapPage reads from dw_progress)
      const progress = loadProgress();
      if (!progress.completedLevels.includes(key)) {
        progress.completedLevels.push(key);
      }
      if (!progress.completedChapters.includes(chapter)) {
        progress.completedChapters.push(chapter);
      }
      saveProgress(progress);

      return { player: next };
    });
  },

  equipWeapon: (id) => {
    set((s) => {
      const next: PlayerState = { ...s.player, equippedWeaponId: id };
      savePlayer(next);
      return { player: next };
    });
  },

  buyEquipment: (item) => {
    set((s) => {
      // Check if already owned
      if (s.player.equipment.some((e) => e.id === item.id)) {
        return s;
      }
      const next: PlayerState = {
        ...s.player,
        gold: s.player.gold - item.cost,
        equipment: [...s.player.equipment, item],
        equippedWeaponId: item.id,
      };
      savePlayer(next);
      return { player: next };
    });
  },

  promoteToAdvanced: (id) => {
    set((s) => {
      const next: PlayerState = { ...s.player, advancedClassId: id };
      savePlayer(next);
      return { player: next };
    });
  },

  addMistakeWord: (id) => {
    // Mistake words are stored in localStorage via word stats; persistence
    // is handled by recordAnswer. This action is a stub for future use.
    set((s) => s);
  },

  recordAnswer: (id, correct) => {
    // This is handled by word stats persistence; for now it's a no-op.
    set((s) => s);
  },

  updateCombo: (n) => {
    // Combo is transient battle state, not persisted in player store.
    set((s) => s);
  },
}));
