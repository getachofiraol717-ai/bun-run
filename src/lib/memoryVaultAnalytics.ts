// ============================================================
// memoryVaultAnalytics.ts
// Educational Intelligence Analytics Engine
// Populates Memory Vault with learning insights
// ============================================================

// Loose SupabaseClient typing so this analytics module compiles against
// auto-generated DB types that don't yet include the memory vault tables.
// The runtime client is the shared @/integrations/supabase/client.
type SupabaseClient = any;

// ── Types ─────────────────────────────────────────────────────
interface UserSession {
  user_id: string;
  session_start: Date;
  session_duration_minutes: number;
  subject?: string;
  ai_mode?: string;
  quiz_accuracy?: number;
  quiz_attempts?: number;
}

interface AnalyticsWindow {
  startDate: Date;
  endDate: Date;
}

// ────────────────────────────────────────────────────────────
// 1. LEARNING ARC ANALYZER
// ────────────────────────────────────────────────────────────
export class LearningArcAnalyzer {
  constructor(private supabase: SupabaseClient) {}

  async analyzeSubjectProgression(
    userId: string,
    subject: string,
    daysBack: number = 90
  ): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch quiz history
      const { data: quizzes } = await this.supabase
        .from('quizzes')
        .select('score, created_at, subject, user_id')
        .eq('user_id', userId)
        .eq('subject', subject)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (!quizzes || quizzes.length === 0) {
        return null;
      }

      // Calculate metrics
      const quizAccuracy = (quizzes.reduce((sum: number, q: any) => sum + q.score, 0) / quizzes.length) * 100;
      const streakData = this.calculateStreak(userId);
      const confidenceLevel = this.estimateConfidence(quizzes);
      const masteryStage = this.determineMasteryStage(quizAccuracy, quizzes.length);

      // Record snapshot
      await this.supabase.rpc('record_learning_arc', {
        _user_id: userId,
        _subject: subject,
        _quiz_accuracy: quizAccuracy,
        _quiz_count: quizzes.length,
        _study_duration_minutes: 0, // Calculate from sessions
        _streak_days: streakData.currentStreak,
        _confidence_level: confidenceLevel,
      });

      return {
        subject,
        quizAccuracy,
        confidenceLevel,
        masteryStage,
        quizCount: quizzes.length,
      };
    } catch (error) {
      console.error('Error analyzing subject progression:', error);
      return null;
    }
  }

  private calculateStreak(userId: string): { currentStreak: number; longestStreak: number } {
    // Implementation: analyze user_presence or session data
    return { currentStreak: 0, longestStreak: 0 };
  }

  private estimateConfidence(quizzes: any[]): number {
    if (quizzes.length === 0) return 0.5;

    // Confidence increases with consistency and recent success
    const recentScores = quizzes.slice(-5).map((q: any) => q.score);
    const recentAvg = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;
    const consistency = this.calculateConsistency(quizzes);

    return Math.min(1, (recentAvg + consistency) / 2);
  }

  private calculateConsistency(quizzes: any[]): number {
    if (quizzes.length < 2) return 0.5;

    const scores = quizzes.map((q: any) => q.score);
    const mean = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum: number, s: number) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = more consistent
    return Math.max(0, 1 - stdDev);
  }

  private determineMasteryStage(accuracy: number, quizCount: number): string {
    // Need minimum reps for mastery
    const minReps = 5;

    if (accuracy >= 90 && quizCount >= minReps) return 'mastery';
    if (accuracy >= 75 && quizCount >= 3) return 'advanced';
    if (accuracy >= 60 && quizCount >= 2) return 'intermediate';
    return 'beginner';
  }
}

// ────────────────────────────────────────────────────────────
// 2. MOTIVATION & BURNOUT ANALYZER
// ────────────────────────────────────────────────────────────
export class MotivationAnalyzer {
  constructor(private supabase: SupabaseClient) {}

