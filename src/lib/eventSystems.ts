// ============================================================
// eventSystems.ts
// Real-Time Event Engine Systems & Algorithms
// ============================================================

/**
 * EVENT BROADCASTING SYSTEM
 * Real-time event updates across the galaxy
 */

export interface EventBroadcast {
  eventId: string;
  message: string;
  type: 'announcement' | 'alert' | 'achievement' | 'milestone' | 'completion';
  urgency: 'low' | 'normal' | 'high' | 'critical';
  targetAudience: 'all' | 'event_participants' | 'guild' | 'classroom';
  timestamp: Date;
}

export class EventBroadcaster {
  /**
   * Broadcast event updates in real-time
   */
  static broadcastEvent(broadcast: EventBroadcast): void {
    // In production, use Supabase Realtime or similar
    console.log(`📡 BROADCAST [${broadcast.urgency.toUpperCase()}]: ${broadcast.message}`);
  }

  /**
   * Generate automated announcements
   */
  static generateAnnouncement(eventId: string, milestone: number, totalGoal: number): EventBroadcast {
    const percentage = (milestone / totalGoal) * 100;
    const messages = {
      25: '🌟 The galaxy is 25% of the way there!',
      50: '⭐ Halfway there! The momentum is building!',
      75: '✨ 75% complete! The finish line is in sight!',
      100: '🎉 QUEST COMPLETE! The entire galaxy has united!',
    };

    return {
      eventId,
      message: messages[percentage as keyof typeof messages] || `${percentage.toFixed(0)}% complete!`,
      type: 'milestone',
      urgency: percentage >= 75 ? 'high' : 'normal',
      targetAudience: 'all',
      timestamp: new Date(),
    };
  }
}

/**
 * REWARD DISTRIBUTION ENGINE
 */

export interface RewardDistribution {
  userId: string;
  eventId: string;
  xpAmount: number;
  badges: string[];
  cosmetics: string[];
  worldUnlocks: string[];
  timestamp: Date;
}

export class RewardDistributor {
  /**
   * Calculate XP rewards with multipliers
   */
  static calculateXP(baseXP: number, eventMultiplier: number, userModifiers: number = 1): number {
    return Math.floor(baseXP * eventMultiplier * userModifiers);
  }

  /**
   * Process event completion rewards
   */
  static async processEventReward(
    userId: string,
    eventId: string,
    baseXP: number,
    eventMultiplier: number
  ): Promise<RewardDistribution> {
    const xpEarned = this.calculateXP(baseXP, eventMultiplier);

    return {
      userId,
      eventId,
      xpAmount: xpEarned,
      badges: [],
      cosmetics: [],
      worldUnlocks: [],
      timestamp: new Date(),
    };
  }

  /**
   * Distribute milestone rewards
   */
  static determineMilestoneReward(completionPercentage: number): {
    xpBonus: number;
    badge?: string;
    cosmetic?: string;
  } {
    if (completionPercentage >= 100) {
      return { xpBonus: 500, badge: 'Quest Master', cosmetic: 'Legendary Aura' };
    } else if (completionPercentage >= 75) {
      return { xpBonus: 300, badge: 'Dedicated Explorer' };
    } else if (completionPercentage >= 50) {
      return { xpBonus: 150, badge: 'Halfway Hero' };
    } else if (completionPercentage >= 25) {
      return { xpBonus: 50 };
    }
    return { xpBonus: 0 };
  }
}

/**
 * REAL-TIME PARTICIPATION TRACKER
 */

export interface ParticipationMetrics {
  eventId: string;
  currentParticipants: number;
  completionPercentage: number;
  estimatedFinalParticipants: number;
  trendingStatus: 'hot' | 'normal' | 'slow';
  peakParticipationTime: Date;
  participationVelocity: number; // participants per hour
}

export class ParticipationTracker {
  private static previousCounts: Map<string, number> = new Map();

  /**
   * Calculate trending status based on participation velocity
   */
  static calculateTrending(
    eventId: string,
    currentParticipants: number,
    previousParticipants: number
  ): 'hot' | 'normal' | 'slow' {
    const velocity = currentParticipants - previousParticipants;

    if (velocity > 100) return 'hot';
    if (velocity > 20) return 'normal';
    return 'slow';
  }

