// ---------------------------------------------------------------------------
// useSound — React hook wrapping lightweight Audio API SoundEngine
// ---------------------------------------------------------------------------
import { useCallback, useEffect } from 'react';
import { soundEngine, type SoundEvent } from '../core/utils/sound';

export function useSound() {
  // Mark loaded so parent components know we're ready
  useEffect(() => {
    soundEngine.unlock();
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
