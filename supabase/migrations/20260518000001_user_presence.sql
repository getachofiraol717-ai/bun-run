-- ============================================================
-- MIGRATION: User Presence & Active Session Tracking
-- ============================================================

-- Add presence columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS presence_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = true;

-- ── Heartbeat function: called every 30s from client ─────────────
-- Marks user online and updates last_seen_at atomically
CREATE OR REPLACE FUNCTION public.update_user_presence()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  UPDATE public.profiles
  SET
    is_online          = true,
    last_seen_at       = now(),
    presence_updated_at = now()
  WHERE user_id = _uid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_user_presence() TO authenticated;

-- ── Offline sweep: marks users offline if no heartbeat for 90s ───
-- Called by a Supabase cron job (pg_cron) or manually
CREATE OR REPLACE FUNCTION public.sweep_offline_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count INTEGER;
BEGIN
  UPDATE public.profiles
  SET is_online = false
  WHERE is_online = true
    AND presence_updated_at < now() - INTERVAL '90 seconds';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
-- Only service role can sweep
REVOKE ALL ON FUNCTION public.sweep_offline_users() FROM PUBLIC, anon, authenticated;

-- ── Admin RPC: get active users with full profile ────────────────
CREATE OR REPLACE FUNCTION public.get_active_users(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  subscription TEXT,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  signup_source TEXT,
  login_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT p.user_id, p.name, p.email, p.subscription,
           p.is_online, p.last_seen_at, p.signup_source, p.login_count
    FROM public.profiles p
    ORDER BY p.is_online DESC NULLS LAST, p.last_seen_at DESC NULLS LAST
    LIMIT _limit;
END;
$$;
REVOKE ALL ON FUNCTION public.get_active_users(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_users(INTEGER) TO authenticated;

-- RLS: let users update their own presence via the function (already SECURITY DEFINER)
-- Let admins read all profiles (already exists), add last_seen columns to their view
