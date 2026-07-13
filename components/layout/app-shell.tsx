"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformStore } from "@/lib/store";
import { fetchUserEnrollments } from "@/lib/supabase/services/enrollments";
import { fetchHierarchyByCourse } from "@/lib/supabase/services/hierarchy";
import { fetchLessonsByTracks } from "@/lib/supabase/services/lessons";
import { fetchExamsByTracks } from "@/lib/supabase/services/exams";
import { fetchFilesByTracks } from "@/lib/supabase/services/library";
import { FlowTrack } from "@/lib/mock-data";
import { SyncManager } from "./sync-manager";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [examActive, setExamActive] = useState(false);
  const { user, profile, isLoading } = useAuth();
  const { setEnrolledCourses, enrolledCourseId, setEnrolledCourseId, setTracks, setLessons, setExams, setFiles, setIsDataLoading, applyUserProgress, tracks, lessons } = usePlatformStore();
  // Track the userId / courseId we last loaded for — prevents re-fetch on token refresh
  const loadedForUserRef = useRef<string | null>(null);
  const loadedForCourseRef = useRef<string | null>(null);
  // Timestamp of last background refresh
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    // Close sidebar by default on mobile screens
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Show loading spinner only for a max of 5 seconds to prevent infinite spinner
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setForceReady(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  // Listen for exam start/end events from ExamRunner
  useEffect(() => {
    const onExamStarted = () => {
      setSidebarOpen(false); // Auto-close sidebar
      setExamActive(true);   // Enable nav lock
    };
    const onExamEnded = () => {
      setExamActive(false);  // Release nav lock
    };
    window.addEventListener("exam-started", onExamStarted);
    window.addEventListener("exam-ended", onExamEnded);
    return () => {
      window.removeEventListener("exam-started", onExamStarted);
      window.removeEventListener("exam-ended", onExamEnded);
    };
  }, []);

  // Redirect to login if not authenticated (after loading finishes)
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/login";
    }
  }, [isLoading, user]);

  // Redirect to onboarding if profile is confirmed missing (not just loading)
  // We wait at least 3 seconds to avoid false redirects during cache init
  useEffect(() => {
    if (!isLoading && user && profile === null) {
      // Give it extra time since localStorage cache may still be loading
      const timeout = setTimeout(() => {
        // Re-check profile after delay — if still null, redirect
        const cached = localStorage.getItem("tkhsas-profile-cache");
        if (!cached) {
          window.location.href = "/onboarding";
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, profile]);

  // Fetch enrolled courses — only when userId actually changes or every 30 seconds if empty
  const lastEnrollmentFetch = useRef<number>(0);
  
  useEffect(() => {
    if (!user || isLoading) return;
    
    const now = Date.now();
    const isSameUser = loadedForUserRef.current === user.id;
    const hasCourses = usePlatformStore.getState().enrolledCourses.length > 0;
    
    // Only skip if we already loaded for this user AND we have courses OR we checked less than 30 seconds ago
    if (isSameUser && (hasCourses || now - lastEnrollmentFetch.current < 30000)) {
      return;
    }
    
    loadedForUserRef.current = user.id;
    lastEnrollmentFetch.current = now;

    fetchUserEnrollments(user.id).then((enrollments) => {
      if (enrollments && enrollments.length > 0) {
        const courses = enrollments
          .filter((e) => e.is_active && e.courses)
          .map((e) => ({
            id: e.course_id,
            title: Array.isArray(e.courses) ? (e.courses[0] as any)?.title : (e.courses as any)?.title || "دورة غير معروفة",
            featuresOverride: Array.isArray(e.courses) ? (e.courses[0] as any)?.features_override : (e.courses as any)?.features_override || {},
          }));
        setEnrolledCourses(courses);
        
        // Ensure the active course ID is valid (not a simulator, which is filtered out)
        const currentId = usePlatformStore.getState().enrolledCourseId || localStorage.getItem("active_course_id");
        const isValid = courses.some((c: any) => c.id === currentId);
        
        if (courses.length > 0 && (!currentId || !isValid)) {
          setEnrolledCourseId(courses[0].id);
          localStorage.setItem("active_course_id", courses[0].id);
          
          // If we had an invalid ID and we are not just loading for the first time
          if (currentId && !isValid && window.location.pathname !== '/dashboard') {
             // Redirect to dashboard to prevent being stuck on an invalid URL
             window.location.href = '/dashboard';
          }
        }
      }
    }).catch((err) => console.error("Error fetching enrollments:", err));
  }, [user?.id, isLoading, setEnrolledCourses, enrolledCourseId, setEnrolledCourseId, window.location.pathname]);

  // Fetch real content — stale-while-revalidate:
  // If cached data exists in Zustand, show it immediately (no spinner),
  // then refresh silently in background. Hard-fetch only on first load.
  useEffect(() => {
    // BUG FIX: Wait for auth to finish loading before fetching content,
    // otherwise we might fetch without a user and cache empty progress.
    if (isLoading) return;

    const hasCachedData = tracks.length > 0;
    // Use targetCourseId or a dummy string for first load check if neither exists
    const isFirstLoad = loadedForCourseRef.current !== (enrolledCourseId || 'default');
    const now = Date.now();
    // Throttle background refresh to once every 10 minutes
    const shouldRefresh = now - lastRefreshRef.current > 10 * 60 * 1000;

    if (isFirstLoad) {
      loadedForCourseRef.current = enrolledCourseId || 'default';
      lastRefreshRef.current = now;
      // Show spinner only if no cached data available
      if (!hasCachedData) setIsDataLoading(true);
    } else if (!shouldRefresh) {
      // Data is fresh enough, skip
      return;
    } else {
      // Background refresh — don't show spinner
      lastRefreshRef.current = now;
    }
    async function loadData() {
      console.log("====== app-shell loadData called! ======", { enrolledCourseId, user: user?.id, isFirstLoad, shouldRefresh });
      
      try {
        // If no enrolled course, we still want to fetch the default course (دورة الاوس الماسية الشاملة)
        // so the dashboard is populated with the hierarchy instead of being totally empty.
        let targetCourseId = enrolledCourseId;
        if (!targetCourseId) {
          const { data: defaultCourse } = await import("@/lib/supabase/client").then(m => m.createClient().from('courses').select('id').neq('title', 'اختبار الستيب ( STEP )').not('title', 'ilike', '%محاكي%').limit(1).maybeSingle());
          if (defaultCourse) {
            targetCourseId = defaultCourse.id;
          } else {
            setIsDataLoading(false);
            return;
          }
        }

        // Parallelize initial top-level fetches for maximum speed
        const [
          platformSettings,
          dbTracks,
          progressRes
        ] = await Promise.all([
          import("@/lib/supabase/services/settings").then(m => m.fetchPlatformSettings()),
          fetchHierarchyByCourse(targetCourseId!),
          user ? import("@/lib/supabase/services/progress-actions").then(m => m.fetchUserProgressServer(user.id).catch(err => {
            console.warn("Could not fetch user progress (possibly offline):", err?.message);
            return { skills: [], lessons: [] };
          })) : Promise.resolve({ skills: [], lessons: [] })
        ]);

        usePlatformStore.getState().setPlatformSettings(platformSettings);

        const skillsProgress: any[] = progressRes.skills || [];
        const lessonsProgress: any[] = progressRes.lessons || [];
        const fetchedProgress = !!user;

        if (user) {
          console.log("====== PROGRESS FETCHED FOR USER ======", user.id, "SKILLS:", skillsProgress.length, "LESSONS:", lessonsProgress.length);
        }

        const oldSkillsMap = new Map();
        tracks.forEach(t => t.sections.forEach(s => s.skills.forEach(sk => oldSkillsMap.set(sk.id, { score: sk.masteryScore, status: sk.status }))));
        
        const oldLessonsMap = new Map();
        lessons.forEach(l => oldLessonsMap.set(l.id, l.status));

        // Build progress lookup maps — store the full row so we can check total_questions_seen
        const skillsMap = new Map(
          skillsProgress.map((s: any) => [s.micro_skill_id, s])
        );
        const lessonsMap = new Map(
          lessonsProgress.map((l: any) => [l.lesson_id, l])
        );
        
        // Map DbTrack to FlowTrack for the UI — scores applied inline
        const mappedTracks: FlowTrack[] = dbTracks.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color || "#6C63FF",
          gradient: t.color ? `from-[${t.color}] to-[${t.color}80]` : "from-[#6C63FF] to-[#6C63FF80]",
          icon: t.icon || "Brain",
          sections: (t.sections || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            skills: (s.micro_skills || []).map((sk: any) => {
              // Use live DB score if available, else fall back to cached or zero
              const progressData: any = fetchedProgress ? skillsMap.get(sk.id) : null;
              const score: number = progressData
                ? (progressData.mastery_score ?? 0)
                : (oldSkillsMap.get(sk.id)?.score ?? 0);
              // A skill is "not_started" only if there's NO row in skill_progress for it.
              // If a row exists with total_questions_seen > 0, it was attempted — even if score is 0.
              const hasBeenAttempted = fetchedProgress
                ? (progressData !== undefined && (progressData.total_questions_seen || 0) > 0)
                : (oldSkillsMap.get(sk.id)?.status !== "not_started" && oldSkillsMap.has(sk.id));
              let status: "not_started" | "weak" | "average" | "strong" = "not_started";
              if (hasBeenAttempted) {
                if (score < 50) status = "weak";
                else if (score < 80) status = "average";
                else status = "strong";
              }
              return { id: sk.id, name: sk.name, lessonId: sk.lesson_id, masteryScore: score, status };
            })
          }))
        }));
        
        setTracks(mappedTracks);
        
        const trackIds = dbTracks.map(t => t.id);
        if (trackIds.length > 0) {
          const [fetchedLessons, exams, files] = await Promise.all([
            fetchLessonsByTracks(trackIds),
            fetchExamsByTracks(trackIds),
            fetchFilesByTracks(trackIds)
          ]);
          
          // Map to Store types — lesson status applied inline from DB progress
          setLessons(fetchedLessons.map(l => {
            let status: "new" | "normal" | "completed" = "normal";
            let pSec = 0;
            if (fetchedProgress) {
              const prog = lessonsMap.get(l.id);
              status = prog?.is_completed ? "completed" : "normal";
              pSec = prog?.progress_seconds || 0;
            } else {
              status = (oldLessonsMap.get(l.id) as any) || "normal";
              // We don't cache old progress_seconds yet, so assume 0 or 100%
              pSec = status === "completed" ? (l.duration_seconds || 1) : 0;
            }
            const dur = l.duration_seconds || 1;
            const percent = Math.min(100, Math.round((pSec / dur) * 100));

            return {
              id: l.id,
              title: l.title,
              videoUrl: l.video_url || "",
              teacherName: l.teacher_name || "",
              trackId: l.track_id,
              sectionId: l.section_id || "",
              durationLabel: l.duration_seconds ? `${Math.floor(l.duration_seconds / 60)}:${(l.duration_seconds % 60).toString().padStart(2, '0')}` : "0:00",
              durationSeconds: l.duration_seconds || 0,
              progressPercent: status === "completed" ? 100 : percent,
              accessType: l.access_type,
              price: l.price || 0,
              status,
              coverImage: l.cover_image || undefined,
              commentsEnabled: l.comments_enabled ?? true
            };
          }));
          
          setExams(exams.map((e: any) => {
            const questions = (e.questions || []).map((q: any) => {
              const options = q.question_options || [];
              return {
                id: q.id,
                questionText: q.text,
                options: options.map((opt: any) => opt.text),
                explanation: q.explanation,
                skillId: q.micro_skill_id,
                skillName: q.micro_skills?.name || "مهارة",
                optionIds: options.map((opt: any) => opt.id)
              };
            });

            return {
              id: e.id,
              trackId: e.track_id,
              sectionId: e.section_id || "",
              name: e.title,
              timeMinutes: e.time_limit_seconds ? Math.floor(e.time_limit_seconds / 60) : 0,
              accessType: e.access_type,
              price: e.price || 0,
              questions: questions
            };
          }));
          
          setFiles(files.map((f: any) => ({
            id: f.id,
            title: f.title,
            type: f.file_type || 'pdf',
            category: f.category || 'ملازم وتأسيس',
            coverImage: f.cover_image || undefined,
            pagesCount: f.pages_count || 0,
            downloadsCount: f.downloads_count || 0,
            trackId: f.track_id,
            sectionId: "",
            url: f.file_url,
            sizeLabel: f.size_label || (f.file_url.includes("supabase.co") ? "ملف" : "رابط خارجي"),
            dateLabel: new Date(f.created_at).toLocaleDateString("ar-EG"),
            accessType: f.access_type,
            price: 0
          })));
        } else {
          setLessons([]);
          setExams([]);
          setFiles([]);
        }

        // No need to call applyUserProgress — progress was applied inline above.
      } catch (err) {
        console.error("Error loading course content:", err);
      } finally {
        setIsDataLoading(false);
      }
    }
    
    loadData();
  }, [enrolledCourseId, setTracks, setLessons, setExams, setFiles, setIsDataLoading, applyUserProgress, user?.id, isLoading]);



  // Show spinner while loading (with safety timeout)
  if (isLoading && !forceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
          <span className="text-sm text-text-muted font-medium">جاري تحميل المنصة...</span>
        </div>
      </div>
    );
  }

  // No user at all - redirect will happen via useEffect
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
          <span className="text-sm text-text-muted font-medium">جاري التحويل لتسجيل الدخول...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SyncManager />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col">
        {!examActive && (
          <Header
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            sidebarOpen={sidebarOpen}
          />
        )}
        <div className="flex flex-col gap-5 p-4 pb-24 md:p-6 md:pb-6">{children}</div>
      </main>

      {!examActive && <BottomNav />}

      {/* ── Exam Navigation Lock Overlay ── */}
      {examActive && (
        <div
          className="fixed inset-0 z-[9999] cursor-not-allowed"
          onClick={(e) => {
            // Allow clicks on the exam area (main content)
            const target = e.target as HTMLElement;
            // Block only sidebar / bottom-nav / header nav links
            const blocked = target.closest("nav, aside, [data-sidebar], [data-bottomnav], [data-header-nav]");
            if (blocked) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          style={{ pointerEvents: "none" }}
        />
      )}
    </div>
  );
}