  async analyzeDailyMotivation(userId: string): Promise<void> {
    try {
      const sessions = await this.fetchTodaySessions(userId);

      const dailySessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + s.session_duration_minutes, 0);
      const studyIntensity = this.calculateIntensity(totalMinutes);
      const consistencyScore = await this.calculateConsistencyScore(userId);
      const burnoutRiskScore = await this.calculateBurnoutRisk(userId, sessions);

      await this.supabase.rpc('record_motivation_snapshot', {
        _user_id: userId,
        _daily_sessions: dailySessions,
        _total_session_minutes: totalMinutes,
        _study_intensity: studyIntensity,
        _consistency_score: consistencyScore,
        _burnout_risk_score: burnoutRiskScore,
      });
    } catch (error) {
      console.error('Error analyzing motivation:', error);
    }
  }

  private async fetchTodaySessions(userId: string): Promise<UserSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query user_presence or session logs
    const { data } = await this.supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .gte('last_seen', today.toISOString());

    return (data || []).map((p: any) => ({
      user_id: userId,
      session_start: new Date(p.last_seen),
      session_duration_minutes: 30, // Mock - should track actual duration
    }));
  }

  private calculateIntensity(totalMinutes: number): number {
    // Normalize: 0 mins = 0, 240 mins = 1, capped at 1
    return Math.min(1, totalMinutes / 240);
  }

  private async calculateConsistencyScore(userId: string): Promise<number> {
    try {
      // Check last 7 days of activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions } = await this.supabase
        .from('user_presence')
        .select('date, last_seen')
        .eq('user_id', userId)
        .gte('last_seen', sevenDaysAgo.toISOString());

      const activeDays = new Set(
        (sessions || []).map((s: any) => new Date(s.date || s.last_seen).toDateString())
      ).size;

      return activeDays / 7; // 0-1 score
    } catch {
      return 0.5;
    }
  }

  private async calculateBurnoutRisk(userId: string, todaySessions: UserSession[]): Promise<number> {
    try {
      // Burnout signals
      let riskScore = 0;

      // Check for inactivity
      const { data: recentActivity } = await this.supabase
        .from('user_presence')
        .select('last_seen')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false })
        .limit(7);

      if (!recentActivity || recentActivity.length < 2) {
        riskScore += 0.4; // Low recent activity
      }

      // Check for failed quiz attempts
      const { data: recentQuizzes } = await this.supabase
        .from('quizzes')
        .select('score')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const failedAttempts = (recentQuizzes || []).filter((q: any) => q.score < 0.5).length;
      if (failedAttempts > 5) {
        riskScore += 0.3;
      }

      // Check study duration decline
      if (todaySessions.length === 0) {
        riskScore += 0.2;
      }

      return Math.min(1, riskScore);
    } catch {
      return 0.3;
    }
  }
}

// ────────────────────────────────────────────────────────────
// 3. EMOTIONAL PROGRESSION TRACKER
// ────────────────────────────────────────────────────────────
export class EmotionalProgressionTracker {
  constructor(private supabase: SupabaseClient) {}

  async trackEmotionalState(
    userId: string,
    signals: {
      quizPerformance?: number;
      sessionDuration?: number;
      frustrationSignals?: boolean;
      successfulCompletion?: boolean;
      aiInteractionQuality?: number;
    }
  ): Promise<void> {
    try {
      const emotionalState = this.inferEmotionalState(signals);

      await this.supabase.rpc('record_emotional_state', {
        _user_id: userId,
        _frustration_level: emotionalState.frustration,
        _confidence_level: emotionalState.confidence,
        _stress_level: emotionalState.stress,
        _motivation_level: emotionalState.motivation,
        _resilience_level: emotionalState.resilience,
        _primary_emotion: emotionalState.primaryEmotion,
      });
    } catch (error) {
      console.error('Error tracking emotional state:', error);
    }
  }

