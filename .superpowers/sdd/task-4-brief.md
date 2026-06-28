# Task 4: Question Engine & Speech Engine

Create the question generation system and the speech (TTS) engine.

## Files

### 1. `src/core/utils/question.ts`
Pure functions (no React):

**`getQuestionTypeForRound(round: number): QuestionType`**
Returns 'en-to-cn' ~60% of the time, 'listen-to-cn' ~40%. Use a seeded approach based on `(round * 2654435761) % 100 < 60`.

**`generateOptions(allWords: Word[], correctChinese: string, excludeWordId: number): string[]`**
- Filter out the correct word + duplicates by chinese
- Randomly select 3 distractors
- If fewer than 3 available, pad with '???'
- Combine correct + 3 distractors, shuffle, return 4 items

**`generateQuestion(wordPool: Word[], usedWordIds: Set<number>, timeLimit: number, chapter: number, mistakeWords?: Word[]): Question | null`**
- If mistakeWords.length > 0 and Math.random() < 0.3: pick a random unused word from mistakeWords
- Otherwise: pick a random unused word from wordPool
- Generate 4 options via generateOptions
- `imagePath` = `/assets/images/word-images/${word.english}.png`
- Return Question or null if pool exhausted

### 2. `src/core/utils/question.test.ts`
Tests (TDD):
- `generateOptions` returns 4 options, includes correct answer, no duplicates
- `getQuestionTypeForRound` over 1000 calls: en-to-cn between 500-700
- `generateQuestion` returns valid Question with 4 options, timeLimit ≥ 8
- `generateQuestion` returns null when pool exhausted
- `generateQuestion` picks from mistakeWords ~30% of the time when available

### 3. `src/core/utils/speech.ts`
`SpeechEngine` class:
```typescript
class SpeechEngine {
  private synth: SpeechSynthesis | null
  private rate: number = 0.8
  private available: boolean

  constructor() // check window.speechSynthesis
  isAvailable(): boolean
  setRate(rate: number) // clamp 0.5-1.5
  speak(word: string): Promise<void> // synth.speak, onend/onerror wrapping
  cancel(): void
}
```
Export singleton: `export const speechEngine = new SpeechEngine()`

### 4. `src/hooks/useSpeech.ts`
React hook wrapping speechEngine:
```typescript
export function useSpeech() {
  const speakingRef = useRef(false);
  const speak = useCallback(async (word: string) => {
    if (speakingRef.current) return;
    speakingRef.current = true;
    try { await speechEngine.speak(word); }
    catch { /* silently fail */ }
    finally { speakingRef.current = false; }
  }, []);
  return { speak, isAvailable: speechEngine.isAvailable() };
}
```

## Global Constraints
- question.ts: pure TypeScript, no React
- speech.ts: browser-only (import guarded by singleton constructor)
- Path alias `@/` → `src/`

## Steps
1. Write `src/core/utils/question.test.ts`
2. `npx vitest run src/core/utils/question.test.ts` — FAIL
3. Write `src/core/utils/question.ts`
4. `npx vitest run src/core/utils/question.test.ts` — PASS
5. Write `src/core/utils/speech.ts`
6. Write `src/hooks/useSpeech.ts`
7. `npx tsc --noEmit` — zero errors
8. Commit: `feat: implement question engine and speech engine`
