// ---------------------------------------------------------------------------
// Timer — countdown display with urgent pulse
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion';

interface TimerProps {
  remaining: number;
  isUrgent: boolean;
}

export function Timer({ remaining, isUrgent }: TimerProps) {
  return (
    <motion.div
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-lg font-bold ${
        isUrgent
          ? 'bg-red-900/60 text-red-300'
          : 'bg-yellow-900/30 text-yellow-300'
      }`}
      animate={
        isUrgent
          ? { scale: [1, 1.12, 1] }
          : {}
      }
      transition={
        isUrgent
          ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
          : {}
      }
    >
      <span>⏱</span>
      <span>{remaining}s</span>
    </motion.div>
  );
}
