import { createClient } from "@/lib/supabase/client";
import { fetchStudentStats } from "@/lib/supabase/services/student-stats";

type ParserOptions = {
  template: string;
  studentId: string;
};

/**
 * Parses a notification template and replaces variables with real student data from Supabase.
 */
export async function parseNotificationTemplate({ template, studentId }: ParserOptions): Promise<string> {
  const supabase = createClient();
  let parsedText = template;

  // 1. Replace simple string variables
  if (parsedText.includes("{timestamp}")) {
    const timestamp = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
    parsedText = parsedText.replace(/{timestamp}/g, timestamp);
  }

  if (parsedText.includes("{random_id}")) {
    const randomId = Math.floor(1000 + Math.random() * 9000).toString();
    parsedText = parsedText.replace(/{random_id}/g, randomId);
  }

  if (parsedText.includes("{random_greeting}")) {
    const greetings = ["مرحباً", "أهلاً بك", "تحية طيبة", "أهلاً وسهلاً"];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    parsedText = parsedText.replace(/{random_greeting}/g, randomGreeting);
  }

  // 2. Fetch student details if needed
  let studentName = "ولي الأمر";
  if (parsedText.includes("{name}") || parsedText.includes("{link}") || parsedText.includes("{courses_report}")) {
    const { data: student } = await supabase
      .from("profiles")
      .select("full_name, id") // Assuming id or some code is used for the link
      .eq("id", studentId)
      .single();

    if (student) {
      studentName = student.full_name || "ولي الأمر";
    }

    parsedText = parsedText.replace(/{name}/g, studentName);

    if (parsedText.includes("{link}")) {
      // In the future, this could be a hashed short code for security.
      // For now, it routes to the parent portal using the student's ID.
      const portalLink = `https://tkhsas.com/p/${studentId.substring(0, 8)}`; 
      parsedText = parsedText.replace(/{link}/g, portalLink);
    }
  }

  // 3. Generate Comprehensive Courses Report
  if (parsedText.includes("{courses_report}")) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        course_id,
        courses ( id, title )
      `)
      .eq("student_id", studentId)
      .eq("is_active", true);

    if (!enrollments || enrollments.length === 0) {
      parsedText = parsedText.replace(/{courses_report}/g, "لا توجد دورات مسجلة حالياً للاستخراج.");
    } else {
      let reportText = "";

      for (const enrollment of enrollments) {
        const course = enrollment.courses as any;
        if (!course) continue;

        const stats = await fetchStudentStats(studentId, course.id, supabase);

        // Calculate progress percentage
        const progressPercent = stats.totalLessons > 0 
          ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
          : 0;

        // Build strengths text (Skills mastered)
        const mastered = stats.masteredSkills > 0 
          ? `أتقن ${stats.masteredSkills} مهارة` 
          : "قيد التطوير";

        // Build weaknesses text
        let weaknessesText = "لا توجد نقاط ضعف بارزة حالياً";
        if (stats.topWeakSkills && stats.topWeakSkills.length > 0) {
          weaknessesText = stats.topWeakSkills.slice(0, 2).map(ws => ws.name).join("، ");
        }

        reportText += `📚 دورة: ${course.title}\n`;
        reportText += `🎯 الإنجاز: ${progressPercent}%\n`;
        reportText += `📈 نقاط القوة: ${mastered}\n`;
        reportText += `⚠️ مهارات تحتاج تركيز: ${weaknessesText}\n\n`;
      }

      parsedText = parsedText.replace(/{courses_report}/g, reportText.trim());
    }
  }

  return parsedText;
}