  /**
   * Estimate final participant count
   */
  static estimateFinalParticipants(
    currentParticipants: number,
    currentTimePercentage: number,
    eventStartParticipants: number = 0
  ): number {
    if (currentTimePercentage === 0) return currentParticipants;

    const trend = (currentParticipants - eventStartParticipants) / currentTimePercentage;
    const estimatedFinal = eventStartParticipants + (trend * 100);

    return Math.round(estimatedFinal);
  }

  /**
   * Generate participation metrics
   */
  static generateMetrics(
    eventId: string,
    currentParticipants: number,
    completionPercentage: number
  ): ParticipationMetrics {
    const previousParticipants = this.previousCounts.get(eventId) || currentParticipants;
    this.previousCounts.set(eventId, currentParticipants);

    return {
      eventId,
      currentParticipants,
      completionPercentage,
      estimatedFinalParticipants: this.estimateFinalParticipants(
        currentParticipants,
        completionPercentage
      ),
      trendingStatus: this.calculateTrending(eventId, currentParticipants, previousParticipants),
      peakParticipationTime: new Date(),
      participationVelocity: currentParticipants - previousParticipants,
    };
  }
}

/**
 * ENGAGEMENT SCORING ENGINE
 */

export class EngagementScorer {
  /**
   * Calculate engagement score (0-100)
   */
  static calculateScore(
    participationRate: number,
    completionRate: number,
    averageSessionDuration: number,
    returningPlayerRate: number
  ): number {
    const weights = {
      participation: 0.25,
      completion: 0.35,
      duration: 0.2,
      retention: 0.2,
    };

    // Normalize values to 0-100
    const normalizedDuration = Math.min(100, (averageSessionDuration / 60) * 10);

    const score =
      participationRate * weights.participation +
      completionRate * weights.completion +
      normalizedDuration * weights.duration +
      returningPlayerRate * weights.retention;

    return Math.round(score);
  }

  /**
   * Generate engagement report
   */
  static generateReport(metrics: {
    participation: number;
    completion: number;
    duration: number;
    retention: number;
  }): {
    score: number;
    rating: 'poor' | 'fair' | 'good' | 'excellent' | 'legendary';
    recommendation: string;
  } {
    const score = this.calculateScore(
      metrics.participation,
      metrics.completion,
      metrics.duration,
      metrics.retention
    );

    let rating: 'poor' | 'fair' | 'good' | 'excellent' | 'legendary' = 'poor';
    let recommendation = '';

    if (score >= 90) {
      rating = 'legendary';
      recommendation = 'This event is performing exceptionally! Consider extending or creating similar events.';
    } else if (score >= 75) {
      rating = 'excellent';
      recommendation = 'Great engagement! Players are enjoying this event.';
    } else if (score >= 60) {
      rating = 'good';
      recommendation = 'Solid performance. Consider adding more incentives or extending duration.';
    } else if (score >= 40) {
      rating = 'fair';
      recommendation = 'Moderate engagement. Consider enhancing rewards or improving communication.';
    } else {
      rating = 'poor';
      recommendation = 'Low engagement. Consider pausing and redesigning this event.';
    }

    return { score, rating, recommendation };
  }
}

/**
 * COMPETITIVE RANKING ENGINE
 */

export interface CompetitionRanking {
  rank: number;
  userId: string;
  username: string;
  score: number;
  xpEarned: number;
  questsCompleted: number;
  achievementBadges: string[];
}

export class CompetitionRanker {
  /**
   * Calculate competition score
   */
  static calculateCompetitionScore(
    questsCompleted: number,
    xpEarned: number,
    accuracy: number,
    speedBonus: number = 0
  ): number {
    return (
      questsCompleted * 100 +
      Math.floor(xpEarned / 10) +
      accuracy * 500 +
      speedBonus
    );
  }

  /**
   * Generate rankings
   */
  static generateRankings(competitors: Array<{
    userId: string;
    username: string;
    questsCompleted: number;
    xpEarned: number;
    accuracy: number;
    speed?: number;
  }>): CompetitionRanking[] {
    const scores = competitors.map(c => ({
      ...c,
      score: this.calculateCompetitionScore(
        c.questsCompleted,
        c.xpEarned,
        c.accuracy,
        c.speed || 0
      ),
    }));

    return scores
      .sort((a, b) => b.score - a.score)
      .map((competitor, index) => ({
        rank: index + 1,
        userId: competitor.userId,
        username: competitor.username,
        score: competitor.score,
        xpEarned: competitor.xpEarned,
        questsCompleted: competitor.questsCompleted,
        achievementBadges: [],
      }));
  }

