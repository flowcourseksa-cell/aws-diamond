"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";

async function verifyUserAccess(targetStudentId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");
  if (user.id !== targetStudentId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      throw new Error("غير مصرح لك بتعديل بيانات هذا الطالب");
    }
  }
}

export async function grantRemedialAttempt(studentId: string, examId: string, skillId?: string) {
  await verifyUserAccess(studentId);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch current normal attempts count
    const { count: officialCount, error: attemptsError } = await supabaseAdmin
      .from("exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("exam_id", examId);

    if (attemptsError) throw attemptsError;

    // 2. Fetch current granted attempts count
    const { count: grantedCount, error: grantedError } = await supabaseAdmin
      .from("granted_exam_attempts")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("exam_id", examId);

    if (grantedError) throw grantedError;

    // They must have exhausted official attempts
    if ((officialCount || 0) < 5) {
      return { success: false, error: "لم تستنفد المحاولات العادية بعد." };
    }

    // They must NOT have any currently unused granted attempts
    if ((officialCount || 0) < 5 + (grantedCount || 0)) {
      return { success: false, error: "لديك محاولات متاحة بالفعل، لا تحتاج لمحاولة علاجية جديدة الآن." };
    }

    // Max 5 extra attempts
    if ((grantedCount || 0) >= 5) {
      return { success: false, error: "لقد استنفدت جميع المحاولات العلاجية الإضافية المسموحة." };
    }

    // 4. Insert granted attempt
    const { error: insertError } = await supabaseAdmin
      .from("granted_exam_attempts")
      .insert({
        student_id: studentId,
        exam_id: examId,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: any) {
    console.error("Error granting remedial attempt:", error);
    return { success: false, error: error.message || "حدث خطأ أثناء منح المحاولة الإضافية" };
  }
}

export async function autoRemediateExams(studentId: string, lessonId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Find section for this lesson
    const { data: lesson } = await supabaseAdmin.from("lessons").select("section_id").eq("id", lessonId).single();
    if (!lesson) return { success: false };

    // Find all exams that are locked (attempts_count >= 5) and relate to this lesson's section or its track
    const { data: exams } = await supabaseAdmin.from("exams")
      .select("id, section_id, track_id")
      .or(`section_id.eq.${lesson.section_id},track_id.eq.(select track_id from sections where id = '${lesson.section_id}')`);

    if (!exams || exams.length === 0) return { success: true };

    for (const exam of exams) {
      // Find if student has any weak skills in this exam's scope
      const { data: weakSkills } = await supabaseAdmin.from("skill_progress")
        .select("micro_skill_id")
        .eq("student_id", studentId)
        .lt("mastery_score", 50);

      // We simply grant an attempt to any locked exam in the scope. 
      // The grantRemedialAttempt function automatically checks if officialCount >= 5 before granting.
      await grantRemedialAttempt(studentId, exam.id);
    }

    return { success: true };
  } catch (error) {
    console.error("autoRemediateExams failed:", error);
    return { success: false };
  }
}

export async function getRemediableExamForLesson(studentId: string, lessonId: string): Promise<string | null> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: lesson } = await supabaseAdmin.from("lessons").select("section_id").eq("id", lessonId).single();
    if (!lesson) return null;

    const { data: section } = await supabaseAdmin.from("sections").select("track_id").eq("id", lesson.section_id).single();
    const trackId = section?.track_id;

    let query = supabaseAdmin.from("exams").select("id, section_id, track_id");
    if (trackId) {
      query = query.or(`section_id.eq.${lesson.section_id},track_id.eq.${trackId}`);
    } else {
      query = query.eq("section_id", lesson.section_id);
    }

    const { data: exams, error: examsError } = await query;

    if (examsError || !exams || exams.length === 0) return null;

    for (const exam of exams) {
      // Check if this exam is locked for the student
      const { count: officialCount } = await supabaseAdmin.from("exam_attempts")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("exam_id", exam.id);

      const { count: grantedCount } = await supabaseAdmin.from("granted_exam_attempts")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("exam_id", exam.id);

      const official = officialCount || 0;
      const granted = grantedCount || 0;

      // It is remediable if official >= 5 AND they don't have unused granted attempts AND granted < 5
      if (official >= 5 && official >= 5 + granted && granted < 5) {
        return exam.id;
      }
    }
    return null;
  } catch (e) {
    console.error("getRemediableExamForLesson error:", e);
    return null;
  }
}

