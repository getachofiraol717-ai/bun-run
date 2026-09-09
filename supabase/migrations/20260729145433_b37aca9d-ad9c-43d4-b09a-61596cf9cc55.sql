
-- content_items
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  subject TEXT,
  grade INTEGER,
  language TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  author TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_items public read" ON public.content_items;
DROP POLICY IF EXISTS "content_items admin insert" ON public.content_items;
DROP POLICY IF EXISTS "content_items admin update" ON public.content_items;
DROP POLICY IF EXISTS "content_items admin delete" ON public.content_items;
CREATE POLICY "content_items public read" ON public.content_items FOR SELECT USING (true);
CREATE POLICY "content_items admin insert" ON public.content_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "content_items admin update" ON public.content_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "content_items admin delete" ON public.content_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- nav_items
CREATE TABLE IF NOT EXISTS public.nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  auth_required BOOLEAN NOT NULL DEFAULT false,
  roles TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_items TO authenticated;
GRANT ALL ON public.nav_items TO service_role;
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_items public read" ON public.nav_items;
DROP POLICY IF EXISTS "nav_items admin insert" ON public.nav_items;
DROP POLICY IF EXISTS "nav_items admin update" ON public.nav_items;
DROP POLICY IF EXISTS "nav_items admin delete" ON public.nav_items;
CREATE POLICY "nav_items public read" ON public.nav_items FOR SELECT USING (true);
CREATE POLICY "nav_items admin insert" ON public.nav_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "nav_items admin update" ON public.nav_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "nav_items admin delete" ON public.nav_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics own insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics own select" ON public.analytics_events;
CREATE POLICY "analytics own insert" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "analytics own select" ON public.analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- reading_progress
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_item_id UUID NOT NULL,
  current_page INTEGER NOT NULL DEFAULT 0,
  total_pages INTEGER NOT NULL DEFAULT 0,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rp own all" ON public.reading_progress;
CREATE POLICY "rp own all" ON public.reading_progress FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid());
