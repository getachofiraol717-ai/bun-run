-- ============================================================
-- MIGRATION: Predictive Learning Engine & Autonomous Operations
-- Phase 2 & 3: Proactive Education & Intelligent Co-Pilot
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PHASE 2: PREDICTIVE LEARNING ENGINE
-- ────────────────────────────────────────────────────────────

-- 1. LEARNER RISK PROFILES
CREATE TABLE IF NOT EXISTS public.learner_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  overall_risk_score INTEGER DEFAULT 0,
  learning_risk INTEGER DEFAULT 0,
  engagement_risk INTEGER DEFAULT 0,
  burnout_risk INTEGER DEFAULT 0,
  dropout_risk INTEGER DEFAULT 0,
  
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  risk_factors TEXT[],
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_level ON public.learner_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_user ON public.learner_risk_profiles(user_id);

ALTER TABLE public.learner_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view risk profiles" ON public.learner_risk_profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. EXAM FORECASTS
CREATE TABLE IF NOT EXISTS public.exam_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  exam_type TEXT,
  current_readiness INTEGER,
  expected_score_min INTEGER,
  expected_score_max INTEGER,
  confidence INTEGER,
  
  weak_areas TEXT[],
  strong_areas TEXT[],
  
  forecast_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecast_student ON public.exam_forecasts(student_id);
CREATE INDEX IF NOT EXISTS idx_forecast_date ON public.exam_forecasts(forecast_date DESC);

ALTER TABLE public.exam_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view forecasts" ON public.exam_forecasts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. WEAK CONCEPT DETECTION
CREATE TABLE IF NOT EXISTS public.weak_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  concept_name TEXT,
  mastery_level INTEGER,
  confidence INTEGER,
  
  prerequisite_gaps TEXT[],
  recurring_mistakes INTEGER,
  
  recommendation TEXT,
  
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weak_user ON public.weak_concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_weak_concept ON public.weak_concepts(concept_name);

ALTER TABLE public.weak_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view weak concepts" ON public.weak_concepts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. BURNOUT FORECASTING
CREATE TABLE IF NOT EXISTS public.burnout_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  burnout_probability INTEGER,
  motivation_decline_risk INTEGER,
  disengagement_risk INTEGER,
  
  risk_factors TEXT[],
  
  intervention_recommended BOOLEAN DEFAULT FALSE,
  intervention_type TEXT,
  
  forecast_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_burnout_user ON public.burnout_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_burnout_risk ON public.burnout_forecasts(burnout_probability DESC);

ALTER TABLE public.burnout_forecasts ENABLE ROW LEVEL SECURITY;

-- 5. DROPOUT PROBABILITY
CREATE TABLE IF NOT EXISTS public.dropout_probabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  dropout_probability INTEGER,
  retention_probability INTEGER,
  
  risk_indicators TEXT[],
  
  at_risk BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropout_user ON public.dropout_probabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_dropout_risk ON public.dropout_probabilities(at_risk);

ALTER TABLE public.dropout_probabilities ENABLE ROW LEVEL SECURITY;

