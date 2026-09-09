-- Migration: 20260907000001_add_grade_column_to_profiles.sql
-- Purpose: Add grade and role columns to public.profiles and refresh schema cache.

-- 1. Ensure grade and role columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 2. Add helpful index for grade-based queries and analytics
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON public.profiles(grade);

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
