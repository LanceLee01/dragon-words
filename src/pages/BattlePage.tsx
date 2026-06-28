// ---------------------------------------------------------------------------
// BattlePage — main battle gameplay screen
// ---------------------------------------------------------------------------
import { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattleStore } from '@/stores/battleStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useSound } from '@/hooks/useSound';
import { HealthBar } from '@/components/shared/HealthBar';
import { Timer } from '@/components/shared/Timer';
import { ComboDisplay } from '@/components/shared/ComboDisplay';
import { QuestionCard } from '@/components/battle/QuestionCard';
import { VictoryScreen } from '@/components/battle/VictoryScreen';
import { DefeatScreen } from '@/components/battle/DefeatScreen';

export default function BattlePage() {
  const { chapter: chapterParam, level: levelParam } = useParams<{
    chapter: string;
    level: string;
  }>();
  const navigate = useNavigate();

  const ch = Number(chapterParam) || 1;
  const lv = Number(levelParam) || 1;

  // Stores
  const battle = useBattleStore((s) => s.battle);
  const monster = useBattleStore((s) => s.monster);
  const currentQuestion = useBattleStore((s) => s.currentQuestion);
  const lastAnswerCorrect = useBattleStore((s) => s.lastAnswerCorrect);
  const initBattle = useBattleStore((s) => s.initBattle);
  const submitAnswer = useBattleStore((s) => s.submitAnswer);
  const useSkillAction = useBattleStore((s) => s.useSkillAction);
  const nextRound = useBattleStore((s) => s.nextRound);
  const finishMonsterTurn = useBattleStore((s) => s.finishMonsterTurn);
  const resetBattle = useBattleStore((s) => s.resetBattle);

  const player = usePlayerStore((s) => s.player);
  const addGold = usePlayerStore((s) => s.addGold);
  const addXp = usePlayerStore((s) => s.addXp);
  const completeLevel = usePlayerStore((s) => s.completeLevel);
  const healToFull = usePlayerStore((s) => s.healToFull);

  const sendEvent = useGameStore((s) => s.sendEvent);

  // Sound
  const { play, playAttackSequence, setClass } = useSound();

  // Prevent double-submissions
  const answeredRef = useRef(false);

  // -----------------------------------------------------------------------
  // Init battle on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    initBattle(ch, lv);
    return () => {
      resetBattle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch, lv]);

  // Set player class for sound engine on mount or when class changes
  useEffect(() => {
    if (player.classId) {
      setClass(player.classId);
    }
  }, [player.classId, setClass]);

  // -----------------------------------------------------------------------
  // Timer — sync'd to current question's timeLimit
  // -----------------------------------------------------------------------

  const handleTimerExpire = useCallback(() => {
    if (!currentQuestion || answeredRef.current) return;
    // Auto-submit a wrong answer on timeout
    answeredRef.current = true;
    submitAnswer('');
  }, [currentQuestion, submitAnswer]);

  const { remaining, reset: resetTimer, isUrgent } = useTimer(
    currentQuestion?.timeLimit ?? 10,
    handleTimerExpire,
  );

  // Reset timer when a new question appears
  useEffect(() => {
    if (currentQuestion) {
      answeredRef.current = false;
      resetTimer(currentQuestion.timeLimit);
    }
  }, [currentQuestion, resetTimer]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleAnswer = useCallback(
    (selected: string) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const wasCorrect = submitAnswer(selected);
    },
    [submitAnswer],
  );

  const handleNextRound = useCallback(() => {
    nextRound();
  }, [nextRound]);

  // Play sounds when phase changes
  const prevPhaseRef = useRef(battle?.phase);
  useEffect(() => {
    if (!battle) return;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = battle.phase;

    if (battle.phase === 'result' && prevPhase === 'question') {
      playAttackSequence();
      if (battle.combo >= 3) {
        setTimeout(() => play('combo'), 500);
      }
    }
    if (battle.phase === 'monster-turn' && prevPhase === 'question') {
      play('playerHit');
    }
    if (battle.phase === 'victory' && prevPhase !== 'victory') {
      play('victory');
    }
    if (battle.phase === 'defeat' && prevPhase !== 'defeat') {
      play('defeat');
    }
  }, [battle?.phase, battle?.status, battle?.combo, play, playAttackSequence]);

  const handleContinue = useCallback(() => {
    finishMonsterTurn();
  }, [finishMonsterTurn]);

  const handleUseSkill = useCallback(() => {
    useSkillAction(0);
  }, [useSkillAction]);

  // Play skill sound when charge resets (skill was used)
  const prevChargeRef = useRef(battle?.charge);
  useEffect(() => {
    if (!battle) return;
    const prevCharge = prevChargeRef.current;
    prevChargeRef.current = battle.charge;
    if (prevCharge === 5 && battle.charge < 5 && battle.phase === 'question') {
      play('skill');
    }
  }, [battle?.charge, battle?.phase, play]);

  const handleVictoryContinue = useCallback(() => {
    // Award rewards
    const goldReward = 50 + lv * 10;
    const xpReward = 100;
    addGold(goldReward);
    addXp(xpReward);

    // Complete the level and heal
    const levelKey = `${ch}-${lv}`;
    completeLevel(levelKey, ch);
    healToFull();

    // Send event and navigate
    sendEvent('BATTLE_WIN');
    navigate('/map');
  }, [ch, lv, addGold, addXp, completeLevel, healToFull, sendEvent, navigate]);

  const handleRetry = useCallback(() => {
    resetBattle();
    initBattle(ch, lv);
  }, [ch, lv, resetBattle, initBattle]);

  const handleLeave = useCallback(() => {
    resetBattle();
    navigate('/map');
  }, [resetBattle, navigate]);

  // -----------------------------------------------------------------------
  // Determine display phase
  // -----------------------------------------------------------------------

  const isVictory = battle?.phase === 'victory';
  const isDefeat = battle?.phase === 'defeat';
  const isResult = lastAnswerCorrect === true && !isVictory && !isDefeat;
  const isMonsterTurn =
    battle?.phase === 'monster-turn' && !isVictory && !isDefeat;
  const isQuestion =
    battle?.phase === 'question' &&
    lastAnswerCorrect === null &&
    !isVictory &&
    !isDefeat;

  // Guard: not initialised yet
  if (!battle || !monster) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">加载中...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* ===== Top HUD ===== */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex-1">
          <HealthBar
            current={battle.playerHp}
            max={battle.playerMaxHp}
            label="玩家"
            color="bg-green-600"
          />
        </div>

        <div className="shrink-0">
          <Timer remaining={remaining} isUrgent={isUrgent} />
        </div>

        <div className="flex-1">
          <HealthBar
            current={battle.monsterHp}
            max={battle.monsterMaxHp}
            label={monster.name}
            color="bg-red-600"
          />
        </div>
      </div>

      {/* ===== Combo Display ===== */}
      <div className="flex justify-center py-2">
        <ComboDisplay combo={battle.combo} />
      </div>

      {/* ===== Main content area ===== */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {isVictory && (
            <motion.div
              key="victory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <VictoryScreen
                gold={50 + lv * 10}
                xp={100}
                onContinue={handleVictoryContinue}
              />
            </motion.div>
          )}

          {isDefeat && (
            <motion.div
              key="defeat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <DefeatScreen onRetry={handleRetry} onLeave={handleLeave} />
            </motion.div>
          )}

          {isResult && (
            <motion.div
              key="result"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="text-6xl">✅</span>
              <p className="text-2xl font-bold text-green-400">正确!</p>
              <button
                onClick={handleNextRound}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                下一题 →
              </button>
            </motion.div>
          )}

          {isMonsterTurn && (
            <motion.div
              key="monster-turn"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="text-6xl">❌</span>
              <p className="text-2xl font-bold text-red-400">答错了!</p>

              {currentQuestion && (
                <p className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 px-6 py-3 text-center">
                  <span className="text-sm text-gray-400">正确答案：</span>
                  <br />
                  <span className="text-xl font-bold text-yellow-300">
                    {currentQuestion.correctAnswer}
                  </span>
                </p>
              )}

              <p className="text-sm text-gray-400">
                ⚔️ {monster.name} 对你造成了 <span className="font-bold text-red-400">{monster.attack}</span> 点伤害！
              </p>

              <button
                onClick={handleContinue}
                className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                继续 →
              </button>
            </motion.div>
          )}

          {isQuestion && currentQuestion && (
            <motion.div
              key="question"
              className="w-full"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={answeredRef.current}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== Skill button (bottom) ===== */}
      <div className="flex justify-center pb-6">
        {battle.charge >= 5 && !isVictory && !isDefeat && (
          <motion.button
            onClick={handleUseSkill}
            className="rounded-xl bg-purple-700 px-8 py-3 text-lg font-bold text-white shadow-lg shadow-purple-700/50"
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: [
                '0 0 15px rgba(168, 85, 247, 0.4)',
                '0 0 30px rgba(168, 85, 247, 0.7)',
                '0 0 15px rgba(168, 85, 247, 0.4)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚡ 释放技能
          </motion.button>
        )}
      </div>
    </div>
  );
}
