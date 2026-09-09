-- ============================================================
-- MIGRATION: Galaxy Economy System
-- Enterprise-grade educational economy platform
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COSMIC CREDITS
--    Primary educational currency
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cosmic_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT DEFAULT 0,
  lifetime_earned BIGINT DEFAULT 0,
  earned_this_period BIGINT DEFAULT 0,
  
  last_earned_at TIMESTAMPTZ,
  last_spent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credits_user ON public.cosmic_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_balance ON public.cosmic_credits(balance DESC);

ALTER TABLE public.cosmic_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON public.cosmic_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 2. CREDIT TRANSACTIONS
--    Track all economy activity
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL,
  
  source TEXT,
  related_id UUID,
  
  balance_before BIGINT,
  balance_after BIGINT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trans_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trans_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trans_timestamp ON public.credit_transactions(created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 3. ACHIEVEMENTS
--    Learning-based accomplishments
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  requirement TEXT,
  
  reward_credits INTEGER DEFAULT 0,
  reward_item_id UUID,
  
  rarity TEXT CHECK (rarity IN ('bronze', 'silver', 'gold', 'platinum')),
  category TEXT,
  
  icon_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievement_rarity ON public.achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievement_category ON public.achievements(category);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 4. USER ACHIEVEMENTS
--    Track earned achievements
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress REAL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievement ON public.user_achievements(user_id, achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_ach ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 5. ARTIFACTS
--    Collectible items
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  lore TEXT,
  
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary', 'mythic')),
  discovery_method TEXT,
  
  owner_id UUID REFERENCES auth.users(id),
  discovered_at TIMESTAMPTZ,
  
  tradeable BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifact_rarity ON public.artifacts(rarity);
CREATE INDEX IF NOT EXISTS idx_artifact_owner ON public.artifacts(owner_id);

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views artifacts" ON public.artifacts
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 6. GUILD ECONOMICS
--    Guild-level economy
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guild_economics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  guild_id UUID NOT NULL,
  
  guild_credits BIGINT DEFAULT 0,
  treasury_balance BIGINT DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  
  level INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guild_econ ON public.guild_economics(guild_id);

ALTER TABLE public.guild_economics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view guild economics" ON public.guild_economics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 7. GUILD MEMBER CONTRIBUTIONS
--    Track member contributions to guild
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guild_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  guild_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  credits_contributed BIGINT DEFAULT 0,
  activity_points INTEGER DEFAULT 0,
  
  role TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrib_guild ON public.guild_contributions(guild_id);
CREATE INDEX IF NOT EXISTS idx_contrib_user ON public.guild_contributions(user_id);

ALTER TABLE public.guild_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view contributions" ON public.guild_contributions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 8. SEASONAL CURRENCIES
--    Temporary event currencies
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seasonal_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  currency_code TEXT UNIQUE,
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT DEFAULT 0,
  
  season_start TIMESTAMPTZ,
  season_end TIMESTAMPTZ,
  
  event_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_user ON public.seasonal_currencies(user_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_code ON public.seasonal_currencies(currency_code);

ALTER TABLE public.seasonal_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own seasonal" ON public.seasonal_currencies
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 9. REPUTATION
--    Educational reputation tracking
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  score INTEGER DEFAULT 0,
  tier TEXT CHECK (tier IN ('novice', 'scholar', 'master', 'legend')),
  
  contributions INTEGER DEFAULT 0,
  mentoring_count INTEGER DEFAULT 0,
  leadership_roles TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_tier ON public.reputation(tier);
CREATE INDEX IF NOT EXISTS idx_rep_score ON public.reputation(score DESC);

ALTER TABLE public.reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views reputation" ON public.reputation
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 10. MARKETPLACE ITEMS
--    Items available for trading
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  category TEXT,
  item_type TEXT,
  
  price_credits INTEGER,
  
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tradeable BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_owner ON public.marketplace_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON public.marketplace_items(item_type);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views marketplace" ON public.marketplace_items
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 11. WORLD REWARDS
--    Per-world reward systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.world_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  world_id UUID NOT NULL,
  
  reward_name TEXT,
  reward_type TEXT,
  
  base_credit_reward INTEGER,
  
  rarity TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_world_reward ON public.world_rewards(world_id);

ALTER TABLE public.world_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views world rewards" ON public.world_rewards
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 12. XP EVOLUTION
--    Extended XP functionality
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.xp_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  total_xp BIGINT DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  
  xp_this_level BIGINT DEFAULT 0,
  xp_needed_next BIGINT,
  
  title TEXT,
  companion_evolution_level INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_level ON public.xp_evolution(current_level);

ALTER TABLE public.xp_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own xp" ON public.xp_evolution
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 13. ECONOMY STATS
--    Global economy metrics
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.economy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  total_credits_circulating BIGINT DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  avg_user_balance BIGINT DEFAULT 0,
  
  daily_generation BIGINT DEFAULT 0,
  daily_sinks BIGINT DEFAULT 0,
  
  inflation_rate REAL DEFAULT 0,
  circulation_health REAL DEFAULT 100,
  
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stats_date ON public.economy_stats(snapshot_date DESC);

ALTER TABLE public.economy_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view economy stats" ON public.economy_stats
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 14. FRAUD DETECTION
--    Security and anti-exploit systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id),
  
  alert_type TEXT,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  transaction_id UUID REFERENCES public.credit_transactions(id),
  
  status TEXT DEFAULT 'active',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON public.fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_severity ON public.fraud_alerts(severity);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view fraud alerts" ON public.fraud_alerts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 15. ECONOMY AUDIT LOG
--    Complete transaction history
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.economy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  action TEXT,
  target_user_id UUID,
  
  details JSONB,
  
  before_state JSONB,
  after_state JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.economy_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.economy_audit_log(created_at DESC);

ALTER TABLE public.economy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log" ON public.economy_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 16. COSMIC AUCTIONS (FUTURE READY)
--    Foundation for future auction system
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cosmic_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  item_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  
  starting_bid BIGINT,
  current_bid BIGINT,
  highest_bidder_id UUID,
  
  auction_start TIMESTAMPTZ,
  auction_end TIMESTAMPTZ,
  
  status TEXT DEFAULT 'scheduled',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_status ON public.cosmic_auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_seller ON public.cosmic_auctions(seller_id);

ALTER TABLE public.cosmic_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone views auctions" ON public.cosmic_auctions
  FOR SELECT TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION award_credits(
  p_user_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_source TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.cosmic_credits
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + p_amount,
      earned_this_period = earned_this_period + p_amount,
      last_earned_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.credit_transactions (
    user_id, amount, transaction_type, source, created_at
  ) VALUES (
    p_user_id, p_amount, p_type, p_source, now()
  );
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION award_credits(UUID, BIGINT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION detect_fraud()
RETURNS TABLE (
  user_id UUID,
  alert_type TEXT,
  severity TEXT
) LANGUAGE SQL AS $$
  SELECT 
    user_id,
    'Suspicious Spike'::TEXT,
    'high'::TEXT
  FROM public.credit_transactions
  WHERE created_at > now() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 10 OR SUM(amount) > 100000;
$$;

GRANT EXECUTE ON FUNCTION detect_fraud() TO authenticated;

-- ────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.cosmic_credits IS 'Primary educational currency - earned through learning';
COMMENT ON TABLE public.credit_transactions IS 'Complete transaction history for economy audit';
COMMENT ON TABLE public.achievements IS 'Learning-based accomplishments with rewards';
COMMENT ON TABLE public.artifacts IS 'Collectible items with rarity and lore';
COMMENT ON TABLE public.guild_economics IS 'Guild-level economy and treasury management';
COMMENT ON TABLE public.seasonal_currencies IS 'Temporary event currencies';
COMMENT ON TABLE public.reputation IS 'Educational reputation tracking';
COMMENT ON TABLE public.marketplace_items IS 'Tradeable cosmetics and collectibles';
COMMENT ON TABLE public.economy_stats IS 'Global economy health metrics';
COMMENT ON TABLE public.fraud_alerts IS 'Security monitoring for exploits';
COMMENT ON TABLE public.economy_audit_log IS 'Admin actions and economy changes';
