// ---------------------------------------------------------------------------
// DamageNumber — floating damage/heal number that rises and fades
// ---------------------------------------------------------------------------
import { motion, AnimatePresence } from 'framer-motion';

interface DamageNumberProps {
  value: number;
  isCrit?: boolean;
  isHeal?: boolean;
  /** Unique key so AnimatePresence tracks instances correctly */
  key: string;
}

export function DamageNumber({ value, isCrit, isHeal, key }: DamageNumberProps) {
  const color = isHeal ? 'text-green-400' : isCrit ? 'text-yellow-300' : 'text-red-400';
  const size = isCrit ? 'text-3xl' : 'text-2xl';

  return (
    <AnimatePresence>
      <motion.div
        key={key}
        className={`pointer-events-none absolute ${color} ${size} font-extrabold`}
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -60, scale: isCrit ? 1.5 : 1.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {isHeal ? `+${value}` : `-${value}`}
        {isCrit ? '!' : ''}
      </motion.div>
    </AnimatePresence>
  );
}
