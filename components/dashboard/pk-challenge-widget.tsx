"use client";

import { useState, useEffect } from "react";
import { IconSwords, IconTrophy, IconX, IconSkull, IconFlame } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchRandomPkQuestions,
  createPkChallenge,
  finishPkChallenge,
  fetchMyPkHistory,
  type PkQuestion,
  type PkChallenge,
} from "@/lib/supabase/services/pk-actions";

// ── أسماء البوت العشوائية ──────────────────────────────────
const BOT_NAMES = ["فارس_AWS", "نوف_99", "سعد_P", "ريم_T", "خالد_A", "سلمى_Q", "ماجد_V"];
const BOT_ACCURACY = 0.72; // 72% دقة
const BOT_MIN_MS = 4000;
const BOT_MAX_MS = 20000;

function getBotSpeed() {
  return BOT_MIN_MS + Math.random() * (BOT_MAX_MS - BOT_MIN_MS);
}

type Stage = "idle" | "searching" | "countdown" | "playing" | "result";

export function PkChallengeWidget() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("idle");
  const [questions, setQuestions] = useState<PkQuestion[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [myAnswers, setMyAnswers] = useState<(number | null)[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [botName, setBotName] = useState("");
  const [botAnswers, setBotAnswers] = useState<(number | null)[]>([]);
  const [searchCountdown, setSearchCountdown] = useState(10);
  const [gameCountdown, setGameCountdown] = useState(3);
  const [qTimer, setQTimer] = useState(25);
  const [history, setHistory] = useState<PkChallenge[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  // تحميل السجل
  useEffect(() => {
    if (user?.id) {
      fetchMyPkHistory(user.id).then(setHistory);
    }
  }, [user?.id]);

  // بدء البحث عن منافس
  async function startSearch() {
    if (!user?.id) return;
    setStage("searching");
    setSearchCountdown(10);

    const qs = await fetchRandomPkQuestions(10);
    if (qs.length < 5) { setStage("idle"); return; }

    const challenge = await createPkChallenge(user.id, qs.map(q => q.id));
    if (!challenge) { setStage("idle"); return; }

    setQuestions(qs);
    setChallengeId(challenge.id);
    setMyAnswers(new Array(qs.length).fill(null));
    setBotAnswers(new Array(qs.length).fill(null));
  }

  // العد التنازلي للبحث (10 ثواني)
  useEffect(() => {
    if (stage !== "searching") return;
    if (searchCountdown <= 0) {
      // لم يأت أحد — نفعّل البوت
      const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      setBotName(name);
      setGameCountdown(3);
      setStage("countdown");
      return;
    }
    const t = setTimeout(() => setSearchCountdown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, searchCountdown]);

  // العد التنازلي قبل البداية (3-2-1)
  useEffect(() => {
    if (stage !== "countdown") return;
    if (gameCountdown <= 0) {
      setCurrentQ(0);
      setQTimer(25);
      setMyScore(0);
      setBotScore(0);
      setSelected(null);
      setRevealed(false);
      setStage("playing");
      return;
    }
    const t = setTimeout(() => setGameCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, gameCountdown]);

  // مؤقت السؤال (25 ثانية)
  useEffect(() => {
    if (stage !== "playing") return;
    if (qTimer <= 0 && !revealed) {
      handleReveal(null); // انتهى الوقت بدون إجابة
      return;
    }
    const t = setTimeout(() => setQTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, qTimer, revealed]);

  // إجابة البوت العشوائية
  useEffect(() => {
    if (stage !== "playing") return;
    const q = questions[currentQ];
    if (!q) return;

    const isCorrect = Math.random() < BOT_ACCURACY;
    const botAns = isCorrect ? q.correct_index : (() => {
      const wrong = [0, 1, 2, 3].filter(i => i !== q.correct_index);
      return wrong[Math.floor(Math.random() * wrong.length)];
    })();

    const delay = getBotSpeed();
    const t = setTimeout(() => {
      setBotAnswers(prev => {
        const updated = [...prev];
        updated[currentQ] = botAns;
        return updated;
      });
      if (botAns === q.correct_index) {
        setBotScore(s => s + 10);
      }
    }, Math.min(delay, (qTimer - 2) * 1000));

    return () => clearTimeout(t);
  }, [stage, currentQ]);

  function handleReveal(answerIndex: number | null) {
    if (revealed) return;
    setRevealed(true);
    setSelected(answerIndex);

    const q = questions[currentQ];
    let pts = 0;
    if (answerIndex !== null && answerIndex === q.correct_index) {
      pts = qTimer > 15 ? 15 : 10; // نقطة إضافية للسرعة
      setMyScore(s => s + pts);
    }
    setMyAnswers(prev => {
      const updated = [...prev];
      updated[currentQ] = answerIndex;
      return updated;
    });

    // الانتقال للسؤال التالي بعد ثانية
    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        endGame();
      } else {
        setCurrentQ(q => q + 1);
        setQTimer(25);
        setSelected(null);
        setRevealed(false);
      }
    }, 1200);
  }

  async function endGame() {
    setStage("result");
    if (!challengeId || !user?.id) return;
    await finishPkChallenge(
      challengeId,
      myScore,
      botScore,
      myAnswers.map(a => a ?? -1),
      true,
      botName
    );
    fetchMyPkHistory(user.id).then(setHistory);
  }

  function resetGame() {
    setStage("idle");
    setCurrentQ(0);
    setMyScore(0);
    setBotScore(0);
    setSelected(null);
    setRevealed(false);
    setQuestions([]);
    setChallengeId(null);
  }

  const q = questions[currentQ];
  const OPTIONS_KEYS = ["option_a", "option_b", "option_c", "option_d"] as const;
  const LABELS = ["أ", "ب", "ج", "د"];
  const iWon = myScore > botScore;
  const isDraw = myScore === botScore;

  // ──────────────────────────────────────────────
  // RENDERS
  // ──────────────────────────────────────────────

  // IDLE: عرض الودجت في الداشبورد
  if (stage === "idle") {
    return (
      <div className="animated-border rounded-2xl bg-sidebar p-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-amber/20 text-accent-amber">
              <IconSwords size={20} />
            </div>
            <span className="text-base font-black shimmer-text">⚔️ تحدي الأبطال</span>
          </div>
          {history.length > 0 && (
            <span className="text-xs text-white/50 font-bold">{history.length} تحدٍّ سابق</span>
          )}
        </div>

        {/* وصف */}
        <p className="text-sm text-white/60 mb-4 leading-relaxed">
          تحدَّ منافساً حقيقياً أو البوت الذكي في 10 أسئلة متنوعة من كمي ولفظي وإدراكي!
        </p>

        {/* آخر التحديات */}
        {history.length > 0 && (
          <div className="space-y-2 mb-4">
            {history.slice(0, 3).map(h => {
              const won = h.challenger_score > h.opponent_score;
              return (
                <div key={h.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {won ? <IconTrophy size={14} className="text-accent-amber" /> : <IconSkull size={14} className="text-accent-red" />}
                    <span className="text-xs font-bold text-white/70">
                      {h.is_bot ? `ضد ${h.bot_name || "البوت"}` : "تحدي حقيقي"}
                    </span>
                  </div>
                  <span className={`text-xs font-black ${won ? "text-accent-teal" : "text-accent-red"}`}>
                    {h.challenger_score} - {h.opponent_score}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={startSearch}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-accent-amber to-yellow-400 py-3 text-sm font-black text-white shadow-lg shadow-accent-amber/30 transition-all hover:-translate-y-0.5 hover:shadow-xl glow-ring"
        >
          <IconFlame size={18} /> تحدَّ الآن!
        </button>
        <p className="mt-2 text-center text-[11px] text-white/30">يتجدد بنك الأسئلة باستمرار</p>
      </div>
    );
  }

  // SEARCHING: عداد البحث عن منافس
  if (stage === "searching") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sidebar/95 backdrop-blur-xl p-4">
        <div className="text-center text-white space-y-6">
          <div className="relative mx-auto h-28 w-28">
            <div className="absolute inset-0 rounded-full border-4 border-accent-amber/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-accent-amber/40 animate-ping" style={{ animationDelay: "0.3s" }} />
            <div className="absolute inset-4 rounded-full bg-accent-amber/10 border-2 border-accent-amber flex items-center justify-center glow-ring">
              <IconSwords size={36} className="text-accent-amber" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black mb-1">جاري البحث عن منافس...</p>
            <p className="text-white/50 text-sm">سيبدأ التحدي تلقائياً خلال</p>
            <div className="text-5xl font-black text-accent-amber mt-2 count-pop" key={searchCountdown}>
              {searchCountdown}
            </div>
          </div>
          <button onClick={resetGame} className="flex items-center gap-2 mx-auto text-sm text-white/40 hover:text-white/70 transition-colors">
            <IconX size={16} /> إلغاء
          </button>
        </div>
      </div>
    );
  }

  // COUNTDOWN: 3-2-1 ابدأ!
  if (stage === "countdown") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sidebar/95 backdrop-blur-xl p-4">
        <div className="text-center text-white space-y-4">
          <p className="text-lg text-white/60 font-bold">انضم إليك المنافس!</p>
          <div className="flex items-center gap-4 justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl font-black">أنت</div>
            </div>
            <div className="text-accent-amber font-black text-2xl">VS</div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent-amber/20 border border-accent-amber/40 flex items-center justify-center text-lg font-black text-accent-amber">
                {botName.split("_")[0]}
              </div>
              <div className="text-xs text-white/50 mt-1 font-bold">{botName} 🤖</div>
            </div>
          </div>
          {gameCountdown > 0 ? (
            <div className="text-8xl font-black text-accent-amber scale-in" key={gameCountdown}>
              {gameCountdown}
            </div>
          ) : (
            <div className="text-5xl font-black text-accent-teal scale-in">ابدأ! 🚀</div>
          )}
        </div>
      </div>
    );
  }

  // PLAYING: شاشة السؤال
  if (stage === "playing" && q) {
    const myAnsweredCount = myAnswers.filter(a => a !== null).length;
    const botAnsweredCount = botAnswers.filter(a => a !== null).length;
    const timerPct = (qTimer / 25) * 100;
    const timerColor = qTimer > 15 ? "bg-accent-teal" : qTimer > 8 ? "bg-accent-amber" : "bg-accent-red";

    return (
      <div className="fixed inset-0 z-[200] flex flex-col bg-sidebar overflow-hidden">
        {/* رأس الشاشة */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-white/50 font-bold">أنت</div>
              <div className="text-xl font-black text-accent-teal">{myScore}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs font-black text-white/60">سؤال {currentQ + 1}/{questions.length}</div>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-5 rounded-full transition-colors ${i < currentQ ? "bg-primary" : i === currentQ ? "bg-accent-amber" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50 font-bold">{botName}</div>
              <div className="text-xl font-black text-accent-amber">{botScore}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-lg font-black ${qTimer <= 8 ? "text-accent-red animate-pulse" : "text-white"}`}>
              {qTimer}s
            </div>
            <button onClick={resetGame} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white/70">
              <IconX size={14} />
            </button>
          </div>
        </div>

        {/* مؤقت شريط */}
        <div className="h-1 bg-white/10">
          <div className={`h-full ${timerColor} transition-all duration-1000`} style={{ width: `${timerPct}%` }} />
        </div>

        {/* مؤشر تقدم المنافس */}
        <div className="flex items-center gap-2 px-5 py-2 bg-white/5 text-xs text-white/40 font-bold">
          <span>أنت: {myAnsweredCount}/{questions.length}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${(myAnsweredCount / questions.length) * 100}%` }} />
          </div>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent-amber/60 rounded-full transition-all" style={{ width: `${(botAnsweredCount / questions.length) * 100}%` }} />
          </div>
          <span>{botName}: {botAnsweredCount}/{questions.length}</span>
        </div>

        {/* السؤال */}
        <div className="flex-1 flex flex-col justify-center px-5 py-4 gap-4 overflow-y-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-white font-bold text-base leading-relaxed text-right">{q.question}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OPTIONS_KEYS.map((key, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.correct_index;
              let cls = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-primary/50";
              if (revealed) {
                if (isCorrect) cls = "bg-accent-teal/20 border-accent-teal text-accent-teal";
                else if (isSelected && !isCorrect) cls = "bg-accent-red/20 border-accent-red text-accent-red";
                else cls = "bg-white/5 border-white/5 text-white/30";
              } else if (isSelected) {
                cls = "bg-primary/20 border-primary text-white";
              }

              return (
                <button
                  key={key}
                  onClick={() => !revealed && handleReveal(i)}
                  disabled={revealed}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-right transition-all duration-200 ${cls} ${!revealed ? "cursor-pointer active:scale-95" : "cursor-default"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black border ${revealed && isCorrect ? "bg-accent-teal border-accent-teal text-white" : revealed && isSelected && !isCorrect ? "bg-accent-red border-accent-red text-white" : "bg-white/10 border-white/20"}`}>
                    {LABELS[i]}
                  </span>
                  <span className="text-sm font-semibold">{q[key]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // RESULT: النتيجة النهائية
  if (stage === "result") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-sidebar/95 backdrop-blur-xl p-4">
        <div className="w-full max-w-sm text-center text-white space-y-5 scale-in">
          {/* أيقونة النتيجة */}
          <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center text-5xl ${
            iWon ? "bg-accent-amber/20 glow-ring" : isDraw ? "bg-primary/20" : "bg-accent-red/20"
          }`}>
            {iWon ? "🏆" : isDraw ? "🤝" : "😤"}
          </div>

          <div>
            <h2 className={`text-2xl font-black mb-1 ${iWon ? "text-accent-amber" : isDraw ? "text-primary" : "text-accent-red"}`}>
              {iWon ? "فزت! أنت بطل! 🎉" : isDraw ? "تعادل! مباراة قوية!" : "حاول مرة أخرى 💪"}
            </h2>
            <p className="text-white/50 text-sm">ضد {botName} (المحاكي الذكي)</p>
          </div>

          {/* النقاط */}
          <div className="flex items-center justify-center gap-6 bg-white/5 rounded-2xl p-5">
            <div className="text-center">
              <div className="text-3xl font-black text-accent-teal">{myScore}</div>
              <div className="text-xs text-white/50 font-bold mt-1">نقاطك</div>
            </div>
            <div className="text-white/20 font-black text-xl">vs</div>
            <div className="text-center">
              <div className="text-3xl font-black text-accent-amber">{botScore}</div>
              <div className="text-xs text-white/50 font-bold mt-1">{botName}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={startSearch}
              className="w-full h-12 rounded-2xl bg-gradient-to-l from-accent-amber to-yellow-400 font-black text-sm shadow-lg shadow-accent-amber/30 transition-all hover:-translate-y-0.5"
            >
              🔥 تحدٍّ جديد
            </button>
            <button
              onClick={resetGame}
              className="w-full h-12 rounded-2xl border border-white/10 text-white/60 font-bold text-sm hover:bg-white/5"
            >
              العودة للرئيسية
            </button>
          </div>
          <p className="text-[10px] text-white/20">لعبت ضد المحاكي الذكي لعدم توفر منافس حقيقي</p>
        </div>
      </div>
    );
  }

  return null;
}
