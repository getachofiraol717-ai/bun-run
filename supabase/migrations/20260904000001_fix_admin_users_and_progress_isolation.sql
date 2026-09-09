-- Migration: 20260904000001_fix_admin_users_and_progress_isolation.sql
-- Purpose:
-- 1. Fix Admin Manage Users: Add admin RLS policies on public.profiles and public.user_roles.
-- 2. Harden handle_new_user trigger: Securely assign registration roles (student, teacher, school - never admin).
-- 3. Create persistent, user-scoped tables for learning progress (quiz_attempts, concept_mastery, user_streaks).
-- 4. Enable RLS and strict ownership policies (user_id = auth.uid()) for all learning progress tables.

-- ============================================================================
-- 0. ENSURE PROFILES TABLE COLUMNS EXIST
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- ============================================================================
-- 1. FIX PROFILES RLS FOR ADMIN ACCESS
-- ============================================================================

-- Drop restrictive policies if they exist to replace with comprehensive ones
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;

-- Ensure Admins can view and manage all profiles
CREATE POLICY "Admins view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure user_roles policies allow admins full management and users can view their own
DROP POLICY IF EXISTS "Admins manage all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own user_roles" ON public.user_roles;

CREATE POLICY "Admins manage all user_roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. HARDEN USER SIGNUP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_role text;
  v_assigned_role app_role;
  v_name text;
  v_phone text;
  v_grade integer;
  v_language text;
  v_study_plan text;
  v_signup_source text;
BEGIN
  -- Extract requested role safely (STUDENT, TEACHER, SCHOOL only - NEVER ADMIN from registration)
  v_raw_role := LOWER(COALESCE(new.raw_user_meta_data->>'role', 'student'));
  
  IF v_raw_role = 'teacher' THEN
    v_assigned_role := 'teacher'::app_role;
  ELSIF v_raw_role = 'school' THEN
    v_assigned_role := 'school'::app_role;
  ELSE
    v_assigned_role := 'student'::app_role;
  END IF;

  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Learner');
  v_phone := new.raw_user_meta_data->>'phone';
  v_language := COALESCE(new.raw_user_meta_data->>'language', 'en');
  v_study_plan := new.raw_user_meta_data->>'study_plan';
  v_signup_source := COALESCE(new.raw_user_meta_data->>'signup_source', 'web_register');

  BEGIN
    v_grade := (new.raw_user_meta_data->>'grade')::integer;
  EXCEPTION WHEN OTHERS THEN
    v_grade := NULL;
  END;

  -- 1. Upsert Profile
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
      name,
      email,
      phone,
      grade,
      study_plan,
      language,
      signup_source,
      role,
      subscription,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      new.id,
      v_name,
      new.email,
      v_phone,
      v_grade,
      v_study_plan,
      v_language,
      v_signup_source,
      v_assigned_role::text,
      'free',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      updated_at = now();
  EXCEPTION WHEN undefined_column THEN
    -- Resilient fallback if grade or role column does not exist in schema cache
    INSERT INTO public.profiles (
      id,
      user_id,
      name,
      email,
      phone,
      study_plan,
      language,
      signup_source,
      subscription,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      new.id,
      v_name,
      new.email,
      v_phone,
      COALESCE(v_study_plan, CASE WHEN v_grade IS NOT NULL THEN 'Grade ' || v_grade ELSE NULL END),
      v_language,
      v_signup_source,
      'free',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      updated_at = now();
  END;

  -- 2. Upsert User Role (authoritative)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. If teacher or school requires approval, insert into user_role_approvals if table exists
  IF v_assigned_role IN ('teacher'::app_role, 'school'::app_role) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_role_approvals'
    ) THEN
      INSERT INTO public.user_role_approvals (
        user_id,
        requested_role,
        status,
        created_at
      )
      VALUES (
        new.id,
        v_assigned_role::text,
        'pending',
        now()
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. PERSISTENT LEARNING PROGRESS TABLES WITH RLS
-- ============================================================================

-- Table: public.quiz_attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  title TEXT,
  subject TEXT,
  grade INTEGER,
  difficulty TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users insert own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users update own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins view all quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Users view own quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own quiz attempts"
  ON public.quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own quiz attempts"
  ON public.quiz_attempts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: public.concept_mastery
CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_name TEXT,
  subject TEXT NOT NULL,
  grade INTEGER,
  learning_objective TEXT,
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  successful_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'emerging' CHECK (status IN ('emerging', 'developing', 'proficient', 'mastered')),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_concept_mastery_user_concept UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_user ON public.concept_mastery(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_status ON public.concept_mastery(user_id, status);

ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own concept mastery" ON public.concept_mastery;
DROP POLICY IF EXISTS "Users insert own concept mastery" ON public.concept_mastery;
DROP POLICY IF EXISTS "Users update own concept mastery" ON public.concept_mastery;

CREATE POLICY "Users view own concept mastery"
  ON public.concept_mastery
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own concept mastery"
  ON public.concept_mastery
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own concept mastery"
  ON public.concept_mastery
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: public.user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_quizzes_completed INTEGER NOT NULL DEFAULT 0,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users insert own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users update own streaks" ON public.user_streaks;

CREATE POLICY "Users view own streaks"
  ON public.user_streaks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own streaks"
  ON public.user_streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own streaks"
  ON public.user_streaks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure grants for authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_mastery TO authenticated;
GRANT ALL ON public.concept_mastery TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;
