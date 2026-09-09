
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS page TEXT;
