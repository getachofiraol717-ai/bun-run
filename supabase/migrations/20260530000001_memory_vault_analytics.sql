-- ============================================================
-- MIGRATION: Memory Vault Analytics System
-- Educational intelligence archive for admin insights
-- Preserves all existing memory architecture
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. LEARNING ARC SNAPSHOTS
--    Track subject mastery evolution over time
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_arc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Mastery progression
  quiz_accuracy REAL DEFAULT 0.0,           -- 0-100%
  avg_quiz_score REAL DEFAULT 0.0,          -- 0-100
  quiz_count INTEGER DEFAULT 0,
  
  -- Learning metrics
  study_duration_minutes INTEGER DEFAULT 0,
  study_sessions INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  
  -- Skill progression
  confidence_level REAL DEFAULT 0.5,        -- 0-1
  mastery_stage TEXT DEFAULT 'beginner',    -- beginner, intermediate, advanced, mastery
  
  -- Topic recovery
  failed_attempts INTEGER DEFAULT 0,
  recovery_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, subject, date)
);

CREATE INDEX IF NOT EXISTS idx_learning_arc_user ON public.learning_arc_snapshots(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_arc_subject ON public.learning_arc_snapshots(user_id, subject, date DESC);

COMMENT ON TABLE public.learning_arc_snapshots IS 'Daily learning progression snapshots for each user-subject combination';

-- ────────────────────────────────────────────────────────────
-- 2. MOTIVATION TIMELINE
--    Track engagement, streaks, and burnout cycles
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.motivation_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Engagement metrics
  daily_sessions INTEGER DEFAULT 0,
  total_session_minutes INTEGER DEFAULT 0,
  
  -- Study intensity
  study_intensity REAL DEFAULT 0.5,         -- 0-1, normalized
  consistency_score REAL DEFAULT 0.5,       -- 0-1, streak-based
  
  -- Streak data
  active_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  
  -- Motivation signals
  ai_mode_usage JSONB,                      -- {"instant": 5, "expert": 2, ...}
  platform_activity REAL DEFAULT 0.5,       -- normalized 0-1
  
  -- Risk indicators
  burnout_risk_score REAL DEFAULT 0.0,      -- 0-1
  disengagement_indicator BOOLEAN DEFAULT FALSE,
  
  -- Recovery signals
  recovery_attempt BOOLEAN DEFAULT FALSE,
  re_engagement_activity BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_motivation_user ON public.motivation_timeline(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_motivation_risk ON public.motivation_timeline(user_id, burnout_risk_score DESC);

COMMENT ON TABLE public.motivation_timeline IS 'Daily motivation and engagement tracking for burnout detection and recovery analysis';

-- ────────────────────────────────────────────────────────────
-- 3. EMOTIONAL PROGRESSION
--    Track emotional state evolution during learning
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emotional_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Primary emotional states (0-1 intensity)
  frustration_level REAL DEFAULT 0.0,
  confidence_level REAL DEFAULT 0.5,
  stress_level REAL DEFAULT 0.0,
  motivation_level REAL DEFAULT 0.5,
  resilience_level REAL DEFAULT 0.5,
  
  -- Emotional events
  breakthrough_event BOOLEAN DEFAULT FALSE,
  failure_recovery BOOLEAN DEFAULT FALSE,
  burnout_period BOOLEAN DEFAULT FALSE,
  
  -- Context
  primary_emotion TEXT,                     -- 'focused', 'calm', 'frustrated', 'overwhelmed', etc
  emotional_volatility REAL DEFAULT 0.3,    -- 0-1, how much emotions swung
  
  -- AI interaction emotional response
  companion_support_effective BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_emotional_user ON public.emotional_progression(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_events ON public.emotional_progression(user_id, breakthrough_event, failure_recovery);

COMMENT ON TABLE public.emotional_progression IS 'Track emotional learning journey for resilience and growth analysis';

-- ────────────────────────────────────────────────────────────
-- 4. BURNOUT RECOVERY PHASES
--    Track burnout detection, intervention, and recovery
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.burnout_recovery_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Phase tracking
  onset_date DATE NOT NULL,
  detection_date DATE,
  recovery_start_date DATE,
  recovery_complete_date DATE,
  
  -- Severity
  severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe')),
  burnout_score REAL,                       -- 0-1 at onset
  
  -- Characteristics
  disengagement_days INTEGER,
  study_duration_reduction REAL,            -- % reduction from baseline
  failed_quiz_spike INTEGER,
  
  -- Intervention
  ai_encouragement_provided BOOLEAN DEFAULT FALSE,
  encouragement_effectiveness REAL,         -- 0-1
  platform_intervention_applied BOOLEAN DEFAULT FALSE,
  
  -- Recovery metrics
  recovery_duration_days INTEGER,
  reengagement_session_count INTEGER DEFAULT 0,
  confidence_restoration_days INTEGER,
  
  -- Outcome
  recovery_successful BOOLEAN DEFAULT FALSE,
  lessons_learned TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_burnout_user ON public.burnout_recovery_phases(user_id, onset_date DESC);
CREATE INDEX IF NOT EXISTS idx_burnout_active ON public.burnout_recovery_phases(user_id, recovery_complete_date IS NULL);

COMMENT ON TABLE public.burnout_recovery_phases IS 'Complete burnout lifecycle tracking for intervention optimization';

-- ────────────────────────────────────────────────────────────
-- 5. AI COMPANION RELATIONSHIP ARCHIVE
--    Track emotional bonds and interaction effectiveness
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_companion_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id TEXT NOT NULL,               -- companion name/identifier
  companion_personality TEXT,               -- 'strict', 'playful', 'calm', 'energetic', 'encouraging'
  
  -- Interaction metrics
  total_interactions INTEGER DEFAULT 0,
  avg_session_duration_minutes REAL DEFAULT 0.0,
  last_interaction_date DATE,
  
  -- Effectiveness
  learning_support_effectiveness REAL DEFAULT 0.5,  -- 0-1
  motivation_boost_frequency REAL DEFAULT 0.5,      -- 0-1
  emotional_resonance_score REAL DEFAULT 0.5,       -- 0-1
  
  -- Trust/bond development
  trust_level REAL DEFAULT 0.0,             -- 0-1, grows with interactions
  personalization_quality REAL DEFAULT 0.5, -- how well companion knows learner
  
  -- Usage patterns
  preferred_ai_modes JSONB,                 -- {"expert": 45%, "instant": 30%, ...}
  most_effective_mode TEXT,
  
  -- Relationship phases
  phase TEXT DEFAULT 'discovery',           -- discovery, development, established, dormant
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, companion_id)
);

CREATE INDEX IF NOT EXISTS idx_companion_user ON public.ai_companion_relationships(user_id, last_interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_companion_effectiveness ON public.ai_companion_relationships(user_id, learning_support_effectiveness DESC);

COMMENT ON TABLE public.ai_companion_relationships IS 'Track AI-human relationship development and effectiveness';

-- ────────────────────────────────────────────────────────────
-- 6. MEMORY TIMELINE EVENTS
--    Milestone and breakthrough tracking
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'first_login', 'first_mission', 'quiz_victory', 'streak_milestone',
    'subject_mastery', 'breakthrough', 'recovery', 'companion_unlocked',
    'world_unlock', 'guild_join', 'battle_victory', 'emotional_milestone',
    'study_habit_formed', 'confidence_surge'
  )),
  
  -- Event context
  subject TEXT,
  companion_id TEXT,
  guild_id TEXT,
  world_id TEXT,
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  significance_score REAL DEFAULT 0.5,      -- 0-1, importance
  emotional_impact TEXT,                    -- 'positive', 'transformative', 'recovery', etc
  
  -- Archival
  archival_order INTEGER,                   -- for timeline chronology
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, event_type, event_date, subject)
);

