/** Development-only debug panel for DDA state visualization */
interface DDADebugPanelProps {
  ddaState: { mistakeStreak: number; correctStreak: number; protectionLevel: number; challengeMode: boolean };
  onSimulateWrong: () => void;
  onSimulateCorrect: () => void;
  onReset: () => void;
}

// Only renders when import.meta.env.DEV is true
// Shows: Mistake Streak, Correct Streak, Protection Level, Challenge Mode
// Shows current modifier values
// Buttons: [Simulate Wrong] [Simulate Correct ×5] [Reset]

export function DDADebugPanel(props: DDADebugPanelProps) {
  if (!import.meta.env.DEV) return null;
  // ... implement with dark-themed debug panel
  const { ddaState, onSimulateWrong, onSimulateCorrect, onReset } = props;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-72 rounded-lg border border-amber-700/50 bg-gray-950/95 p-3 font-mono text-xs shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-amber-800/30 pb-1.5">
        <span className="font-bold uppercase tracking-wider text-amber-400/80">
          DDA Debug
        </span>
        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] text-amber-500/70">
          DEV
        </span>
      </div>

      {/* Streaks */}
      <div className="mb-1.5 grid grid-cols-2 gap-1">
        <div className="rounded bg-red-950/40 px-2 py-1">
          <span className="text-[10px] uppercase text-red-400/60">Mistake</span>
          <span className="ml-2 font-bold text-red-400">{ddaState.mistakeStreak}</span>
        </div>
        <div className="rounded bg-green-950/40 px-2 py-1">
          <span className="text-[10px] uppercase text-green-400/60">Correct</span>
          <span className="ml-2 font-bold text-green-400">{ddaState.correctStreak}</span>
        </div>
      </div>

      {/* Protection / Challenge */}
      <div className="mb-2 grid grid-cols-2 gap-1">
        <div className="rounded bg-blue-950/40 px-2 py-1">
          <span className="text-[10px] uppercase text-blue-400/60">Protection</span>
          <span className="ml-2 font-bold text-blue-400">Lv.{ddaState.protectionLevel}</span>
        </div>
        <div className="rounded bg-purple-950/40 px-2 py-1">
          <span className="text-[10px] uppercase text-purple-400/60">Challenge</span>
          <span className={`ml-2 font-bold ${ddaState.challengeMode ? 'text-purple-400' : 'text-gray-500'}`}>
            {ddaState.challengeMode ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-1">
        <button
          onClick={onSimulateWrong}
          className="flex-1 rounded bg-red-800/60 px-2 py-1 text-[11px] font-medium text-red-300 transition hover:bg-red-700/60 active:scale-95"
        >
          Simulate Wrong
        </button>
        <button
          onClick={onSimulateCorrect}
          className="flex-1 rounded bg-green-800/60 px-2 py-1 text-[11px] font-medium text-green-300 transition hover:bg-green-700/60 active:scale-95"
        >
          Simulate Correct ×5
        </button>
        <button
          onClick={onReset}
          className="rounded bg-gray-800/60 px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:bg-gray-700/60 active:scale-95"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
