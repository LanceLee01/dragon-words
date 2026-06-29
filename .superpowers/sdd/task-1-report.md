# Task 1 Report — EventModal Action Navigation Fix

## Status: DONE

## What was done

Modified `src/App.tsx` to make the `handleLoginChoice` callback navigate to the battle page when the selected choice has `action === 'battle'`.

### Changes

1. **Import `useNavigate`** from `react-router-dom` (line 5) — was missing despite being referenced in the brief.

2. **Added `const navigate = useNavigate()`** call inside the component (after the `useEffect` block, before the callback).

3. **Replaced modal-close logic** (lines 107–108) with:
   - Find the selected choice via `loginEvent.choices.find((c) => c.id === choiceId)`
   - If `selectedChoice?.action === 'battle' && selectedChoice.actionPayload`, extract `{ chapter, level, monsterId }` and navigate to `/battle/${chapter}/${level}?monster=${monsterId}` (the `?monster=` param is only appended when `monsterId` exists).
   - Otherwise, close the modal (`setShowLoginEvent(false); setLoginEvent(null)`) as before.

4. **Added `navigate`** to the `useCallback` dependency array.

### Verification

- `npx tsc --noEmit` — passes with zero errors.
- Commit: `46273aa` with message `"fix: EventModal battle action now navigates to battle page"`.
