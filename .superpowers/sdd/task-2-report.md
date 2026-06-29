# Task 2: StoryPlayer Single-Page Mode — Done

## Changes Made

### `src/components/adventure/StoryPlayer.tsx`

1. **Added `useMemo` to React import** (line 4)
2. **Added `singlePage?: boolean` to `StoryPlayerProps`** (line 17)
3. **Added `SinglePageContent` component** (lines 164–261) — placed between `PanelContent` and `StoryPlayer`. It:
   - Collects all panel text into one string via `useMemo` and renders it through a single `TypewriterText`
   - Renders all image panels enlarged (`max-h-[70vh] object-contain`) in a scrollable container
   - Shows choice buttons at the bottom if a choice panel exists (calls `onChoice` then `onContinue`)
   - Shows a "继续 →" button that appears only after typewriter text completes (when no choice panel)
4. **Destructured `singlePage` prop** in the StoryPlayer function (line 257)
5. **Guarded auto-advance effect** — added `|| singlePage` to the early return (line 272), preventing timers from starting in single-page mode
6. **Render guards** for singlePage mode:
   - **ProgressBar** hidden when `singlePage` (line 354)
   - **PanelContent** replaced with `SinglePageContent` when `singlePage` (lines 359–367)
   - **Next/Close button** hidden when `singlePage` (line 371)

### `src/pages/BattlePage.tsx`

- Added `singlePage={true}` to the `<StoryPlayer>` invocation (line 705)

## Verification

- `npx tsc --noEmit` — passed with **zero errors**
- Existing panel-by-panel mode (`singlePage=false/undefined`) is **completely untouched** — all guards use `!singlePage` which keeps original code paths when the prop is absent/falsy
- Commit: `4412896` with message `feat: StoryPlayer single-page mode with enlarged images and continue button`
