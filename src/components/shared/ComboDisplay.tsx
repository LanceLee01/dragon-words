// ---------------------------------------------------------------------------
// ComboDisplay — shows combo tier label + multiplier counter
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion';

interface ComboDisplayProps {
  combo: number;
}

const TIERS = [
  { threshold: 7, label: 'LEGENDARY!!!!', color: 'text-purple-300' },
  { threshold: 5, label: 'AMAZING!!!', color: 'text-orange-300' },
  { threshold: 3, label: 'Great!!', color: 'text-yellow-300' },
  { threshold: 1, label: 'Nice!', color: 'text-green-300' },
] as const;

export function ComboDisplay({ combo }: ComboDisplayProps) {
  if (combo <= 0) return null;

  const tier = TIERS.find((t) => combo >= t.threshold) ?? TIERS[TIERS.length - 1];

  return (
    <motion.div
      className={`flex flex-col items-center ${tier.color}`}
      key={combo}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 12 }}
    >
      <span className="text-2xl font-extrabold drop-shadow-lg">{tier.label}</span>
      <span className="text-sm font-semibold opacity-80">
        {combo} Combo!
      </span>
    </motion.div>
  );
}
