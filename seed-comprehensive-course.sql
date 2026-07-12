-- =========================================================================
-- SEED SCRIPT FOR THE COMPREHENSIVE COURSE (الكورس الشامل)
-- =========================================================================

-- 1. DELETE existing data to ensure a clean slate
DELETE FROM courses;
-- Cascading deletes will remove tracks, sections, skills, exams, lessons, etc.

-- 2. CREATE THE COMPREHENSIVE COURSE
DO $$
DECLARE
    v_course_id uuid;
    v_track_komi uuid;
    v_track_lafzi uuid;
    v_track_tahsili uuid;
    v_track_tasis uuid;
    v_track_nafis uuid;
    
    v_sec_komi_1 uuid;
    v_sec_komi_2 uuid;
    v_skill_komi_1 uuid;
    v_skill_komi_2 uuid;

    v_exam_id uuid;
BEGIN
    -- Insert the Course
    INSERT INTO courses (title, subtitle, description, price, discounted_price, is_active, is_featured, exam_date)
    VALUES (
        'دورة القدرات 2026',
        'الدورة الشاملة لاختبار القدرات (كمي ولفظي)',
        'أقوى دورة شاملة تؤهلك لاجتياز اختبار القدرات بدرجة فوق 90% إن شاء الله.',
        500,
        0,
        true,
        true,
        '2026-11-01'
    ) RETURNING id INTO v_course_id;

    -- 3. CREATE TRACKS (المسارات)
    INSERT INTO tracks (course_id, name, color, icon, order_index) VALUES (v_course_id, 'قدرات كمي', '#6366f1', '📊', 1) RETURNING id INTO v_track_komi;
    INSERT INTO tracks (course_id, name, color, icon, order_index) VALUES (v_course_id, 'قدرات لفظي', '#ec4899', '📝', 2) RETURNING id INTO v_track_lafzi;
    INSERT INTO tracks (course_id, name, color, icon, order_index) VALUES (v_course_id, 'تحصيلي', '#10b981', '🔬', 3) RETURNING id INTO v_track_tahsili;
    INSERT INTO tracks (course_id, name, color, icon, order_index) VALUES (v_course_id, 'تأسيس', '#f59e0b', '🏗️', 4) RETURNING id INTO v_track_tasis;
    INSERT INTO tracks (course_id, name, color, icon, order_index) VALUES (v_course_id, 'نافس', '#8b5cf6', '🚀', 5) RETURNING id INTO v_track_nafis;

    -- 4. CREATE SECTIONS FOR "KOMI" (أقسام الكمي)
    INSERT INTO sections (track_id, name, order_index) VALUES (v_track_komi, 'الأساسيات في الجبر', 1) RETURNING id INTO v_sec_komi_1;
    INSERT INTO sections (track_id, name, order_index) VALUES (v_track_komi, 'الهندسة والقياس', 2) RETURNING id INTO v_sec_komi_2;

    -- 5. CREATE SKILLS (المهارات)
    INSERT INTO micro_skills (section_id, name) VALUES (v_sec_komi_1, 'الكسور والنسب') RETURNING id INTO v_skill_komi_1;
    INSERT INTO micro_skills (section_id, name) VALUES (v_sec_komi_1, 'المعادلات الخطية') RETURNING id INTO v_skill_komi_2;

    -- 6. CREATE LESSONS (الدروس)
    INSERT INTO lessons (track_id, section_id, title, video_url, teacher_name, duration_seconds, access_type, price, status)
    VALUES 
    (v_track_komi, v_sec_komi_1, 'مقدمة في الكسور (جزء 1)', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'أ. أحمد علي', 920, 'free', 0, 'normal'),
    (v_track_komi, v_sec_komi_1, 'تطبيقات على النسب', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'أ. أحمد علي', 1210, 'paid', 50, 'new');

    -- 7. CREATE EXAMS & QUESTIONS (الاختبارات والأسئلة)
    INSERT INTO exams (track_id, section_id, title, time_limit_seconds, access_type, price)
    VALUES (v_track_komi, v_sec_komi_1, 'اختبار قياس مستوى - الجبر', 1800, 'free', 0) RETURNING id INTO v_exam_id;

    -- Question 1
    DECLARE
        v_q1_id uuid;
        v_q2_id uuid;
    BEGIN
        INSERT INTO questions (exam_id, micro_skill_id, text, explanation, order_index)
        VALUES (v_exam_id, v_skill_komi_1, 'نصف العدد 2 أس 10 هو؟', 'نقسم على 2 فتنقص الأسس 1', 1)
        RETURNING id INTO v_q1_id;

        INSERT INTO question_options (question_id, text, is_correct) VALUES
        (v_q1_id, '2 أس 9', true),
        (v_q1_id, '2 أس 5', false),
        (v_q1_id, '1 أس 10', false),
        (v_q1_id, '4 أس 5', false);

        -- Question 2
        INSERT INTO questions (exam_id, micro_skill_id, text, explanation, order_index)
        VALUES (v_exam_id, v_skill_komi_2, 'قيمة س في المعادلة 2س + 4 = 10', 'بطرح 4 وقسمة الطرفين على 2', 2)
        RETURNING id INTO v_q2_id;

        INSERT INTO question_options (question_id, text, is_correct) VALUES
        (v_q2_id, '2', false),
        (v_q2_id, '3', true),
        (v_q2_id, '4', false),
        (v_q2_id, '5', false);
    END;

END $$;
