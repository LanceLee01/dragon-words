// ---------------------------------------------------------------------------
// useSound — React hook wrapping SoundEngine
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef } from 'react';
import { soundEngine, type SoundEvent } from '../core/utils/sound';

/**
 * React hook for playing game sounds via the singleton SoundEngine.
 *
 * Automatically preloads on mount (once, globally).
 *
 * @example
 * ```tsx
 * const { play, setClass } = useSound();
 * setClass('warrior');
 * <button onClick={() => play('playerAttack')}>Attack!</button>
 * ```
 */
export function useSound() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      soundEngine.preload().catch(() => {
        // Howler preload failures are non-fatal
      });
    }
  }, []);

  const play = useCallback((event: SoundEvent, opts?: { rate?: number; volume?: number }) => {
    soundEngine.play(event, opts);
  }, []);

  const playAttackSequence = useCallback(() => {
    soundEngine.playAttackSequence();
  }, []);

  const setClass = useCallback((classId: import('../core/data/types').ClassId | null) => {
    soundEngine.setClass(classId);
  }, []);

  return { play, playAttackSequence, setClass };
}
