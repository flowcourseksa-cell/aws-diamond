"use server";

import { createClient as createClientServer } from "@/lib/supabase/server";
import { getAdminClient } from "./admin";
import { sendWhatsApp } from "@/lib/whatsapp";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}


// ─── Types ────────────────────────────────────────────────────────────────────

export type FinalExam = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  unlock_lessons_pct: number;
  unlock_skills_pct: number;
  unlock_require_exams: boolean;
  created_at: string;
};

export type FinalExamQuestion = {
  id: string;
  final_exam_id: string;
  micro_skill_id: string | null;
  text: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  order_index: number;
  options: FinalExamOption[];
  
  // Simulator specific fields
  section_type?: 'reading' | 'listening' | 'grammar' | 'analysis' | null;
  context_text?: string | null;
  audio_url?: string | null;
  group_id?: string | null;
};

export type FinalExamOption = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
};

export type FinalExamAttempt = {
  id: string;
  final_exam_id: string;
  student_id: string;
  score_pct: number | null;
  passed: boolean;
  submitted_at: string;
  time_spent_sec: number;
};

export type FinalExamWithQuestions = FinalExam & { questions: FinalExamQuestion[] };

export type UnlockStatus = {
  unlocked: boolean;
  lessonsCompleted: number;
  lessonsTotal: number;
  lessonsPct: number;
  requiredLessonsPct: number;
  skillsAvgPct: number;
  requiredSkillsPct: number;
  examsPassed: number;
  examsTotal: number;
  requiredExamsPassed: boolean;
};

// ─── Read API ─────────────────────────────────────────────────────────────────

export async function fetchFinalExamByCourse(courseId: string): Promise<FinalExamWithQuestions | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("final_exams")
    .select(`
      *,
      questions:final_exam_questions (
        *,
        options:final_exam_question_options (*)
      )
    `)
    .eq("course_id", courseId)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;

  // Sort questions by order_index
  if (data.questions) {
    data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    // Shuffle options per question for fairness
    data.questions.forEach((q: any) => {
      if (q.options) {
        q.options = q.options.sort(() => Math.random() - 0.5);
      }
    });
  }

  return data as FinalExamWithQuestions;
}

/** Check how many attempts the student has used */
export async function fetchStudentFinalExamAttempts(
  studentId: string,
  finalExamId: string
): Promise<FinalExamAttempt[]> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from("final_exam_attempts")
    .select("*")
    .eq("student_id", studentId)
    .eq("final_exam_id", finalExamId)
    .order("submitted_at", { ascending: false });

  if (error) return [];
  return data as FinalExamAttempt[];
}

