"use client";

import { useEffect } from "react";
import { useSyncStore } from "@/lib/sync-store";
import { submitSecureExamAttempt } from "@/app/actions/exams";
import { useToast } from "@/components/ui/toast";
import { usePlatformStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export function SyncManager() {
  const { pendingExams, removePendingExam } = useSyncStore();
  const { showToast } = useToast();
  const { applyUserProgress } = usePlatformStore();

  useEffect(() => {
    const handleOnline = async () => {
      if (pendingExams.length === 0) return;
      
      showToast("جاري مزامنة بياناتك واختباراتك المعلقة...", "warning");

      let successCount = 0;
      let userIdToSync = null;

      // Loop over queue and submit
      for (const pending of pendingExams) {
        try {
          const response = await submitSecureExamAttempt(pending.userId, pending.examId, pending.rawAnswers);
          if (response && response.success) {
            removePendingExam(pending.id);
            successCount++;
            userIdToSync = pending.userId; // Save userId to update their progress later
          } else {
            console.error("Failed to sync exam:", pending.examId);
          }
        } catch (err) {
          console.error("Error syncing exam:", err);
        }
      }
      
      if (successCount > 0) {
        showToast(`تمت مزامنة ${successCount} اختبار(ات) بنجاح!`, "success");
        
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
        window.dispatchEvent(new CustomEvent("exams-synced"));
      }
    };

    window.addEventListener("online", handleOnline);

    // Also attempt sync on mount if online
    if (typeof window !== "undefined" && navigator.onLine && pendingExams.length > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [pendingExams, removePendingExam, showToast, applyUserProgress]);

  return null;
}
