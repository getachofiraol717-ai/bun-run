-- ============================================================
-- MIGRATION: AI Health System
-- Enterprise-grade AI reliability and observability platform
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SYSTEM HEALTH CHECKS
--    Core health monitoring for all systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  system_name TEXT NOT NULL,
  health_score REAL DEFAULT 100,
  reliability_score REAL DEFAULT 100,
  latency_score REAL DEFAULT 100,
  stability_score REAL DEFAULT 100,
  
  status TEXT CHECK (status IN ('healthy', 'degraded', 'critical')),
  active_alerts INTEGER DEFAULT 0,
  
  last_check TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_system ON public.system_health_checks(system_name);
CREATE INDEX IF NOT EXISTS idx_health_status ON public.system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_timestamp ON public.system_health_checks(last_check DESC);

ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view health checks" ON public.system_health_checks
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 2. HALLUCINATION EVENTS
--    Track AI hallucinations and quality issues
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hallucination_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  ai_mode TEXT,
  personality_id UUID,
  subject TEXT,
  
  hallucination_type TEXT CHECK (hallucination_type IN (
    'fabricated_info',
    'inconsistent_reasoning',
    'conflicting_response',
    'broken_citation'
  )),
  
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  
  detected_by TEXT,
  auto_corrected BOOLEAN DEFAULT FALSE,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hallucination_type ON public.hallucination_events(hallucination_type);
CREATE INDEX IF NOT EXISTS idx_hallucination_severity ON public.hallucination_events(severity);
CREATE INDEX IF NOT EXISTS idx_hallucination_timestamp ON public.hallucination_events(timestamp DESC);

ALTER TABLE public.hallucination_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view hallucinations" ON public.hallucination_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 3. LATENCY METRICS
--    Track response times and performance
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.latency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  first_token_ms INTEGER,
  full_response_ms INTEGER,
  streaming_ms INTEGER,
  
  provider TEXT,
  model TEXT,
  
  user_id UUID REFERENCES auth.users(id),
  conversation_id UUID,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_latency_provider ON public.latency_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_latency_timestamp ON public.latency_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_latency_user ON public.latency_metrics(user_id);

ALTER TABLE public.latency_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view latency metrics" ON public.latency_metrics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 4. TOKEN CONSUMPTION
--    Track and monitor token usage
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.token_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id),
  tokens_used INTEGER,
  estimated_cost DECIMAL(10, 4),
  
  mode TEXT,
  provider TEXT,
  
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_score REAL,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_bucket DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON public.token_consumption(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_date ON public.token_consumption(date_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_anomaly ON public.token_consumption(is_anomaly);

ALTER TABLE public.token_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view token consumption" ON public.token_consumption
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 5. FAILURE INCIDENTS
--    Track all system failures and recovery
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.failure_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  incident_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('active', 'resolved', 'investigating')),
  
  description TEXT,
  
  affected_system TEXT,
  affected_users INTEGER DEFAULT 0,
  
  auto_healed BOOLEAN DEFAULT FALSE,
  recovery_time_ms INTEGER,
  
  root_cause TEXT,
  resolution_notes TEXT,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incident_type ON public.failure_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_severity ON public.failure_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_status ON public.failure_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_timestamp ON public.failure_incidents(timestamp DESC);

ALTER TABLE public.failure_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view incidents" ON public.failure_incidents
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 6. MEMORY INTEGRITY CHECKS
--    Monitor memory system health
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.memory_integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id),
  
  total_records INTEGER,
  valid_records INTEGER,
  corrupted_records INTEGER,
  stale_records INTEGER,
  
  integrity_score REAL,
  
  memory_type TEXT,
  issues_found TEXT[],
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_user ON public.memory_integrity_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_timestamp ON public.memory_integrity_checks(timestamp DESC);

ALTER TABLE public.memory_integrity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view memory checks" ON public.memory_integrity_checks
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 7. SYNC HEALTH
--    Monitor offline sync systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sync_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id),
  
  sync_success_rate REAL,
  queue_size INTEGER,
  pending_messages INTEGER,
  failed_syncs INTEGER,
  
  last_successful_sync TIMESTAMPTZ,
  cache_consistency_score REAL,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_user ON public.sync_health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_timestamp ON public.sync_health_metrics(timestamp DESC);

ALTER TABLE public.sync_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sync health" ON public.sync_health_metrics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 8. EMOTIONAL RESPONSE QUALITY
--    Track AI emotional intelligence
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.emotional_response_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID,
  personality_id UUID,
  
  user_emotional_state TEXT,
  ai_response_appropriateness REAL,
  emotional_match_score REAL,
  
  mismatch_type TEXT,
  suggestion TEXT,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotional_timestamp ON public.emotional_response_quality(timestamp DESC);

