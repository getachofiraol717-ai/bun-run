-- ============================================================
-- MIGRATION: Universe Events + AI Personality Lab tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.universe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('xp_boost','challenge','seasonal','tournament','community','ai_boost','custom')),
  description TEXT,
  color TEXT DEFAULT '#8b5cf6',
  multiplier REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universe_events_active ON public.universe_events(is_active, ends_at);

ALTER TABLE public.universe_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read active events (affects user XP etc.)
CREATE POLICY "Anyone views active events"
  ON public.universe_events FOR SELECT USING (true);

-- Only admins can create/modify events
CREATE POLICY "Admins manage events"
  ON public.universe_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ── Auto-expire events via scheduled check ──────────────────
CREATE OR REPLACE FUNCTION public.expire_universe_events()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _count INTEGER;
BEGIN
  UPDATE public.universe_events
  SET is_active = false
  WHERE is_active = true AND ends_at IS NOT NULL AND ends_at < now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- ── Active event helper for client ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_active_events()
RETURNS TABLE(id UUID, name TEXT, type TEXT, color TEXT, multiplier REAL, ends_at TIMESTAMPTZ)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, name, type, color, multiplier, ends_at
  FROM public.universe_events
  WHERE is_active = true AND (ends_at IS NULL OR ends_at > now())
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_events() TO authenticated, anon;
