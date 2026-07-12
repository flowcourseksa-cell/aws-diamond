-- Create comment_bans table
CREATE TABLE IF NOT EXISTS comment_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX comment_bans_global_idx ON comment_bans (student_id) WHERE lesson_id IS NULL;
CREATE UNIQUE INDEX comment_bans_lesson_idx ON comment_bans (student_id, lesson_id) WHERE lesson_id IS NOT NULL;
ALTER TABLE comment_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own bans" ON comment_bans FOR SELECT TO authenticated USING (auth.uid() = student_id);
