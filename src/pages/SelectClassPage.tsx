// ---------------------------------------------------------------------------
// SelectClassPage — first pick word level, then pick a class
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { BASE_CLASSES } from '@/core/data/classes';
import type { ClassDef, ClassId, WordLevel } from '@/core/data/types';

export default function SelectClassPage() {
  const navigate = useNavigate();
  const selectClass = usePlayerStore((s) => s.selectClass);
  const selectWordLevel = usePlayerStore((s) => s.selectWordLevel);
  const sendEvent = useGameStore((s) => s.sendEvent);

  const [step, setStep] = useState<'level' | 'class'>('level');
  const [selectedLevel, setSelectedLevel] = useState<WordLevel>('primary');
  const classes = Object.values(BASE_CLASSES);

  const handleLevelSelect = (level: WordLevel) => {
    setSelectedLevel(level);
    selectWordLevel(level);
    setStep('class');
  };

  const handleClassSelect = (id: ClassId) => {
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
      {step === 'level' ? (
        <LevelPicker onSelect={handleLevelSelect} />
      ) : (
        <>
          {/* Back button */}
          <button
            onClick={() => setStep('level')}
            className="mb-4 self-start text-sm text-gray-400 hover:text-white"
          >
            ← 返回选择难度
          </button>

          {/* Title */}
          <motion.h1
            className="mb-10 text-3xl font-bold tracking-widest text-white sm:text-4xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            选择你的职业
          </motion.h1>

          {/* Class grid */}
          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls, i) => (
              <ClassCard key={cls.id} cls={cls} index={i} onSelect={handleClassSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level Picker
// ---------------------------------------------------------------------------

function LevelPicker({ onSelect }: { onSelect: (level: WordLevel) => void }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.h1
        className="text-3xl font-bold tracking-widest text-white sm:text-4xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        选择单词难度
      </motion.h1>

      <p className="text-gray-400 text-center max-w-md">
        根据你的学习阶段选择词汇范围，后续可在设置中切换
      </p>

      <div className="flex flex-col gap-6 sm:flex-row">
        <motion.button
          onClick={() => onSelect('primary')}
          className="flex w-56 flex-col items-center rounded-xl border-2 border-green-700 bg-green-900/20 p-8
                     transition-colors hover:border-green-500 hover:bg-green-900/40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-5xl">📚</span>
          <h2 className="mt-4 text-xl font-bold text-green-300">小学词汇</h2>
          <p className="mt-2 text-sm text-gray-400">505 个基础单词</p>
          <p className="mt-1 text-xs text-gray-500">第 1 ~ 5 章</p>
          <div className="mt-4 rounded-full bg-green-800/50 px-4 py-1 text-sm text-green-300">
            ⭐ 推荐
          </div>
        </motion.button>

        <motion.button
          onClick={() => onSelect('middle')}
          className="flex w-56 flex-col items-center rounded-xl border-2 border-purple-700 bg-purple-900/20 p-8
                     transition-colors hover:border-purple-500 hover:bg-purple-900/40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-5xl">📖</span>
          <h2 className="mt-4 text-xl font-bold text-purple-300">初中词汇</h2>
          <p className="mt-2 text-sm text-gray-400">2018 个核心单词</p>
          <p className="mt-1 text-xs text-gray-500">第 6 ~ 15 章</p>
          <div className="mt-4 rounded-full bg-purple-800/50 px-4 py-1 text-sm text-purple-300">
            🏆 挑战
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Class Card
// ---------------------------------------------------------------------------

const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  ranger: '🏹',
  paladin: '🛡️',
  rogue: '🗡️',
  druid: '🌿',
};

function getPassiveText(cls: ClassDef): string {
  const types: Record<string, string> = {
    attackPerk: `攻击力 +${Math.round(cls.passive.value * 100)}%`,
    comboStart: `首次技能伤害 ×${cls.passive.value}`,
    critAfterWrong: `答错后 ${Math.round(cls.passive.value * 100)}% 暴击率`,
    damageReduction: `受伤 -${Math.round(cls.passive.value * 100)}%`,
    critBonus: `暴击率 +${Math.round(cls.passive.value * 100)}%`,
    regen: `每回合回复 ${Math.round(cls.passive.value * 100)}% 生命`,
  };
  return types[cls.passive.type] || `${cls.passive.type}: ${cls.passive.value}`;
}

function getClassDesc(id: ClassId): string {
  const desc: Record<ClassId, string> = {
    warrior: '近战猛攻，以力破巧',
    mage: '法术轰击，掌控元素',
    ranger: '百步穿杨，一击毙命',
    paladin: '神圣守护，愈战愈强',
    rogue: '暗影潜行，致命一击',
    druid: '自然之力，生生不息',
  };
  return desc[id] || '';
}

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
      className="flex flex-col items-center rounded-xl border border-gray-700 bg-white/5 p-6
                 text-left backdrop-blur-sm transition-colors hover:border-amber-500 hover:bg-white/10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="text-5xl sm:text-6xl">{CLASS_ICONS[cls.id] || '❓'}</span>
      <h2 className="mt-4 text-xl font-bold text-white">{cls.name}</h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-400">{getClassDesc(cls.id)}</p>
      <div className="mt-4 w-full rounded-md bg-green-900/30 px-3 py-2 text-sm text-green-300">
        <span className="font-semibold">被动：</span>
        {getPassiveText(cls)}
      </div>
      <div className="mt-2 w-full rounded-md bg-blue-900/30 px-3 py-2 text-sm text-blue-300">
        <span className="font-semibold">技能：</span>
        {cls.skill.name} — {cls.skill.description}
      </div>
    </motion.button>
  );
}