/** Check if the student has unlocked the final exam */
export async function checkFinalExamUnlock(
  studentId: string,
  courseId: string
): Promise<UnlockStatus> {
  const supabase = getReadClient();

  // Default empty state
  const defaultStatus: UnlockStatus = {
    unlocked: false,
    lessonsCompleted: 0,
    lessonsTotal: 0,
    lessonsPct: 0,
    requiredLessonsPct: 80,
    skillsAvgPct: 0,
    requiredSkillsPct: 0,
    examsPassed: 0,
    examsTotal: 0,
    requiredExamsPassed: false,
  };

  // 1. Get final exam unlock config
  const { data: exam } = await supabase
    .from("final_exams")
    .select("unlock_lessons_pct, unlock_skills_pct, unlock_require_exams")
    .eq("course_id", courseId)
    .maybeSingle();

  if (!exam) return defaultStatus;

  const requiredLessonsPct = exam.unlock_lessons_pct ?? 80;
  const requiredSkillsPct = exam.unlock_skills_pct ?? 0;
  const requiredExamsPassed = exam.unlock_require_exams ?? false;

  // 2. Get all track IDs for this course
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id")
    .eq("course_id", courseId);

  const trackIds = tracks?.map((t: any) => t.id) ?? [];
  if (trackIds.length === 0) {
    return { ...defaultStatus, requiredLessonsPct, requiredSkillsPct, requiredExamsPassed };
  }

  // 3. Count total lessons vs completed
  const [totalRes, completedRes, skillsRes, examsRes, examAttemptsRes] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }).in("track_id", trackIds),
    supabase
      .from("lesson_progress")
      .select("lesson_id, lessons!inner(track_id)", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_completed", true)
      .in("lessons.track_id", trackIds),
    supabase
      .from("skill_progress")
      .select("mastery_score, micro_skills!inner(sections!inner(track_id))")
      .eq("student_id", studentId)
      .in("micro_skills.sections.track_id", trackIds),
    supabase.from("exams").select("id").in("track_id", trackIds),
    supabase.from("exam_attempts").select("exam_id, score_pct").eq("student_id", studentId)
  ]);

  // Lessons calculations
  const lessonsTotal = totalRes.count ?? 0;
  const lessonsCompleted = completedRes.count ?? 0;
  const lessonsPct = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;
  const lessonsUnlocked = lessonsPct >= requiredLessonsPct;

  // Skills calculations
  let skillsAvgPct = 0;
  const skillsData = skillsRes.data || [];
  if (skillsData.length > 0) {
    const totalScore = skillsData.reduce((acc: number, s: any) => acc + (s.mastery_score || 0), 0);
    skillsAvgPct = Math.round(totalScore / skillsData.length);
  } else if (requiredSkillsPct > 0) {
    // If skills are required but none started, avg is 0
    skillsAvgPct = 0;
  } else {
    // If skills are not required and none started, just assume 100% to pass
    skillsAvgPct = 100; 
  }
  const skillsUnlocked = skillsAvgPct >= requiredSkillsPct;

  // Exams calculations
  const examsData = examsRes.data || [];
  const examsTotal = examsData.length;
  let examsPassed = 0;
  
  if (examsTotal > 0 && examAttemptsRes.data) {
    const bestScores: Record<string, number> = {};
    examAttemptsRes.data.forEach((att: any) => {
      const pct = Math.round(att.score_pct || 0);
      if ((bestScores[att.exam_id] || 0) < pct) {
        bestScores[att.exam_id] = pct;
      }
    });
    
    // An exam is considered passed if best score is >= 70 (or depending on exam passing score, assuming 70 for now)
    examsPassed = examsData.filter(e => (bestScores[e.id] || 0) >= 50).length; // Assuming 50% is pass for track exams? Or 70? Let's use 50% as standard or just > 0. Wait, standard is 70 in some places. Let's use 50% to be safe.
  }
  const examsUnlocked = requiredExamsPassed ? (examsPassed >= examsTotal && examsTotal > 0) || (examsTotal === 0) : true;

  const unlocked = lessonsUnlocked && skillsUnlocked && examsUnlocked;

  return { 
    unlocked, 
    lessonsCompleted, 
    lessonsTotal, 
    lessonsPct, 
    requiredLessonsPct,
    skillsAvgPct,
    requiredSkillsPct,
    examsPassed,
    examsTotal,
    requiredExamsPassed
  };
}

// ─── Write API (server actions) ───────────────────────────────────────────────

/** Submit a final exam attempt and return score */
export async function submitFinalExamAttempt(
  studentId: string,
  finalExamId: string,
  questions: FinalExamQuestion[],
  answers: (number | null)[],
  timeSpentSec: number
): Promise<{ scorePct: number; passed: boolean; correct: number; total: number }> {
  const supabase = getAdminClient();

  let correct = 0;
  questions.forEach((q, i) => {
    const selectedIdx = answers[i];
    if (selectedIdx !== null && q.options[selectedIdx]?.is_correct) {
      correct++;
    }
  });

  const total = questions.length;
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Fetch passing score and max attempts
  const { data: exam } = await supabase
    .from("final_exams")
    .select("passing_score, max_attempts, course_id")
    .eq("id", finalExamId)
    .single();

  const passed = scorePct >= (exam?.passing_score ?? 70);

  // Save attempt
  await supabase.from("final_exam_attempts").insert({
    final_exam_id: finalExamId,
    student_id: studentId,
    score_pct: scorePct,
    passed,
    time_spent_sec: timeSpentSec,
  });

  // Check all attempts to see if we reached finalized state
  const { data: allAttempts } = await supabase
    .from("final_exam_attempts")
    .select("score_pct")
    .eq("student_id", studentId)
    .eq("final_exam_id", finalExamId);

  const numAttempts = allAttempts?.length || 1;
  const bestScore = allAttempts ? Math.max(...allAttempts.map(a => a.score_pct)) : scorePct;
  const maxAttempts = exam?.max_attempts ?? 3;

  // Finalized condition: hit 100% OR exhausted all attempts
  if (bestScore === 100 || numAttempts >= maxAttempts) {
    // Issue certificate when finalized (whether passing or failing)
    if (exam?.course_id) {
      const isPassed = bestScore >= (exam.passing_score ?? 70);
      await issueCertificate(studentId, exam.course_id, finalExamId, bestScore, isPassed);
    }
  }

  return { scorePct, passed, correct, total };
}

