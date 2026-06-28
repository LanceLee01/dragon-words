// ---------------------------------------------------------------------------
// HomePage — title screen with New Game / Continue options
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { soundEngine } from '@/core/utils/sound';

export default function HomePage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const loaded = usePlayerStore((s) => s.loaded);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasSave = player.classId !== null;

  const handleNewGame = () => setShowConfirm(true);

  const confirmNewGame = () => {
    setShowConfirm(false);
    // Clear local storage save data
    localStorage.removeItem('dw_player');
    localStorage.removeItem('dw_progress');
    localStorage.removeItem('dw_settings');
    localStorage.removeItem('dw_wordstats');
    // Navigate to class select (fresh start)
    navigate('/select-class');
  };

  const handleContinue = () => navigate('/map');

  const handleShop = () => navigate('/shop');

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background: 'linear-gradient(180deg, #0a0a2e 0%, #1a0a2e 50%, #2a1a0a 100%)',
      }}
    >
      {/* Animated entrance */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="text-7xl sm:text-8xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          🐉
        </motion.div>

        <motion.h1
          className="mt-4 text-4xl font-bold tracking-widest sm:text-5xl"
          style={{ color: '#ffd700' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Dragon Words
        </motion.h1>

        <motion.p
          className="mt-2 text-lg text-gray-300 sm:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          龙与地下城 · 背单词冒险
        </motion.p>
      </motion.div>

      {/* Action buttons — always show both options */}
      <motion.div
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <ActionButton onClick={handleNewGame} label="🆕  开始新冒险" primary />
        <ActionButton
          onClick={handleContinue}
          label="⚔️  继续冒险"
          disabled={!hasSave}
        />
        <ActionButton onClick={handleShop} label="🏪  商店" />
      </motion.div>

      {/* Audio test button */}
      <motion.button
        onClick={() => soundEngine.testBeep()}
        className="mt-4 text-xs text-gray-600 hover:text-gray-400"
        whileHover={{ scale: 1.05 }}
      >
        🔊 测试音效
      </motion.button>

      {/* Player stats (only if save exists) */}
      {hasSave && loaded && (
        <motion.div
          className="mt-10 flex gap-8 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Stat label="等级" value={player.level} />
          <Stat label="金币" value={player.gold} />
          <Stat label="最高连击" value={player.highestCombo || 0} />
          <Stat
            label="正确率"
            value={
              player.totalQuestions > 0
                ? `${Math.round((player.totalCorrect / player.totalQuestions) * 100)}%`
                : '0%'
            }
          />
        </motion.div>
      )}

      {/* New Game confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-4 w-full max-w-sm rounded-xl border border-gray-600 bg-gray-900 p-8 text-center shadow-2xl"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">开始新冒险？</h3>
              <p className="text-gray-400 mb-6">
                现有进度将被清除，确定要重新开始吗？
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={confirmNewGame}
                  className="rounded-lg bg-red-600 px-6 py-2 font-bold text-white hover:bg-red-500"
                >
                  确定新开
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 hover:bg-gray-800"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionButton({
  label,
  primary,
  disabled,
  onClick,
}: {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={
        `min-w-[180px] rounded-lg px-6 py-3 text-lg font-semibold tracking-wide transition-colors ` +
        (disabled
          ? 'cursor-not-allowed border border-gray-700 text-gray-600'
          : primary
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-800/40 hover:bg-amber-500'
            : 'border border-gray-500 text-gray-200 hover:bg-gray-700/50')
      }
    >
      {label}
    </motion.button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
      <span className="text-lg font-bold text-amber-400">{value}</span>
    </div>
  );
}
