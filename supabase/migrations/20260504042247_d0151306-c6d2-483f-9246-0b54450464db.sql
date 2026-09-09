
-- Per-provider tracking
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS provider text;

-- AI settings singleton
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  free_msg_limit int NOT NULL DEFAULT 5,
  free_img_limit int NOT NULL DEFAULT 1,
  free_msg_limit_per_provider int NOT NULL DEFAULT 5,
  window_hours int NOT NULL DEFAULT 24,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ai_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read ai_settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Admins manage ai_settings" ON public.ai_settings;
CREATE POLICY "Anyone read ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ai_settings" ON public.ai_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Drop old RPC overloads, then re-create with new signature
DROP FUNCTION IF EXISTS public.check_and_record_ai_usage(text, integer, bigint);
DROP FUNCTION IF EXISTS public.check_and_record_ai_usage(text, integer, bigint, text);

CREATE OR REPLACE FUNCTION public.check_and_record_ai_usage(_kind text, _limit integer, _window_ms bigint, _provider text DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _uid UUID := auth.uid();
  _used INT;
  _is_premium BOOLEAN;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated', 'used', 0, 'limit', _limit);
  END IF;
  IF _kind NOT IN ('message','image') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_kind', 'used', 0, 'limit', _limit);
  END IF;

  SELECT subscription = 'premium' INTO _is_premium FROM public.profiles WHERE user_id = _uid;
  IF COALESCE(_is_premium, false) THEN
    INSERT INTO public.ai_usage (user_id, kind, provider) VALUES (_uid, _kind, _provider);
    RETURN jsonb_build_object('allowed', true, 'premium', true, 'used', 0, 'limit', -1);
  END IF;

  SELECT COUNT(*) INTO _used FROM public.ai_usage
    WHERE user_id = _uid AND kind = _kind
      AND (_provider IS NULL OR provider IS NULL OR provider = _provider)
      AND created_at > now() - (_window_ms || ' milliseconds')::interval;

  IF _used >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'used', _used, 'limit', _limit);
  END IF;

  INSERT INTO public.ai_usage (user_id, kind, provider) VALUES (_uid, _kind, _provider);
  RETURN jsonb_build_object('allowed', true, 'used', _used + 1, 'limit', _limit);
END;
$$;

-- Tighten EXECUTE permissions on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_and_record_ai_usage(text, integer, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_record_ai_usage(text, integer, bigint, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
