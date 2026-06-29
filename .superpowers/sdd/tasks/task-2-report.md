# Task 2 Report: Extend `stores/gameStore.ts`

## 1. Status

**DONE**

## 2. Commits Made

| SHA | Message |
|-----|---------|
| `7e289b0` | `feat(p1): extend gameStore with eventHistory, globalFlags, storyProgress` |

## 3. Test / Verification Results

- **TypeScript check:** `npx tsc --noEmit --pretty` — zero errors
- **Existing fields verified unchanged** via `git diff HEAD~1` — only the P1 fields were appended; `phase`, `fsm`, `words`, `setWords`, `sendEvent`, `setPhase`, `initWords` remain untouched.

## 4. Changes Made

### `src/stores/gameStore.ts`

**Interface** — added after `initWords`:
- `eventHistory: Array<{ id, timestamp, choice }>` — tracks event log
- `globalFlags: Set<string>` — persistent global flags
- `storyProgress: { unlockedBeats, galleryEntries }` — sets for beat/gallery unlocks
- 5 action method signatures: `addEventToHistory`, `setFlag`, `hasFlag`, `unlockStoryBeat`, `unlockGalleryEntry`

**Zustand creator** (`return { ... }`) — added after `initWords`:
- Initial state: `eventHistory: []`, `globalFlags: new Set()`, `storyProgress: { unlockedBeats: new Set(), galleryEntries: new Set() }`
- `addEventToHistory` — appends entry with `Date.now()` timestamp
- `setFlag` — adds flag via immutable `Set` copy
- `hasFlag` — simple `get().globalFlags.has(flag)` getter
- `unlockStoryBeat` — adds beatId to `storyProgress.unlockedBeats`
- `unlockGalleryEntry` — adds entryId to `storyProgress.galleryEntries`

## 5. Concerns

None.
