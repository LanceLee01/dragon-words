// ---------------------------------------------------------------------------
// BattlePage — main battle gameplay screen
// ---------------------------------------------------------------------------
import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattleStore } from '@/stores/battleStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { useTimer } from '@/hooks/useTimer';
import { useSound } from '@/hooks/useSound';
import { HealthBar } from '@/components/shared/HealthBar';
import { Timer } from '@/components/shared/Timer';
import { ComboDisplay } from '@/components/shared/ComboDisplay';
import { AnswerLog } from '@/components/battle/AnswerLog';
import { CombatLog } from '@/components/battle/CombatLog';

// Portrait assets
const CLASS_NAMES: Record<string, string> = {
  warrior: '战士', mage: '法师', ranger: '游侠',
  paladin: '圣骑士', rogue: '盗贼', druid: '德鲁伊',
};
const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️', mage: '🔮', ranger: '🏹',
  paladin: '🛡️', rogue: '🗡️', druid: '🌿',
};
const CLASS_PORTRAITS: Record<string, string> = {
  warrior: '/assets/images/classes/warrior.png',
  mage: '/assets/images/classes/mage.png',
  ranger: '/assets/images/classes/ranger.png',
  paladin: '/assets/images/classes/paladin.png',
  rogue: '/assets/images/classes/rogue.png',
  druid: '/assets/images/classes/druid.png',
};
const MONSTER_ICONS: Record<string, string> = {
  goblin: '👺', skeleton: '💀', apprentice: '🧙', shadowwolf: '🐺',
  gargoyle: '🗿', troglodyte: '🦎', harpy: '🦅', ghost: '👻',
  ogre: '👹', succubus: '😈', demonhound: '🐲', fallenAngel: '👼',
  timeGhost: '⏳', dragonborn: '🐉', eliteGuard: '🛡️',
  goblinKing: '👑', deathKnight: '⚫', archmage_boss: '🔵',
  treantElder: '🌳', lavaGiant: '🌋', drowElf: '🏹',
  wyvern: '🦎', lichKing: '☠️', stormGiant: '⚡',
  darkKnight: '🖤', abyssalLord: '👿', archangel: '👼',
  timeKeeper: '⌛', dracolich: '☠️', ancientRed: '🐉',
};

/** Monster portrait image paths */
const MONSTER_PORTRAITS: Record<string, string> = {};
// Filled from generated files
const monsterNames = [
  'goblin','skeleton','apprentice','shadowwolf','gargoyle','troglodyte',
  'harpy','ghost','ogre','succubus','demonhound','fallenAngel',
  'timeGhost','dragonborn','eliteGuard','goblinKing','deathKnight',
  'archmage_boss','treantElder','lavaGiant','drowElf','wyvern',
  'lichKing','stormGiant','darkKnight','abyssalLord','archangel',
  'timeKeeper','dracolich','ancientRed',
];
for (const name of monsterNames) {
  MONSTER_PORTRAITS[name] = `/assets/images/monsters/${name}.png`;
}
import { QuestionRenderer } from '@/components/battle/QuestionRenderer';
import { VictoryScreen } from '@/components/battle/VictoryScreen';
import { DefeatScreen } from '@/components/battle/DefeatScreen';
import type { TranslateQuestion, SpellQuestion, PosQuestion } from '@/core/data/types';
import { EQUIPMENT } from '@/core/data/equipment';
import { BASE_CLASSES, ADVANCED_CLASSES } from '@/core/data/classes';
import { getPlayerAttack, getPlayerDefense } from '@/core/engine/battle';
import { StoryPlayer } from '@/components/adventure/StoryPlayer';
import { getStoryBeatForTrigger } from '@/core/data/story';
import type { StoryBeat } from '@/core/data/story';

