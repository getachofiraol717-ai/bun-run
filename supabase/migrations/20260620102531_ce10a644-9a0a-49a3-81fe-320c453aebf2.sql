ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS signup_source TEXT;

CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT DEFAULT 'email',
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.login_history TO authenticated;
GRANT ALL ON public.login_history TO service_role;

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users record own login history" ON public.login_history;
DROP POLICY IF EXISTS "Admins view all login history" ON public.login_history;

CREATE POLICY "Users view own login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users record own login history"
ON public.login_history
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_login_history_user_created
ON public.login_history(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_subscription_validity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET subscription = 'free', updated_at = now()
  WHERE subscription = 'premium'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_subscription_validity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_validity() TO service_role;