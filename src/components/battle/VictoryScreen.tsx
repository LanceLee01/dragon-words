// ---------------------------------------------------------------------------
// VictoryScreen — animated battle victory overlay with rewards
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion';

interface VictoryScreenProps {
  gold: number;
  xp: number;
  onContinue: () => void;
}

export function VictoryScreen({ gold, xp, onContinue }: VictoryScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 px-6 py-12"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 14 }}
    >
      {/* Trophy */}
      <motion.span
        className="text-7xl"
        initial={{ rotate: -20, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 12 }}
      >
        🏆
      </motion.span>

      {/* Title */}
      <motion.h2
        className="text-4xl font-extrabold text-yellow-400 drop-shadow-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        胜利!
      </motion.h2>

      {/* Rewards */}
      <motion.div
        className="flex flex-col items-center gap-3 rounded-2xl border border-yellow-700/50 bg-yellow-900/20 px-8 py-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 text-xl">
          <span>🪙</span>
          <span className="font-bold text-amber-300">+{gold}</span>
          <span className="text-gray-400">金币</span>
        </div>
        <div className="flex items-center gap-2 text-xl">
          <span>⚡</span>
          <span className="font-bold text-purple-300">+{xp}</span>
          <span className="text-gray-400">经验</span>
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.button
        onClick={onContinue}
        className="rounded-xl bg-gradient-to-r from-yellow-600 to-amber-500 px-10 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        继续冒险 →
      </motion.button>
    </motion.div>
  );
}
