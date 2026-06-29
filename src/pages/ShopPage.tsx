// ---------------------------------------------------------------------------
// ShopPage — equipment shop with 3 slot categories (weapon/armor/accessory)
//             and a weekly special section with affix equipment
// ---------------------------------------------------------------------------
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore, type AffixEquipmentItem } from '@/stores/playerStore';
import { EQUIPMENT } from '@/core/data/equipment';
import { AFFIX_POOLS, rollAffixValue } from '@/core/data/affixes';
import type { Affix, Equipment } from '@/core/data/types';

type SlotTab = 'weapon' | 'armor' | 'accessory';

const SLOT_TABS: { key: SlotTab; label: string; icon: string }[] = [
  { key: 'weapon', label: '武器', icon: '⚔️' },
  { key: 'armor', label: '防具', icon: '🛡️' },
  { key: 'accessory', label: '饰品', icon: '💍' },
];

// ---------------------------------------------------------------------------
// Weekly special helpers — deterministic affix equipment generation
// ---------------------------------------------------------------------------

/** Generate a deterministic set of affix equipment for the shop based on class */
function generateWeeklySpecials(classId: string): AffixEquipmentItem[] {
  const classEquipment = EQUIPMENT.filter(
    (eq) => eq.classId === classId || eq.slot === 'accessory',
  );
  // Pick one tier-2 and one tier-3 item (weapon or armor) + one accessory
  const pick = (arr: Equipment[]): Equipment | undefined =>
    arr[Math.floor(Math.random() * arr.length)];

  const weaponOrArmorPoolT2 = classEquipment.filter(
    (eq) => eq.tier === 2 && eq.slot !== 'accessory',
  );
  const weaponOrArmorPoolT3 = classEquipment.filter(
    (eq) => eq.tier === 3 && eq.slot !== 'accessory',
  );
  const accessoryPool = classEquipment.filter((eq) => eq.slot === 'accessory');

  const results: AffixEquipmentItem[] = [];

  const addItem = (base: Equipment | undefined, tier: number) => {
    if (!base) return;
    // Pick 1-2 affixes from the appropriate tier
    const affixPool = AFFIX_POOLS[tier] ?? AFFIX_POOLS[1];
    const count = Math.min(affixPool.length, tier === 3 ? 2 : 1);
    const shuffled = [...affixPool].sort(() => Math.random() - 0.5);
    const affixes = shuffled.slice(0, count).map((a: Affix) => ({
      id: `${a.id}_${base.id}`,
      stat: a.stat,
      value: rollAffixValue(a),
    }));
    results.push({
      ...base,
      cost: base.cost * (tier === 3 ? 3 : 2), // premium pricing
      affixes,
    });
  };

  addItem(weaponOrArmorPoolT2[0] ?? weaponOrArmorPoolT2[1], 2);
  addItem(weaponOrArmorPoolT3[0] ?? weaponOrArmorPoolT3[1], 3);
  addItem(accessoryPool[0], 2);

  return results;
}

// ---------------------------------------------------------------------------
// Lockstone item definition
// ---------------------------------------------------------------------------
const LOCKSTONE_COST = 100;
const LOCKSTONE_NAME = '锁链石';
const LOCKSTONE_DESC = '用于锁定装备上的词缀，防止在重铸时被改变';

// ---------------------------------------------------------------------------
// ShopPage
// ---------------------------------------------------------------------------