CREATE INDEX IF NOT EXISTS idx_timeline_user ON public.memory_timeline_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON public.memory_timeline_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_significance ON public.memory_timeline_events(user_id, significance_score DESC);

COMMENT ON TABLE public.memory_timeline_events IS 'Educational milestones and breakthrough moments in learning journey';

-- ────────────────────────────────────────────────────────────
-- 7. STUDY PATTERN ANALYTICS
--    Behavioral learning pattern clustering
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_pattern_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  
  -- Time patterns
  preferred_study_hours TEXT,               -- "morning", "afternoon", "evening", "night"
  peak_focus_period_start TIME,
  peak_focus_period_end TIME,
  peak_focus_duration_minutes INTEGER,
  peak_accuracy_in_focus_period REAL,       -- 0-1
  
  -- Session behavior
  avg_session_duration_minutes REAL,
  session_frequency_weekly REAL,
  optimal_session_duration REAL,            -- ideal duration for this learner
  
  -- Topic behavior
  topic_switching_frequency INTEGER,        -- topics per session
  topic_depth_indicator REAL,               -- 0-1, deep vs shallow
  
  -- AI mode preferences
  most_used_ai_mode TEXT,
  ai_mode_distribution JSONB,               -- mode percentages
  
  -- Quiz patterns
  quiz_attempt_frequency REAL,              -- per week
  time_between_retry REAL,                  -- minutes
  batch_quiz_tendency BOOLEAN,              -- takes quizzes in batches
  
  -- Learning effectiveness
  effectiveness_score REAL,                 -- overall learning efficiency 0-1
  suggested_optimizations TEXT,             -- AI-generated recommendations
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, analysis_date)
);

