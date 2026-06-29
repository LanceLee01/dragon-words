// ---------------------------------------------------------------------------
// EquipmentDetail — detailed equipment view with base stats and affix list
// ---------------------------------------------------------------------------
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALL_AFFIXES } from '@/core/data/affixes';
import type { AffixInstance } from '@/core/data/affixes';
import type { Equipment } from '@/core/data/types';
import { IconBadge } from '@/components/ui/IconBadge';

interface EquipmentDetailProps {
  equipment: Equipment & { affixes: AffixInstance[] };
  lockedAffixIds: string[];
  onToggleLock: (affixId: string) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Affix lookup — finds the Affix definition for a given AffixInstance
// ---------------------------------------------------------------------------
function resolveAffix(inst: AffixInstance): (typeof ALL_AFFIXES)[number] | undefined {
  // Match by stat (guaranteed unique in the deduped pool)
  return ALL_AFFIXES.find((a) => a.stat === inst.stat);
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------
const TIER_LABELS: Record<number, string> = {
  1: '普通',
  2: '稀有',
  3: '史诗',
  4: '传说',
};

const TIER_STYLES: Record<number, string> = {
  1: 'bg-gray-700/60 text-gray-300 border-gray-600',
  2: 'bg-blue-900/60 text-blue-300 border-blue-700',
  3: 'bg-purple-900/60 text-purple-300 border-purple-700',
  4: 'bg-yellow-900/60 text-yellow-300 border-yellow-600',
};

const SLOT_ICONS: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  accessory: '💍',
};

const SLOT_LABELS: Record<string, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '饰品',
};

// ---------------------------------------------------------------------------
// Stat format helpers
// ---------------------------------------------------------------------------
function formatStatValue(stat: string, value: number): string {
  const BOOLEAN_STATS = new Set([
    'doubleCast',
    'cheatDeath',
    'infiniteCombo',
    'skillDoubleCast',
  ]);
  if (BOOLEAN_STATS.has(stat)) {
    return value > 0 ? '已激活' : '未激活';
  }
  const PCT_STATS = new Set([
    'critRate',
    'critDmg',
    'elementalDmg',
    'armorPen',
    'dmgReduction',
    'statusResist',
    'hpRegen',
    'goldBonus',
    'xpBonus',
    'comboDecayReduction',
    'skillChargeSpeed',
    'timeBonus',
    'thorns',
    'omniResist',
    'killHeal',
    'shieldMax',
    'autoRemoveDistractor',
  ]);
  if (PCT_STATS.has(stat) || value < 1) {
    return `${(value * 100).toFixed(0)}%`;
  }
  return `+${value}`;
}

function formatBaseStat(label: string, value: number): string {
  return `${label} +${value}`;
}

// ---------------------------------------------------------------------------
// Category → text colour mapping
// ---------------------------------------------------------------------------
const CATEGORY_TEXT_COLORS: Record<string, string> = {
  offense: 'text-red-400',
  defense: 'text-green-400',
  utility: 'text-blue-400',
  legendary: 'text-yellow-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EquipmentDetail({
  equipment,
  lockedAffixIds,
  onToggleLock,
  onClose,
}: EquipmentDetailProps) {
  const lockedSet = useMemo(() => new Set(lockedAffixIds), [lockedAffixIds]);

  const resolvedAffixes = useMemo(
    () =>
      equipment.affixes.map((inst) => ({
        inst,
        def: resolveAffix(inst),
      })),
    [equipment.affixes],
  );

  const isLocked = (affixId: string) => lockedSet.has(affixId);

  return (
    <motion.div
      className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        aria-label="关闭"
      >
        ✕
      </button>

      {/* Header: slot icon + name + tier */}
      <div className="mb-4 flex items-start gap-3 pr-8">
        <span className="mt-1 text-3xl">{SLOT_ICONS[equipment.slot] ?? '📦'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-white">
            {equipment.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <span>{SLOT_LABELS[equipment.slot] ?? equipment.slot}</span>
            <span className="text-gray-600">·</span>
            <span
              className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                TIER_STYLES[equipment.tier] ?? TIER_STYLES[1]
              }`}
            >
              {TIER_LABELS[equipment.tier] ?? `T${equipment.tier}`}
            </span>
          </div>
        </div>
      </div>

      {/* Base stats */}
      <div className="mb-5 rounded-lg bg-white/5 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          基础属性
        </h3>
        <div className="flex gap-4 text-sm">
          {equipment.attack > 0 && (
            <span className="text-red-400">
              ⚔ {formatBaseStat('攻击', equipment.attack)}
            </span>
          )}
          {equipment.defense > 0 && (
            <span className="text-green-400">
              🛡 {formatBaseStat('防御', equipment.defense)}
            </span>
          )}
          {equipment.attack === 0 && equipment.defense === 0 && (
            <span className="italic text-gray-500">无基础属性</span>
          )}
        </div>
      </div>

      {/* Affixes section */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          词缀列表
          {equipment.affixes.length > 0 && (
            <span className="ml-2 text-gray-600">
              ({equipment.affixes.length})
            </span>
          )}
        </h3>

        {resolvedAffixes.length === 0 ? (
          <p className="text-sm italic text-gray-500">该装备没有词缀</p>
        ) : (
          <ul className="space-y-2">
            {resolvedAffixes.map(({ inst, def }) => {
              const locked = isLocked(inst.id);
              const category = def?.category ?? 'utility';
              const displayName = def?.display.name ?? inst.stat;
              const colorClass =
                CATEGORY_TEXT_COLORS[category] ?? 'text-gray-300';

              return (
                <motion.li
                  key={inst.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    locked
                      ? 'border-yellow-600/40 bg-yellow-900/15'
                      : 'border-gray-700 bg-white/5'
                  }`}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {/* Category badge */}
                  <IconBadge category={category} size="sm" />

                  {/* Affix name + value */}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${colorClass}`}>
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatStatValue(inst.stat, inst.value)}
                    </div>
                  </div>

                  {/* Lock toggle button */}
                  <button
                    onClick={() => onToggleLock(inst.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors ${
                      locked
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'bg-gray-700/50 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
                    }`}
                    aria-label={locked ? '解锁' : '锁定'}
                    title={locked ? '点击解锁' : '点击锁定'}
                  >
                    {locked ? '🔒' : '🔓'}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
