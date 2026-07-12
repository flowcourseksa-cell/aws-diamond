"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitSecureExamAttempt(
  userId: string,
  examId: string,
  rawAnswers: { question_id: string; selected_option_id: string | null; micro_skill_id: string }[]
) {
  // Use Admin Client to bypass RLS for fetching correct answers and inserting securely
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const questionIds = rawAnswers.map(a => a.question_id);
    
    if (questionIds.length === 0) return false;

    const { data: dbOptions, error: dbError } = await supabaseAdmin
      .from("question_options")
      .select("id, question_id, is_correct")
      .in("question_id", questionIds)
      .eq("is_correct", true);

    if (dbError) throw dbError;

    // Create a map of question_id -> correct_option_id
    const correctMap = new Map<string, string>();
    dbOptions?.forEach(opt => {
      correctMap.set(opt.question_id, opt.id);
    });

    // 2. Evaluate answers securely on the server
    const evaluatedAnswers = rawAnswers.map(ans => {
      const correctOptionId = correctMap.get(ans.question_id);
      const isCorrect = ans.selected_option_id !== null && ans.selected_option_id === correctOptionId;
      return {
        ...ans,
        is_correct: isCorrect
      };
    });

    const total = evaluatedAnswers.length;
    const correct = evaluatedAnswers.filter((a) => a.is_correct).length;
    const scorePct = total > 0 ? (correct / total) * 100 : 0;

    // 3. Fetch attempts count to determine if this is an official attempt
    const { data: previousAttempts, count } = await supabaseAdmin
      .from("exam_attempts")
      .select("score_pct", { count: "exact" })
      .eq("student_id", userId)
      .eq("exam_id", examId);

    const previousBestScore = previousAttempts ? Math.max(0, ...previousAttempts.map(a => Number(a.score_pct) || 0)) : 0;

    // Fetch granted attempts
    const { count: grantedCount } = await supabaseAdmin
      .from("granted_exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("exam_id", examId);

    const maxAllowedAttempts = 5 + (grantedCount || 0);
    // An attempt is official ONLY if they haven't exhausted their current max attempts AND they haven't already scored 100%
    const isOfficialAttempt = (count || 0) < maxAllowedAttempts && previousBestScore < 100;

    // 4. Insert attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("exam_attempts")
      .insert([{
        student_id: userId,
        exam_id: examId,
        score_pct: scorePct,
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (attemptError || !attempt) throw attemptError;

    // 5. Insert answers
    const answersData = evaluatedAnswers.map((ans) => ({
      attempt_id: attempt.id,
      question_id: ans.question_id,
      selected_option_id: ans.selected_option_id,
      is_correct: ans.is_correct,
      micro_skill_id: ans.micro_skill_id
    }));

    const { error: answersError } = await supabaseAdmin
      .from("attempt_answers")
      .insert(answersData);

    if (answersError) throw answersError;

    // 6. Call RPC to update skill progress for ALL attempts (official and training)
    if (true) {
      const { error: rpcError } = await supabaseAdmin.rpc("calculate_skill_gap", {
        p_student_id: userId,
        p_attempt_id: attempt.id
      });
      if (rpcError) console.error("Error calculating skill gap via RPC:", rpcError);

      // 7. Auto-Remediation: batch upsert study plan tasks for weak skills (replaces N+1 loop)
      try {
        const skillStats = new Map<string, { total: number, correct: number }>();
        evaluatedAnswers.forEach(ans => {
          if (!ans.micro_skill_id) return;
          if (!skillStats.has(ans.micro_skill_id)) {
            skillStats.set(ans.micro_skill_id, { total: 0, correct: 0 });
          }
          const s = skillStats.get(ans.micro_skill_id)!;
          s.total += 1;
          if (ans.is_correct) s.correct += 1;
        });

        const weakSkillIds: string[] = [];
        skillStats.forEach((stats, skillId) => {
          const pct = (stats.correct / stats.total) * 100;
          if (pct < 60) weakSkillIds.push(skillId);
        });

        if (weakSkillIds.length > 0) {
          const { data: skillsData } = await supabaseAdmin
            .from("micro_skills")
            .select("id, name")
            .in("id", weakSkillIds);

          if (skillsData && skillsData.length > 0) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dueDateStr = tomorrow.toISOString().split("T")[0];

            const newTasks = skillsData.map(sk => ({
              student_id: userId,
              micro_skill_id: sk.id,
              exam_id: examId,
              title: `🎯 مراجعة لرفع مستواك: ${sk.name}`,
              due_date: dueDateStr,
              is_completed: false,
              source: "auto"
            }));

            // Single batch upsert — ignore duplicates via onConflict
            await supabaseAdmin
              .from("study_plan_tasks")
              .upsert(newTasks, {
                onConflict: "student_id,micro_skill_id,due_date,source",
                ignoreDuplicates: true
              });
          }
        }
      } catch (autoErr) {
        console.error("Auto-remediation failed:", autoErr);
        // Do not throw — exam was already submitted successfully
      }
    }

    return {
      success: true,
      scorePct,
      evaluatedAnswers,
      attemptsCount: (count || 0) + 1,
      isTraining: !isOfficialAttempt
    };
  } catch (error) {
    console.error("Server Action submitSecureExamAttempt failed:", error);
    return { success: false };
  }
}


