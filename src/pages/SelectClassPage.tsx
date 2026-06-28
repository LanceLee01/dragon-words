// ---------------------------------------------------------------------------
// SelectClassPage — pick a base class to begin the adventure
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { BASE_CLASSES } from '@/core/data/classes';
import type { ClassDef, ClassId } from '@/core/data/types';

export default function SelectClassPage() {
  const navigate = useNavigate();
  const selectClass = usePlayerStore((s) => s.selectClass);
  const sendEvent = useGameStore((s) => s.sendEvent);

  const classes = Object.values(BASE_CLASSES);

  const handleSelect = (id: ClassId) => {
    selectClass(id);
    sendEvent('SELECT_CLASS');
    navigate('/map');
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-12"
      style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)',
      }}
    >
      {/* Title */}
      <motion.h1
        className="mb-10 text-3xl font-bold tracking-widest text-white sm:text-4xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        选择你的职业
      </motion.h1>

      {/* Class grid */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls, i) => (
          <ClassCard key={cls.id} cls={cls} index={i} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Class card
// ---------------------------------------------------------------------------

const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  ranger: '🏹',
  paladin: '🛡️',
  rogue: '🗡️',
  druid: '🌿',
};

function ClassCard({
  cls,
  index,
  onSelect,
}: {
  cls: ClassDef;
  index: number;
  onSelect: (id: ClassId) => void;
}) {
  return (
    <motion.button
      onClick={() => onSelect(cls.id)}
      className="flex flex-col items-center rounded-xl border border-gray-700 bg-white/5 p-6 text-left backdrop-blur-sm transition-colors hover:border-amber-500 hover:bg-white/10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Icon */}
      <span className="text-5xl sm:text-6xl">{CLASS_ICONS[cls.id] || '❓'}</span>

      {/* Name */}
      <h2 className="mt-4 text-xl font-bold text-white">{cls.name}</h2>

      {/* Description */}
      <p className="mt-1 text-sm leading-relaxed text-gray-400">
        {getClassDescription(cls.id)}
      </p>

      {/* Passive */}
      <div className="mt-4 w-full rounded-md bg-green-900/30 px-3 py-2 text-sm text-green-300">
        <span className="font-semibold">被动：</span>
        {describePassive(cls)}
      </div>

      {/* Skill */}
      <div className="mt-2 w-full rounded-md bg-blue-900/30 px-3 py-2 text-sm text-blue-300">
        <span className="font-semibold">技能：</span>
        {cls.skill.name} — {cls.skill.description}
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClassDescription(id: ClassId): string {
  const descriptions: Record<ClassId, string> = {
    warrior: '近战猛攻，以力破巧',
    mage: '法术轰击，掌控元素',
    ranger: '百步穿杨，一击毙命',
    paladin: '神圣守护，愈战愈强',
    rogue: '暗影潜行，致命一击',
    druid: '自然之力，生生不息',
  };
  return descriptions[id] || '';
}

function describePassive(cls: ClassDef): string {
  const { type, value } = cls.passive;
  switch (type) {
    case 'attackPerk':
      return `攻击力 +${Math.round(value * 100)}%`;
    case 'comboStart':
      return `首次技能伤害 ×${value}`;
    case 'critAfterWrong':
      return `答错后 ${Math.round(value * 100)}% 暴击率`;
    case 'damageReduction':
      return `受伤 -${Math.round(value * 100)}%`;
    case 'critBonus':
      return `暴击率 +${Math.round(value * 100)}%`;
    case 'regen':
      return `每回合回复 ${Math.round(value * 100)}% 生命`;
    default:
      return String(value);
  }
}