  private inferEmotionalState(signals: any): any {
    let frustration = 0;
    let confidence = 0.5;
    let stress = 0;
    let motivation = 0.5;
    let resilience = 0.5;

    // Analyze signals
    if (signals.quizPerformance) {
      confidence = signals.quizPerformance;
      frustration = 1 - signals.quizPerformance;
    }

    if (signals.frustrationSignals) {
      frustration = Math.min(1, frustration + 0.3);
      stress = 0.6;
    }

    if (signals.successfulCompletion) {
      confidence = Math.min(1, confidence + 0.3);
      motivation = Math.min(1, motivation + 0.2);
      resilience = Math.min(1, resilience + 0.1);
    }

    if (signals.sessionDuration && signals.sessionDuration > 60) {
      stress = Math.min(1, stress + 0.2);
    }

    const emotionMap: Record<string, string> = {
      high_confidence_low_stress: 'confident',
      high_confidence_high_stress: 'focused',
      low_confidence_high_stress: 'frustrated',
      low_confidence_low_stress: 'calm',
    };

    const confKey = confidence > 0.6 ? 'high' : 'low';
    const stressKey = stress > 0.5 ? 'high' : 'low';
    const primaryEmotion = emotionMap[`${confKey}_confidence_${stressKey}_stress`] || 'neutral';

    return {
      frustration,
      confidence,
      stress,
      motivation,
      resilience,
      primaryEmotion,
    };
  }
}

// ────────────────────────────────────────────────────────────
// 4. TIMELINE EVENT RECORDER
// ────────────────────────────────────────────────────────────
export class TimelineEventRecorder {
  constructor(private supabase: SupabaseClient) {}

  async recordQuizVictory(userId: string, subject: string, score: number): Promise<void> {
    if (score < 0.8) return; // Only major victories

    await this.supabase.rpc('record_timeline_event', {
      _user_id: userId,
      _event_type: 'quiz_victory',
      _event_date: new Date().toISOString().split('T')[0],
      _title: `${subject} Quiz Victory`,
      _description: `Achieved ${Math.round(score * 100)}% on ${subject} quiz`,
      _subject: subject,
      _significance_score: Math.min(1, score),
    });
  }

  async recordBreakthrough(
    userId: string,
    subject: string,
    description: string
  ): Promise<void> {
    await this.supabase.rpc('record_timeline_event', {
      _user_id: userId,
      _event_type: 'breakthrough',
      _event_date: new Date().toISOString().split('T')[0],
      _title: `Breakthrough in ${subject}`,
      _description: description,
      _subject: subject,
      _significance_score: 0.9,
    });
  }

  async recordStreakMilestone(userId: string, streakDays: number): Promise<void> {
    if (streakDays % 5 !== 0) return; // Record every 5 days

    await this.supabase.rpc('record_timeline_event', {
      _user_id: userId,
      _event_type: 'streak_milestone',
      _event_date: new Date().toISOString().split('T')[0],
      _title: `${streakDays} Day Study Streak!`,
      _description: `Consistent learning for ${streakDays} consecutive days`,
      _significance_score: 0.7,
    });
  }

  async recordSubjectMastery(userId: string, subject: string): Promise<void> {
    await this.supabase.rpc('record_timeline_event', {
      _user_id: userId,
      _event_type: 'subject_mastery',
      _event_date: new Date().toISOString().split('T')[0],
      _title: `Mastered ${subject}`,
      _description: `Achieved mastery level in ${subject}`,
      _subject: subject,
      _significance_score: 0.95,
    });
  }

  async recordRecovery(userId: string, description: string): Promise<void> {
    await this.supabase.rpc('record_timeline_event', {
      _user_id: userId,
      _event_type: 'recovery',
      _event_date: new Date().toISOString().split('T')[0],
      _title: 'Back on Track',
      _description: description,
      _significance_score: 0.8,
    });
  }
}

// ────────────────────────────────────────────────────────────
// 5. BURNOUT RECOVERY TRACKER
// ────────────────────────────────────────────────────────────
export class BurnoutRecoveryTracker {
  constructor(private supabase: SupabaseClient) {}

