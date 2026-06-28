// ---------------------------------------------------------------------------
// HealthBar — animated HP bar with label and fraction display
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion';

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  color?: string;
  className?: string;
}

export function HealthBar({
  current,
  max,
  label,
  color = 'bg-red-600',
  className = '',
}: HealthBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
