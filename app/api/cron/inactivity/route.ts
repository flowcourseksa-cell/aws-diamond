import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We need a service role key to bypass RLS for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Vercel / Next.js config to allow this endpoint to run for up to 5 minutes (300 seconds)
// Note: Requires Vercel Pro or a hosting provider that supports long-running functions.
export const maxDuration = 300; 

export async function GET(request: Request) {
  // 1. Verify cron secret to protect this endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();

    // To prevent Vercel/AWS serverless timeouts (usually 60s max), we process in small batches.
    // We only fetch students who ACTUALLY need an update.
    const { data: students, error } = await supabase
      .from("profiles")
      .select("id, full_name, parent_phone, last_active_at, warning_level")
      .eq("role", "student")
      .lt("last_active_at", threeDaysAgo) // Only fetch if they passed at least the first threshold
      .limit(20); // Process max 20 students per run to accommodate the 10-second delay safely!

    if (error) throw error;

    let processedCount = 0;

    for (const student of students) {
      if (!student.last_active_at) continue;

      const lastActive = student.last_active_at;
      const currentLevel = student.warning_level || 0;
      let newLevel = currentLevel;

      // Check 21 days (Revocation)
      if (lastActive <= twentyOneDaysAgo && currentLevel < 3) {
        newLevel = 3;
        const { data: enrollments } = await supabase.from("enrollments").select("id").eq("student_id", student.id);
        if (enrollments) {
          const { unenrollStudent } = await import("@/lib/supabase/services/students-actions");
          for (const enr of enrollments) {
            await unenrollStudent(enr.id);
          }
        }
        // TODO: Send Revocation Message (Queue it)
      } 
      // Check 7 days (Final Warning)
      else if (lastActive <= sevenDaysAgo && currentLevel < 2) {
        newLevel = 2;
        // TODO: Send Final Warning (Queue it)
      } 
      // Check 3 days (First Warning)
      else if (lastActive <= threeDaysAgo && currentLevel < 1) {
        newLevel = 1;
        // TODO: Send First Warning (Queue it)
      }

      // If level changed, update DB. This acts as our "Processed" flag so they aren't fetched again.
      if (newLevel !== currentLevel) {
        await supabase.from("profiles").update({ warning_level: newLevel }).eq("id", student.id);
        processedCount++;
        
        // Safe 10-second delay between WhatsApp requests as requested by the admin!
        // 20 users * 10 sec = 200 seconds (Safely within the 300s maxDuration limit)
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