-- 6. RECOVERY PLANS
CREATE TABLE IF NOT EXISTS public.recovery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  risk_type TEXT,
  actions TEXT[],
  timeline TEXT,
  expected_improvement INTEGER,
  
  status TEXT CHECK (status IN ('active', 'completed', 'paused')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON public.recovery_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_status ON public.recovery_plans(status);

ALTER TABLE public.recovery_plans ENABLE ROW LEVEL SECURITY;

-- 7. LEARNING TRAJECTORIES
CREATE TABLE IF NOT EXISTS public.learning_trajectories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  current_level INTEGER,
  projected_level_7d INTEGER,
  projected_level_30d INTEGER,
  projected_level_90d INTEGER,
  
  bottleneck_risks TEXT[],
  achievement_predictions TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trajectory_user ON public.learning_trajectories(user_id);

ALTER TABLE public.learning_trajectories ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- PHASE 3: AUTONOMOUS UNIVERSE OPERATIONS
-- ────────────────────────────────────────────────────────────

-- 8. GENERATED MISSIONS
CREATE TABLE IF NOT EXISTS public.generated_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  
  world_id UUID,
  mission_type TEXT,
  difficulty INTEGER,
  
  objectives TEXT[],
  rewards TEXT,
  narrative TEXT,
  
  status TEXT CHECK (status IN ('pending_review', 'approved', 'rejected', 'published')),
  
  generated_by TEXT DEFAULT 'ai_governor',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_mission_status ON public.generated_missions(status);
CREATE INDEX IF NOT EXISTS idx_mission_world ON public.generated_missions(world_id);
CREATE INDEX IF NOT EXISTS idx_mission_date ON public.generated_missions(generated_at DESC);

ALTER TABLE public.generated_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view missions" ON public.generated_missions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. GENERATED EVENTS
CREATE TABLE IF NOT EXISTS public.generated_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  
  event_type TEXT,
  start_date DATE,
  end_date DATE,
  
  narrative TEXT,
  objectives TEXT[],
  rewards TEXT,
  
  status TEXT CHECK (status IN ('pending_review', 'approved', 'rejected', 'scheduled')),
  
  generated_by TEXT DEFAULT 'ai_governor',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_event_status ON public.generated_events(status);
CREATE INDEX IF NOT EXISTS idx_event_date ON public.generated_events(generated_at DESC);

ALTER TABLE public.generated_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view events" ON public.generated_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. GENERATED STORIES
CREATE TABLE IF NOT EXISTS public.generated_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  content TEXT,
  
  world TEXT,
  narrative_type TEXT,
  length INTEGER,
  
  status TEXT CHECK (status IN ('pending_review', 'approved', 'published')),
  
  generated_by TEXT DEFAULT 'ai_governor',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_story_world ON public.generated_stories(world);
CREATE INDEX IF NOT EXISTS idx_story_status ON public.generated_stories(status);

ALTER TABLE public.generated_stories ENABLE ROW LEVEL SECURITY;

-- 11. SEASONAL PLANS
CREATE TABLE IF NOT EXISTS public.seasonal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  season_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  
  missions_generated INTEGER DEFAULT 0,
  events_generated INTEGER DEFAULT 0,
  stories_generated INTEGER DEFAULT 0,
  
  rewards_theme TEXT,
  
  status TEXT CHECK (status IN ('planning', 'pending_approval', 'approved', 'active', 'completed')),
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_season_status ON public.seasonal_plans(status);

ALTER TABLE public.seasonal_plans ENABLE ROW LEVEL SECURITY;

-- 12. OPERATIONS RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.operations_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category TEXT,
  recommendation TEXT,
  reasoning TEXT,
  
  impact TEXT,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_rec_priority ON public.operations_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_rec_status ON public.operations_recommendations(status);

ALTER TABLE public.operations_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view recommendations" ON public.operations_recommendations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. CONTENT OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.content_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  opportunity_type TEXT,
  description TEXT,
  
  affected_world TEXT,
  affected_subject TEXT,
  
  priority TEXT,
  
  recommendation TEXT,
  expected_impact TEXT,
  
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_type ON public.content_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_priority ON public.content_opportunities(priority);

ALTER TABLE public.content_opportunities ENABLE ROW LEVEL SECURITY;

-- 14. GUILD CHALLENGES (GENERATED)
CREATE TABLE IF NOT EXISTS public.generated_guild_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  
  challenge_type TEXT,
  difficulty_level TEXT,
  
  objectives TEXT[],
  rewards TEXT,
  
  expected_participants INTEGER,
  
  status TEXT CHECK (status IN ('pending_review', 'approved', 'scheduled', 'active', 'completed')),
  
  generated_by TEXT DEFAULT 'ai_governor',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_guild_challenge_status ON public.generated_guild_challenges(status);

ALTER TABLE public.generated_guild_challenges ENABLE ROW LEVEL SECURITY;

-- 15. XP CAMPAIGN RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.xp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  campaign_name TEXT NOT NULL,
  campaign_type TEXT,
  
  xp_multiplier REAL,
  bonus_missions INTEGER,
  
  start_date DATE,
  end_date DATE,
  
  rationale TEXT,
  expected_engagement_boost INTEGER,
  
  status TEXT CHECK (status IN ('recommended', 'approved', 'scheduled', 'active', 'completed')),
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_status ON public.xp_campaigns(status);

ALTER TABLE public.xp_campaigns ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_learning_risk INTEGER,
  p_engagement_risk INTEGER,
  p_burnout_risk INTEGER,
  p_dropout_risk INTEGER
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
BEGIN
  RETURN ROUND((p_learning_risk + p_engagement_risk + p_burnout_risk + p_dropout_risk) / 4.0);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_risk_score(INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION get_at_risk_learners()
RETURNS TABLE (
  user_id UUID,
  risk_level TEXT,
  risk_score INTEGER
) LANGUAGE SQL AS $$
  SELECT 
    user_id,
    risk_level,
    overall_risk_score
  FROM public.learner_risk_profiles
  WHERE risk_level IN ('high', 'critical')
  ORDER BY overall_risk_score DESC;
$$;

GRANT EXECUTE ON FUNCTION get_at_risk_learners() TO authenticated;

CREATE OR REPLACE FUNCTION get_pending_approvals()
RETURNS TABLE (
  type TEXT,
  item_id UUID,
  title TEXT,
  count INTEGER
) LANGUAGE SQL AS $$
  SELECT 'Mission'::TEXT, id, title, 1::INTEGER FROM public.generated_missions WHERE status = 'pending_review'
  UNION ALL
  SELECT 'Event'::TEXT, id, title, 1::INTEGER FROM public.generated_events WHERE status = 'pending_review'
  UNION ALL
  SELECT 'Story'::TEXT, id, title, 1::INTEGER FROM public.generated_stories WHERE status = 'pending_review';
$$;

GRANT EXECUTE ON FUNCTION get_pending_approvals() TO authenticated;

-- ────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.learner_risk_profiles IS 'Predictive risk profiles for all learners';
COMMENT ON TABLE public.exam_forecasts IS 'AI-predicted exam readiness and performance';
COMMENT ON TABLE public.weak_concepts IS 'Detected weak concepts and learning gaps';
COMMENT ON TABLE public.burnout_forecasts IS 'Predicted burnout and disengagement risk';
COMMENT ON TABLE public.dropout_probabilities IS 'Dropout probability predictions';
COMMENT ON TABLE public.recovery_plans IS 'Personalized recovery plans for at-risk learners';
COMMENT ON TABLE public.learning_trajectories IS 'Projected learning paths and bottlenecks';
COMMENT ON TABLE public.generated_missions IS 'AI-generated missions pending admin review';
COMMENT ON TABLE public.generated_events IS 'AI-generated events pending admin review';
COMMENT ON TABLE public.generated_stories IS 'AI-generated world stories pending review';
COMMENT ON TABLE public.seasonal_plans IS 'Automated seasonal event planning';
COMMENT ON TABLE public.operations_recommendations IS 'AI recommendations for universe operations';
COMMENT ON TABLE public.content_opportunities IS 'Detected content gaps and opportunities';
COMMENT ON TABLE public.generated_guild_challenges IS 'AI-generated guild challenges';
COMMENT ON TABLE public.xp_campaigns IS 'Recommended XP and engagement campaigns';
