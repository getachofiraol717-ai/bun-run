-- ============================================================
-- MIGRATION: Secure Payment System + Auth Upgrades
-- Knowledge Universe v6
-- ============================================================

-- ============================================================
-- 1. UPGRADE PROFILES: phone, avatar_url, login_history, signup_source
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+251',
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- ============================================================
-- 2. SECURE PAYMENTS TABLE (replaces insecure old one)
-- ============================================================
-- Drop old insecure payments if exists, recreate properly
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','processing','verified','failed','refunded','expired')),
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','failed','suspicious')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_duration_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS chapa_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS chapa_tx_ref TEXT UNIQUE;

-- Remove old status column (kept as payment_status now)
-- Keep reference_number for backward compat but mark as legacy
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_chapa_tx_ref ON public.payments(chapa_tx_ref) WHERE chapa_tx_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Drop and recreate RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;

CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- CRITICAL: Users CANNOT update payments (only backend/admin can verify)
CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3. PAYMENT SESSIONS (for Chapa / redirect-based flows)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  tx_ref TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'chapa',
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','pending','completed','failed','expired')),
  checkout_url TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ETB',
  plan_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  completed_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  raw_webhook JSONB
);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_tx_ref ON public.payment_sessions(tx_ref);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user ON public.payment_sessions(user_id);

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.payment_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users create own sessions" ON public.payment_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- NO user update policy — only backend service role can update sessions
CREATE POLICY "Admins manage sessions" ON public.payment_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 4. WEBHOOK AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tx_ref TEXT,
  raw_payload JSONB NOT NULL,
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tx_ref ON public.webhook_events(tx_ref);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Webhook events are service-role only (no RLS policies for authenticated users)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view webhooks" ON public.webhook_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 5. ADMIN SESSIONS TABLE (second-door security)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON public.admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view own sessions" ON public.admin_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage sessions" ON public.admin_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 6. RATE LIMIT TABLE (payment + auth rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_action ON public.rate_limits(key, action);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No user access to rate_limits — service role only

-- ============================================================
-- 7. LOGIN HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT DEFAULT 'email',
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.login_history(user_id, created_at DESC);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own login history" ON public.login_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all login history" ON public.login_history
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 8. SECURE FUNCTION: verify_payment_and_upgrade
--    Only callable server-side (service role), never from frontend
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_payment_and_upgrade(
  _payment_id UUID,
  _tx_ref TEXT,
  _provider_reference TEXT,
  _verified_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment RECORD;
  _plan_days INTEGER;
  _expires_at TIMESTAMPTZ;
BEGIN
  -- Fetch payment
  SELECT * INTO _payment FROM public.payments WHERE id = _payment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'payment_not_found');
  END IF;

  -- Idempotency: already verified
  IF _payment.verification_status = 'verified' THEN
    RETURN jsonb_build_object('success', true, 'message', 'already_verified');
  END IF;

  -- Mark payment verified
  _plan_days := COALESCE(_payment.plan_duration_days, 30);
  _expires_at := now() + (_plan_days || ' days')::INTERVAL;

  UPDATE public.payments
  SET
    payment_status = 'verified',
    verification_status = 'verified',
    verified_at = now(),
    verified_by = _verified_by,
    provider_reference = _provider_reference,
    metadata = metadata || jsonb_build_object('verified_tx_ref', _tx_ref)
  WHERE id = _payment_id;

  -- Upgrade subscription
  UPDATE public.profiles
  SET
    subscription = 'premium',
    subscription_started_at = now(),
    subscription_expires_at = _expires_at,
    updated_at = now()
  WHERE user_id = _payment.user_id;

  -- Update session if exists
  UPDATE public.payment_sessions
  SET status = 'completed', completed_at = now()
  WHERE tx_ref = _tx_ref;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', _payment.user_id,
    'expires_at', _expires_at
  );
END;
$$;

-- CRITICAL: Only service role can call this
REVOKE ALL ON FUNCTION public.verify_payment_and_upgrade(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 9. FUNCTION: check_subscription_validity (called on login)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_subscription_validity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expire subscriptions that have passed their expiry date
  UPDATE public.profiles
  SET
    subscription = 'free',
    updated_at = now()
  WHERE
    subscription = 'premium'
    AND subscription_expires_at IS NOT NULL
    AND subscription_expires_at < now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_subscription_validity() TO authenticated;

-- ============================================================
-- 10. FUNCTION: admin_approve_manual_payment
--     Admin-only RPC to approve manual (bank transfer) payments
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_approve_manual_payment(
  _payment_id UUID,
  _admin_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _is_admin BOOLEAN;
  _result JSONB;
BEGIN
  -- Verify caller is admin
  SELECT has_role(_uid, 'admin'::app_role) INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT public.verify_payment_and_upgrade(
    _payment_id,
    'manual_' || _payment_id::TEXT,
    'admin_approved',
    'admin:' || _uid::TEXT
  ) INTO _result;

  -- Store admin note
  IF _admin_note <> '' THEN
    UPDATE public.payments
    SET metadata = metadata || jsonb_build_object('admin_note', _admin_note, 'approved_by', _uid::TEXT)
    WHERE id = _payment_id;
  END IF;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_manual_payment(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_manual_payment(UUID, TEXT) TO authenticated;

-- ============================================================
-- 11. FUNCTION: admin_reject_payment
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reject_payment(
  _payment_id UUID,
  _reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _is_admin BOOLEAN;
BEGIN
  SELECT has_role(_uid, 'admin'::app_role) INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.payments
  SET
    payment_status = 'failed',
    verification_status = 'failed',
    verified_by = 'admin:' || _uid::TEXT,
    verified_at = now(),
    metadata = metadata || jsonb_build_object('rejection_reason', _reason)
  WHERE id = _payment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_payment(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(UUID, TEXT) TO authenticated;

-- ============================================================
-- 12. FUNCTION: flag_suspicious_payment
-- ============================================================
CREATE OR REPLACE FUNCTION public.flag_suspicious_payment(
  _payment_id UUID,
  _reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _is_admin BOOLEAN;
BEGIN
  SELECT has_role(_uid, 'admin'::app_role) INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.payments
  SET
    verification_status = 'suspicious',
    fraud_score = LEAST(fraud_score + 50, 100),
    metadata = metadata || jsonb_build_object('fraud_flag', _reason, 'flagged_by', _uid::TEXT, 'flagged_at', now())
  WHERE id = _payment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.flag_suspicious_payment(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.flag_suspicious_payment(UUID, TEXT) TO authenticated;

-- ============================================================
-- 13. AI API KEYS TABLE (admin-managed, encrypted references)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('openai','gemini','claude','custom')),
  label TEXT NOT NULL,
  key_hint TEXT NOT NULL, -- last 4 chars only, never store full key
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage api keys" ON public.ai_api_keys
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 14. TRIGGER: update profiles.updated_at
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated') THEN
    CREATE TRIGGER trg_profiles_updated
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
