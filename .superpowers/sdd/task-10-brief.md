# Task 10: Full Build, Test & Fix

Final verification pass before deployment.

## Steps
1. Run all tests: `npx vitest run` — all pass
2. Type check: `npx tsc --noEmit` — zero errors
3. Production build: `npm run build` — dist/ created successfully
4. Fix any issues found
5. Commit: "fix: final integration fixes and build verification"
