// ---------------------------------------------------------------------------
// InventoryPanel — grid of equipment cards with selection & merge support
// ---------------------------------------------------------------------------
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Equipment } from '@/core/data/types';
import type { AffixInstance } from '@/core/data/affixes';

interface InventoryPanelProps {
  items: Array<Equipment & { affixes: AffixInstance[] }>;
  onSelect: (item: Equipment & { affixes: AffixInstance[] }) => void;
  onMerge: (baseId: string, donorId: string) => void;
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------
const TIER_BORDER: Record<number, string> = {
  1: 'border-gray-700',
  2: 'border-blue-700',
  3: 'border-purple-700',
  4: 'border-yellow-600',
};

const TIER_BADGE: Record<number, string> = {
  1: 'bg-gray-700/60 text-gray-300',
  2: 'bg-blue-900/60 text-blue-300',
  3: 'bg-purple-900/60 text-purple-300',
  4: 'bg-yellow-900/60 text-yellow-300',
};

const TIER_LABELS: Record<number, string> = {
  1: '普通',
  2: '稀有',
  3: '史诗',
  4: '传说',
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
// InventoryPanel
// ---------------------------------------------------------------------------
export function InventoryPanel({ items, onSelect, onMerge }: InventoryPanelProps) {
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mergeBase, setMergeBase] = useState<string | null>(null);

  // Reset merge selection when entering/exiting merge mode
  const toggleMergeMode = useCallback(() => {
    setMergeMode((prev) => {
      if (prev) {
        // Exiting merge mode — clear selections
        setMergeBase(null);
        setSelectedId(null);
      } else {
        // Entering merge mode — keep current selection but reset merge base
        setMergeBase(null);
      }
      return !prev;
    });
  }, []);

  // Cancel merge mode and any selections
  const cancelMerge = useCallback(() => {
    setMergeMode(false);
    setMergeBase(null);
    setSelectedId(null);
  }, []);

  const handleCardClick = useCallback(
    (item: Equipment & { affixes: AffixInstance[] }) => {
      if (mergeMode) {
        // Merge mode logic
        if (mergeBase === null) {
          // First selection — pick base
          setMergeBase(item.id);
          setSelectedId(item.id);
        } else if (mergeBase === item.id) {
          // Clicked the same item — deselect
          setMergeBase(null);
          setSelectedId(null);
        } else {
          // Second selection — confirm merge
          onMerge(mergeBase, item.id);
          cancelMerge();
        }
      } else {
        // Normal selection
        setSelectedId((prev) => (prev === item.id ? null : item.id));
        onSelect(item);
      }
    },
    [mergeMode, mergeBase, onMerge, onSelect, cancelMerge],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          装备背包
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({items.length})
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {mergeMode ? (
            <>
              <span className="text-sm text-yellow-400">
                {mergeBase === null
                  ? '选择第一件装备作为基础'
                  : '选择第二件装备作为材料'}
              </span>
              <button
                onClick={cancelMerge}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={toggleMergeMode}
              className="rounded-lg border border-purple-700 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-900/30 hover:text-purple-200"
            >
              🔗 融合
            </button>
          )}
        </div>
      </div>

      {/* Merge mode hint banner */}
      {mergeMode && (
        <motion.div
          className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-2 text-sm text-yellow-300"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          💡 选择两件<strong>同名</strong>装备进行融合，保留各词缀的最高数值，最多保留 6 个词缀。
          {mergeBase !== null && (
            <span className="ml-1">
              已选择基础装备，请选择材料装备。
            </span>
          )}
        </motion.div>
      )}

      {/* Equipment grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 py-16">
          <span className="mb-2 text-4xl text-gray-600">📦</span>
          <p className="text-sm text-gray-500">背包为空</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const isSelected = selectedId === item.id;
            const isMergeBase = mergeBase === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                  isMergeBase
                    ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-900/30'
                    : isSelected
                      ? 'border-blue-500 bg-blue-900/20'
                      : TIER_BORDER[item.tier] ?? 'border-gray-700'
                } bg-white/5 backdrop-blur-sm hover:bg-white/10`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
              >
                {/* Slot icon + name row */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">
                    {SLOT_ICONS[item.slot] ?? '📦'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {SLOT_LABELS[item.slot] ?? item.slot}
                    </div>
                  </div>
                  {/* Tier badge */}
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      TIER_BADGE[item.tier] ?? TIER_BADGE[1]
                    } ${isMergeBase ? 'border-yellow-600' : 'border-transparent'}`}
                  >
                    {TIER_LABELS[item.tier] ?? `T${item.tier}`}
                  </span>
                </div>

                {/* Base stats */}
                <div className="mb-2 flex gap-3 text-xs text-gray-400">
                  {item.attack > 0 && (
                    <span className="text-red-400">⚔ +{item.attack}</span>
                  )}
                  {item.defense > 0 && (
                    <span className="text-green-400">🛡 +{item.defense}</span>
                  )}
                  {item.attack === 0 && item.defense === 0 && (
                    <span className="italic text-gray-600">无属性</span>
                  )}
                </div>

                {/* Affix count + category badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.affixes.length > 0 ? (
                    <>
                      <span className="text-xs text-gray-500">
                        词缀 {item.affixes.length}
                      </span>
                      {/* Show up to 3 category dots */}
                      {Array.from(
                        new Set(
                          item.affixes.map(
                            (a) => a.stat,
                          ),
                        ),
                      )
                        .slice(0, 3)
                        .map((stat) => {
                          const dotColor = getStatDotColor(stat);
                          return (
                            <span
                              key={stat}
                              className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
                              title={stat}
                            />
                          );
                        })}
                      {item.affixes.length > 3 && (
                        <span className="text-xs text-gray-600">
                          +{item.affixes.length - 3}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs italic text-gray-600">无词缀</span>
                  )}
                </div>

                {/* Selected / merge mode indicator */}
                {isMergeBase && (
                  <div className="absolute right-2 top-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-yellow-900">
                    基础
                  </div>
                )}
                {mergeMode && selectedId === item.id && !isMergeBase && (
                  <div className="absolute right-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-blue-900">
                    材料
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a stat key to a colour dot for quick visual categorisation */
function getStatDotColor(stat: string): string {
  // Offense stats
  if (
    ['critRate', 'critDmg', 'elementalDmg', 'armorPen', 'killHeal', 'doubleCast', 'skillDoubleCast'].includes(stat)
  ) {
    return 'bg-red-500';
  }
  // Defense stats
  if (
    ['dmgReduction', 'maxHp', 'hpRegen', 'statusResist', 'shieldMax', 'thorns', 'omniResist', 'cheatDeath'].includes(stat)
  ) {
    return 'bg-green-500';
  }
  // Legendary
  if (['infiniteCombo', 'cheatDeath', 'doubleCast', 'omniResist', 'skillDoubleCast'].includes(stat)) {
    return 'bg-yellow-500';
  }
  // Everything else → utility (blue)
  return 'bg-blue-500';
}
