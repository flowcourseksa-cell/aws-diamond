"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconSwords, IconFlame, IconX, IconArrowRight, IconHome,
  IconCheck, IconLoader2, IconAlertTriangle,
  IconUser, IconHistory, IconTarget, IconBolt
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  fetchRandomPkQuestions, fetchPkQuestionsByIds,
  createPkChallenge, findWaitingChallenge, joinChallenge,
  finishPkChallenge, fetchMyPkHistory,
  type PkQuestion, type PkChallenge,
} from "@/lib/supabase/services/pk-actions";
import { RealtimeChannel } from "@supabase/supabase-js";

const BOT_NAMES = ["فارس_AWS", "نوف_99", "سعد_P", "ريم_T", "خالد_A", "سلمى_Q"];
const BOT_ACCURACY = 0.88;
const BOT_MIN_MS = 2800;
const BOT_MAX_MS = 11000;
const LABELS = ["أ", "ب", "ج", "د"];

type Stage = "info" | "searching" | "countdown" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareQuestion(q: PkQuestion) {
  const keys = ["option_a", "option_b", "option_c", "option_d"] as const;
  const correctText = q[keys[q.correct_index]];
  const opts = shuffle(keys.map(k => q[k]));
  return {
    text: q.question.replace(/\s*\(نموذج \d+\)\s*$/, "").trim(),
    opts, correctIdx: opts.indexOf(correctText)
  };
}

