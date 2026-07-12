import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseNotificationTemplate } from "@/lib/notifications/parser";

// 1. Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Define Day mapping
const DAYS_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export async function GET(request: Request) {
  try {
    // 1. Check authorization (Cron Secret) - Optional but recommended for production
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. We can't access localStorage in the backend. 
    // In a real scenario, settings should be fetched from a `settings` table.
    // For this demonstration/execution phase, we will fetch from `settings` table if it exists,
    // or simulate the logic based on the user's intended Dual-Engine logic.
    
    // Attempt to get settings from database
    const { data: dbSettings } = await supabase.from("settings").select("*").eq("key", "parent_notifications").single();
    
    // Fallback default settings (simulating what we saved in the UI)
    const settings = dbSettings?.value || {
      channel: "whatsapp",
      autoDaily: true,
      autoWeekly: true,
      weeklyDay: "friday",
      dailyWhatsappTemplate: "{random_greeting} ولي أمر الطالب {name}،\\nهذا ملخص سريع لأداء ابنكم اليوم:\\n\\n{courses_report}\\n\\nللمتابعة: {link}",
      weeklyWhatsappTemplate: "{random_greeting}،\\nهذا هو التقرير الأسبوعي المفصل للطالب {name}.\\n\\n{courses_report}\\n\\nالرابط: {link}",
      dailySmsTemplate: "التقرير اليومي للطالب {name}: {link}",
      weeklySmsTemplate: "التقرير الأسبوعي للطالب {name}: {link}",
      whatsappDelay: 15
    };

    if (settings.channel === "none") {
      return NextResponse.json({ message: "Notifications are disabled globally." });
    }

    const todayIndex = new Date().getDay();
    const todayName = DAYS_EN[todayIndex];

    // Conflict Resolution Logic
    const isWeeklyDay = settings.weeklyDay === todayName;
    const shouldSendWeekly = settings.autoWeekly && isWeeklyDay;
    const shouldSendDaily = settings.autoDaily && !isWeeklyDay; // Daily skips if it's weekly day!

    if (!shouldSendWeekly && !shouldSendDaily) {
      return NextResponse.json({ message: "No reports scheduled for today." });
    }

    // 3. Fetch all active students with parent phones
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, parent_phone")
      .eq("role", "student")
      .not("parent_phone", "is", null);

    if (!students || students.length === 0) {
      return NextResponse.json({ message: "No students with parent phones found." });
    }

    const results = [];
    
    // 4. Determine which template to use
    let templateToUse = "";
    if (settings.channel === "whatsapp") {
      templateToUse = shouldSendWeekly ? settings.weeklyWhatsappTemplate : settings.dailyWhatsappTemplate;
    } else {
      templateToUse = shouldSendWeekly ? settings.weeklySmsTemplate : settings.dailySmsTemplate;
    }

    // 5. Process queue
    for (const student of students) {
      // Use our backend parser to compile the comprehensive report!
      const finalMessage = await parseNotificationTemplate({
        template: templateToUse,
        studentId: student.id
      });

      // Here you would call your WhatsApp API (e.g., UltraMsg / Wati) or SMS API Gateway
      // For now, we simulate the delay and log it.
      
      results.push({
        student: student.full_name,
        phone: student.parent_phone,
        message: finalMessage,
        type: shouldSendWeekly ? "Weekly" : "Daily"
      });
      
      // Implement the anti-ban delay (only for WhatsApp)
      if (settings.channel === "whatsapp") {
        await new Promise(resolve => setTimeout(resolve, settings.whatsappDelay * 100)); // using 100ms instead of 1000ms just for testing speed, in production 1000ms
      }
    }

    return NextResponse.json({
      success: true,
      channel: settings.channel,
      reportType: shouldSendWeekly ? "Weekly" : "Daily",
      processedCount: results.length,
      data: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
