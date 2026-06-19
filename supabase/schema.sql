-- ============================================================
-- منصة فلو — Schema كامل لـ Supabase
-- النسخة: 1.0.0
-- ============================================================
-- تشغيل هذا الملف في Supabase SQL Editor بالترتيب

-- ── تفعيل UUID ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════
-- ١. المسارات الرئيسية (Tracks)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tracks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,               -- 'qudrat-komi', 'qudrat-lafzi', 'nafis'
  name_ar     TEXT NOT NULL,                      -- 'القدرات (كمي)'
  description TEXT,
  icon        TEXT,                               -- اسم الأيقونة
  color       TEXT DEFAULT '#6366f1',             -- لون المسار
  order_index INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- ٢. الأقسام (Sections) — تتبع المسار
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  order_index INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id, slug)
);

-- ════════════════════════════════════════════════════════════
-- ٣. المهارات (Skills) — تتبع القسم
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS skills (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id      UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  description     TEXT,
  mastery_threshold INTEGER DEFAULT 80,          -- نسبة الإتقان المطلوبة (%)
  remedial_video_url TEXT,                       -- رابط فيديو الشرح العلاجي
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, slug)
);

-- ════════════════════════════════════════════════════════════
-- ٤. الأسئلة (Questions)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,                 -- نص السؤال
  options         JSONB NOT NULL,                -- ["خيار أ", "خيار ب", "خيار ج", "خيار د"]
  correct_index   SMALLINT NOT NULL,             -- الفهرس الصحيح 0-3
  explanation     TEXT,                          -- شرح الإجابة
  difficulty      TEXT DEFAULT 'medium'          -- easy | medium | hard
                    CHECK (difficulty IN ('easy','medium','hard')),
  source          TEXT,                          -- 'step-2023' | 'nafis-2024' إلخ
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- ٥. الاختبارات (Exams)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id        UUID REFERENCES tracks(id),
  section_id      UUID REFERENCES sections(id),
  title           TEXT NOT NULL,
  description     TEXT,
  time_minutes    INTEGER DEFAULT 60,
  access_type     TEXT DEFAULT 'free' CHECK (access_type IN ('free','paid')),
  price           NUMERIC(10,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  is_simulator    BOOLEAN DEFAULT FALSE,         -- هل هو محاكي؟
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ربط الأسئلة بالاختبارات (Many-to-Many)
CREATE TABLE IF NOT EXISTS exam_questions (
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  PRIMARY KEY (exam_id, question_id)
);

-- ════════════════════════════════════════════════════════════
-- ٦. الملفات الشخصية للطلاب (Student Profiles)
-- يمتد على auth.users الخاصة بـ Supabase Auth
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  phone             TEXT,
  parent_phone      TEXT NOT NULL,               -- إجباري لإشعارات الواتساب
  parent_name       TEXT,
  grade             TEXT,                        -- الصف الدراسي
  city              TEXT,
  role              TEXT DEFAULT 'student'
                      CHECK (role IN ('student','admin','super_admin')),
  avatar_url        TEXT,
  streak_days       INTEGER DEFAULT 0,
  total_points      INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- ٧. نقاط إتقان المهارات (الجدول الأهم)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS student_skill_scores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  correct_count     INTEGER DEFAULT 0,
  total_attempts    INTEGER DEFAULT 0,
  mastery_score     NUMERIC(5,2) DEFAULT 0,      -- نسبة مئوية محسوبة
  status            TEXT DEFAULT 'not_started'
                      CHECK (status IN ('not_started','weak','average','strong')),
  last_attempted_at TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- ════════════════════════════════════════════════════════════
-- ٨. محاولات الاختبارات (Exam Attempts)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exam_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  answers         JSONB DEFAULT '{}',            -- {question_id: selected_index}
  score           NUMERIC(5,2),                  -- نسبة مئوية
  correct_count   INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_taken_sec  INTEGER,                       -- الوقت المستغرق
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  is_completed    BOOLEAN DEFAULT FALSE
);

