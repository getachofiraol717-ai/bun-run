-- ============================================================
-- MIGRATION: AI Personality Lab System
-- Database schema for personality creation, testing, and deployment
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. AI PERSONALITIES
--    Core personality storage
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT DEFAULT '🤖',
  archetype TEXT NOT NULL,  -- 'strict', 'philosopher', 'coach', 'explorer', 'archivist', 'scientist', 'commander', 'motivator'
  
  -- Personality DNA (10 traits, 0-100 each)
  dna JSONB NOT NULL DEFAULT '{}',
  
  -- Emotional responses for different situations
  emotional_style JSONB NOT NULL DEFAULT '{}',
  
  -- Voice and communication profile
  voice_profile JSONB NOT NULL DEFAULT '{}',
  
  -- Teaching philosophy
  teaching_philosophy TEXT,
  
  -- Memory behavior type
  memory_behavior TEXT CHECK (memory_behavior IN ('personal', 'balanced', 'minimal', 'achievement_focused', 'goal_focused', 'emotional_support')),
  
  -- Version and status
  version INTEGER DEFAULT 1,
  deployment_status TEXT CHECK (deployment_status IN ('draft', 'testing', 'deployed', 'archived')),
  
  -- Family tree
  parent_personality_id UUID REFERENCES public.ai_personalities(id),
  
  -- Test results (cached)
  test_results JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_personalities_archetype ON public.ai_personalities(archetype);
CREATE INDEX IF NOT EXISTS idx_personalities_status ON public.ai_personalities(deployment_status);
CREATE INDEX IF NOT EXISTS idx_personalities_parent ON public.ai_personalities(parent_personality_id);
CREATE INDEX IF NOT EXISTS idx_personalities_created_by ON public.ai_personalities(created_by);

ALTER TABLE public.ai_personalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage personalities" ON public.ai_personalities
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view deployed personalities" ON public.ai_personalities
  FOR SELECT TO authenticated USING (deployment_status = 'deployed');

-- ────────────────────────────────────────────────────────────
-- 2. PERSONALITY TEST SESSIONS
--    Track testing and evaluation sessions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  -- Test configuration
  test_type TEXT CHECK (test_type IN ('simulator', 'battle', 'learner_simulation', 'edge_case')),
  test_scenario TEXT,
  
  -- Test input (the question or scenario)
  input_prompt TEXT NOT NULL,
  
  -- Response generated
  response TEXT,
  
  -- Evaluation metrics
  engagement_score REAL,
  educational_effectiveness REAL,
  emotional_intelligence REAL,
  response_quality REAL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tests_personality ON public.personality_test_sessions(personality_id);
