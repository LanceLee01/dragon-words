// ---------------------------------------------------------------------------
// CombatLog — right panel: scrolling combat statistics
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { useBattleStore } from '@/stores/battleStore';

export function CombatLog() {
  const log = useBattleStore((s) => s.battle?.log ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  if (log.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 text-sm">
        暂无记录
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        ⚔️ 战斗统计
      </h3>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {log.map((entry, i) => (
          <div
            key={i}
            className="rounded border-l-4 border-gray-600 bg-black/20 px-2 py-1.5 text-xs"
          >
            {entry.isCorrect ? (
              <>
                <div className="text-green-300">
                  ⚔️ 对 {entry.monsterName} 造成 {entry.damageDealt} 点伤害
                  {entry.isCrit && <span className="ml-1 text-yellow-300">💥 暴击!</span>}
                </div>
                {entry.lastCombo >= 1 && (
                  <div className="text-orange-300">🔥 连击 x{entry.lastCombo + 1}</div>
                )}
              </>
            ) : (
              <>
                <div className="text-red-300">
                  ❌ 答错
                </div>
                {entry.damageTaken > 0 && (
                  <div className="text-red-400">
                    💢 受到 {entry.monsterName} {entry.damageTaken} 点伤害
                  </div>
                )}
              </>
            )}
            <div className="mt-0.5 text-gray-500">
              ❤️ 怪物 HP: {entry.monsterHpAfter}/{entry.monsterMaxHp} · 玩家 HP: {entry.playerHpAfter}/{entry.playerMaxHp}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
