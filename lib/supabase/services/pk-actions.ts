// pk-actions.ts — دوال الطالب (client-side)
import { createClient } from "@/lib/supabase/client";

export type PkQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  category: "quantitative" | "verbal" | "analytical" | "mixed";
  created_at: string;
};

export type PkChallenge = {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  is_bot: boolean;
  bot_name: string | null;
  challenger_score: number;
  opponent_score: number;
  challenger_answers: number[];
  opponent_answers: number[];
  status: "waiting" | "active" | "finished";
  question_ids: string[];
  total_questions: number;
  created_at: string;
  finished_at: string | null;
};

export async function fetchRandomPkQuestions(count = 10): Promise<PkQuestion[]> {
  const supabase = createClient();
  // Fetch all questions (no limit) for proper randomization
  const { data, error } = await supabase.from("pk_questions").select("*");
  if (error || !data || data.length === 0) return [];
  // Fisher-Yates shuffle for true randomness
  const arr = [...data];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count) as PkQuestion[];
}

export async function fetchPkQuestionsByIds(ids: any): Promise<PkQuestion[]> {
  const supabase = createClient();
  let parsedIds = ids;
  if (typeof ids === "string") {
    try {
      parsedIds = JSON.parse(ids);
    } catch (e) {
      parsedIds = ids.replace(/^{|}$/g, '').split(',');
    }
  }
  const { data, error } = await supabase.from("pk_questions").select("*").in("id", parsedIds);
  if (error) {
    console.error("fetchPkQuestionsByIds error:", error.message);
    return [];
  }
  const questions = (data || []) as PkQuestion[];
  // Ensure same order as the array
  questions.sort((a, b) => parsedIds.indexOf(a.id) - parsedIds.indexOf(b.id));
  return questions;
}

export async function createPkChallenge(
  challengerId: string,
  questionIds: string[]
): Promise<PkChallenge | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pk_challenges")
    .insert([{
      challenger_id: challengerId,
      question_ids: questionIds,
      total_questions: questionIds.length,
      status: "waiting",
    }])
    .select()
    .single();
  if (error) { console.error("createPkChallenge:", error.message); return null; }
  return data as PkChallenge;
}

export async function findWaitingChallenge(userId: string): Promise<PkChallenge | null> {
  const supabase = createClient();
  const timeLimit = new Date(Date.now() - 15000).toISOString();
  const { data, error } = await supabase
    .from("pk_challenges")
    .select("*")
    .eq("status", "waiting")
    .neq("challenger_id", userId)
    .is("opponent_id", null)
    .gte("created_at", timeLimit)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as PkChallenge;
}

export async function joinChallenge(challengeId: string, opponentId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pk_challenges")
    .update({
      opponent_id: opponentId,
      status: "active"
    })
    .eq("id", challengeId)
    .eq("status", "waiting");
  if (error) {
    console.error("joinChallenge error:", error.message);
    return false;
  }
  return true;
}

export async function finishPkChallenge(
  challengeId: string,
  isChallenger: boolean,
  score: number,
  answers: number[],
  isBot: boolean,
  botName?: string,
  botScore?: number,
  botAnswers?: number[]
): Promise<boolean> {
  const supabase = createClient();
  const updateData: any = {
    status: "finished",
    finished_at: new Date().toISOString(),
  };

  if (isChallenger) {
    updateData.challenger_score = score;
    updateData.challenger_answers = answers;
    if (isBot) {
      updateData.is_bot = true;
      updateData.bot_name = botName || null;
      updateData.opponent_score = botScore || 0;
      updateData.opponent_answers = botAnswers || [];
    }
  } else {
    updateData.opponent_score = score;
    updateData.opponent_answers = answers;
  }

  const { error } = await supabase
    .from("pk_challenges")
    .update(updateData)
    .eq("id", challengeId);
  return !error;
}

export async function fetchMyPkHistory(userId: string): Promise<PkChallenge[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("pk_challenges")
    .select("*")
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .eq("status", "finished")
    .order("finished_at", { ascending: false })
    .limit(5);
  return (data || []) as PkChallenge[];
}

export async function fetchProfileName(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  return data?.full_name || null;
}
