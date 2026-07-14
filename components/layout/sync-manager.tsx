"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/lib/sync-store";
import { submitSecureExamAttempt } from "@/app/actions/exams";
import { useToast } from "@/components/ui/toast";
import { usePlatformStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export function SyncManager() {
  const { pendingExams, removePendingExam, pendingLessons, removePendingLesson } = useSyncStore();
  const { showToast } = useToast();
  const { applyUserProgress } = usePlatformStore();

  useEffect(() => {
    const handleOnline = async () => {
      if (pendingExams.length === 0 && pendingLessons.length === 0) return;
      
      showToast("جاري مزامنة بياناتك واختباراتك المعلقة...", "warning");

      let successCount = 0;
      let lessonSuccessCount = 0;
      let userIdToSync = null;

      // Loop over exams
      for (const pending of pendingExams) {
        try {
          const response = await submitSecureExamAttempt(pending.userId, pending.examId, pending.rawAnswers);
          if (response && response.success) {
            removePendingExam(pending.id);
            successCount++;
            userIdToSync = pending.userId;
          } else {
            console.error("Failed to sync exam:", pending.examId);
          }
        } catch (err) {
          console.error("Error syncing exam:", err);
        }
      }

      // Loop over lessons
      if (pendingLessons.length > 0) {
        const { markLessonCompleted } = await import("@/lib/supabase/services/progress");
        for (const pending of pendingLessons) {
          try {
            const success = await markLessonCompleted(pending.userId, pending.lessonId);
            if (success) {
              removePendingLesson(pending.id);
              lessonSuccessCount++;
              userIdToSync = pending.userId;
            }
          } catch (err) {
            console.error("Error syncing lesson:", err);
          }
        }
      }
      
      if (successCount > 0 || lessonSuccessCount > 0) {
        let msg = [];
        if (successCount > 0) msg.push(`${successCount} اختبار(ات)`);
        if (lessonSuccessCount > 0) msg.push(`${lessonSuccessCount} درس(دروس)`);
        showToast(`تمت مزامنة ${msg.join(" و ")} بنجاح!`, "success");
        
        // Refresh global user progress after sync to reflect new scores
        if (userIdToSync) {
          try {
            const { fetchUserProgress } = await import("@/lib/supabase/services/progress");
            const { skills, lessons } = await fetchUserProgress(userIdToSync);
            applyUserProgress(skills, lessons);
          } catch (progressErr) {
            console.error("Failed to re-sync user progress after background sync:", progressErr);
          }
        }

        // Trigger custom event so exams-client reloads its stats
        if (successCount > 0) {
          window.dispatchEvent(new CustomEvent("exams-synced"));
        }
      }
    };

    window.addEventListener("online", handleOnline);

    // Also attempt sync on mount if online
    if (typeof window !== "undefined" && navigator.onLine && (pendingExams.length > 0 || pendingLessons.length > 0)) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [pendingExams, pendingLessons, removePendingExam, removePendingLesson, showToast, applyUserProgress]);

  return null;
}