  async detectBurnout(userId: string, riskScore: number): Promise<void> {
    if (riskScore < 0.7) return; // Only high-risk

    try {
      // Check if already in burnout
      const { data: existing } = await this.supabase
        .from('burnout_recovery_phases')
        .select('id')
        .eq('user_id', userId)
        .is('recovery_complete_date', null)
        .limit(1)
        .single();

      if (existing) return; // Already tracked

      // Record burnout onset
      await this.supabase
        .from('burnout_recovery_phases')
        .insert({
          user_id: userId,
          onset_date: new Date().toISOString().split('T')[0],
          detection_date: new Date().toISOString().split('T')[0],
          severity_level: riskScore > 0.85 ? 'severe' : 'moderate',
          burnout_score: riskScore,
        });
    } catch (error) {
      console.error('Error detecting burnout:', error);
    }
  }

  async recordRecoveryProgress(userId: string, reengagementLevel: number): Promise<void> {
    try {
      // Find active burnout phase
      const { data: phase } = await this.supabase
        .from('burnout_recovery_phases')
        .select('id, onset_date')
        .eq('user_id', userId)
        .is('recovery_complete_date', null)
        .limit(1)
        .single();

      if (!phase) return;

      if (reengagementLevel > 0.7) {
        // Mark as recovered
        const onsetDate = new Date(phase.onset_date);
        const today = new Date();
        const recoveryDays = Math.floor((today.getTime() - onsetDate.getTime()) / (1000 * 60 * 60 * 24));

        await this.supabase
          .from('burnout_recovery_phases')
          .update({
            recovery_complete_date: today.toISOString().split('T')[0],
            recovery_duration_days: recoveryDays,
            recovery_successful: true,
          })
          .eq('id', phase.id);
      }
    } catch (error) {
      console.error('Error recording recovery progress:', error);
    }
  }
}

// ────────────────────────────────────────────────────────────
// 6. MEMORY VAULT ORCHESTRATOR
// ────────────────────────────────────────────────────────────
export class MemoryVaultOrchestrator {
  private learningArcAnalyzer: LearningArcAnalyzer;
  private motivationAnalyzer: MotivationAnalyzer;
  private emotionalTracker: EmotionalProgressionTracker;
  private timelineRecorder: TimelineEventRecorder;
  private burnoutTracker: BurnoutRecoveryTracker;

  constructor(private supabase: SupabaseClient) {
    this.learningArcAnalyzer = new LearningArcAnalyzer(supabase);
    this.motivationAnalyzer = new MotivationAnalyzer(supabase);
    this.emotionalTracker = new EmotionalProgressionTracker(supabase);
    this.timelineRecorder = new TimelineEventRecorder(supabase);
    this.burnoutTracker = new BurnoutRecoveryTracker(supabase);
  }

  /**
   * Analyze a user session and populate memory vault
   */
  async analyzeSession(userId: string, sessionData: any): Promise<void> {
    try {
      // 1. Analyze learning progression
      if (sessionData.subject) {
        await this.learningArcAnalyzer.analyzeSubjectProgression(userId, sessionData.subject);
      }

      // 2. Track motivation
      await this.motivationAnalyzer.analyzeDailyMotivation(userId);

      // 3. Track emotional state
      await this.emotionalTracker.trackEmotionalState(userId, {
        quizPerformance: sessionData.quizScore,
        sessionDuration: sessionData.durationMinutes,
        successfulCompletion: sessionData.completed,
      });

      // 4. Record timeline events if significant
      if (sessionData.quizScore > 0.8) {
        await this.timelineRecorder.recordQuizVictory(userId, sessionData.subject, sessionData.quizScore);
      }

      // 5. Detect burnout
      const burnoutRisk = await this.calculateBurnoutRisk(userId);
      await this.burnoutTracker.detectBurnout(userId, burnoutRisk);
    } catch (error) {
      console.error('Error analyzing session:', error);
    }
  }

  private async calculateBurnoutRisk(userId: string): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('motivation_timeline')
        .select('burnout_risk_score')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      return data?.burnout_risk_score || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate platform-wide insights
   */
  async generatePlatformInsights(): Promise<void> {
    try {
      const { data: aggregates } = await this.supabase
        .from('memory_vault_aggregates')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      // Analyze trends and generate insights
      // This would be enhanced with actual trend analysis
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }
}

export default MemoryVaultOrchestrator;
