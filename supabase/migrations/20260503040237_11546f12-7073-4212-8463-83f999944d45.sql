
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Atomic check-and-record for AI usage. Returns true if recorded, false if over limit.
CREATE OR REPLACE FUNCTION public.check_and_record_ai_usage(_kind TEXT, _limit INT, _window_ms BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    INSERT INTO public.ai_usage (user_id, kind) VALUES (_uid, _kind);
    RETURN jsonb_build_object('allowed', true, 'premium', true, 'used', 0, 'limit', -1);
  END IF;

  SELECT COUNT(*) INTO _used FROM public.ai_usage
    WHERE user_id = _uid AND kind = _kind
      AND created_at > now() - (_window_ms || ' milliseconds')::interval;

  IF _used >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'used', _used, 'limit', _limit);
  END IF;

  INSERT INTO public.ai_usage (user_id, kind) VALUES (_uid, _kind);
  RETURN jsonb_build_object('allowed', true, 'used', _used + 1, 'limit', _limit);
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_ai_usage(TEXT, INT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_record_ai_usage(TEXT, INT, BIGINT) TO authenticated;
