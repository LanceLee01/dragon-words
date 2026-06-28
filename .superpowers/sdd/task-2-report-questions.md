# Task 2 Report: 权重配置 + 轮盘出题算法 + 3 个生成器 + 测试

## Status: DONE

## Commits made

```
1b7bc0f feat: weighted question type roulette + 3 new generators
```

## Files changed

| File | Action |
|------|--------|
| `src/core/data/balance.ts` | **Created** — `QUESTION_TYPE_WEIGHTS` config + `pickQuestionType` weighted roulette |
| `src/core/utils/question.ts` | **Modified** — added `generateSpellQuestion`, `generatePosQuestion`, `generateMatchQuestion`; refactored `generateQuestion` to accept `isBoss` param and dispatch via wheel + generators |
| `src/core/utils/question.test.ts` | **Modified** — updated existing tests + added new test suites for all new functions |

## Test results

```
npx tsc --noEmit → pass (no errors)
npx vitest run   → 79 passed (4 files), 976ms
```

All previous 64 tests preserved; 15 new tests added for:
- `generateSpellQuestion` (4 tests) — difficulty-based letter extraction, short-word edge case, structure, default difficulty 2
- `generateMatchQuestion` (3 tests) — returns 5 pairs, correct structure, tiny pool edge case
- `pickQuestionType` (3 tests) — never match on boss, valid types only, match appears on non-boss
- `generatePosQuestion` (2 tests) — returns null on data-less word, valid question on word with collocations
- `generateQuestion` updated (6 tests) — round-0 type, exhaustion null, mistake pool, imagePath, spell guarantee on round 2, boss excludes match, fallback on null POS

## Implementation summary

### 1. `balance.ts`
- Exports `QUESTION_TYPE_WEIGHTS: Record<QuestionType, number>` with weights summing to 1.0
- Exports `pickQuestionType(weights, round, isBoss)` — deterministic LCG hash `(round * 2654435761) % 1000 / 1000`; filters out `'match'` on boss levels

### 2. Three generators in `question.ts`

**`generateSpellQuestion(word, timeLimit)`**
- Maps `difficulty` (1→3, 2→4, 3→5) to target letter count
- Clamps to word length if shorter
- Returns `SpellQuestion` with uppercase `targetLetters[]`, `maxLength`, `chineseHint`, `timeLimit + 2`

**`generatePosQuestion(word, wordPool, timeLimit)`**
- 60 % collocation / 40 % wordForm split
- Collocation: picks random collocation from `word.collocations`; distractors from other words' collocations
- WordForm: picks random POS variant from `word.posVariants`; distractors from other variants
- Returns `null` if data insufficient (caller falls back to `word-meaning`)

**`generateMatchQuestion(wordPool, timeLimit)`**
- Shuffles pool, takes 5 words, creates `MatchPair[]` (left = English, right = Chinese)
- Shuffles pairs for display; sets fixed `timeLimit: 30` and reward

### 3. Refactored `generateQuestion`
- Added optional `isBoss?: boolean` parameter
- Uses `pickQuestionType(QUESTION_TYPE_WEIGHTS, round, boss)` for type selection
- Spell guarantee: every 3rd question (round % 3 === 2) forces `'spell'`
- Dispatches via `switch` statement; `pos` null → fallback to `word-meaning`

## Concerns

None. All checks pass and the API is backward-compatible (existing callers omit the optional `isBoss` param).
