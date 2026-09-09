
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  subscription TEXT NOT NULL DEFAULT 'free' CHECK (subscription IN ('free', 'premium')),
  study_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Content items table
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('books', 'vocabulary', 'grammar', 'reference', 'videos')),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  access_level TEXT NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'premium')),
  file_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Analytics events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- User sessions table
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  pages_visited TEXT[] DEFAULT '{}',
  duration_minutes NUMERIC DEFAULT 0
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Nav items table
CREATE TABLE public.nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  auth_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;

-- Wellbeing stats table
CREATE TABLE public.wellbeing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  screen_time_minutes NUMERIC DEFAULT 0,
  focus_score NUMERIC DEFAULT 0,
  breaks_taken INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
ALTER TABLE public.wellbeing_stats ENABLE ROW LEVEL SECURITY;

-- Planets table
CREATE TABLE public.planets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planets ENABLE ROW LEVEL SECURITY;

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('students', 'teachers', 'schools', 'all')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Storage bucket for content files
INSERT INTO storage.buckets (id, name, public) VALUES ('content-files', 'content-files', true);

-- RLS POLICIES

-- user_roles: admins can manage, users can read own
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- profiles: admins can manage all, users can read/update own
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- content_items: readable by all auth, writable by admins
CREATE POLICY "Anyone can read content" ON public.content_items FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins can manage content" ON public.content_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- quiz_questions: readable by all auth, writable by admins
CREATE POLICY "Anyone can read quizzes" ON public.quiz_questions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins can manage quizzes" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- analytics_events: admins read all, users insert own
CREATE POLICY "Admins can read all analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own events" ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- user_sessions: admins read all, users manage own
CREATE POLICY "Admins can read all sessions" ON public.user_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own sessions" ON public.user_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- nav_items: readable by all, writable by admins
CREATE POLICY "Anyone can read nav items" ON public.nav_items FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Anon can read nav items" ON public.nav_items FOR SELECT TO anon
  USING (true);
CREATE POLICY "Admins can manage nav items" ON public.nav_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- wellbeing_stats: admins read all, users manage own
CREATE POLICY "Admins can read all wellbeing" ON public.wellbeing_stats FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own wellbeing" ON public.wellbeing_stats FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- planets: readable by all, writable by admins
CREATE POLICY "Anyone can read planets" ON public.planets FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins can manage planets" ON public.planets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- announcements: readable by all, writable by admins
CREATE POLICY "Anyone can read announcements" ON public.announcements FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies
CREATE POLICY "Public can read content files" ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files');
CREATE POLICY "Admins can upload content files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete content files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-files' AND public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planets_updated_at BEFORE UPDATE ON public.planets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
