// ---------------------------------------------------------------------------
// React hook wrapping the SpeechEngine singleton
// ---------------------------------------------------------------------------
import { useCallback, useRef } from 'react';
import { speechEngine } from '@/core/utils/speech';

/**
 * React hook providing a `speak` function and `isAvailable` flag.
 *
 * Uses a ref to prevent overlapping speech calls — if a word is already
 * being spoken, subsequent calls are silently ignored.
 */
export function useSpeech() {
  const speakingRef = useRef(false);

  const speak = useCallback(async (word: string) => {
    if (speakingRef.current) return;
    speakingRef.current = true;
    try {
      await speechEngine.speak(word);
    } catch {
      /* silently fail */
    } finally {
      speakingRef.current = false;
    }
  }, []);

  return { speak, isAvailable: speechEngine.isAvailable() };
}
