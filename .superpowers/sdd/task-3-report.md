# Task 3 Report: Question Card Text Enlargement

**Status:** DONE

## Summary

Applied all 9 CSS class changes to `src/components/battle/QuestionCard.tsx` to enlarge question card text 2-3x.

## Changes Applied

| # | Location | Old Class(es) | New Class(es) |
|---|----------|---------------|---------------|
| 1 | Main container (line 69) | `gap-6` | `gap-8` |
| 2 | POS subtype label (line 73) | `text-sm` | `text-xl` |
| 3 | POS stem display (line 77) | `text-xl` | `text-3xl` |
| 4 | POS explanation (line 82) | `text-sm` | `text-xl` |
| 5 | Word image container (line 93) | `h-56 w-56` | `h-64 w-64` |
| 6 | Question prompt text (line 158) | `text-lg` | `text-3xl` |
| 7 | Main word display (line 162) | `text-3xl` | `text-5xl` |
| 8 | Option buttons (line 188) | `px-4 py-3 text-sm` | `px-6 py-5 text-2xl` |
| 9 | Option label circles (line 196) | `h-7 w-7 text-xs` | `h-10 w-10 text-lg` |

## Verification

- `npx tsc --noEmit` passed with zero errors
- `git commit` succeeded on commit `764f512`
- No logic changes — only Tailwind class names were updated
