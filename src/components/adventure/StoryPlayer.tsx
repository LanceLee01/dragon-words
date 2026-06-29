// ---------------------------------------------------------------------------
// StoryPlayer — panel-by-panel story playback component
// ---------------------------------------------------------------------------
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { FlyReward } from '@/components/ui/FlyReward';
import type { StoryBeat, StoryPanel } from '@/core/data/story';

interface StoryPlayerProps {
  beat: StoryBeat;
  open: boolean;
  onComplete: (rewards: StoryBeat['rewards']) => void;
  onChoice?: (flag: string) => void;
  onClose: () => void;
  singlePage?: boolean;
}

// ── Character emotion → emoji mapping ──────────────────────────────────
const EMOTION_ICONS: Record<string, string> = {
  smile: '😊',
  serious: '😐',
  angry: '😠',
  sad: '😢',
  worried: '😟',
  laugh: '😈',
  proud: '😤',
  cry: '😭',
  surprised: '😲',
  amazed: '🤩',
  warm: '🥰',
  epic: '✨',
  info: 'ℹ️',
};

// ── Progress indicator bar ──────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-xs text-gray-400">
        {current + 1} / {total}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Panel content sub-component ─────────────────────────────────────────
function PanelContent({
  panel,
  onChoice,
}: {
  panel: StoryPanel;
  onChoice: (flag?: string) => void;
}) {
  const [selected, setSelected] = useState(false);

  const handleChoice = useCallback(
    (setFlag?: string) => {
      if (selected) return;
      setSelected(true);
      onChoice(setFlag);
    },
    [selected, onChoice],
  );

  return (
    <motion.div
      key={`${panel.type}-${panel.text?.slice(0, 20)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Image panel */}
      {panel.type === 'image' && (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex h-56 w-full items-center justify-center rounded-lg bg-gray-800">
            {panel.imagePath ? (
              <img
                src={`/assets/images/${panel.imagePath}.png`}
                alt={panel.text ?? ''}
                className="max-h-full max-w-full rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '🎨';
                }}
              />
            ) : (
              <span className="text-5xl">🎨</span>
            )}
          </div>
          {panel.text && (
            <p className="max-w-lg text-center text-lg leading-relaxed text-gray-200">
              <TypewriterText text={panel.text} speed={25} />
            </p>
          )}
        </div>
      )}

      {/* Text panel — character dialogue or narration */}
      {panel.type === 'text' && (
        <div className="flex w-full max-w-lg flex-col gap-4">
          {panel.character && (
            <div className="flex items-center gap-3 border-b border-gray-700 pb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-xl">
                {panel.character === '精灵向导' && '🧝'}
                {panel.character === '大法师' && '🧙'}
                {panel.character === '矮人长老' && '⛏️'}
                {panel.character === '暗黑骑士' && '⚫'}
                {panel.character === '远古红龙' && '🐉'}
                {panel.character === '系统' && '📖'}
                {!['精灵向导', '大法师', '矮人长老', '暗黑骑士', '远古红龙', '系统'].includes(panel.character) && '👤'}
              </span>
              <span className="text-lg font-semibold text-amber-300">{panel.character}</span>
              {panel.emotion && (
                <span className="text-sm text-gray-400" title={panel.emotion}>
                  {EMOTION_ICONS[panel.emotion] ?? ''}
                </span>
              )}
            </div>
          )}
          <div className="min-h-[4rem]">
            {panel.text && (
              <p className="text-lg leading-relaxed text-gray-100">
                <TypewriterText text={panel.text} speed={25} />
              </p>
            )}
          </div>
        </div>
      )}

      {/* Choice panel */}
      {panel.type === 'choice' && (
        <div className="flex w-full max-w-md flex-col gap-4">
          {panel.text && (
            <p className="mb-2 text-center text-lg text-gray-200">{panel.text}</p>
          )}
          {panel.choices?.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice.setFlag)}
              disabled={selected}
              className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-800/60 px-5 py-3 text-left text-white transition hover:border-amber-500 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{choice.text}</span>
              <span className="text-gray-500">{selected ? '✓' : '→'}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Single-page content (all panels at once) ────────────────────────────
function SinglePageContent({
  beat,
  onChoice,
  onContinue,
}: {
  beat: StoryBeat;
  onChoice: (flag?: string) => void;
  onContinue: () => void;
}) {
  const [textDone, setTextDone] = useState(false);
  const [selected, setSelected] = useState(false);
  const allText = useMemo(() =>
    beat.panels.filter(p => p.text).map(p => p.text!).join('\n\n'),
    [beat.panels]
  );
  const choicePanel = useMemo(() =>
    beat.panels.find(p => p.type === 'choice'),
    [beat.panels]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 overflow-y-auto max-h-[80vh]"
    >
      {/* Enlarged images */}
      {beat.panels.filter(p => p.type === 'image').map((panel, i) => (
        <div key={i} className="flex w-full max-w-3xl items-center justify-center overflow-hidden rounded-xl bg-gray-800">
          {panel.imagePath ? (
            <img
              src={`/assets/images/${panel.imagePath}.png`}
              alt={panel.text ?? ''}
              className="max-h-[70vh] w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                (e.target as HTMLImageElement).parentElement!.innerHTML = '🎨';
              }}
            />
          ) : (
            <span className="text-5xl">🎨</span>
          )}
        </div>
      ))}

      {/* Single typewriter for all text */}
      <div className="w-full max-w-2xl">
        <TypewriterText
          text={allText}
          speed={25}
          onComplete={() => setTextDone(true)}
          className="text-lg leading-relaxed text-gray-100 whitespace-pre-line"
        />
      </div>

      {/* Choices — show at bottom */}
      {choicePanel?.type === 'choice' && choicePanel.choices && (
        <div className="flex w-full max-w-md flex-col gap-4">
          {choicePanel.text && (
            <p className="mb-2 text-center text-lg text-gray-200">{choicePanel.text}</p>
          )}
          {choicePanel.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => {
                if (selected) return;
                setSelected(true);
                if (choice.setFlag) onChoice(choice.setFlag);
                onContinue();
              }}
              disabled={selected}
              className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-800/60 px-5 py-3 text-left text-white transition hover:border-amber-500 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{choice.text}</span>
              <span className="text-gray-500">{selected ? '✓' : '→'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Continue button — only after text fully typed */}
      {textDone && !choicePanel && (
        <button
          onClick={onContinue}
          className="mt-4 rounded-lg bg-amber-600 px-10 py-3 text-lg font-bold text-white transition hover:bg-amber-500 active:scale-95"
        >
          继续 →
        </button>
      )}
    </motion.div>
  );
}

// ── StoryPlayer ─────────────────────────────────────────────────────────
export function StoryPlayer({ beat, open, onComplete, onChoice, onClose, singlePage }: StoryPlayerProps) {
  const [panelIndex, setPanelIndex] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Reset when opening a new beat
  useEffect(() => {
    if (open) {
      setPanelIndex(0);
      setShowRewards(false);
    }
  }, [open, beat.id]);

  // Auto-advance for panels with a duration
  useEffect(() => {
    if (!open || singlePage) return;

    const currentPanel = beat.panels[panelIndex];
    if (!currentPanel || currentPanel.type === 'choice') return;
    if (!currentPanel.duration) return;

    const timer = setTimeout(() => {
      handleNext();
    }, currentPanel.duration);

    setAutoAdvanceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, panelIndex, beat.id]);

  const clearTimer = useCallback(() => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  }, [autoAdvanceTimer]);

  const handleNext = useCallback(() => {
    clearTimer();
    if (panelIndex < beat.panels.length - 1) {
      setPanelIndex(i => i + 1);
    } else {
      // Last panel — show rewards then complete
      setShowRewards(true);
    }
  }, [clearTimer, panelIndex, beat.panels.length]);

  const handleSkip = useCallback(() => {
    clearTimer();
    setPanelIndex(beat.panels.length - 1);
    setShowRewards(true);
  }, [clearTimer, beat.panels.length]);

  const handleChoice = useCallback(
    (flag?: string) => {
      clearTimer();
      if (flag && onChoice) {
        onChoice(flag);
      }
      handleNext();
    },
    [clearTimer, handleNext, onChoice],
  );

  const handleComplete = useCallback(() => {
    setShowRewards(false);
    onComplete(beat.rewards);
  }, [beat.rewards, onComplete]);

  const currentPanel = beat.panels[panelIndex];
  const isLastPanel = panelIndex === beat.panels.length - 1;

  return (
    <Modal open={open} onClose={showRewards ? undefined : onClose} variant="fullscreen">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            第 {beat.chapter} 章 ·{' '}
            {beat.format === 'comic' && '🎬'}
            {beat.format === 'dialogue' && '💬'}
            {beat.format === 'narration' && '📖'}
          </h2>
          {!showRewards && (
            <button
              onClick={handleSkip}
              className="rounded px-3 py-1 text-sm text-gray-400 transition hover:bg-gray-700 hover:text-white"
            >
              跳过 ⏭️
            </button>
          )}
        </div>

        {/* Progress */}
        {!showRewards && !singlePage && (
          <ProgressBar current={panelIndex} total={beat.panels.length} />
        )}

        {/* Panel content */}
        {!singlePage && (
          <AnimatePresence mode="wait">
            {!showRewards && currentPanel && (
              <PanelContent panel={currentPanel} onChoice={handleChoice} />
            )}
          </AnimatePresence>
        )}
        {singlePage && !showRewards && (
          <SinglePageContent beat={beat} onChoice={handleChoice} onContinue={handleComplete} />
        )}

        {/* Next / Close button (not for choice panels — choices auto-advance) */}
        {!showRewards && !singlePage && currentPanel && currentPanel.type !== 'choice' && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleNext}
              className="rounded-lg bg-amber-600 px-8 py-2 text-white transition hover:bg-amber-500"
            >
              {isLastPanel ? '完成' : '下一页 →'}
            </button>
          </div>
        )}

        {/* Rewards fly-in */}
        {showRewards && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-gray-300">— 章节完成 —</p>
            <FlyReward
              rewards={beat.rewards.map(r => ({
                type: r.type,
                amount: r.amount,
                icon: r.type === 'gold' ? '🪙' : r.type === 'xp' ? '⚡' : r.type === 'cosmetic' ? '✨' : r.type === 'galleryEntry' ? '🖼️' : undefined,
              }))}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