-- ════════════════════════════════════════════════════════════
-- ٩. إشعارات الواتساب (WhatsApp Notifications Queue)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  parent_phone    TEXT NOT NULL,
  message_body    TEXT NOT NULL,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','failed')),
  attempt_count   INTEGER DEFAULT 0,
  scheduled_for   TIMESTAMPTZ DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- ١٠. الكورسات / الاشتراكات
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id        UUID REFERENCES tracks(id),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) DEFAULT 0,
  original_price  NUMERIC(10,2) DEFAULT 0,
  access_type     TEXT DEFAULT 'paid' CHECK (access_type IN ('free','paid')),
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_enrollments (
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  PRIMARY KEY (student_id, course_id)
);

-- ════════════════════════════════════════════════════════════
-- Functions & Triggers
-- ════════════════════════════════════════════════════════════

-- ١. حساب Mastery Score تلقائياً عند كل تحديث
CREATE OR REPLACE FUNCTION update_mastery_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_attempts > 0 THEN
    NEW.mastery_score := ROUND((NEW.correct_count::NUMERIC / NEW.total_attempts) * 100, 2);
  ELSE
    NEW.mastery_score := 0;
  END IF;

  -- تحديث الحالة بناءً على النسبة
  NEW.status := CASE
    WHEN NEW.mastery_score >= 80 THEN 'strong'
    WHEN NEW.mastery_score >= 60 THEN 'average'
    WHEN NEW.total_attempts > 0  THEN 'weak'
    ELSE 'not_started'
  END;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_mastery
  BEFORE INSERT OR UPDATE ON student_skill_scores
  FOR EACH ROW EXECUTE FUNCTION update_mastery_score();

