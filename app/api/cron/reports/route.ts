import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchWhatsappSettings } from "@/lib/supabase/services/settings";
import { fetchStudents } from "@/lib/supabase/services/students";

import { fetchStudentStats } from "@/lib/supabase/services/student-stats";
import { sendWhatsApp } from "@/lib/whatsapp";

export const maxDuration = 300; // 5 minutes max duration for serverless functions

const DAYS_ARABIC = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await fetchWhatsappSettings();

    if (!settings.useWhatsapp) {
      return NextResponse.json({ message: "WhatsApp channel is disabled. Skipping reports." });
    }

    const todayIndex = new Date().getDay();
    const todayArabic = DAYS_ARABIC[todayIndex];

    const isWeeklyDay = settings.autoWeekly && settings.weeklyDay === todayArabic;
    const isDailyDay = settings.autoExam && !isWeeklyDay;

    if (!isWeeklyDay && !isDailyDay) {
      return NextResponse.json({ message: "No reports scheduled for today or they are disabled." });
    }

    const students = await fetchStudents();
    
    const todayStr = new Date().toISOString().split('T')[0];

    const activeStudents = students.filter(s => {
      if (s.is_banned === true) {
        return false;
      }
      if (s.last_report_sent_at && s.last_report_sent_at.startsWith(todayStr)) {
        return false;
      }
      return true;
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = [];
    let count = 0;

    // Process in batches
    for (const student of activeStudents) {
      if (count >= 20) break; // Limit to 20 for this cron run to avoid timeout
      
      const phone = student.parent_phone || student.phone;
      if (!phone) continue;

      let message = "";
      let reportType = "";

      // Fetch Real Enrollments and Stats
      const { data: enrolls } = await supabaseAdmin
        .from("enrollments")
        .select("course_id, courses(id, title)")
        .eq("student_id", student.id)
        .eq("is_active", true);

      // Fetch Certificates to exclude passed courses
      const { data: certs } = await supabaseAdmin
        .from("certificates")
        .select("course_id, score_pct")
        .eq("student_id", student.id);

      const passedCourseIds = new Set(
        certs?.filter(c => c.score_pct >= 70).map(c => c.course_id) || []
      );

      let coursesListStr = "غير مسجل بدورات";
      let totalCompletedLessons = 0;
      let avgMasterySum = 0;
      let weakPointsList: string[] = [];
      let enrolledCount = 0;

      let detailedProgressStr = "";
      let detailedExamsStr = "";

      if (enrolls && enrolls.length > 0) {
        const titles = [];
        for (const e of enrolls) {
          const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          if (!course) continue;
          if (passedCourseIds.has(course.id)) continue; // 👈 Exclude completed courses

          titles.push(course.title);
          enrolledCount++;
          const stats = await fetchStudentStats(student.id, course.id, supabaseAdmin);
          totalCompletedLessons += stats.completedLessons;
          avgMasterySum += stats.avgMastery;
          weakPointsList.push(...stats.topWeakSkills.map(w => w.name));

          detailedProgressStr += `🔹 دورة (${course.title}): إتمام ${stats.completedLessons} درس\n`;
          detailedExamsStr += `🔹 دورة (${course.title}): إتقان بنسبة ${stats.avgMastery}%\n`;
        }
        coursesListStr = titles.join("، ");
      }

      const gpa = enrolledCount > 0 ? Math.round(avgMasterySum / enrolledCount) : 0;
      const weakPointsStr = weakPointsList.length > 0 ? [...new Set(weakPointsList)].slice(0, 3).join("، ") : "لا يوجد";

      if (isWeeklyDay) {
        // Build Weekly Report
        if (totalCompletedLessons === 0 && gpa === 0) {
          // Skip empty weekly reports if no progress at all
          continue;
        }

        reportType = "Weekly";
        message = settings.weeklyTemplate
          .replace("{name}", student.full_name)
          .replace("{courses_list}", coursesListStr)
          .replace("{progress_details}", detailedProgressStr.trim() || `لم يتم إنجاز دروس`)
          .replace("{exams_details}", detailedExamsStr.trim() || `لم يتم اجتياز تقييمات`)
          .replace("{gpa}", gpa.toString())
          .replace("{strong_points}", gpa >= 80 ? "مستوى ممتاز" : "مستوى جيد")
          .replace("{weak_points}", weakPointsStr)
          .replace("{ref_id}", `WK-${Date.now().toString().slice(-6)}`);

      } else if (isDailyDay) {
        // Build Daily Report
        reportType = "Daily";
        message = settings.examTemplate
          .replace("{name}", student.full_name)
          .replace("{daily_progress}", detailedProgressStr.trim() || `لم يتم إنجاز دروس`)
          .replace("{daily_exams}", detailedExamsStr.trim() || `لم يتم اجتياز تقييمات`)
          .replace("{ref_id}", `DY-${Date.now().toString().slice(-6)}`);
      }

      if (message) {
        // Send actual message via UltraMsg
        const sendResult = await sendWhatsApp(phone, message);
        
        results.push({
          student: student.full_name,
          phone,
          type: reportType,
          success: sendResult.success,
          error: sendResult.error,
          messagePreview: message.substring(0, 50) + "..."
        });

        count++;

        // Mark as sent for today using admin bypass
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin.from("profiles").update({ last_report_sent_at: new Date().toISOString() }).eq("id", student.id);

        // 10-second delay between messages to prevent bans
        if (count < 20) {
          await delay(10000);
        }
      }
    }

    return NextResponse.json({
      success: true,
      reportType: isWeeklyDay ? "Weekly" : "Daily",
      processedCount: count,
      results
    });

  } catch (error: any) {
    console.error("Cron Error (Reports):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}