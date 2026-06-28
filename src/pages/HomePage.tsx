// ---------------------------------------------------------------------------
// HomePage — title screen with game-entry actions
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';

export default function HomePage() {
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const loaded = usePlayerStore((s) => s.loaded);
  const sendEvent = useGameStore((s) => s.sendEvent);

  const hasSave = player.classId !== null;

  const handleStart = () => {
    sendEvent('START_GAME');
    navigate('/select-class');
  };

  const handleContinue = () => {
    navigate('/map');
  };

  const handleReselect = () => {
    navigate('/select-class');
  };

  const handleShop = () => {
    navigate('/shop');
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background: 'linear-gradient(180deg, #0a0a2e 0%, #1a0a2e 50%, #2a1a0a 100%)',
      }}
    >
      {/* --- Animated entrance --- */}
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

      {/* --- Action buttons --- */}
      <motion.div
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {hasSave ? (
          <>
            <ActionButton onClick={handleContinue} label="继续冒险" primary />
            <ActionButton onClick={handleReselect} label="重新选择职业" />
            <ActionButton onClick={handleShop} label="商店" />
          </>
        ) : (
          <ActionButton onClick={handleStart} label="开始冒险" primary />
        )}
      </motion.div>

      {/* --- Player stats --- */}
      {loaded && (
        <motion.div
          className="mt-10 flex gap-6 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Stat label="Lv" value={player.level} />
          <Stat label="金币" value={player.gold} />
          <Stat label="最高连击" value={0} />
          <Stat label="准确率" value="0%" />
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionButton({
  label,
  primary,
  onClick,
}: {
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={
        'min-w-[160px] rounded-lg px-6 py-3 text-lg font-semibold tracking-wide transition-colors ' +
        (primary
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
