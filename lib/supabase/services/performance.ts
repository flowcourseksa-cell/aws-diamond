import { createClient } from "@/lib/supabase/client";

export type WeeklyScorePoint = { label: string; score: number };
export type ActivityCell = { date: string; value: number };

export type TrackPerformance = {
  trackId: string;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  totalSkills: number;
  masteredSkills: number;
  avgMastery: number;
  skillCount: number;
};

export type PerformanceData = {
  overallAvg: number;
  completedExams: number;
  weeklyScores: WeeklyScorePoint[];
  activity: ActivityCell[];
  tracks: TrackPerformance[];
  weakSkills: { id: string; name: string; track: string; score: number }[];
  strongSkills: { id: string; name: string; track: string; score: number }[];
};

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// All analytics are real, per-student, from Supabase (isolated by RLS).
export async function fetchPerformanceData(userId: string): Promise<PerformanceData> {
  const supabase = createClient();

  const [attemptsRes, progressRes] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("score_pct, submitted_at")
      .eq("student_id", userId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: true }),
    supabase
      .from("skill_progress")
      .select("micro_skill_id, mastery_score, micro_skills(name, sections(tracks(id, name, icon, color)))")
      .eq("student_id", userId),
  ]);

  const attempts = (attemptsRes.data || []) as { score_pct: number; submitted_at: string }[];
  const progress = progressRes.data || [];

  const completedExams = attempts.length;

  // ---- Weekly average scores for the last 8 weeks (real attempts) ----
  const now = new Date();
  const weekBuckets: { sum: number; count: number }[] = Array.from({ length: 8 }, () => ({ sum: 0, count: 0 }));
  attempts.forEach(a => {
    const diffDays = Math.floor((now.getTime() - new Date(a.submitted_at).getTime()) / 86400000);
    const weeksAgo = Math.floor(diffDays / 7);
    if (weeksAgo >= 0 && weeksAgo < 8) {
      const idx = 7 - weeksAgo; // oldest -> newest
      weekBuckets[idx].sum += a.score_pct || 0;
      weekBuckets[idx].count += 1;
    }
  });
  const weeklyScores: WeeklyScorePoint[] = weekBuckets.map((b, i) => ({
    label: `أسبوع ${i + 1}`,
    score: b.count > 0 ? Math.round(b.sum / b.count) : 0,
  }));

  // ---- Activity map: exam attempts per day for the last 91 days (13 weeks) ----
  const activityMap = new Map<string, number>();
  attempts.forEach(a => {
    const key = toKey(new Date(a.submitted_at));
    activityMap.set(key, (activityMap.get(key) || 0) + 1);
  });
  const activity: ActivityCell[] = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (90 - i));
    const key = toKey(d);
    return { date: key, value: activityMap.get(key) || 0 };
  });

  // ---- Per-track performance ----
  const trackMap = new Map<string, TrackPerformance>();
  const weakSkills: PerformanceData["weakSkills"] = [];
  const strongSkills: PerformanceData["strongSkills"] = [];

  progress.forEach((row: any) => {
    const track = row.micro_skills?.sections?.tracks;
    const score = Math.round(row.mastery_score || 0);
    const skillName = row.micro_skills?.name || "مهارة";
    const trackName = track?.name || "";
    if (track) {
      const existing = trackMap.get(track.id) || {
        trackId: track.id,
        trackName: track.name,
        trackIcon: track.icon || "📚",
        trackColor: track.color || "#6366f1",
        totalSkills: 0,
        masteredSkills: 0,
        avgMastery: 0,
        skillCount: 0,
      };
      existing.skillCount += 1;
      existing.totalSkills += 1;
      if (score >= 80) existing.masteredSkills += 1;
      existing.avgMastery += score;
      trackMap.set(track.id, existing);
    }
    if (score > 0 && score < 50) weakSkills.push({ id: row.micro_skill_id, name: skillName, track: trackName, score });
    if (score >= 80) strongSkills.push({ id: row.micro_skill_id, name: skillName, track: trackName, score });
  });

  const tracks = Array.from(trackMap.values()).map(t => ({
    ...t,
    avgMastery: t.skillCount > 0 ? Math.round(t.avgMastery / t.skillCount) : 0,
  }));

  const overallAvg = tracks.length > 0
    ? Math.round(tracks.reduce((sum, t) => sum + t.avgMastery, 0) / tracks.length)
    : 0;

  weakSkills.sort((a, b) => a.score - b.score);

  return {
    overallAvg,
    completedExams,
    weeklyScores,
    activity,
    tracks,
    weakSkills: weakSkills.slice(0, 3),
    strongSkills: strongSkills.slice(0, 1),
  };
}
