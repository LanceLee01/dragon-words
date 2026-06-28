# Task 4: Create the AnswerLog component

**Status**: ✅ Completed

## File Created

- `src/components/battle/AnswerLog.tsx` — `<AnswerLog>` component showing a scrollable left panel of answer history with auto-scroll to bottom.

## TypeScript Verification

```
$ npx tsc --noEmit
# exit code 0, no errors
```

## Component Summary

The `AnswerLog` component:

- Reads `battle.log` from the Zustand `useBattleStore` (defaulting to `[]` when no battle exists).
- Uses a `useRef` + `useEffect` to auto-scroll to the bottom whenever the log length changes.
- When the log is empty, renders a centered "暂无记录" (no records) placeholder.
- Renders each log entry with:
  - A left border strip (green for correct, red for incorrect).
  - Turn number, English word, Chinese translation.
  - Correct/incorrect indicator and question type.

## Commit

```
git commit -m "feat: add AnswerLog component for left panel"
```