export default function BattlePage() {
  const { chapter: chapterParam, level: levelParam } = useParams<{
    chapter: string;
    level: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ch = Number(chapterParam) || 1;
  const lv = Number(levelParam) || 1;
  const monsterOverride = searchParams.get('monster');

  // Stores
  const battle = useBattleStore((s) => s.battle);
  const monster = useBattleStore((s) => s.monster);
  const currentQuestion = useBattleStore((s) => s.currentQuestion);
  const lastAnswerCorrect = useBattleStore((s) => s.lastAnswerCorrect);
  const initBattle = useBattleStore((s) => s.initBattle);
  const submitAnswer = useBattleStore((s) => s.submitAnswer);
  const matchConnect = useBattleStore((s) => s.matchConnect);
  const nextRound = useBattleStore((s) => s.nextRound);
  const finishMonsterTurn = useBattleStore((s) => s.finishMonsterTurn);
  const resetBattle = useBattleStore((s) => s.resetBattle);

  const player = usePlayerStore((s) => s.player);
  const addGold = usePlayerStore((s) => s.addGold);
  const addXp = usePlayerStore((s) => s.addXp);
  const completeLevel = usePlayerStore((s) => s.completeLevel);
  const healToFull = usePlayerStore((s) => s.healToFull);

  const sendEvent = useGameStore((s) => s.sendEvent);
  const unlockStoryBeat = useGameStore((s) => s.unlockStoryBeat);

  // Pending story beat to show after level clear
  const [pendingStoryBeat, setPendingStoryBeat] = useState<StoryBeat | null>(null);
  const [showStory, setShowStory] = useState(false);

  // Sound
  const { play, playAttackSequence, setClass } = useSound();

  // Prevent double-submissions
  const answeredRef = useRef(false);

  // -----------------------------------------------------------------------
  // Init battle on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    initBattle(ch, lv, monsterOverride || undefined);
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
    (selected: string | number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      submitAnswer(String(selected));
    },
    [submitAnswer],
  );

  const handleMatchConnect = useCallback(
    (leftWordId: number, rightWordId: number) => {
      matchConnect(leftWordId, rightWordId);
    },
    [matchConnect],
  );

  // Play sounds when phase changes
  const prevPhaseRef = useRef(battle?.phase);
  const prevStatusRef = useRef(battle?.status);
  useEffect(() => {
    if (!battle) return;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = battle.phase;
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = battle.status;

    if (battle.phase === 'result' && prevPhase === 'question') {
      playAttackSequence();
      if (battle.combo >= 3) {
        setTimeout(() => play('combo'), 500);
      }
    }
    if (battle.status === 'won' && prevStatus !== 'won') {
      play('victory');
    }
    if (battle.status === 'lost' && prevStatus !== 'lost') {
      play('defeat');
    }
  }, [battle?.phase, battle?.status, battle?.combo, play, playAttackSequence]);

  // Play playerHit sound when monster deals damage (works for both correct and wrong)
  const prevDamageRef = useRef(battle?.lastDamageTaken);
  useEffect(() => {
    if (!battle) return;
    const prev = prevDamageRef.current;
    prevDamageRef.current = battle.lastDamageTaken;
    if (battle.lastDamageTaken > 0 && prev === 0) {
      play('playerHit');
    }
  }, [battle?.lastDamageTaken, play]);

  // Auto-advance from result screen to monster turn after 2 seconds
  useEffect(() => {
    if (!battle || !lastAnswerCorrect) return;
    if (battle.phase === 'result' && battle.status === 'ongoing') {
      const timer = setTimeout(() => finishMonsterTurn(), 4000);
      return () => clearTimeout(timer);
    }
  }, [battle?.phase, battle?.status, lastAnswerCorrect, finishMonsterTurn]);

  const handleContinue = useCallback(() => {
    finishMonsterTurn();
  }, [finishMonsterTurn]);

  // Pre-compute story beat when battle is won (before user clicks continue)
  const wonRef = useRef(false);
  useEffect(() => {
    if (!battle) return;
    if (battle.status === 'won' && !wonRef.current) {
      wonRef.current = true;
      let beat: StoryBeat | undefined;
      if (lv >= 1 && lv <= 4) {
        beat = getStoryBeatForTrigger(`level_${lv}_clear`, ch);
      } else if (lv === 5) {
        beat = getStoryBeatForTrigger('first_clear', ch)
          ?? getStoryBeatForTrigger('boss_post', ch);
      }
      if (beat) {
        setPendingStoryBeat(beat);
      }
    }
  }, [battle?.status, ch, lv]);

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

    // Send event
    sendEvent('BATTLE_WIN');

    // Check for pending story beat (pre-computed by effect)
    if (pendingStoryBeat) {
      setShowStory(true);
    } else {
      navigate('/map');
    }
  }, [ch, lv, addGold, addXp, completeLevel, healToFull, sendEvent, navigate, pendingStoryBeat]);

  /** Called after story beat finishes playing */
  const handleStoryComplete = useCallback(() => {
    if (pendingStoryBeat) {
      unlockStoryBeat(pendingStoryBeat.id);
    }
    setShowStory(false);
    setPendingStoryBeat(null);
    navigate('/map');
  }, [pendingStoryBeat, unlockStoryBeat, navigate]);

  const handleRetry = useCallback(() => {
    resetBattle();
    initBattle(ch, lv, monsterOverride || undefined);
  }, [ch, lv, resetBattle, initBattle, monsterOverride]);

  const handleLeave = useCallback(() => {
    resetBattle();
    navigate('/map');
  }, [resetBattle, navigate]);

  // -----------------------------------------------------------------------
  // Determine display phase
  // -----------------------------------------------------------------------

  const isVictory = battle?.status === 'won';
  const isDefeat = battle?.status === 'lost';
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
            label={`Lv.${player.level} ${player.classId ? CLASS_NAMES[player.classId] || '' : '冒险者'}`}
            color="bg-green-600"
          />
          {/* Player portrait with equipment + skills + stats */}
          <div className="relative mt-2 flex items-center justify-center gap-2">
            {/* Left: 3 equipment slots */}
            <div className="w-28 shrink-0 flex flex-col gap-1">
              {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
                const eqId = slot === 'weapon' ? player.equippedWeaponId
                  : slot === 'armor' ? player.equippedArmorId
                  : player.equippedAccessoryId;
                const eq = eqId ? EQUIPMENT.find((e) => e.id === eqId) : null;
                const icon = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍';
                return (
                  <div key={slot} className="rounded bg-black/20 px-1.5 py-1 text-[10px] text-center">
                    {eq ? (
                      <>
                        <div className="text-xs">{icon}</div>
                        <div className="font-medium text-white truncate">{eq.name}</div>
                        <div className="text-gray-400">
                          {eq.attack > 0 && <span>⚔+{eq.attack}</span>}
                          {eq.defense > 0 && <span> 🛡+{eq.defense}</span>}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-600">
                        <div className="text-xs">{icon}</div>
                        <div>空</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skills — 4 equal-height cards with icons */}
            <div className="w-64 shrink-0">
              {(() => {
                const classDef = player.advancedClassId
                  ? ADVANCED_CLASSES[player.advancedClassId]
                  : BASE_CLASSES[player.classId];
                if (!classDef) return null;
                const icons = ['⚔️', '🔮', '🛡️', '🏹'];
                return (
                  <div className="grid grid-cols-2 gap-1.5">
                    {classDef.skills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center rounded-lg bg-white/5 px-2 py-2 text-center min-h-[4.5rem]"
                      >
                        <span className="text-base leading-none mb-0.5">{icons[i % icons.length]}</span>
                        <div className="text-xs font-medium leading-tight text-blue-300 w-full">
                          {skill.name}
                        </div>
                        <div className="text-[10px] text-gray-500 leading-snug w-full">
                          {skill.description}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Center: Portrait */}
            <div className="relative">
              {battle.lastDamageTaken > 0 && (
                <motion.div
                  key={`taken-${battle.turn}`}
                  className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl font-bold text-red-400"
                  initial={{ opacity: 1, y: 0, scale: 1.5 }}
                  animate={{ opacity: 0, y: -80, scale: 0.8 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  -{battle.lastDamageTaken}
                </motion.div>
              )}
              <div className="h-56 w-56 overflow-hidden rounded-xl border-2 border-green-700 bg-gray-800/60">
                {player.classId && CLASS_PORTRAITS[player.classId] ? (
                  <img
                    src={CLASS_PORTRAITS[player.classId]}
                    alt={player.classId}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className="flex h-full w-full items-center justify-center text-4xl hidden">
                  {CLASS_ICONS[player.classId || ''] || '🧑'}
                </div>
              </div>
            </div>

            {/* Right: Battle stats */}
            <div className="w-28 shrink-0 rounded-lg bg-black/20 p-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-gray-300">
                  <span>⚔️ 攻击</span>
                  <span className="font-bold text-white">{getPlayerAttack(player)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>🛡️ 防御</span>
                  <span className="font-bold text-white">{getPlayerDefense(player)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>❤️ 生命</span>
                  <span className="font-bold text-white">{battle.playerMaxHp}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>📈 等级</span>
                  <span className="font-bold text-white">{player.level}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>💰 金币</span>
                  <span className="font-bold text-yellow-300">{player.gold}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <Timer remaining={remaining} isUrgent={isUrgent} />
        </div>

        <div className="flex-1">
          <HealthBar
            current={battle.monsterHp}
            max={battle.monsterMaxHp}
            label={monster.name}
            color="bg-red-600"
          />
          {/* Monster portrait with damage animation */}
          <div className="relative mt-2 flex justify-center">
            {battle.lastDamageDealt > 0 && (
              <motion.div
                key={`dealt-${battle.turn}`}
                className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl font-bold text-yellow-300"
                initial={{ opacity: 1, y: 0, scale: 1.5 }}
                animate={{ opacity: 0, y: -80, scale: 0.8 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                -{battle.lastDamageDealt}
              </motion.div>
            )}
            <div className="h-56 w-56 overflow-hidden rounded-xl border-2 border-red-700 bg-gray-800/60">
              <img
                src={MONSTER_PORTRAITS[monster.id]}
                alt={monster.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLImageElement).nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="flex hidden h-full w-full items-center justify-center bg-gray-800 text-5xl">
                {MONSTER_ICONS[monster.id] || '👹'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Combo Display ===== */}
      <div className="flex justify-center py-2">
        <ComboDisplay combo={battle.combo} />
      </div>

      {/* ===== Main content area (three columns) ===== */}
      <div className="flex flex-1 gap-2 px-2 pb-2 pt-1 overflow-hidden min-h-0">
        {/* Left column — Answer Log */}
        <div className="w-[280px] shrink-0 rounded-xl bg-black/10 p-3 overflow-hidden flex flex-col">
          <AnswerLog />
        </div>

        {/* Center column — Battle content */}
        <div className="flex flex-1 flex-col items-center justify-center px-2 overflow-y-auto">
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
                isBoss={battle?.isBoss ?? false}
                onContinue={handleVictoryContinue}
                onStartBattle={(ch, lv, monsterId) => {
                  const params = monsterId ? `?monster=${monsterId}` : '';
                  navigate(`/battle/${ch}/${lv}${params}`);
                }}
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
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <span className="text-6xl">✅</span>
              <p className="text-2xl font-bold text-green-400">正确!</p>

              {/* Word card — support all question types */}
              {currentQuestion && (() => {
                if (currentQuestion.type === 'spell') {
                  const q = currentQuestion as SpellQuestion;
                  return (
                    <div className="w-full max-w-xs rounded-xl border border-green-800/40 bg-black/30 p-4 text-center">
                      <p className="text-xl font-bold text-white">{q.word.english}</p>
                      <p className="mt-1 text-lg text-green-300">{q.targetLetters.join('')}</p>
                      <p className="mt-1 text-sm text-gray-400">{q.chineseHint}</p>
                    </div>
                  );
                }
                if (currentQuestion.type === 'pos') {
                  const q = currentQuestion as PosQuestion;
                  return (
                    <div className="w-full max-w-xs rounded-xl border border-green-800/40 bg-black/30 p-4 text-center">
                      <p className="text-sm text-gray-400">{q.subtype === 'collocation' ? '搭配' : '词性'}</p>
                      <p className="mt-1 text-lg font-bold text-white">{q.stem}</p>
                      <p className="mt-1 text-base text-green-300">✅ {q.options[q.correctIndex]}</p>
                      <p className="mt-2 text-xs text-blue-300">💡 {q.explanation}</p>
                    </div>
                  );
                }
                const q = currentQuestion as TranslateQuestion;
                return (
                  <div className="w-full max-w-xs rounded-xl border border-green-800/40 bg-black/30 p-4 text-center">
                    <p className="text-xl font-bold text-white">{q.word.english}</p>
                    <p className="mt-1 text-lg text-gray-400">{q.word.chinese}</p>
                  </div>
                );
              })()}

              {/* Damage info */}
              <p className="text-lg text-yellow-300">
                ⚔️ 使用 <span className="font-bold text-white">{battle.lastSkillName || '普通攻击'}</span> 造成 <span className="font-bold text-white">{battle.lastDamageDealt}</span> 点伤害
              </p>

              {/* Monster attack */}
              {battle.lastDamageTaken > 0 && (
                <p className="text-lg text-red-400">
                  {battle.lastMonsterSkillName
                    ? <>👹 {monster.name} 使用 <span className="font-bold text-white">{battle.lastMonsterSkillName}</span> 造成 <span className="font-bold text-white">{battle.lastDamageTaken}</span> 点伤害</>
                    : <>💢 {monster.name} 反击造成 <span className="font-bold text-white">{battle.lastDamageTaken}</span> 点伤害</>}
                </p>
              )}

              {/* Combo */}
              <p className={`text-lg ${battle.combo >= 3 ? 'font-bold text-orange-400' : 'text-gray-400'}`}>
                🔥 连击 x{battle.combo}
              </p>

              {/* Countdown */}
              <p className="text-sm text-gray-500">4秒后自动继续...</p>
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

              {currentQuestion && (() => {
                if (currentQuestion.type === 'spell') {
                  const q = currentQuestion as SpellQuestion;
                  return (
                    <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 px-6 py-3 text-center">
                      <span className="text-sm text-gray-400">正确答案：</span>
                      <br />
                      <span className="text-xl font-bold text-yellow-300">{q.word.english}</span>
                      <br />
                      <span className="text-base text-gray-300">拼写前 {q.maxLength} 字母：{q.targetLetters.join('')}</span>
                      <br />
                      <span className="mt-1 text-xs text-gray-400">{q.chineseHint}</span>
                    </div>
                  );
                }
                if (currentQuestion.type === 'pos') {
                  const q = currentQuestion as PosQuestion;
                  return (
                    <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 px-6 py-3 text-center">
                      <span className="text-sm text-gray-400">正确答案：</span>
                      <br />
                      <span className="text-lg font-bold text-yellow-300">
                        {q.stem} → {q.options[q.correctIndex]}
                      </span>
                      <br />
                      <span className="mt-1 text-xs text-blue-200">💡 {q.explanation}</span>
                    </div>
                  );
                }
                const q = currentQuestion as TranslateQuestion;
                return (
                  <p className="rounded-xl border border-yellow-700/40 bg-yellow-900/20 px-6 py-3 text-center">
                    <span className="text-sm text-gray-400">正确答案：</span>
                    <br />
                    <span className="text-xl font-bold text-yellow-300">
                      {q.correctAnswer}
                    </span>
                  </p>
                );
              })()}

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
              <QuestionRenderer
                question={currentQuestion}
                onAnswer={handleAnswer}
                onMatchConnect={handleMatchConnect}
                disabled={answeredRef.current}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Right column — Combat Log */}
        <div className="w-[280px] shrink-0 rounded-xl bg-black/10 p-3 overflow-hidden flex flex-col">
          <CombatLog />
        </div>
      </div>

      {/* Story beat overlay — plays after level clear */}
      {pendingStoryBeat && (
        <StoryPlayer
          beat={pendingStoryBeat}
          open={showStory}
          onComplete={handleStoryComplete}
          onChoice={(flag) => {
            if (flag) {
              useGameStore.getState().setFlag(flag);
            }
          }}
          onClose={() => {
            setShowStory(false);
            setPendingStoryBeat(null);
            navigate('/map');
          }}
        />
      )}

    </div>
  );
}