export default function ShopPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const equipWeapon = usePlayerStore((s) => s.equipWeapon);
  const equipArmor = usePlayerStore((s) => s.equipArmor);
  const equipAccessory = usePlayerStore((s) => s.equipAccessory);
  const buyEquipment = usePlayerStore((s) => s.buyEquipment);
  const buyAffixEquipment = usePlayerStore((s) => s.buyAffixEquipment);
  const affixEquipmentInventory = usePlayerStore((s) => s.affixEquipmentInventory);
  const lockedAffixIds = usePlayerStore((s) => s.lockedAffixIds);
  const lockAffix = usePlayerStore((s) => s.lockAffix);

  const [activeTab, setActiveTab] = useState<SlotTab | 'specials'>('weapon');

  // Generate weekly specials once per session
  const weeklySpecials = useMemo(
    () => (player.classId ? generateWeeklySpecials(player.classId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const ownedIds = new Set(player.equipment.map((e) => e.id));

  // Filter by slot and class (accessories are shared)
  const filteredItems = EQUIPMENT.filter(
    (eq) =>
      eq.slot === activeTab &&
      (eq.slot === 'accessory' || eq.classId === player.classId),
  );

  const handleBack = () => navigate(-1);

  const handleBuy = (item: Equipment) => {
    if (player.gold < item.cost) return;
    buyEquipment(item);
  };

  const handleEquip = (item: Equipment) => {
    if (item.slot === 'weapon') equipWeapon(item.id);
    else if (item.slot === 'armor') equipArmor(item.id);
    else if (item.slot === 'accessory') equipAccessory(item.id);
  };

  const handleUnequip = (item: Equipment) => {
    if (item.slot === 'weapon') equipWeapon(null);
    else if (item.slot === 'armor') equipArmor(null);
    else if (item.slot === 'accessory') equipAccessory(null);
  };

  const getEquippedId = (slot: SlotTab): string | null => {
    if (slot === 'weapon') return player.equippedWeaponId;
    if (slot === 'armor') return player.equippedArmorId;
    return player.equippedAccessoryId;
  };

  const handleBuyAffix = (item: AffixEquipmentItem) => {
    if (player.gold < item.cost) return;
    buyAffixEquipment(item);
  };

  const handleBuyLockstone = () => {
    if (player.gold < LOCKSTONE_COST) return;
    // Use addGold with negative to subtract, then add lockstone
    usePlayerStore.getState().addGold(-LOCKSTONE_COST);
    lockAffix(`lockstone_${Date.now()}`);
  };

  // If no class selected
  if (!player.classId) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)' }}
      >
        <p className="mb-6 text-xl text-gray-300">请先选择职业再进入商店</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-amber-600 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-amber-800/40 transition-colors hover:bg-amber-500"
        >
          返回首页
        </button>
      </div>
    );
  }

  const equippedId = getEquippedId(activeTab as SlotTab);

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)' }}
    >
      {/* Header */}
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← 返回
        </button>
        <motion.h1
          className="text-2xl font-bold tracking-wide text-white sm:text-3xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🏪 装备商店
        </motion.h1>
        <div className="flex items-center gap-2 rounded-lg bg-yellow-900/30 px-4 py-2 text-lg font-semibold text-amber-400">
          💰 {player.gold}
        </div>
      </div>

      {/* Slot tabs + Specials tab */}
      <div className="mx-auto mb-6 flex max-w-lg justify-center gap-2">
        {SLOT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-700 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('specials')}
          className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'specials'
              ? 'bg-purple-700 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
          }`}
        >
          <span>✨</span>
          <span>特供</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* Regular equipment grid                                          */}
      {/* ================================================================ */}
      {activeTab !== 'specials' && (
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, i) => {
            const owned = ownedIds.has(item.id);
            const equipped = equippedId === item.id;

            return (
              <motion.div
                key={item.id}
                className={`rounded-xl border p-5 backdrop-blur-sm transition-colors ${
                  equipped
                    ? 'border-yellow-500 bg-yellow-900/20'
                    : 'border-gray-700 bg-white/5'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
              >
                {/* Item icon */}
                <div className="mb-3 text-center text-4xl">
                  {getItemIcon(item)}
                </div>

                {/* Name + tier badge */}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      item.tier === 3
                        ? 'bg-purple-900/60 text-purple-300'
                        : item.tier === 2
                          ? 'bg-blue-900/60 text-blue-300'
                          : 'bg-gray-700/60 text-gray-300'
                    }`}
                  >
                    {getTierText(item.tier)}
                  </span>
                </div>

                {/* Stats */}
                <div className="mb-1 text-sm text-gray-400">
                  {item.attack > 0 && <span className="mr-3">⚔ 攻击 +{item.attack}</span>}
                  {item.defense > 0 && <span>🛡 防御 +{item.defense}</span>}
                  {item.attack === 0 && item.defense === 0 && (
                    <span className="italic text-gray-500">无属性</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  {equipped ? (
                    <button
                      onClick={() => handleUnequip(item)}
                      className="flex-1 rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-900/30"
                    >
                      🚫 卸下
                    </button>
                  ) : owned ? (
                    <button
                      onClick={() => handleEquip(item)}
                      className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                      装备
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={player.gold < item.cost}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        player.gold < item.cost
                          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                          : 'bg-amber-600 text-white hover:bg-amber-500'
                      }`}
                    >
                      💰 {item.cost}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state for regular tabs */}
      {activeTab !== 'specials' && filteredItems.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          {activeTab === 'accessory' ? '暂无可用饰品' : '该职业暂无可用装备'}
        </p>
      )}

      {/* ================================================================ */}
      {/* Specials tab — affix equipment + lockstone                      */}
      {/* ================================================================ */}
      {activeTab === 'specials' && (
        <div className="mx-auto max-w-4xl">
          {/* Section title */}
          <motion.h2
            className="mb-4 text-xl font-bold text-purple-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✨ 每周特供装备
          </motion.h2>
          <p className="mb-6 text-sm text-gray-500">
            带有特殊词缀的稀有装备，每周刷新！
          </p>

          {/* Affix equipment grid */}
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {weeklySpecials.map((item, i) => {
              const alreadyOwned = affixEquipmentInventory.some(
                (e) => e.id === item.id,
              );

              return (
                <motion.div
                  key={item.id}
                  className="rounded-xl border border-purple-700/50 bg-purple-900/10 p-5 backdrop-blur-sm transition-colors hover:border-purple-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.1, ease: 'easeOut' }}
                >
                  {/* Icon */}
                  <div className="mb-3 text-center text-4xl">
                    ✨{getItemIcon(item)}
                  </div>

                  {/* Name + tier */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-purple-200">{item.name}</h3>
                    <span className="rounded-md bg-purple-900/60 px-2 py-0.5 text-xs font-semibold text-purple-300">
                      {getTierText(item.tier)}
                    </span>
                  </div>

                  {/* Slot label */}
                  <div className="mb-2 text-xs text-gray-500">
                    {item.slot === 'weapon' && '⚔️ 武器'}
                    {item.slot === 'armor' && '🛡️ 防具'}
                    {item.slot === 'accessory' && '💍 饰品'}
                  </div>

                  {/* Base stats */}
                  <div className="mb-2 text-sm text-gray-400">
                    {item.attack > 0 && <span className="mr-3">⚔ +{item.attack}</span>}
                    {item.defense > 0 && <span>🛡 +{item.defense}</span>}
                  </div>

                  {/* Affix list */}
                  <div className="mb-4 space-y-1">
                    {item.affixes.map((affix) => (
                      <div
                        key={affix.id}
                        className="flex items-center gap-2 rounded bg-purple-800/20 px-2 py-1 text-xs text-purple-300"
                      >
                        <span>✦</span>
                        <span>
                          {affix.stat}: {affix.value > 0 ? '+' : ''}{affix.value}
                          {typeof affix.value === 'number' &&
                          affix.value < 1 &&
                          affix.value > 0
                            ? '%'
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Buy button */}
                  <button
                    onClick={() => handleBuyAffix(item)}
                    disabled={alreadyOwned || player.gold < item.cost}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      alreadyOwned
                        ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                        : player.gold < item.cost
                          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                          : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    {alreadyOwned ? '已拥有' : `💰 ${item.cost}`}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* Lockstone item                                               */}
          {/* ============================================================ */}
          <motion.div
            className="rounded-xl border border-amber-700/50 bg-amber-900/10 p-5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🔗</span>
                <div>
                  <h3 className="text-lg font-bold text-amber-200">{LOCKSTONE_NAME}</h3>
                  <p className="text-sm text-gray-400">{LOCKSTONE_DESC}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    当前拥有：{lockedAffixIds.filter((id) => id.startsWith('lockstone_')).length} 个
                  </p>
                </div>
              </div>
              <button
                onClick={handleBuyLockstone}
                disabled={player.gold < LOCKSTONE_COST}
                className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${
                  player.gold < LOCKSTONE_COST
                    ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                    : 'bg-amber-600 text-white hover:bg-amber-500'
                }`}
              >
                💰 {LOCKSTONE_COST}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItemIcon(item: Equipment): string {
  const baseIcon = item.slot === 'weapon' ? '⚔️' : item.slot === 'armor' ? '🛡️' : '💍';
  if (item.tier >= 3) return `✨${baseIcon}`;
  return baseIcon;
}

function getTierText(tier: number): string {
  return ['', 'I', 'II', 'III'][tier] || '';
}