/* ── Exit Modal ─────────────────────────── */
function ExitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-xs rounded-3xl bg-card border border-border shadow-2xl p-7 flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/25">
          <IconAlertTriangle size={28} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-black text-text mb-1.5">خروج من التحدي؟</h3>
          <p className="text-text-muted text-xs leading-relaxed">لو خرجت دلوقتي، التحدي هيتسجل خسارة</p>
        </div>
        <div className="w-full flex flex-col gap-2">
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-black text-sm bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all">
            استمر في التحدي ⚔️
          </button>
          <button onClick={onConfirm}
            className="w-full py-3 rounded-2xl font-bold text-sm border border-red-500/25 text-red-500 hover:bg-red-500/8 active:scale-[0.98] transition-all">
            خروج
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function ChallengePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  // Use a single stable supabase client instance
  const supabase = useRef(createClient()).current;

  const [stage, setStage] = useState<Stage>("info");
  const [questions, setQuestions] = useState<ReturnType<typeof prepareQuestion>[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isChallenger, setIsChallenger] = useState(true);
  const [isBot, setIsBot] = useState(false);

  const [currentQ, setCurrentQ] = useState(0);
  const [myAnswers, setMyAnswers] = useState<(number | null)[]>([]);
  const [myScore, setMyScore] = useState(0);
  const myScoreRef = useRef(0);
  myScoreRef.current = myScore;

  const [oppName, setOppName] = useState("");
  const [oppScore, setOppScore] = useState(0);
  const [oppAnswers, setOppAnswers] = useState<(number | null)[]>([]);

  const [searchTimer, setSearchTimer] = useState(10);
  const [gameCountdown, setGameCountdown] = useState(3);
  const [qTimer, setQTimer] = useState(25);
  const [history, setHistory] = useState<PkChallenge[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const broadcastRef = useRef<RealtimeChannel | null>(null);
  const dbListenerRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchedRef = useRef(false);

  // Show page as soon as user is known — don't wait if loading but user is cached
  const isReady = !!user || !isLoading;

  useEffect(() => {
    if (!isLoading && !user) router.push("/login?callbackUrl=/challenge");
  }, [user, isLoading]);

  useEffect(() => {
    if (user?.id) fetchMyPkHistory(user.id).then(setHistory);
  }, [user?.id]);

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    broadcastRef.current?.unsubscribe();
    dbListenerRef.current?.unsubscribe();
    if (pollRef.current) clearInterval(pollRef.current);
    matchedRef.current = false;
  }

  /* ── Searching countdown ── */
  useEffect(() => {
    if (stage !== "searching" || !isChallenger) return;
    if (searchTimer <= 0) {
      cleanup();
      setIsBot(true);
      setOppName(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
      setGameCountdown(3);
      setStage("countdown");
      return;
    }
    const t = setTimeout(() => setSearchTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, searchTimer, isChallenger]);

  /* ── 3-2-1 ── */
  useEffect(() => {
    if (stage !== "countdown") return;
    if (gameCountdown <= 0) {
      setCurrentQ(0); setQTimer(25); setMyScore(0); setOppScore(0);
      setSelected(null); setRevealed(false); setStage("playing"); return;
    }
    const t = setTimeout(() => setGameCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, gameCountdown]);

  /* ── Question timer ── */
  useEffect(() => {
    if (stage !== "playing" || revealed) return;
    if (qTimer <= 0) { handleReveal(null); return; }
    const t = setTimeout(() => setQTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, qTimer, revealed]);

  /* ── Bot logic ── */
  useEffect(() => {
    if (stage !== "playing" || !isBot) return;
    const q = questions[currentQ];
    if (!q) return;
    const correct = Math.random() < BOT_ACCURACY;
    const wrongs = [0, 1, 2, 3].filter(i => i !== q.correctIdx);
    const ans = correct ? q.correctIdx : wrongs[Math.floor(Math.random() * wrongs.length)];
    const delay = Math.min(BOT_MIN_MS + Math.random() * (BOT_MAX_MS - BOT_MIN_MS), (qTimer - 1.5) * 1000);
    const t = setTimeout(() => {
      setOppAnswers(prev => { const u = [...prev]; u[currentQ] = ans; return u; });
      if (ans === q.correctIdx) setOppScore(s => s + 10);
    }, delay);
    return () => clearTimeout(t);
  }, [stage, currentQ, isBot]);

  async function getName(uid: string): Promise<string> {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", uid).single();
    return data?.full_name?.split(" ")[0] || "طالب";
  }

  async function onOpponentJoined(opponentId: string) {
    if (matchedRef.current) return;
    matchedRef.current = true;
    cleanup();
    setIsBot(false);
    const name = await getName(opponentId);
    setOppName(name);
    setGameCountdown(3);
    setStage("countdown");
  }

  async function startSearch() {
    if (!user?.id) return;
    matchedRef.current = false;
    setStage("searching");
    setSearchTimer(10);

    const waiting = await findWaitingChallenge(user.id);
    if (waiting) {
      const joined = await joinChallenge(waiting.id, user.id);
      if (joined) {
        setIsChallenger(false);
        setIsBot(false);
        setChallengeId(waiting.id);
        const name = await getName(waiting.challenger_id);
        setOppName(name);
        const qs = await fetchPkQuestionsByIds(waiting.question_ids);
        setQuestions(qs.map(prepareQuestion));
        setMyAnswers(new Array(qs.length).fill(null));
        setOppAnswers(new Array(qs.length).fill(null));
        setupBroadcast(waiting.id);
        setGameCountdown(3);
        setStage("countdown");
        return;
      }
    }

    const qs = await fetchRandomPkQuestions(10);
    if (qs.length < 5) { showToast("لا توجد أسئلة كافية.", "error"); setStage("info"); return; }

    const chal = await createPkChallenge(user.id, qs.map(q => q.id));
    if (!chal) { setStage("info"); return; }

    setQuestions(qs.map(prepareQuestion));
    setChallengeId(chal.id);
    setIsChallenger(true);
    setMyAnswers(new Array(qs.length).fill(null));
    setOppAnswers(new Array(qs.length).fill(null));
    setupBroadcast(chal.id);

    // DB Realtime
    dbListenerRef.current = supabase
      .channel(`db:pk:${chal.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'pk_challenges', filter: `id=eq.${chal.id}`
      }, async (payload) => {
        if (payload.new.status === 'active' && payload.new.opponent_id) {
          await onOpponentJoined(payload.new.opponent_id);
        }
      })
      .subscribe();

    // Polling backup every 2s
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("pk_challenges").select("status, opponent_id")
        .eq("id", chal.id).single();
      if (data?.status === 'active' && data?.opponent_id) {
        await onOpponentJoined(data.opponent_id);
      }
    }, 2000);
  }

  function setupBroadcast(id: string) {
    if (broadcastRef.current) broadcastRef.current.unsubscribe();
    broadcastRef.current = supabase.channel(`challenge-bc-${id}`);
    broadcastRef.current.on('broadcast', { event: 'score_update' }, ({ payload }) => {
      setOppScore(payload.score);
      setOppAnswers(prev => { const u = [...prev]; u[payload.qIndex] = payload.answer; return u; });
    }).subscribe();
  }

  const handleReveal = useCallback((idx: number | null) => {
    if (revealed) return;
    setRevealed(true);
    setSelected(idx);
    const q = questions[currentQ];
    let ns = myScoreRef.current;
    if (idx !== null && idx === q.correctIdx) {
      ns += qTimer > 15 ? 15 : 10;
      setMyScore(ns);
    }
    setMyAnswers(prev => { const u = [...prev]; u[currentQ] = idx; return u; });
    if (!isBot && broadcastRef.current) {
      broadcastRef.current.send({ type: 'broadcast', event: 'score_update', payload: { score: ns, answer: idx, qIndex: currentQ } });
    }
    setTimeout(() => {
      if (currentQ + 1 >= questions.length) endGame(ns);
      else { setCurrentQ(i => i + 1); setQTimer(25); setSelected(null); setRevealed(false); }
    }, 1400);
  }, [revealed, questions, currentQ, qTimer, isBot]);

  async function endGame(finalScore: number) {
    setStage("result");
    if (!challengeId || !user?.id) return;
    await finishPkChallenge(
      challengeId, isChallenger, finalScore,
      myAnswers.map(a => a ?? -1), isBot,
      oppName, isBot ? oppScore : undefined,
      isBot ? oppAnswers.map(a => a ?? -1) : undefined
    );
    fetchMyPkHistory(user.id).then(setHistory);
  }

  function reset() {
    cleanup();
    setShowExit(false);
    setStage("info"); setCurrentQ(0); setMyScore(0); setOppScore(0);
    setSelected(null); setRevealed(false); setQuestions([]);
    setChallengeId(null); setSearchTimer(10); setGameCountdown(3); setQTimer(25);
    setIsBot(false); setIsChallenger(true); setOppName(""); setOppAnswers([]); setMyAnswers([]);
  }

  function tryExit() { if (stage === "playing") setShowExit(true); else reset(); }

  // Show spinner only if truly not ready
  if (!isReady) return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center">
      <IconLoader2 size={44} className="text-primary animate-spin" />
    </div>
  );

  if (!user) return null; // redirecting

  const q = questions[currentQ];
  const timerPct = (qTimer / 25) * 100;
  const timerColor = qTimer > 15 ? "var(--accent-teal)" : qTimer > 8 ? "#f97316" : "#ef4444";

  /* ══ INFO ══════════════════════════════════════════════════════════════ */
  if (stage === "info") return (
    <div className="fixed inset-0 bg-bg flex flex-col overflow-hidden">
      {/* Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[80px] bg-primary" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-[0.06] blur-[80px] bg-accent-teal" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <button onClick={() => router.push("/")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-text-muted hover:text-text text-sm font-bold transition-all">
          <IconHome size={14} /> الرئيسية
        </button>
        <span className="text-xs font-bold text-text-muted">⚔️ تحدي الأبطال</span>
        <div className="w-24" />
      </nav>

      {/* Content — 2-col on lg */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT: Hero */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-right gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-25 scale-150 bg-primary" />
                <div className="relative w-28 h-28 rounded-full flex items-center justify-center bg-card border border-border shadow-xl">
                  <IconSwords size={50} className="text-primary" />
                </div>
              </div>

              <div>
                <h1 className="text-5xl lg:text-6xl font-black text-text mb-3 leading-tight">
                  ⚔️ تحدي<br />الأبطال
                </h1>
                <p className="text-text-muted text-base leading-relaxed max-w-xs">
                  تحدَّ طالباً حقيقياً أو العب ضد المحاكي الذكي، وأثبت أنك الأفضل!
                </p>
              </div>

              {history.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border w-full max-w-xs">
                  <IconHistory size={15} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-text-muted flex-1">آخر التحديات</span>
                  <div className="flex gap-1">
                    {history.slice(0, 5).map((h, i) => {
                      const won = (h.challenger_score ?? 0) > (h.opponent_score ?? 0);
                      return (
                        <div key={i} className="w-6 h-6 rounded-full text-[9px] font-black flex items-center justify-center"
                          style={{ background: won ? "rgba(20,184,166,0.15)" : "rgba(239,68,68,0.12)", color: won ? "var(--accent-teal)" : "#ef4444" }}>
                          {won ? "✓" : "✗"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Cards + CTA */}
            <div className="flex flex-col gap-4">
              {/* Feature cards — vertical on this side */}
              {[
                {
                  icon: <IconUser size={20} />, color: "var(--primary)",
                  title: "لاعب حقيقي أو محاكي",
                  desc: "نبحث عن منافس حقيقي لمدة 10 ثوانٍ. إذا لم نجد أحداً، يدخل المحاكي الذكي فوراً.",
                  badge: "جديد 🔥"
                },
                {
                  icon: <IconBolt size={20} />, color: "#f97316",
                  title: "نقاط الإجابة السريعة",
                  desc: "الإجابة قبل 15 ثانية تمنحك 15 نقطة بدل 10. السرعة مهمة!",
                  badge: null
                },
                {
                  icon: <IconTarget size={20} />, color: "var(--accent-teal)",
                  title: "10 أسئلة × 25 ثانية",
                  desc: "أسئلة عشوائية من بنك الأسئلة. كل سؤال له 25 ثانية فقط.",
                  badge: null
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-border/60 transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: `${item.color}15`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-text text-sm">{item.title}</span>
                      {item.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>}
                    </div>
                    <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}

              {/* CTA */}
              <button onClick={startSearch}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-lg text-white transition-all hover:scale-[1.015] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, var(--primary), #7c3aed)", boxShadow: "0 8px 32px rgba(139,92,246,0.35)" }}>
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <IconSwords size={22} className="relative z-10" />
                <span className="relative z-10">توكلت على الله</span>
                <IconFlame size={20} className="relative z-10 animate-pulse" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  /* ══ SEARCHING ═════════════════════════════════════════════════════════ */
  if (stage === "searching") return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, var(--primary-light) 0%, transparent 65%)" }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl bg-card border border-border shadow-xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-400 to-primary" />
          <div className="p-8 flex flex-col items-center gap-7 text-center">

            {/* Sonar */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="absolute rounded-full border border-primary/20 animate-ping"
                  style={{ inset: `${i * 10}px`, animationDelay: `${i * 0.35}s`, animationDuration: "2s" }} />
              ))}
              <div className="relative w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center bg-primary/10 border border-primary/30 shadow-lg">
                <IconSwords size={30} className="text-primary" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <p className="text-lg font-black text-text">جاري البحث عن منافس...</p>
              <p className="text-text-muted text-xs">يبدأ ضد المحاكي بعد</p>
              <div key={searchTimer} className="text-8xl font-black leading-none text-primary mt-1">{searchTimer}</div>
              <div className="w-32 h-1.5 rounded-full bg-border overflow-hidden mt-2">
                <div className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${(searchTimer / 10) * 100}%` }} />
              </div>
            </div>

            <button onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-text bg-bg border border-border transition-all hover:scale-105 active:scale-95">
              <IconX size={13} /> إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ COUNTDOWN ═════════════════════════════════════════════════════════ */
  if (stage === "countdown") return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center p-5">
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, var(--primary-light) 0%, transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl bg-card border border-border shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-violet-400 to-primary" />
          <div className="p-8 flex flex-col items-center gap-7 text-center">

            <p className="text-xs font-black tracking-widest text-text-muted uppercase">⚔️ المنافس جاهز!</p>

            <div className="w-full flex items-center gap-4">
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center font-black text-base bg-primary/10 border border-primary/25 text-primary">
                  أنت
                </div>
                <span className="text-[10px] font-bold text-text-muted">{isChallenger ? "المتحدي" : "المنافس"}</span>
              </div>
              <div className="text-2xl font-black text-text-muted">VS</div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center font-black text-base bg-orange-500/10 border border-orange-500/20 text-orange-500 text-center px-1 leading-tight">
                  {oppName.charAt(0) || "؟"}
                </div>
                <span className="text-[10px] font-bold text-text-muted max-w-[90px] truncate">{oppName} {isBot ? "🤖" : "👤"}</span>
              </div>
            </div>

            {gameCountdown > 0
              ? <div key={gameCountdown} className="text-[100px] font-black leading-none text-primary">{gameCountdown}</div>
              : <div className="text-4xl font-black text-accent-teal animate-bounce">ابدأ! 🚀</div>
            }

            <p className="text-xs text-text-muted">سؤال × 25 ثانية · الإجابة السريعة = 15 نقطة</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══ PLAYING ═══════════════════════════════════════════════════════════ */
  if (stage === "playing") {
    if (!q) return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center p-6 text-center">
        <IconLoader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="font-bold text-text">جاري تجهيز الأسئلة...</p>
        <button onClick={reset} className="mt-4 text-sm text-text-muted hover:text-text underline">رجوع</button>
      </div>
    );

    const myDone = myAnswers.filter(a => a !== null).length;
    const oppDone = oppAnswers.filter(a => a !== null).length;

    return (
      <>
        {showExit && <ExitModal onConfirm={reset} onCancel={() => setShowExit(false)} />}
        <div className="fixed inset-0 bg-bg flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <header className="shrink-0 bg-card border-b border-border">
            <div className="flex items-stretch divide-x divide-x-reverse divide-border">
              {/* Opponent */}
              <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-xs bg-orange-500/10 border border-orange-500/20 text-orange-500">
                  {oppName.charAt(0) || "؟"}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-text-muted truncate max-w-[80px] lg:max-w-none">{oppName} {isBot ? "🤖" : "👤"}</div>
                  <div className="text-2xl font-black text-orange-500 leading-none">{oppScore}</div>
                </div>
              </div>

              {/* Center */}
              <div className="shrink-0 flex flex-col items-center justify-center px-4 py-2 gap-0.5">
                <div className="text-[10px] font-bold text-text-muted">س {currentQ + 1}/{questions.length}</div>
                <div key={qTimer} className="text-3xl font-black leading-none" style={{ color: timerColor }}>{qTimer}</div>
                <div className="flex gap-0.5 mt-0.5">
                  {questions.map((_, i) => (
                    <div key={i} className="h-1 w-3 rounded-full"
                      style={{ background: i < currentQ ? "var(--primary)" : i === currentQ ? timerColor : "var(--border)" }} />
                  ))}
                </div>
              </div>

              {/* Me + Exit */}
              <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0 justify-end">
                <div className="text-right min-w-0">
                  <div className="text-[10px] font-bold text-text-muted">نقاطك</div>
                  <div className="text-2xl font-black text-primary leading-none">{myScore}</div>
                </div>
                <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-xs bg-primary/10 border border-primary/20 text-primary">أنت</div>
                <button onClick={tryExit}
                  className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center border border-border text-text-muted/40 hover:text-red-500 hover:border-red-500/30 transition-all">
                  <IconX size={13} />
                </button>
              </div>
            </div>
          </header>

          {/* Timer bar */}
          <div className="shrink-0 h-1.5 bg-border">
            <div className="h-full rounded-r-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Progress strip */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/40">
            <span className="text-[9px] font-bold text-text-muted shrink-0">{oppName.split("_")[0]} {oppDone}/{questions.length}</span>
            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(oppDone / questions.length) * 100}%`, background: "#f97316" }} />
            </div>
            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(myDone / questions.length) * 100}%`, background: "var(--primary)" }} />
            </div>
            <span className="text-[9px] font-bold text-text-muted shrink-0">أنت {myDone}/{questions.length}</span>
          </div>

          {/* ── Main playing area ── */}
          <div className="flex-1 overflow-hidden flex">
            {/* Stacked layout for all screens: Question on top, Options on bottom */}
            <div className="flex-1 flex flex-col overflow-y-auto pb-8">

              {/* Top: Question card */}
              <div className="flex items-center justify-center p-5 lg:p-8 pb-2 lg:pb-4">
                <div className="w-full max-w-3xl">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-text-muted px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary">
                      سؤال {currentQ + 1}
                    </span>
                  </div>
                  <div className="rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-sm">
                    <p className="text-text font-bold text-lg lg:text-2xl leading-relaxed text-center">{q.text}</p>
                  </div>
                </div>
              </div>

              {/* Bottom: Options */}
              <div className="flex items-center justify-center p-5 lg:p-8 pt-2 lg:pt-4">
                <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.opts.map((opt, i) => {
                    const isSel = selected === i, isCorr = i === q.correctIdx;
                    let border = "var(--border)", bg = "transparent", color = "var(--text)", op = "1";
                    let lBg = "var(--bg)", lBorder = "var(--border)", lColor = "var(--text-muted)";

                    if (revealed) {
                      if (isCorr) { border = "var(--accent-teal)"; bg = "rgba(20,184,166,0.07)"; color = "var(--accent-teal)"; lBg = "var(--accent-teal)"; lBorder = "var(--accent-teal)"; lColor = "white"; }
                      else if (isSel) { border = "#ef4444"; bg = "rgba(239,68,68,0.07)"; color = "#ef4444"; lBg = "#ef4444"; lBorder = "#ef4444"; lColor = "white"; }
                      else { op = "0.35"; }
                    } else if (isSel) {
                      border = "var(--primary)"; bg = "rgba(139,92,246,0.07)"; color = "var(--primary)"; lBg = "var(--primary)"; lBorder = "var(--primary)"; lColor = "white";
                    }

                    return (
                      <button key={i}
                        onClick={() => !revealed && handleReveal(i)}
                        disabled={revealed}
                        style={{ borderColor: border, background: bg, color, opacity: op }}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 lg:py-5 text-right transition-all duration-200 ${!revealed ? "cursor-pointer hover:scale-[1.02] active:scale-[0.97]" : "cursor-default"}`}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black border-2 transition-all"
                          style={{ background: lBg, borderColor: lBorder, color: lColor }}>
                          {revealed && isCorr ? <IconCheck size={15} /> : LABELS[i]}
                        </span>
                        <span className="text-sm font-semibold leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ══ RESULT ════════════════════════════════════════════════════════════ */
  if (stage === "result") {
    const iWon = myScore > oppScore, isDraw = myScore === oppScore;
    const emoji = iWon ? "🏆" : isDraw ? "🤝" : "😤";
    const label = iWon ? "فزت! أنت البطل! 🎉" : isDraw ? "تعادل رائع! 🤝" : "حاول مرة أخرى! 💪";
    const accent = iWon ? "var(--accent-teal)" : isDraw ? "var(--primary)" : "#ef4444";

    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center p-5 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at center, ${accent}12 0%, transparent 55%)` }} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 text-center py-8">
          {/* Badge + title */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-20 scale-150" style={{ background: accent }} />
              <div className="relative w-28 h-28 rounded-full flex items-center justify-center text-5xl bg-card border shadow-xl" style={{ borderColor: `${accent}40` }}>
                {emoji}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black mb-1" style={{ color: accent }}>{label}</h2>
              <p className="text-text-muted text-sm">ضد <span className="font-bold text-text">{oppName}</span> {isBot ? "🤖" : "👤"}</p>
            </div>
          </div>

          {/* Score + breakdown */}
          <div className="w-full rounded-3xl bg-card border border-border p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-center gap-10">
              <div className="text-center">
                <div className="text-5xl font-black text-primary">{myScore}</div>
                <div className="text-xs font-bold text-text-muted mt-1">نقاطك</div>
              </div>
              <div className="text-2xl font-black text-border">:</div>
              <div className="text-center">
                <div className="text-5xl font-black text-orange-500">{oppScore}</div>
                <div className="text-xs font-bold text-text-muted mt-1">{oppName}</div>
              </div>
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {myAnswers.map((ans, i) => {
                const right = ans !== null && ans === questions[i]?.correctIdx;
                return (
                  <div key={i} className="w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center"
                    style={{ background: ans === null ? "var(--border)" : right ? "var(--accent-teal)" : "#ef4444", color: "white" }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button onClick={reset}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--primary), #7c3aed)", boxShadow: "0 6px 24px rgba(139,92,246,0.3)" }}>
              <IconSwords size={20} /> تحدٍّ جديد
            </button>
            <button onClick={() => router.push("/")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-card border border-border text-text-muted hover:text-text transition-all">
              <IconHome size={15} /> الصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
