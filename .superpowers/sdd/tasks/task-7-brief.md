# Task 7: Create TypewriterText.tsx shared UI component

**Files:**
- Create: `src/components/ui/TypewriterText.tsx`

**Interfaces:**
- Produces: `<TypewriterText text speed onComplete />`

## Implementation

Create `src/components/ui/TypewriterText.tsx`:

```tsx
import { useEffect, useState, useRef, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({ text, speed = 30, onComplete, className = '' }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayed(text);
    setDone(true);
    onComplete?.();
  }, [text, onComplete]);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    timerRef.current = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <span className={className} onClick={skip} style={{ cursor: done ? 'default' : 'pointer' }}>
      {displayed}
      {!done && <span className="animate-pulse">▌</span>}
    </span>
  );
}
```

## Verification

- `npx tsc --noEmit --pretty` — zero errors

## Commit

```
git add src/components/ui/TypewriterText.tsx
git commit -m "feat(p1): add shared TypewriterText component with skip-on-click"
```
