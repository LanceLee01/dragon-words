// ---------------------------------------------------------------------------
// useTimer — countdown hook with expiry callback
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const reset = useCallback(
    (seconds?: number) => setRemaining(seconds ?? initialSeconds),
    [initialSeconds],
  );

  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current();
      return;
    }
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  return { remaining, reset, isUrgent: remaining <= 3 && remaining > 0 };
}
