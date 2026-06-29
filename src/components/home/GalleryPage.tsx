// ---------------------------------------------------------------------------
// GalleryPage — story gallery where players review unlocked story beats
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { STORY_BEATS, getStoryBeatsByChapter } from '@/core/data/story';
import { StoryPlayer } from '@/components/adventure/StoryPlayer';
import { resolveEnding, getEndingStoryBeat } from '@/core/engine/storyResolver';
import type { StoryBeat } from '@/core/data/story';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAPTER_NAMES: string[] = [
  '森林小径',       // 1
  '城堡大厅',       // 2
  '魔法学院',       // 3
  '精灵森林',       // 4
  '矮人矿坑',       // 5
  '幽暗地域',       // 6
  '龙脊山脉',       // 7
  '亡灵沼泽',       // 8
  '巨人平原',       // 9
  '终焉之塔',       // 10
  '深渊裂口',       // 11
  '天堂之门',       // 12
  '时光回廊',       // 13
  '龙之圣殿',       // 14
  '龙王之巢',       // 15
];

const TRIGGER_LABELS: Record<string, string> = {
  chapter_start: '章节开始',
  boss_pre: '首领战前',
  boss_post: '首领先前',
  hidden_event: '隐藏事件',
  perfect_clear: '完美通关',
  first_clear: '首次通关',
};

const TRIGGER_ICONS: Record<string, string> = {
  chapter_start: '📖',
  boss_pre: '⚔️',
  boss_post: '🏆',
  hidden_event: '❓',
  perfect_clear: '⭐',
  first_clear: '🎉',
};

const FORMAT_ICONS: Record<string, string> = {
  comic: '🎬',
  dialogue: '💬',
  narration: '📖',
};

// ---------------------------------------------------------------------------
// GalleryPage
// ---------------------------------------------------------------------------