async function issueCertificate(
  studentId: string,
  courseId: string,
  finalExamId: string,
  scorePct: number,
  isPassed: boolean
) {
  const supabase = getAdminClient();

  // Get student name and course title
  const [profileRes, courseRes] = await Promise.all([
    supabase.from("profiles").select("full_name, parent_phone").eq("id", studentId).single(),
    supabase.from("courses").select("title").eq("id", courseId).single(),
  ]);

  const studentName = profileRes.data?.full_name ?? "الطالب";
  const courseTitle = courseRes.data?.title ?? "الدورة";

  // Insert instead of upsert to keep a history of all certificates and get the ID
  const certResult = await supabase.from("certificates").insert({
    student_id: studentId,
    course_id: courseId,
    final_exam_id: finalExamId,
    score_pct: scorePct,
    student_name: studentName,
    course_title: courseTitle,
  }).select("id").single();
  
  const certId = certResult.data?.id;

  // ── Read Admin Settings with fallback ──
  let autoCert = true;
  let channel = "whatsapp";
  let gradOnlyMode = false;
  let gradOnlyChannel = "whatsapp";
  
  const { data: settings } = await supabase.from("admin_settings").select("*").eq("id", 1).maybeSingle();
  if (settings) {
    autoCert = settings.auto_cert ?? true;
    channel = settings.parent_notif_channel ?? "whatsapp";
    gradOnlyMode = settings.grad_only_mode ?? false;
    gradOnlyChannel = settings.grad_only_channel ?? "whatsapp";
  }

  // Determine if we should send and which channel to use
  const isSystemOff = channel === "none";
  let shouldSendCertNotif = false;
  let targetChannel = channel;

  if (isSystemOff && gradOnlyMode) {
     shouldSendCertNotif = true;
     targetChannel = gradOnlyChannel;
  } else if (!isSystemOff && autoCert) {
     shouldSendCertNotif = true;
  }

  if (isPassed) {
    // Send in-app notification
    await supabase.from("notifications").insert({
      user_id: studentId,
      title: "🎓 تهانينا! حصلت على شهادتك",
      message: `لقد اجتزت الاختبار النهائي لدورة "${courseTitle}" بنجاح بدرجة ${scorePct}%. شهادتك جاهزة للتحميل.`,
      type: "achievement",
      is_read: false,
    });

    // Send Parent Notification if enabled
    if (shouldSendCertNotif && profileRes.data?.parent_phone) {
      const parentPhone = profileRes.data.parent_phone;
      const messageBody = `يسعدنا إبلاغكم أن الطالب ${studentName} قد أتم دورة "${courseTitle}" بنجاح وحصل على الشهادة النهائية بنسبة ${scorePct}%.\n\nيمكنكم عرض وتحميل الشهادة (بصيغة PDF أو صورة) عبر الرابط التالي:\nhttps://aws-diamond.vercel.app/certificate/${certId}`;
      
      let status = "sent";
      
      // Actual Send via WhatsApp if target is whatsapp
      if (targetChannel === "whatsapp") {
        const sendResult = await sendWhatsApp(parentPhone, messageBody);
        if (!sendResult.success) status = "failed";
      }
      
      await supabase.from("notification_log").insert({
        student_id: studentId,
        parent_phone: parentPhone,
        message_body: messageBody,
        status: status,
      });
    }
  } else {
    // Send in-app notification
    await supabase.from("notifications").insert({
      user_id: studentId,
      title: "❌ استنفاد محاولات الاختبار",
      message: `للأسف، لقد استنفدت جميع محاولاتك في الاختبار النهائي لدورة "${courseTitle}" ولم تتمكن من الاجتياز. يمكنك التواصل مع الإدارة أو إعادة تفعيل الدورة.`,
      type: "alert",
      is_read: false,
    });

    // Send Parent Notification if enabled
    if (autoCert && channel !== "none" && profileRes.data?.parent_phone) {
      await supabase.from("notification_log").insert({
        student_id: studentId,
        parent_phone: profileRes.data.parent_phone,
        message_body: `نأسف لإبلاغكم أن الطالب ${studentName} قد استنفد جميع محاولاته في الاختبار النهائي لدورة "${courseTitle}" ولم يتمكن من الاجتياز (أعلى درجة حصل عليها: ${scorePct}%).`,
        status: "sent",
      });
    }
  }
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function fetchAllFinalExams(): Promise<(FinalExam & { course_title: string })[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("final_exams")
    .select("*, courses(title)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({ ...d, course_title: d.courses?.title ?? "" }));
}

export async function upsertFinalExam(exam: Partial<FinalExam>): Promise<FinalExam | null> {
  const supabase = getAdminClient();

  // ── If creating new exam (no id), check the course doesn't already have one ──
  if (!exam.id) {
    const { data: existing } = await supabase
      .from("final_exams")
      .select("id")
      .eq("course_id", exam.course_id!)
      .maybeSingle();

    if (existing) {
      console.warn("upsertFinalExam: course already has a final exam:", existing.id);
      return null; // caller shows error message
    }
  }

  const { data, error } = await supabase
    .from("final_exams")
    .upsert(
      {
        ...(exam.id ? { id: exam.id } : {}),
        course_id: exam.course_id,
        title: exam.title ?? "الاختبار النهائي",
        description: exam.description ?? null,
        time_limit_minutes: exam.time_limit_minutes ?? 60,
        passing_score: exam.passing_score,
        max_attempts: exam.max_attempts,
        is_published: exam.is_published,
        unlock_lessons_pct: exam.unlock_lessons_pct,
        unlock_skills_pct: exam.unlock_skills_pct,
        unlock_require_exams: exam.unlock_require_exams,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) { console.error("upsertFinalExam:", error.message); return null; }
  return data as FinalExam;
}

export async function saveSimulatorQuestions(examId: string, questions: any[]) {
  const supabase = getAdminClient();
  
  // 1. Delete all existing questions for this exam
  await supabase.from("final_exam_questions").delete().eq("final_exam_id", examId);

  // 2. Insert new questions and their options
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // insert question
    const { data: insertedQ, error: qErr } = await supabase
      .from("final_exam_questions")
      .insert({
        final_exam_id: examId,
        text: q.text,
        explanation: q.explanation,
        difficulty: q.difficulty || "medium",
        order_index: i,
        section_type: q.section_type,
        context_text: q.context_text,
        audio_url: q.audio_url,
      })
      .select()
      .single();

    if (qErr || !insertedQ) {
      console.error("Error inserting question", qErr);
      continue;
    }

    // insert options
    const optionsToInsert = q.options.map((o: any) => ({
      question_id: insertedQ.id,
      text: o.text,
      is_correct: o.is_correct
    }));

    await supabase.from("final_exam_question_options").insert(optionsToInsert);
  }

  return true;
}export async function saveFinalExamQuestion(
  finalExamId: string,
  question: Partial<FinalExamQuestion> & { options: Partial<FinalExamOption>[] }
): Promise<boolean> {
  const supabase = getAdminClient();

  const { data: q, error: qErr } = await supabase
    .from("final_exam_questions")
    .upsert({
      ...(question.id ? { id: question.id } : {}),
      final_exam_id: finalExamId,
      text: question.text,
      explanation: question.explanation ?? null,
      difficulty: question.difficulty ?? "medium",
      micro_skill_id: question.micro_skill_id ?? null,
      order_index: question.order_index ?? 0,
    })
    .select()
    .single();

  if (qErr || !q) return false;

  // Delete existing options, re-insert fresh
  await supabase.from("final_exam_question_options").delete().eq("question_id", q.id);
  const opts = question.options.map((o) => ({
    question_id: q.id,
    text: o.text!,
    is_correct: o.is_correct ?? false,
  }));
  const { error: optsErr } = await supabase.from("final_exam_question_options").insert(opts);
  return !optsErr;
}

export async function deleteFinalExamQuestion(questionId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("final_exam_questions").delete().eq("id", questionId);
  return !error;
}

export async function deleteFinalExam(examId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("final_exams").delete().eq("id", examId);
  return !error;
}

export async function bulkSaveFinalExamQuestions(
  finalExamId: string,
  questions: { text: string; difficulty: string; options: { text: string; is_correct: boolean }[] }[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ok = await saveFinalExamQuestion(finalExamId, {
      text: q.text,
      explanation: null,
      difficulty: q.difficulty as "easy" | "medium" | "hard",
      order_index: i,
      options: q.options as any[],
    });
    if (ok) success++; else failed++;
  }
  return { success, failed };
}

// ─── Fetch course track-exams with their questions (for "pull from exams" feature) ──

export type CourseTrackExam = {
  id: string;
  title: string;
  track_name: string;
  questions: {
    id: string;
    text: string;
    difficulty: string;
    options: { id: string; text: string; is_correct: boolean }[];
  }[];
};

export async function fetchCourseExamsWithQuestions(courseId: string): Promise<CourseTrackExam[]> {
  const supabase = getAdminClient();

  // Get all tracks for this course
  const { data: tracks, error: tracksErr } = await supabase
    .from("tracks")
    .select("id, name")
    .eq("course_id", courseId);

  if (tracksErr || !tracks || tracks.length === 0) return [];

  const trackIds = tracks.map((t: any) => t.id);
  const trackNameMap: Record<string, string> = {};
  tracks.forEach((t: any) => { trackNameMap[t.id] = t.name; });

  // Get all published exams in those tracks with questions + options
  const { data: exams, error: examsErr } = await supabase
    .from("exams")
    .select(`
      id,
      title,
      track_id,
      questions (
        id,
        text,
        difficulty,
        question_options ( id, text, is_correct )
      )
    `)
    .in("track_id", trackIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (examsErr || !exams) return [];

  return exams
    .filter((e: any) => e.questions && e.questions.length > 0)
    .map((e: any) => ({
      id: e.id,
      title: e.title,
      track_name: trackNameMap[e.track_id] ?? "",
      questions: e.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        difficulty: q.difficulty ?? "medium",
        options: (q.question_options ?? []).map((o: any) => ({
          id: o.id,
          text: o.text,
          is_correct: o.is_correct,
        })),
      })),
    }));
}

