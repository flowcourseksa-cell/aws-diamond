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
  const { data, error } = await supabase.from("pk_questions").select("*").limit(200);
  if (error || !data) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count) as PkQuestion[];
}

export async function fetchPkQuestionsByIds(ids: string[]): Promise<PkQuestion[]> {
  const supabase = createClient();
  const { data } = await supabase.from("pk_questions").select("*").in("id", ids);
  return (data || []) as PkQuestion[];
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

export async function finishPkChallenge(
  challengeId: string,
  challengerScore: number,
  opponentScore: number,
  challengerAnswers: number[],
  isBot: boolean,
  botName?: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pk_challenges")
    .update({
      status: "finished",
      challenger_score: challengerScore,
      opponent_score: opponentScore,
      challenger_answers: challengerAnswers,
      is_bot: isBot,
      bot_name: botName || null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", challengeId);
  return !error;
}

export async function fetchMyPkHistory(userId: string): Promise<PkChallenge[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("pk_challenges")
    .select("*")
    .eq("challenger_id", userId)
    .eq("status", "finished")
    .order("finished_at", { ascending: false })
    .limit(5);
  return (data || []) as PkChallenge[];
}
