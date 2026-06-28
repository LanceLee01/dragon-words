// ---------------------------------------------------------------------------
// ShopPage — equipment shop with 3 slot categories (weapon/armor/accessory)
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { EQUIPMENT } from '@/core/data/equipment';
import type { Equipment } from '@/core/data/types';

type SlotTab = 'weapon' | 'armor' | 'accessory';

const SLOT_TABS: { key: SlotTab; label: string; icon: string }[] = [
  { key: 'weapon', label: '武器', icon: '⚔️' },
  { key: 'armor', label: '防具', icon: '🛡️' },
  { key: 'accessory', label: '饰品', icon: '💍' },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const equipWeapon = usePlayerStore((s) => s.equipWeapon);
  const equipArmor = usePlayerStore((s) => s.equipArmor);
  const equipAccessory = usePlayerStore((s) => s.equipAccessory);
  const buyEquipment = usePlayerStore((s) => s.buyEquipment);

  const [activeTab, setActiveTab] = useState<SlotTab>('weapon');

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

  const equippedId = getEquippedId(activeTab);

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

      {/* Slot tabs */}
      <div className="mx-auto mb-6 flex max-w-md justify-center gap-2">
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
      </div>

      {/* Equipment grid */}
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

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          {activeTab === 'accessory' ? '暂无可用饰品' : '该职业暂无可用装备'}
        </p>
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