CREATE INDEX IF NOT EXISTS idx_tests_type ON public.personality_test_sessions(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_created ON public.personality_test_sessions(created_at DESC);

ALTER TABLE public.personality_test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tests" ON public.personality_test_sessions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 3. PERSONALITY BATTLES
--    Compare personalities side-by-side
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_1_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  personality_2_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  -- Battle configuration
  test_question TEXT NOT NULL,
  
  -- Responses
  response_1 TEXT,
  response_2 TEXT,
  
  -- Scoring
  score_1 REAL,
  score_2 REAL,
  winner_id UUID,
  
  -- Evaluation dimensions
  educational_effectiveness_1 REAL,
  educational_effectiveness_2 REAL,
  engagement_1 REAL,
  engagement_2 REAL,
  emotional_intelligence_1 REAL,
  emotional_intelligence_2 REAL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_battles_personality_1 ON public.personality_battles(personality_1_id);
CREATE INDEX IF NOT EXISTS idx_battles_personality_2 ON public.personality_battles(personality_2_id);
CREATE INDEX IF NOT EXISTS idx_battles_winner ON public.personality_battles(winner_id);

ALTER TABLE public.personality_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage battles" ON public.personality_battles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 4. PERSONALITY DEPLOYMENTS
--    Track where each personality is deployed
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  -- Deployment scope
  scope_type TEXT CHECK (scope_type IN ('platform_wide', 'world_specific', 'subject_specific', 'classroom_specific', 'guild_specific', 'mission_specific')),
  
  -- Scope targets (which worlds, subjects, classrooms, etc.)
  world_ids UUID[] DEFAULT '{}',
  subject_ids UUID[] DEFAULT '{}',
  classroom_ids UUID[] DEFAULT '{}',
  guild_ids UUID[] DEFAULT '{}',
  mission_ids UUID[] DEFAULT '{}',
  
  -- Deployment status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metrics
  active_users INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  user_satisfaction REAL,
  
  -- Metadata
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deployed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_deployments_personality ON public.personality_deployments(personality_id);
CREATE INDEX IF NOT EXISTS idx_deployments_active ON public.personality_deployments(is_active);
CREATE INDEX IF NOT EXISTS idx_deployments_scope ON public.personality_deployments(scope_type);

ALTER TABLE public.personality_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deployments" ON public.personality_deployments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view active deployments" ON public.personality_deployments
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- ────────────────────────────────────────────────────────────
-- 5. PERSONALITY ANALYTICS
--    Track personality performance metrics
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  -- Engagement metrics
  user_preference_score REAL,
  engagement_score REAL,
  learning_effectiveness REAL,
  emotional_intelligence_score REAL,
  student_satisfaction REAL,
  retention_rate REAL,
  
  -- Interaction metrics
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER,  -- in minutes
  total_interactions INTEGER DEFAULT 0,
  
  -- Learning outcomes
  avg_quiz_improvement REAL,
  learner_goal_achievement_rate REAL,
  burnout_recovery_effectiveness REAL,
  
  -- Learner feedback
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  feedback_sentiment REAL,  -- -1 to 1
  
  -- Comparison data
  percentile_rank REAL,  -- Compared to all personalities
  
  -- Snapshot date
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_personality ON public.personality_analytics(personality_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.personality_analytics(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_satisfaction ON public.personality_analytics(student_satisfaction DESC);

ALTER TABLE public.personality_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view analytics" ON public.personality_analytics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 6. PERSONALITY FEEDBACK
--    Learner feedback on personalities
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Feedback dimensions
  helpfulness REAL,
  engagement REAL,
  emotional_support REAL,
  learning_effectiveness REAL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_personality ON public.personality_feedback(personality_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.personality_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.personality_feedback(rating);

ALTER TABLE public.personality_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users give feedback on personalities" ON public.personality_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all feedback" ON public.personality_feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 7. PERSONALITY VERSIONS
--    Track evolution and versioning
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  version_number INTEGER NOT NULL,
  
  -- What changed
  dna_changes JSONB,  -- What DNA traits were modified
  description TEXT,   -- What was improved
  
  -- Effectiveness before/after
  effectiveness_before REAL,
  effectiveness_after REAL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_versions_personality ON public.personality_versions(personality_id);
CREATE INDEX IF NOT EXISTS idx_versions_number ON public.personality_versions(version_number DESC);

ALTER TABLE public.personality_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view versions" ON public.personality_versions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 8. PERSONALITY MARKETPLACE (FUTURE READY)
--    Infrastructure for sharing personalities
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  
  -- Listing info
  is_public BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Sharing metadata
  downloads INTEGER DEFAULT 0,
  rating REAL,
  review_count INTEGER DEFAULT 0,
  
  -- Description for marketplace
  marketplace_description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_personality ON public.personality_listings(personality_id);
CREATE INDEX IF NOT EXISTS idx_listings_public ON public.personality_listings(is_public);

ALTER TABLE public.personality_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage listings" ON public.personality_listings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view public listings" ON public.personality_listings
  FOR SELECT TO authenticated USING (is_public = TRUE);

-- ────────────────────────────────────────────────────────────
-- 9. PERSONALITY USAGE LOG
--    Track which personality is being used by whom
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personality_id UUID NOT NULL REFERENCES public.ai_personalities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Context
  context_type TEXT,  -- 'tutor', 'companion', 'mentor', etc.
  context_id UUID,    -- mission_id, world_id, etc.
  
  -- Metrics
  interaction_count INTEGER DEFAULT 0,
  session_duration INTEGER,  -- in minutes
  satisfaction_rating REAL,
  
  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_personality ON public.personality_usage_log(personality_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON public.personality_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_dates ON public.personality_usage_log(started_at DESC);

ALTER TABLE public.personality_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view usage logs" ON public.personality_usage_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 10. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_personality_stats(p_id UUID)
RETURNS TABLE (
  name TEXT,
  archetype TEXT,
  version INTEGER,
  avg_satisfaction REAL,
  total_users INTEGER,
  total_interactions INTEGER,
  test_count INTEGER
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    p.name,
    p.archetype,
    p.version,
    COALESCE(pa.student_satisfaction, 0),
    COUNT(DISTINCT pul.user_id),
    COALESCE(SUM(pul.interaction_count), 0)::INTEGER,
    (SELECT COUNT(*) FROM public.personality_test_sessions WHERE personality_id = p_id)::INTEGER
  FROM public.ai_personalities p
  LEFT JOIN public.personality_analytics pa ON p.id = pa.personality_id AND pa.snapshot_date = CURRENT_DATE
  LEFT JOIN public.personality_usage_log pul ON p.id = pul.personality_id
  WHERE p.id = get_personality_stats.p_id
  GROUP BY p.id, p.name, p.archetype, p.version, pa.student_satisfaction;
$$;

GRANT EXECUTE ON FUNCTION get_personality_stats(UUID) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.ai_personalities IS 'Core AI personalities with DNA, emotions, and voice profiles';
COMMENT ON TABLE public.personality_test_sessions IS 'Testing and evaluation of personality responses';
COMMENT ON TABLE public.personality_battles IS 'Side-by-side personality comparison battles';
COMMENT ON TABLE public.personality_deployments IS 'Deployment tracking - where each personality is active';
COMMENT ON TABLE public.personality_analytics IS 'Performance metrics and analytics for personalities';
COMMENT ON TABLE public.personality_feedback IS 'Learner feedback on personality effectiveness';
COMMENT ON TABLE public.personality_versions IS 'Version history and evolution tracking';
COMMENT ON TABLE public.personality_listings IS 'Marketplace listings (future ready)';
COMMENT ON TABLE public.personality_usage_log IS 'Logs of which personalities are being used';
