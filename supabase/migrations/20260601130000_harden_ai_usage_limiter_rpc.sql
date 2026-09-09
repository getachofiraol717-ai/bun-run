-- Harden the AI Tutor limiter so stale edge deployments do not convert RPC failures into 5-message lockouts.
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS provider text;

CREATE OR REPLACE FUNCTION public.check_and_record_ai_usage(
  _kind text,
  _limit integer,
  _window_ms bigint,
  _provider text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _used int;
  _is_premium boolean;
  _effective_limit int := CASE
    WHEN _kind = 'message' THEN GREATEST(COALESCE(_limit, 0), 1000)
    WHEN _kind = 'image' THEN GREATEST(COALESCE(_limit, 0), 50)
    ELSE COALESCE(_limit, 0)
  END;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated', 'used', 0, 'limit', _effective_limit);
  END IF;

  IF _kind NOT IN ('message', 'image') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_kind', 'used', 0, 'limit', _effective_limit);
  END IF;

  SELECT subscription = 'premium'
    INTO _is_premium
    FROM public.profiles
    WHERE user_id = _uid;

  IF COALESCE(_is_premium, false) THEN
    INSERT INTO public.ai_usage (user_id, kind, provider) VALUES (_uid, _kind, _provider);
    RETURN jsonb_build_object('allowed', true, 'premium', true, 'used', 0, 'limit', -1);
  END IF;

  SELECT COUNT(*) INTO _used
    FROM public.ai_usage
    WHERE user_id = _uid
      AND kind = _kind
      AND (_provider IS NULL OR provider IS NULL OR provider = _provider)
      AND created_at > now() - (_window_ms || ' milliseconds')::interval;

  IF _used >= _effective_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'used', _used, 'limit', _effective_limit);
  END IF;

  INSERT INTO public.ai_usage (user_id, kind, provider) VALUES (_uid, _kind, _provider);
  RETURN jsonb_build_object('allowed', true, 'used', _used + 1, 'limit', _effective_limit);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_record_ai_usage(text, integer, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_record_ai_usage(text, integer, bigint, text) TO authenticated;