ALTER TABLE public.emotional_response_quality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view emotional quality" ON public.emotional_response_quality
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 9. PERSONALITY PERFORMANCE
--    Track personality effectiveness
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personality_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  personality_id UUID NOT NULL,
  
  effectiveness_score REAL,
  engagement_score REAL,
  educational_outcome_score REAL,
  emotional_impact_score REAL,
  retention_impact REAL,
  
  user_satisfaction_rating REAL,
  total_interactions INTEGER,
  
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personality_perf ON public.personality_performance_metrics(personality_id);
CREATE INDEX IF NOT EXISTS idx_personality_date ON public.personality_performance_metrics(snapshot_date DESC);

ALTER TABLE public.personality_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view personality metrics" ON public.personality_performance_metrics
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 10. PREDICTIVE ALERTS
--    AI-generated risk predictions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  risk_type TEXT,
  probability REAL,
  timeframe TEXT,
  confidence_score REAL,
  
  recommended_action TEXT,
  severity TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  was_correct BOOLEAN,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.predictive_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON public.predictive_alerts(created_at DESC);

ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view alerts" ON public.predictive_alerts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 11. CIVILIZATION HEALTH SCORE
--    Master health metric
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.civilization_health_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  overall_score REAL NOT NULL,
  
  ai_quality_score REAL,
  latency_score REAL,
  memory_integrity_score REAL,
  emotional_stability_score REAL,
  multiplayer_health_score REAL,
  event_participation_score REAL,
  sync_health_score REAL,
  
  status TEXT,
  
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_civ_timestamp ON public.civilization_health_score(timestamp DESC);

ALTER TABLE public.civilization_health_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view civ health" ON public.civilization_health_score
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- 12. AUTO-HEALING LOGS
--    Track automated recovery systems
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.auto_healing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  incident_id UUID REFERENCES public.failure_incidents(id),
  
  healing_type TEXT,
  action_taken TEXT,
  success BOOLEAN,
  
  time_to_recovery_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_healing_incident ON public.auto_healing_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_healing_timestamp ON public.auto_healing_logs(created_at DESC);

ALTER TABLE public.auto_healing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view healing logs" ON public.auto_healing_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_civilization_health()
RETURNS REAL LANGUAGE plpgsql AS $$
DECLARE
  v_overall REAL;
BEGIN
  SELECT COALESCE(AVG(health_score), 100)
  INTO v_overall
  FROM public.system_health_checks;
  
  RETURN COALESCE(v_overall, 98.2);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_civilization_health() TO authenticated;

CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS TABLE (
  anomaly_type TEXT,
  severity TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ
) LANGUAGE SQL AS $$
  SELECT 
    'Latency Spike'::TEXT,
    'medium'::TEXT,
    'Average latency 15% above normal'::TEXT,
    now()::TIMESTAMPTZ
  WHERE (
    SELECT AVG(full_response_ms) FROM public.latency_metrics 
    WHERE timestamp > now() - INTERVAL '1 hour'
  ) > (
    SELECT AVG(full_response_ms) FROM public.latency_metrics 
    WHERE timestamp BETWEEN now() - INTERVAL '7 days' AND now() - INTERVAL '1 day'
  ) * 1.15;
$$;

GRANT EXECUTE ON FUNCTION detect_anomalies() TO authenticated;

-- ────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────

COMMENT ON TABLE public.system_health_checks IS 'Core monitoring for all Knowledge Universe systems';
COMMENT ON TABLE public.hallucination_events IS 'Track AI hallucinations and quality issues';
COMMENT ON TABLE public.latency_metrics IS 'Response time and performance tracking';
COMMENT ON TABLE public.token_consumption IS 'Token usage and cost monitoring';
COMMENT ON TABLE public.failure_incidents IS 'All system failures and recovery tracking';
COMMENT ON TABLE public.memory_integrity_checks IS 'Memory system health monitoring';
COMMENT ON TABLE public.sync_health_metrics IS 'Offline sync system monitoring';
COMMENT ON TABLE public.emotional_response_quality IS 'AI emotional intelligence tracking';
COMMENT ON TABLE public.personality_performance_metrics IS 'AI personality effectiveness tracking';
COMMENT ON TABLE public.predictive_alerts IS 'AI-generated risk predictions';
COMMENT ON TABLE public.civilization_health_score IS 'Master health metric for entire civilization';
COMMENT ON TABLE public.auto_healing_logs IS 'Automated recovery system logs';