export default function GalleryPage() {
  const navigate = useNavigate();
  const storyProgress = useGameStore((s) => s.storyProgress);
  const globalFlags = useGameStore((s) => s.globalFlags);
  const setFlag = useGameStore((s) => s.setFlag);

  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<StoryBeat | null>(null);

  const toggleChapter = (ch: number) => {
    setExpandedChapter((prev) => (prev === ch ? null : ch));
  };

  // Ending info
  const endingBeatSeal = getEndingStoryBeat('seal', STORY_BEATS);
  const endingBeatTame = getEndingStoryBeat('tame', STORY_BEATS);
  const hasSealEnding = endingBeatSeal ? storyProgress.unlockedBeats.has(endingBeatSeal.id) : false;
  const hasTameEnding = endingBeatTame ? storyProgress.unlockedBeats.has(endingBeatTame.id) : false;
  const resolvedEnding = resolveEnding(globalFlags);

  const handleBeatClick = (beat: StoryBeat) => {
    if (storyProgress.unlockedBeats.has(beat.id)) {
      setSelectedBeat(beat);
    }
  };

  const handleStoryComplete = () => {
    setSelectedBeat(null);
  };

  const handleStoryChoice = (flag: string) => {
    setFlag(flag);
  };

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a2e 100%)' }}
    >
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← 返回首页
        </button>
        <motion.h1
          className="text-2xl font-bold tracking-wide text-white sm:text-3xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🖼️ 故事图鉴
        </motion.h1>
        <div className="w-24" /> {/* spacer */}
      </div>

      {/* Ending summary (always visible if any ending is unlocked) */}
      {(hasSealEnding || hasTameEnding) && (
        <motion.div
          className="mx-auto mb-6 max-w-4xl rounded-xl border border-yellow-700/50 bg-yellow-900/20 p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-2 text-lg font-bold text-yellow-300">🏁 结局解锁</h2>
          <div className="flex flex-wrap gap-4">
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                hasSealEnding
                  ? 'bg-blue-900/40 text-blue-300'
                  : 'bg-gray-800/40 text-gray-600'
              }`}
            >
              <span>{hasSealEnding ? '🔓' : '🔒'}</span>
              <span className="font-semibold">
                封印结局 {hasSealEnding ? (resolvedEnding === 'seal' ? '👑' : '') : ''}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                hasTameEnding
                  ? 'bg-green-900/40 text-green-300'
                  : 'bg-gray-800/40 text-gray-600'
              }`}
            >
              <span>{hasTameEnding ? '🔓' : '🔒'}</span>
              <span className="font-semibold">
                驯服结局 {hasTameEnding ? (resolvedEnding === 'tame' ? '👑' : '') : ''}
              </span>
            </div>
          </div>
          {resolvedEnding && (hasSealEnding || hasTameEnding) && (
            <p className="mt-2 text-sm text-gray-400">
              当前路线：<span className="text-amber-300">{resolvedEnding === 'seal' ? '封印结局' : '驯服结局'}</span>
              {hasSealEnding && hasTameEnding && ' — 两种结局均已解锁！'}
            </p>
          )}
        </motion.div>
      )}

      {/* Chapter gallery */}
      <div className="mx-auto max-w-4xl space-y-3">
        {CHAPTER_NAMES.map((name, idx) => {
          const chapter = idx + 1;
          const beats = getStoryBeatsByChapter(chapter);
          const unlockedCount = beats.filter((b) => storyProgress.unlockedBeats.has(b.id)).length;
          const isExpanded = expandedChapter === chapter;

          return (
            <motion.div
              key={chapter}
              className="overflow-hidden rounded-xl border border-gray-700 bg-white/5 backdrop-blur-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              {/* Chapter row header */}
              <button
                onClick={() => toggleChapter(chapter)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-lg font-bold text-amber-400">
                    {chapter}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      第 {chapter} 章 · {name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {unlockedCount} / {beats.length} 已解锁
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-gray-700 sm:block">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: beats.length > 0 ? `${(unlockedCount / beats.length) * 100}%` : '0%',
                      }}
                    />
                  </div>
                  <span
                    className={`text-xl transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded beat list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-gray-700/50"
                  >
                    <div className="divide-y divide-gray-800/50 px-5 py-3">
                      {beats.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-500">
                          该章节暂无故事片段
                        </p>
                      )}
                      {beats.map((beat) => {
                        const unlocked = storyProgress.unlockedBeats.has(beat.id);
                        return (
                          <button
                            key={beat.id}
                            onClick={() => handleBeatClick(beat)}
                            disabled={!unlocked}
                            className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors ${
                              unlocked
                                ? 'cursor-pointer hover:bg-white/5'
                                : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {unlocked ? FORMAT_ICONS[beat.format] ?? '📄' : '🔒'}
                              </span>
                              <div>
                                <span className="text-sm font-medium text-white">
                                  {TRIGGER_LABELS[beat.trigger] ?? beat.trigger}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  {TRIGGER_ICONS[beat.trigger] ?? ''}
                                  {' · '}
                                  {beat.format === 'comic' && '漫画'}
                                  {beat.format === 'dialogue' && '对话'}
                                  {beat.format === 'narration' && '叙述'}
                                  {' · '}
                                  {beat.panels.length} 页
                                </span>
                              </div>
                            </div>
                            <span className="text-sm">
                              {unlocked ? (
                                <span className="text-amber-400">▶ 观看</span>
                              ) : (
                                <span className="text-gray-600">未解锁</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {CHAPTER_NAMES.every(
        (_, idx) => getStoryBeatsByChapter(idx + 1).length === 0,
      ) && (
        <div className="mt-20 text-center">
          <div className="mb-4 text-6xl">📭</div>
          <p className="text-xl text-gray-400">暂无故事数据</p>
        </div>
      )}

      {/* StoryPlayer modal */}
      {selectedBeat && (
        <StoryPlayer
          beat={selectedBeat}
          open={!!selectedBeat}
          onComplete={handleStoryComplete}
          onChoice={handleStoryChoice}
          onClose={() => setSelectedBeat(null)}
        />
      )}
    </div>
  );
}
