# Task 2: StoryPlayer Single-Page Mode

## Context

Part of Battle UI Enhancement & Event Fix plan. Refactor the StoryPlayer to support a `singlePage` mode where all story content (images + text + choices) is shown on one page, with enlarged images and a continue button that appears only after all typewriter text completes.

## Requirements

**Files to modify:**
1. `src/components/adventure/StoryPlayer.tsx` — add singlePage prop and SinglePageContent component
2. `src/pages/BattlePage.tsx` — pass `singlePage={true}` to StoryPlayer

### Changes to StoryPlayer.tsx:

**1. Add `singlePage?: boolean` prop to StoryPlayerProps interface**

```typescript
interface StoryPlayerProps {
  beat: StoryBeat;
  open: boolean;
  onComplete: (rewards: StoryBeat['rewards']) => void;
  onChoice?: (flag: string) => void;
  onClose: () => void;
  singlePage?: boolean;  // NEW
}
```

**2. Add SinglePageContent component** (after PanelContent, before StoryPlayer)

Use this simpler approach — collect all text into one string with TypewriterText:

```typescript
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
                if (choice.setFlag) onChoice(choice.setFlag);
                onContinue();
              }}
              className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-800/60 px-5 py-3 text-left text-white transition hover:border-amber-500 hover:bg-gray-700"
            >
              <span>{choice.text}</span>
              <span className="text-gray-500">→</span>
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
```

**3. In StoryPlayer's render, conditionally show SinglePageContent:**

Replace the portion between the ProgressBar and rewards section. When `singlePage` is true:
- Show `<SinglePageContent beat={beat} onChoice={handleChoice} onContinue={handleComplete} />`
- Skip auto-advance timers (need to guard the useEffect that uses panelIndex)
- Hide the ProgressBar and panel navigation buttons

When `singlePage` is false/undefined, keep existing behavior unchanged.

### Changes to BattlePage.tsx:

Find the `<StoryPlayer>` component usage (around line 701-717) and add `singlePage={true}`.

### Imports needed
In StoryPlayer.tsx, `useMemo` is needed (already imported from 'react' at line 4).

### Global constraints
- All changes must compile with `tsc -b` without errors
- No new dependencies
- Follow existing code patterns
- Keep all existing functionality working — singlePage=false mode must be unchanged

## Deliverable

Write the changes, verify `npx tsc --noEmit` passes, and commit:
```
git add src/components/adventure/StoryPlayer.tsx src/pages/BattlePage.tsx
git commit -m "feat: StoryPlayer single-page mode with enlarged images and continue button"
```