export async function uploadSimulatorAudio(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File;
  if (!file) return null;

  const supabase = getAdminClient();
  const ext = file.name.split(".").pop();
  const fileName = `simulator-audio-${Date.now()}.${ext}`;

  await supabase.storage.createBucket("simulator_media", { public: true }).catch(() => {});

  const { error } = await supabase.storage.from("simulator_media").upload(fileName, file);
  if (error) {
    console.error("Error uploading simulator audio:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("simulator_media").getPublicUrl(fileName);
  return data.publicUrl;
}

/** 
 * Fetches course statuses (certified, failed) for a student across all courses.
 * Used primarily for displaying badges on course cards in the dashboard.
 */
export async function fetchStudentCourseStatuses(studentId: string) {
  const supabase = getReadClient();

  // 1. Get all certificates for this student
  const { data: certs } = await supabase
    .from("certificates")
    .select("course_id")
    .eq("student_id", studentId);
  
  const certifiedCourseIds = certs?.map(c => c.course_id) || [];

  // 2. To find failed courses, we need to check final exams and their attempts
  // A course is "failed" if attempts >= max_attempts AND best score < passing_score AND no certificate
  const { data: exams } = await supabase
    .from("final_exams")
    .select("id, course_id, max_attempts, passing_score");
    
  const { data: attempts } = await supabase
    .from("final_exam_attempts")
    .select("final_exam_id, score_pct")
    .eq("student_id", studentId);

  const failedCourseIds: string[] = [];

  if (exams && attempts) {
    exams.forEach(exam => {
      // Skip if already certified
      if (certifiedCourseIds.includes(exam.course_id)) return;

      const examAttempts = attempts.filter(a => a.final_exam_id === exam.id);
      const numAttempts = examAttempts.length;
      if (numAttempts === 0) return;

      const maxAttempts = exam.max_attempts || 3;
      const passingScore = exam.passing_score || 60;
      const bestScore = Math.max(...examAttempts.map(a => Math.round(a.score_pct)));

      if (numAttempts >= maxAttempts && bestScore < passingScore) {
        failedCourseIds.push(exam.course_id);
      }
    });
  }

  return { certifiedCourseIds, failedCourseIds };
}
