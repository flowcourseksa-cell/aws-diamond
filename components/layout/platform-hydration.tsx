"use client";

import { useEffect } from "react";
import { usePlatformStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { FlowTrack, FlowSection, FlowSkill, AdminLesson, AdminExam, LibraryFile, SkillQuestion } from "@/lib/store";

export function PlatformHydration() {
  const { setTracks, setLessons, setExams, setFiles, applyUserProgress } = usePlatformStore();
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // 1. Fetch Comprehensive Course ID
      const { data: courses } = await supabase.from('courses').select('id').limit(1);
      if (!courses || courses.length === 0) return;
      const courseId = courses[0].id;

      // 2. Fetch Hierarchy
      const { data: tracksData } = await supabase
        .from("tracks")
        .select(`
          *,
          sections (
            *,
            micro_skills (*)
          )
        `)
        .eq("course_id", courseId)
        .order("order_index", { ascending: true })
        .order("order_index", { ascending: true, foreignTable: "sections" })
        .order("created_at", { ascending: true, foreignTable: "sections.micro_skills" });

      if (tracksData) {
        const parsedTracks: FlowTrack[] = tracksData.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "#6366f1",
          gradient: "from-indigo-500 to-violet-600",
          icon: t.icon || "📚",
          sections: (t.sections || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            skills: (s.micro_skills || []).map((ms: any) => ({
              id: ms.id,
              name: ms.name,
              masteryScore: 0, // Default to 0, updated below
              status: "not_started"
            }))
          }))
        }));
        setTracks(parsedTracks);
      }

      // 3. Fetch Lessons
      const { data: lessonsData } = await supabase.from('lessons').select('*');
      if (lessonsData) {
        const parsedLessons: AdminLesson[] = lessonsData.map((l: any) => ({
          id: l.id,
          title: l.title,
          videoUrl: l.video_url,
          teacherName: l.teacher_name || "المعلم",
          trackId: l.track_id,
          sectionId: l.section_id || "",
          durationLabel: `${Math.floor(l.duration_seconds / 60)}:${(l.duration_seconds % 60).toString().padStart(2, '0')}`,
          accessType: l.access_type,
          price: l.price || 0,
          status: l.status
        }));
        setLessons(parsedLessons);
      }

      // 4. Fetch Exams & Questions
      const { data: examsData } = await supabase
        .from('exams')
        .select(`
          *,
          questions (
            *,
            micro_skills(name),
            question_options (*)
          )
        `);
      
      if (examsData) {
        const parsedExams: AdminExam[] = examsData.map((e: any) => {
          const questions: SkillQuestion[] = (e.questions || []).map((q: any) => {
            const options = q.question_options || [];
            return {
              id: q.id,
              questionText: q.text,
              options: options.map((opt: any) => opt.text),
              correctIndex: options.findIndex((opt: any) => opt.is_correct) >= 0 ? options.findIndex((opt: any) => opt.is_correct) : 0,
              explanation: q.explanation,
              skillId: q.micro_skill_id,
              skillName: q.micro_skills?.name || "مهارة",
            };
          });

          return {
            id: e.id,
            trackId: e.track_id,
            sectionId: e.section_id || "",
            name: e.title,
            timeMinutes: Math.floor(e.time_limit_seconds / 60),
            accessType: e.access_type,
            price: e.price || 0,
            questions: questions
          };
        });
        setExams(parsedExams);
      }

      // 5. Fetch Library Files
      const { data: filesData } = await supabase.from('library_files').select('*');
      if (filesData) {
        const parsedFiles: LibraryFile[] = filesData.map((f: any) => ({
          id: f.id,
          title: f.title,
          type: f.file_type === 'summary' ? 'pdf' : f.file_type || 'pdf',
          trackId: f.track_id,
          sectionId: "",
          url: f.file_url,
          sizeLabel: "1 MB", // Demo
          dateLabel: new Date(f.created_at).toLocaleDateString("ar-SA"),
          accessType: f.access_type,
          price: 0
        }));
        setFiles(parsedFiles);
      }
      // 6. Fetch User Progress (if logged in)
      if (user) {
        const { fetchUserProgress } = await import("@/lib/supabase/services/progress");
        const { skills, lessons } = await fetchUserProgress(user.id);
        applyUserProgress(skills, lessons);
      } else {
        // Reset to 0 if not logged in
        applyUserProgress([], []);
      }
    }

    loadData();
  }, [setTracks, setLessons, setExams, setFiles, applyUserProgress, user]);

  return null;
}