CREATE INDEX IF NOT EXISTS idx_study_pattern_user ON public.study_pattern_profiles(user_id, analysis_date DESC);

COMMENT ON TABLE public.study_pattern_profiles IS 'Behavioral learning pattern analysis and optimization recommendations';

-- ────────────────────────────────────────────────────────────
-- 8. EDUCATIONAL INSIGHTS
--    AI-generated insights about learning effectiveness
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.educational_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Insight classification
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'learning_breakthrough', 'study_optimization', 'burnout_risk',
    'subject_mastery', 'retention_pattern', 'learning_style',
    'motivation_driver', 'companion_effectiveness', 'platform_improvement'
  )),
  
  -- Insight content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Evidence
  evidence_strength REAL,                   -- 0-1, confidence in insight
  supporting_data JSONB,                    -- backing metrics
  
  -- Actionability
  recommendation TEXT,
  action_priority INTEGER,                  -- 1-5, urgency
  
  -- Status
  insight_status TEXT DEFAULT 'active',     -- 'active', 'resolved', 'superseded'
  resolved_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insight_user ON public.educational_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_type ON public.educational_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_priority ON public.educational_insights(user_id, action_priority);

COMMENT ON TABLE public.educational_insights IS 'AI-generated educational intelligence for learner and educator optimization';

-- ────────────────────────────────────────────────────────────
-- 9. MEMORY VAULT ADMIN VIEW
--    Aggregated insights for admin dashboard
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_vault_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date DATE NOT NULL,
  
  -- Platform-wide metrics
  total_learners_analyzed INTEGER,
  avg_learning_arc_progression REAL,        -- 0-1
  avg_motivation_score REAL,
  
  -- Burnout analytics
  learners_in_burnout INTEGER DEFAULT 0,
  learners_in_recovery INTEGER DEFAULT 0,
  avg_recovery_duration_days REAL,
  
  -- Emotional health
  avg_confidence_level REAL,
  avg_stress_level REAL,
  breakthrough_event_count INTEGER,
  
  -- AI effectiveness
  avg_ai_support_effectiveness REAL,
  avg_companion_satisfaction REAL,
  
  -- Learning patterns
  most_effective_study_pattern TEXT,
  most_common_peak_hours TEXT,
  
  -- Trends
  platform_engagement_trend TEXT,           -- 'improving', 'stable', 'declining'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aggregates_date ON public.memory_vault_aggregates(analysis_date DESC);

COMMENT ON TABLE public.memory_vault_aggregates IS 'Platform-wide analytical aggregates for Memory Vault insights';

