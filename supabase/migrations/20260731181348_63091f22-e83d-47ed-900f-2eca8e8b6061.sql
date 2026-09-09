CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  event_type text NOT NULL,
  method text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.auth_audit_log TO authenticated;
GRANT INSERT ON public.auth_audit_log TO anon;
GRANT ALL ON public.auth_audit_log TO service_role;

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_audit own select" ON public.auth_audit_log;
DROP POLICY IF EXISTS "auth_audit insert own" ON public.auth_audit_log;
DROP POLICY IF EXISTS "auth_audit anon insert" ON public.auth_audit_log;

CREATE POLICY "auth_audit own select" ON public.auth_audit_log
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auth_audit insert own" ON public.auth_audit_log
FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "auth_audit anon insert" ON public.auth_audit_log
FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

CREATE INDEX IF NOT EXISTS auth_audit_log_created_at_idx ON public.auth_audit_log (created_at DESC);