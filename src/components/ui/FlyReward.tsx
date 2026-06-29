import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FlyRewardItem {
  type: string;
  amount: number;
  icon?: string;
}

interface FlyRewardProps {
  rewards: FlyRewardItem[];
  origin?: { x: number; y: number };
  onComplete?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  gold: '🪙',
  xp: '⚡',
  shield: '🛡️',
  item: '📦',
  cosmetic: '✨',
};

export function FlyReward({ rewards, onComplete }: FlyRewardProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (rewards.length === 0) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, rewards.length * 300 + 600);
    return () => clearTimeout(timer);
  }, [rewards, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {rewards.map((reward, i) => (
            <motion.div
              key={`${reward.type}-${i}`}
              className="absolute flex items-center gap-2 rounded-full bg-gray-800/90 px-4 py-2 text-lg font-bold text-white shadow-lg"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [0, -40 - i * 30, -80 - i * 30],
                scale: [0.5, 1.2, 1, 0.8],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.2,
                ease: 'easeOut',
              }}
            >
              <span>{reward.icon || TYPE_ICONS[reward.type] || '🎁'}</span>
              <span>+{reward.amount}</span>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