-- ────────────────────────────────────────────────────────────
-- 10. RLS POLICIES (ADMIN-ONLY ACCESS)
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.learning_arc_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view learning arcs" ON public.learning_arc_snapshots
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.motivation_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view motivation" ON public.motivation_timeline
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.emotional_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view emotional data" ON public.emotional_progression
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.burnout_recovery_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view burnout data" ON public.burnout_recovery_phases
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.ai_companion_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view companion relationships" ON public.ai_companion_relationships
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.memory_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view timeline events" ON public.memory_timeline_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.study_pattern_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view study patterns" ON public.study_pattern_profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.educational_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view insights" ON public.educational_insights
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.memory_vault_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view aggregates" ON public.memory_vault_aggregates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 11. ANALYTICS RECORDING FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Record learning arc snapshot
CREATE OR REPLACE FUNCTION public.record_learning_arc(
  _user_id UUID,
  _subject TEXT,
  _quiz_accuracy REAL,
  _quiz_count INTEGER,
  _study_duration_minutes INTEGER,
  _streak_days INTEGER,
  _confidence_level REAL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.learning_arc_snapshots (
    user_id, subject, date, quiz_accuracy, quiz_count,
    study_duration_minutes, streak_days, confidence_level
  ) VALUES (
    _user_id, _subject, CURRENT_DATE, _quiz_accuracy, _quiz_count,
    _study_duration_minutes, _streak_days, _confidence_level
  )
  ON CONFLICT (user_id, subject, date)
  DO UPDATE SET
    quiz_accuracy = _quiz_accuracy,
    quiz_count = _quiz_count,
    study_duration_minutes = _study_duration_minutes,
    streak_days = _streak_days,
    confidence_level = _confidence_level;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_learning_arc(UUID, TEXT, REAL, INTEGER, INTEGER, INTEGER, REAL) TO authenticated;

-- Record motivation snapshot
CREATE OR REPLACE FUNCTION public.record_motivation_snapshot(
  _user_id UUID,
  _daily_sessions INTEGER,
  _total_session_minutes INTEGER,
  _study_intensity REAL,
  _consistency_score REAL,
  _burnout_risk_score REAL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.motivation_timeline (
    user_id, date, daily_sessions, total_session_minutes,
    study_intensity, consistency_score, burnout_risk_score
  ) VALUES (
    _user_id, CURRENT_DATE, _daily_sessions, _total_session_minutes,
    _study_intensity, _consistency_score, _burnout_risk_score
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    daily_sessions = _daily_sessions,
    total_session_minutes = _total_session_minutes,
    study_intensity = _study_intensity,
    consistency_score = _consistency_score,
    burnout_risk_score = _burnout_risk_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_motivation_snapshot(UUID, INTEGER, INTEGER, REAL, REAL, REAL) TO authenticated;

-- Record emotional state
CREATE OR REPLACE FUNCTION public.record_emotional_state(
  _user_id UUID,
  _frustration_level REAL,
  _confidence_level REAL,
  _stress_level REAL,
  _motivation_level REAL,
  _resilience_level REAL,
  _primary_emotion TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.emotional_progression (
    user_id, date, frustration_level, confidence_level, stress_level,
    motivation_level, resilience_level, primary_emotion
  ) VALUES (
    _user_id, CURRENT_DATE, _frustration_level, _confidence_level,
    _stress_level, _motivation_level, _resilience_level, _primary_emotion
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    frustration_level = _frustration_level,
    confidence_level = _confidence_level,
    stress_level = _stress_level,
    motivation_level = _motivation_level,
    resilience_level = _resilience_level,
    primary_emotion = _primary_emotion;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_emotional_state(UUID, REAL, REAL, REAL, REAL, REAL, TEXT) TO authenticated;

-- Record timeline event
CREATE OR REPLACE FUNCTION public.record_timeline_event(
  _user_id UUID,
  _event_type TEXT,
  _event_date DATE,
  _title TEXT,
  _description TEXT,
  _subject TEXT DEFAULT NULL,
  _significance_score REAL DEFAULT 0.5
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.memory_timeline_events (
    user_id, event_date, event_type, title, description, subject, significance_score
  ) VALUES (
    _user_id, _event_date, _event_type, _title, _description, _subject, _significance_score
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_timeline_event(UUID, TEXT, DATE, TEXT, TEXT, TEXT, REAL) TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 12. ANALYTICS QUERIES HELPER VIEWS
-- ────────────────────────────────────────────────────────────

-- View: Learning progression over time
CREATE OR REPLACE VIEW public.v_learning_progression_timelines AS
SELECT
  user_id,
  subject,
  date,
  quiz_accuracy,
  streak_days,
  confidence_level,
  mastery_stage,
  LAG(quiz_accuracy) OVER (PARTITION BY user_id, subject ORDER BY date) as prev_accuracy,
  (quiz_accuracy - LAG(quiz_accuracy) OVER (PARTITION BY user_id, subject ORDER BY date)) as accuracy_change
FROM public.learning_arc_snapshots
ORDER BY user_id, subject, date DESC;

-- View: Burnout patterns
CREATE OR REPLACE VIEW public.v_burnout_patterns AS
SELECT
  user_id,
  COUNT(*) as total_burnout_episodes,
  AVG(recovery_duration_days) as avg_recovery_days,
  COUNT(CASE WHEN recovery_successful THEN 1 END) as successful_recoveries,
  AVG(EXTRACT(DAY FROM (detection_date - onset_date))) as avg_detection_speed_days,
  COUNT(CASE WHEN ai_encouragement_provided THEN 1 END) as ai_interventions
FROM public.burnout_recovery_phases
WHERE recovery_complete_date IS NOT NULL
GROUP BY user_id;

-- View: Emotional health trajectory
CREATE OR REPLACE VIEW public.v_emotional_health_trajectory AS
SELECT
  user_id,
  date,
  confidence_level,
  stress_level,
  resilience_level,
  motivation_level,
  COUNT(CASE WHEN breakthrough_event THEN 1 END) OVER (PARTITION BY user_id ORDER BY date) as cumulative_breakthroughs,
  COUNT(CASE WHEN failure_recovery THEN 1 END) OVER (PARTITION BY user_id ORDER BY date) as cumulative_recoveries
FROM public.emotional_progression
ORDER BY user_id, date DESC;

COMMENT ON VIEW public.v_learning_progression_timelines IS 'Learning trajectory with historical comparisons';
COMMENT ON VIEW public.v_burnout_patterns IS 'Burnout episode analysis and recovery effectiveness';
COMMENT ON VIEW public.v_emotional_health_trajectory IS 'Emotional state evolution with milestone tracking';
