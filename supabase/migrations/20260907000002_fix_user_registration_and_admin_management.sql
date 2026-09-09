-- ============================================================================
-- Migration: Fix User Registration (No Role Selection) & Enable Full Admin Management
-- ============================================================================

-- 1. Ensure all columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON public.profiles(grade);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 2. Update has_role function to recognize designated admin and database roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Explicit admin check for owner email
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  IF LOWER(COALESCE(v_email, '')) = 'getachofiraol717@gmail.com' AND _role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 2. Query user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 3. Update handle_new_user trigger to remove role selection requirement
-- Everyone registers as standard learner; owner gets admin automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned_role app_role;
  v_name text;
  v_phone text;
  v_grade integer;
  v_language text;
  v_study_plan text;
  v_signup_source text;
BEGIN
  -- Designate owner as admin automatically, all others register as student
  IF LOWER(COALESCE(new.email, '')) = 'getachofiraol717@gmail.com' THEN
    v_assigned_role := 'admin'::app_role;
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

  -- 1. Upsert Profile safely
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
      role = COALESCE(public.profiles.role, EXCLUDED.role),
      updated_at = now();
  EXCEPTION WHEN undefined_column THEN
    -- Fallback if grade column is not yet refreshed in cache
    INSERT INTO public.profiles (
      id,
      user_id,
      name,
      email,
      phone,
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
      role = COALESCE(public.profiles.role, EXCLUDED.role),
      updated_at = now();
  END;

  -- 2. Seed assigned role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- 4. RLS Policies: Guarantee Admins have full access to view, edit, and manage profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins update profiles" ON public.profiles;

CREATE POLICY "Users and admins view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users and admins insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users and admins update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. RLS Policies for user_roles
DROP POLICY IF EXISTS "Users view own user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage all user_roles" ON public.user_roles;

CREATE POLICY "Users view own user_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all user_roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Analytics Events policy for admin audit logging
DROP POLICY IF EXISTS "analytics own insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics insert policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics own select" ON public.analytics_events;

CREATE POLICY "analytics insert policy"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "analytics own select"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 7. Seed Admin Role for getachofiraol717@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE LOWER(email) = 'getachofiraol717@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) = 'getachofiraol717@gmail.com';

-- 8. Backfill any auth.users missing from public.profiles
INSERT INTO public.profiles (id, user_id, name, email, role, subscription, created_at, updated_at)
SELECT
  u.id,
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Learner'),
  COALESCE(u.email, ''),
  CASE WHEN LOWER(u.email) = 'getachofiraol717@gmail.com' THEN 'admin' ELSE 'student' END,
  'free',
  COALESCE(u.created_at, now()),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