  /**
   * Generate prize pool distribution
   */
  static distributePrizes(rankings: CompetitionRanking[], totalPrizePool: number): Map<number, number> {
    const distribution = new Map<number, number>();
    
    if (rankings.length >= 1) distribution.set(1, Math.floor(totalPrizePool * 0.5)); // 1st: 50%
    if (rankings.length >= 2) distribution.set(2, Math.floor(totalPrizePool * 0.3)); // 2nd: 30%
    if (rankings.length >= 3) distribution.set(3, Math.floor(totalPrizePool * 0.2)); // 3rd: 20%

    return distribution;
  }
}

/**
 * GUILD EVENT COORDINATOR
 */

export interface GuildEventMetrics {
  guildId: string;
  totalContribution: number;
  memberParticipation: number;
  averageMemberXP: number;
  guildRank: number;
  collectiveReward: string;
}

export class GuildEventCoordinator {
  /**
   * Calculate guild contribution
   */
  static calculateGuildContribution(
    memberXP: number[],
    completedQuests: number,
    participationRate: number
  ): number {
    const totalXP = memberXP.reduce((a, b) => a + b, 0);
    return Math.floor(totalXP * participationRate + completedQuests * 1000);
  }

  /**
   * Rank guilds in event
   */
  static rankGuilds(guilds: Array<{
    guildId: string;
    contribution: number;
    participation: number;
    memberCount: number;
  }>): GuildEventMetrics[] {
    return guilds
      .sort((a, b) => b.contribution - a.contribution)
      .map((guild, index) => ({
        guildId: guild.guildId,
        totalContribution: guild.contribution,
        memberParticipation: guild.participation,
        averageMemberXP: Math.floor(guild.contribution / guild.memberCount),
        guildRank: index + 1,
        collectiveReward: this.getGuildReward(index + 1),
      }));
  }

  private static getGuildReward(rank: number): string {
    const rewards = {
      1: '👑 Galactic Champions - 1000 Guild XP',
      2: '🥈 Elite Guild - 750 Guild XP',
      3: '🥉 Honored Guild - 500 Guild XP',
    };
    return rewards[rank as keyof typeof rewards] || `Guild Rank ${rank}`;
  }
}

/**
 * EVENT SCHEDULING ENGINE
 */

export class EventScheduler {
  /**
   * Generate recurring event schedule
   */
  static generateSchedule(
    startDate: Date,
    pattern: 'weekly' | 'monthly' | 'yearly' | 'holiday',
    count: number = 12
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate));

      switch (pattern) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        case 'holiday':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
      }
    }

    return dates;
  }

  /**
   * Suggest optimal event timing based on engagement data
   */
  static suggestOptimalTime(
    engagementData: Map<string, number>
  ): string {
    const times = Array.from(engagementData.entries());
    const best = times.reduce((a, b) => (a[1] > b[1] ? a : b));
    return best[0];
  }
}

/**
 * ADAPTIVE EVENT RECOMMENDER
 */

export class EventRecommender {
  /**
   * Recommend events based on player profile
   */
  static recommendEvents(
    playerLevel: number,
    interests: string[],
    recentEventPerformance: number[]
  ): string[] {
    const recommendations: string[] = [];

    // High performers get competitive events
    const avgPerformance = recentEventPerformance.reduce((a, b) => a + b, 0) / recentEventPerformance.length;
    if (avgPerformance > 75) {
      recommendations.push('Quantum Challenge Season');
      recommendations.push('Research Marathon');
    }

    // Interest-based recommendations
    if (interests.includes('adventure')) {
      recommendations.push('Astronomy Expedition');
      recommendations.push('Galaxy Exploration Festival');
    }
    if (interests.includes('competition')) {
      recommendations.push('Knowledge Championship');
    }
    if (interests.includes('community')) {
      recommendations.push('Research Marathon');
    }

    // Level-based recommendations
    if (playerLevel < 10) {
      recommendations.push('Cosmic Discovery Week');
    }

    return [...new Set(recommendations)];
  }
}

export default {
  EventBroadcaster,
  RewardDistributor,
  ParticipationTracker,
  EngagementScorer,
  CompetitionRanker,
  GuildEventCoordinator,
  EventScheduler,
  EventRecommender,
};
