// ============================================================
// منصة الأوس الماسية — TypeScript Types (مطابق لـ Supabase Schema)
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ── Enums ────────────────────────────────────────────────────
export type AccessType        = "free" | "paid";
export type Difficulty        = "easy" | "medium" | "hard";
export type SkillStatus       = "not_started" | "weak" | "average" | "strong";
export type NotificationStatus = "pending" | "sent" | "failed";
export type UserRole          = "student" | "admin" | "super_admin";

// ── Database Tables ──────────────────────────────────────────
export interface Track {
  id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  icon: string | null;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  track_id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  // Joined
  track?: Track;
}

export interface Skill {
  id: string;
  section_id: string;
  slug: string;
  name_ar: string;
  description: string | null;
  mastery_threshold: number;
  remedial_video_url: string | null;
  order_index: number;
  created_at: string;
  // Joined
  section?: Section;
}

export interface Question {
  id: string;
  skill_id: string;
  body: string;
  options: string[];       // ["خيار أ", "خيار ب", "خيار ج", "خيار د"]
  correct_index: number;
  explanation: string | null;
  difficulty: Difficulty;
  source: string | null;
  is_active: boolean;
  created_at: string;
  // Joined
  skill?: Skill;
}

export interface Exam {
  id: string;
  track_id: string | null;
  section_id: string | null;
  title: string;
  description: string | null;
  time_minutes: number;
  access_type: AccessType;
  price: number;
  is_active: boolean;
  is_simulator: boolean;
  created_at: string;
  // Joined
  track?: Track;
  section?: Section;
  questions?: Question[];
}

export interface StudentProfile {
  id: string;
  full_name: string;
  phone: string | null;
  parent_phone: string;
  parent_name: string | null;
  grade: string | null;
  city: string | null;
  role: UserRole;
  avatar_url: string | null;
  streak_days: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface StudentSkillScore {
  id: string;
  student_id: string;
  skill_id: string;
  correct_count: number;
  total_attempts: number;
  mastery_score: number;    // 0-100
  status: SkillStatus;
  last_attempted_at: string | null;
  updated_at: string;
  // Joined
  skill?: Skill;
}

export interface ExamAttempt {
  id: string;
  student_id: string;
  exam_id: string;
  answers: Record<string, number>;  // {question_id: selected_index}
  score: number | null;
  correct_count: number;
  total_questions: number;
  time_taken_sec: number | null;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  // Joined
  exam?: Exam;
}

export interface WhatsAppNotification {
  id: string;
  student_id: string;
  parent_phone: string;
  message_body: string;
  status: NotificationStatus;
  attempt_count: number;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ── View Types ───────────────────────────────────────────────
export interface StudentWeakSkill {
  student_id: string;
  skill_id: string;
  skill_name: string;
  section_name: string;
  track_name: string;
  mastery_score: number;
  correct_count: number;
  total_attempts: number;
  status: SkillStatus;
  remedial_video_url: string | null;
}

export interface StudentTrackSummary {
  student_id: string;
  track_id: string;
  track_name: string;
  track_color: string;
  skills_attempted: number;
  avg_mastery: number;
  strong_count: number;
  average_count: number;
  weak_count: number;
}

// ── UI Helper Types ──────────────────────────────────────────
export interface SkillWithScore extends Skill {
  score?: StudentSkillScore;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
}

export interface ExamResult {
  attempt: ExamAttempt;
  skillBreakdown: Array<{
    skill: Skill;
    correct: number;
    total: number;
    percentage: number;
    status: SkillStatus;
  }>;
  weakSkills: Skill[];
  strongSkills: Skill[];
  whatsappMessage: string;
}

// ── Supabase Database Generic Type ──────────────────────────
export interface Database {
  public: {
    Tables: {
      tracks:                   { Row: Track;                  Insert: Partial<Track>;                  Update: Partial<Track>; };
      sections:                 { Row: Section;                Insert: Partial<Section>;                Update: Partial<Section>; };
      skills:                   { Row: Skill;                  Insert: Partial<Skill>;                  Update: Partial<Skill>; };
      questions:                { Row: Question;               Insert: Partial<Question>;               Update: Partial<Question>; };
      exams:                    { Row: Exam;                   Insert: Partial<Exam>;                   Update: Partial<Exam>; };
      student_profiles:         { Row: StudentProfile;         Insert: Partial<StudentProfile>;         Update: Partial<StudentProfile>; };
      student_skill_scores:     { Row: StudentSkillScore;      Insert: Partial<StudentSkillScore>;      Update: Partial<StudentSkillScore>; };
      exam_attempts:            { Row: ExamAttempt;            Insert: Partial<ExamAttempt>;            Update: Partial<ExamAttempt>; };
      whatsapp_notifications:   { Row: WhatsAppNotification;  Insert: Partial<WhatsAppNotification>;  Update: Partial<WhatsAppNotification>; };
    };
    Views: {
      student_weak_skills:    { Row: StudentWeakSkill; };
      student_track_summary:  { Row: StudentTrackSummary; };
    };
  };
}

