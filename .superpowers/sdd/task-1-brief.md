# Task 1: Project Scaffolding

This is the FIRST task of the Dragon Words project. It sets up the entire frontend project infrastructure.

## Steps

1. Run `npm create vite@latest . -- --template react-ts` (if the directory has existing contents, clear them first)
2. Run `npm install`
3. Run `npm install react-router-dom zustand framer-motion`
4. Run `npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom`
5. Write `vite.config.ts` — use the exact code from the plan below
6. Write `tsconfig.json` — strict mode, path alias `@/*` → `./src/*`
7. Write `src/index.css` with Tailwind import, D&D theme colors, `.game-active` class
8. Write `src/main.tsx` with StrictMode + App
9. Write `src/App.tsx` with minimal BrowserRouter (Route path="/" showing "Dragon Words" placeholder) 
10. Write `vitest.config.ts` — jsdom environment, `@/` alias
11. Create directory structure: `mkdir -p src/core/engine src/core/data src/core/utils src/stores src/components/ui src/components/battle src/components/adventure src/components/home src/components/shared src/hooks src/pages src/assets/images/monsters src/assets/images/classes src/assets/images/word-images src/assets/images/equipment src/assets/images/ui src/assets/sounds src/assets/fonts`
12. Verify: `npx vite --host` runs
13. `git add -A && git commit -m "feat: scaffold Vite + React + TS + Tailwind project"`

## Exact Code

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': '/src' } },
});
```

### src/index.css
```css
@import "tailwindcss";

@theme {
  --color-parchment: #f4e4c1;
  --color-parchment-dark: #d4b896;
  --color-blood: #8b0000;
  --color-gold: #ffd700;
  --color-magic: #7b2ff7;
  --color-dragon: #ff4500;
}

body {
  margin: 0;
  background: var(--color-parchment);
  font-family: 'Georgia', serif;
  -webkit-tap-highlight-color: transparent;
}

.game-active {
  user-select: none;
  -webkit-user-select: none;
}
```

### src/main.tsx
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
```

### src/App.tsx
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-parchment">
        <Routes>
          <Route path="/" element={<div className="p-8 text-center text-2xl">Dragon Words</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
```

## Global Constraints

- Platform: Web responsive, mobile-first
- Framework: React 18 + TypeScript 5 + Vite 5
- State: Zustand (not Redux)
- Animation: Framer Motion
- Styles: Tailwind CSS
- Tests: Vitest + Testing Library
- Pure logic layer: `core/` directory (zero React imports) — create it now

## Report

Write status to D:/reasonix/l9eng/.superpowers/sdd/task-1-report.md when done.
