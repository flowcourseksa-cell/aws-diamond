-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global settings (all true by default)
INSERT INTO public.platform_settings (key, value)
VALUES 
    ('global_interactive_book', true),
    ('global_study_plan', true),
    ('global_library', true)
ON CONFLICT (key) DO NOTHING;

-- Add features_override column to courses if it doesn't exist
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS features_override JSONB DEFAULT '{}'::jsonb;