-- ٢. تحديث updated_at في student_profiles تلقائياً
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_profiles_updated
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ٣. إنشاء Profile تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_profiles (id, full_name, parent_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'طالب جديد'),
    COALESCE(NEW.raw_user_meta_data->>'parent_phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ════════════════════════════════════════════════════════════
ALTER TABLE student_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skill_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments       ENABLE ROW LEVEL SECURITY;

-- الطالب يشوف بياناته بس
CREATE POLICY "student_own_profile"
  ON student_profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "student_own_skill_scores"
  ON student_skill_scores FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "student_own_attempts"
  ON exam_attempts FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "student_own_enrollments"
  ON student_enrollments FOR SELECT
  USING (auth.uid() = student_id);

-- المحتوى العام يقدر يشوفه أي حد
CREATE POLICY "public_read_tracks"   ON tracks    FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_sections" ON sections  FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_skills"   ON skills    FOR SELECT USING (true);
CREATE POLICY "public_read_questions" ON questions FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_exams"    ON exams     FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_courses"  ON courses   FOR SELECT USING (is_active = true);

-- ════════════════════════════════════════════════════════════
-- البيانات الأولية (Seed Data)
-- ════════════════════════════════════════════════════════════

-- المسارات الثلاثة
INSERT INTO tracks (slug, name_ar, description, icon, color, order_index) VALUES
  ('qudrat-komi',  'القدرات (كمي)',  'اختبار القدرات الكمية — الجبر والهندسة والإحصاء', 'IconMath',    '#6366f1', 1),
  ('qudrat-lafzi', 'القدرات (لفظي)', 'اختبار القدرات اللفظية — المفردات والاستيعاب',    'IconBook',    '#8b5cf6', 2),
  ('nafis',        'اختبارات نافس',  'اختبارات نافس — رياضيات وعلوم ولغة عربية',        'IconAward',   '#f59e0b', 3);

-- أقسام القدرات الكمي
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'algebra',     'الجبر',              1 FROM tracks WHERE slug = 'qudrat-komi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'geometry',    'الهندسة',            2 FROM tracks WHERE slug = 'qudrat-komi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'statistics',  'الإحصاء',            3 FROM tracks WHERE slug = 'qudrat-komi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'word-problems','المسائل اللفظية',   4 FROM tracks WHERE slug = 'qudrat-komi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'comparisons', 'المقارنات الكمية',   5 FROM tracks WHERE slug = 'qudrat-komi';

-- أقسام القدرات اللفظي
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'odd-word',    'مفردة شاذة',         1 FROM tracks WHERE slug = 'qudrat-lafzi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'reading',     'استيعاب مقروء',      2 FROM tracks WHERE slug = 'qudrat-lafzi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'completion',  'إكمال جمل',          3 FROM tracks WHERE slug = 'qudrat-lafzi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'context-error','خطأ سياقي',          4 FROM tracks WHERE slug = 'qudrat-lafzi';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'analogy',     'تناظر لفظي',         5 FROM tracks WHERE slug = 'qudrat-lafzi';

-- أقسام نافس
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'math',        'الرياضيات',          1 FROM tracks WHERE slug = 'nafis';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'science',     'العلوم',             2 FROM tracks WHERE slug = 'nafis';
INSERT INTO sections (track_id, slug, name_ar, order_index)
SELECT id, 'arabic',      'اللغة العربية',      3 FROM tracks WHERE slug = 'nafis';

-- مهارات قسم الجبر (مثال تفصيلي)
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'linear-equations',  'المعادلات الخطية',     80, 1 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'algebra';
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'quadratic',         'المعادلات التربيعية',  80, 2 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'algebra';
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'functions',         'الدوال',               80, 3 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'algebra';
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'sequences',         'المتتاليات والمتسلسلات',80, 4 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'algebra';

-- مهارات قسم الهندسة
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'areas',             'المساحات والمحيطات',   80, 1 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'geometry';
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'angles',            'الزوايا والمثلثات',    80, 2 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'geometry';
INSERT INTO skills (section_id, slug, name_ar, mastery_threshold, order_index)
SELECT s.id, 'coordinates',       'الإحداثيات',           80, 3 FROM sections s JOIN tracks t ON s.track_id = t.id WHERE t.slug = 'qudrat-komi' AND s.slug = 'geometry';

-- ════════════════════════════════════════════════════════════
-- Views مفيدة للـ Dashboard
-- ════════════════════════════════════════════════════════════

-- عرض: المهارات الضعيفة لكل طالب مع اسم المهارة والقسم
CREATE OR REPLACE VIEW student_weak_skills AS
SELECT
  sss.student_id,
  sss.skill_id,
  sk.name_ar AS skill_name,
  sec.name_ar AS section_name,
  t.name_ar AS track_name,
  sss.mastery_score,
  sss.correct_count,
  sss.total_attempts,
  sss.status,
  sk.remedial_video_url
FROM student_skill_scores sss
JOIN skills sk ON sss.skill_id = sk.id
JOIN sections sec ON sk.section_id = sec.id
JOIN tracks t ON sec.track_id = t.id
WHERE sss.status IN ('weak', 'average');

-- عرض: ملخص أداء الطالب لكل مسار
CREATE OR REPLACE VIEW student_track_summary AS
SELECT
  sss.student_id,
  t.id AS track_id,
  t.name_ar AS track_name,
  t.color AS track_color,
  COUNT(sss.skill_id) AS skills_attempted,
  ROUND(AVG(sss.mastery_score), 2) AS avg_mastery,
  SUM(CASE WHEN sss.status = 'strong'  THEN 1 ELSE 0 END) AS strong_count,
  SUM(CASE WHEN sss.status = 'average' THEN 1 ELSE 0 END) AS average_count,
  SUM(CASE WHEN sss.status = 'weak'    THEN 1 ELSE 0 END) AS weak_count
FROM student_skill_scores sss
JOIN skills sk ON sss.skill_id = sk.id
JOIN sections sec ON sk.section_id = sec.id
JOIN tracks t ON sec.track_id = t.id
GROUP BY sss.student_id, t.id, t.name_ar, t.color;
