// ---------------------------------------------------------------------------
// DefeatScreen — battle defeat overlay with retry and leave options
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion';

interface DefeatScreenProps {
  onRetry: () => void;
  onLeave: () => void;
}

export function DefeatScreen({ onRetry, onLeave }: DefeatScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Skull */}
      <motion.span
        className="text-7xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
      >
        💀
      </motion.span>

      {/* Title */}
      <motion.h2
        className="text-3xl font-extrabold text-red-400 drop-shadow-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        战败...
      </motion.h2>

      {/* Encouragement */}
      <motion.p
        className="max-w-xs text-center text-gray-400"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        失败是成功之母！再试一次吧！
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-3 sm:flex-row"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={onRetry}
          className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          🔄 再来一次
        </button>
        <button
          onClick={onLeave}
          className="rounded-xl border border-gray-600 bg-gray-800 px-8 py-3 text-lg font-bold text-gray-300 shadow-lg transition-transform hover:scale-105 hover:bg-gray-700 active:scale-95"
        >
          🏠 返回地图
        </button>
      </motion.div>
    </motion.div>
  );
}