export async function archiveStudentCourse(studentId: string, courseId: string) {
  await verifyUserAccess(studentId);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Get tracks and sections for this course to identify related progress
    // Fetch course to get trackIds from description JSON
    const { data: courseData } = await supabaseAdmin.from("courses").select("description").eq("id", courseId).single();
    let trackIds: string[] = [];
    
    try {
      if (courseData?.description && courseData.description.startsWith("{")) {
        const meta = JSON.parse(courseData.description);
        if (Array.isArray(meta.trackIds) && meta.trackIds.length > 0) {
          trackIds = meta.trackIds;
        }
      }
    } catch (e) {
      // ignore JSON parse error
    }

    // Fallback if no trackIds found in JSON
    if (trackIds.length === 0) {
      const { data: tracks } = await supabaseAdmin.from("tracks").select("id").eq("course_id", courseId);
      trackIds = tracks?.map(t => t.id) || [];
    }
    
    if (trackIds.length > 0) {
      const { data: sections } = await supabaseAdmin.from("sections").select("id").in("track_id", trackIds);
      const sectionIds = sections?.map(s => s.id) || [];

      // 2. Get lessons for these tracks
      const { data: lessons } = await supabaseAdmin.from("lessons").select("id").in("track_id", trackIds);
      const lessonIds = lessons?.map(l => l.id) || [];

      // 3. Get exams for these tracks/sections
      // Instead of complex OR, since exams belong to track OR section, fetch all and filter
      const { data: exams } = await supabaseAdmin.from("exams").select("id, track_id, section_id");
      const examIds = exams?.filter(e => trackIds.includes(e.track_id) || sectionIds.includes(e.section_id)).map(e => e.id) || [];

      // 4. Get micro skills for these sections
      const { data: microSkills } = await supabaseAdmin.from("micro_skills").select("id").in("section_id", sectionIds.length ? sectionIds : ['00000000-0000-0000-0000-000000000000']);
      const microSkillIds = microSkills?.map(m => m.id) || [];

      // 5. Delete lesson progress
      if (lessonIds.length > 0) {
        await supabaseAdmin.from("lesson_progress").delete().eq("student_id", studentId).in("lesson_id", lessonIds);
      }

      // 6. Delete exam attempts
      if (examIds.length > 0) {
        await supabaseAdmin.from("exam_attempts").delete().eq("student_id", studentId).in("exam_id", examIds);
        await supabaseAdmin.from("granted_exam_attempts").delete().eq("student_id", studentId).in("exam_id", examIds);
      }

      // 7. Delete skill progress and study plan tasks
      if (microSkillIds.length > 0) {
        await supabaseAdmin.from("skill_progress").delete().eq("student_id", studentId).in("micro_skill_id", microSkillIds);
        await supabaseAdmin.from("study_plan_tasks").delete().eq("student_id", studentId).in("micro_skill_id", microSkillIds);
      }
    }

    // 8. Delete final exam attempts
    const { data: finalExams } = await supabaseAdmin.from("final_exams").select("id").eq("course_id", courseId);
    const finalExamIds = finalExams?.map(f => f.id) || [];
    if (finalExamIds.length > 0) {
      await supabaseAdmin.from("final_exam_attempts").delete().eq("student_id", studentId).in("final_exam_id", finalExamIds);
    }

    // Note: We DO NOT delete certificates. They stay in the DB as historical records.

    // 9. Send Parent Notification about re-activation
    const [profileRes, courseRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, parent_phone").eq("id", studentId).single(),
      supabaseAdmin.from("courses").select("title").eq("id", courseId).single(),
    ]);

    if (profileRes.data?.parent_phone) {
      await supabaseAdmin.from("notification_log").insert({
        student_id: studentId,
        parent_phone: profileRes.data.parent_phone,
        message_body: `قام الطالب ${profileRes.data.full_name} بإعادة تفعيل وبدء دورة "${courseRes.data?.title}" من جديد. نتمنى له التوفيق!`,
        status: "sent",
      });
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error archiving student course:", error);
    return { success: false, error: error.message || "حدث خطأ أثناء تصفير الدورة" };
  }
}

export async function saveLessonProgressTime(studentId: string, lessonId: string, progressSeconds: number) {
  await verifyUserAccess(studentId);
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabaseAdmin.from("lesson_progress").upsert({
      student_id: studentId,
      lesson_id: lessonId,
      progress_seconds: progressSeconds,
      updated_at: new Date().toISOString()
    }, { onConflict: "student_id,lesson_id" });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save lesson progress time:", error);
    return { success: false, error: error.message };
  }
}

export async function getLessonProgressTime(studentId: string, lessonId: string): Promise<number> {
  const supabase = await createServerClient();
  try {
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("progress_seconds, is_completed")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .single();
    if (error || !data) return 0;
    if (data.is_completed) return 0;
    return data.progress_seconds || 0;
  } catch (err) {
    return 0;
  }
}
