-- Add new columns to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;

-- Create lesson_comments table
CREATE TABLE IF NOT EXISTS lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  parent_id UUID REFERENCES lesson_comments(id) ON DELETE CASCADE,
  is_admin_reply BOOLEAN DEFAULT false
);

-- Enable RLS for lesson_comments
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_comments
-- Anyone can view comments
CREATE POLICY "Anyone can view lesson comments"
ON lesson_comments FOR SELECT
USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert lesson comments"
ON lesson_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own lesson comments"
ON lesson_comments FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- Users can update their own comments
CREATE POLICY "Users can update own lesson comments"
ON lesson_comments FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);
