// @ts-nocheck
/**
 * ModerationEngine.ts
 *
 * Comprehensive engine for classroom moderation, content management,
 * reporting system, audit logging, and automated moderation with
 * extensive filter rules and action management.
 */

const STORAGE_KEY = 'moderation_engine_data';
const AUDIT_LOG_KEY = 'moderation_audit_log';

export interface ModerationEngineConfig {
  enableAutoModeration?: boolean;
  enableProfanityFilter?: boolean;
  enableReportSystem?: boolean;
  enableAuditLogging?: boolean;
  enableContentAnalysis?: boolean;
  maxWarnings?: number;
  autoBanThreshold?: number;
  warningExpirationDays?: number;
  maxFilterRules?: number;
}

export interface ModerationAction {
  id: string;
  type: ActionType;
  targetUserId: string;
  targetUserName: string;
  moderatorId: string;
  moderatorName: string;
  classroomId: string;
  channelId?: string;
  reason: string;
  details?: string;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export type ActionType =
  | 'warning'
  | 'mute'
  | 'unmute'
  | 'kick'
  | 'temporary_ban'
  | 'permanent_ban'
  | 'unban'
  | 'remove_message'
  | 'pin_message'
  | 'unpin_message'
  | 'channel_lock'
  | 'channel_unlock'
  | 'role_change'
  | 'delete_channel'
  | 'archive_channel'
  | 'restrict_media'
  | 'allow_media';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  reportedUserName?: string;
  messageId?: string;
  channelId: string;
  classroomId: string;
  type: ReportType;
  reason: string;
  details?: string;
  evidence?: string[];
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  escalationLevel?: number;
  assignedTo?: string;
}

export type ReportType =
  | 'spam'
  | 'harassment'
  | 'bullying'
  | 'inappropriate_content'
  | 'offensive_language'
  | 'false_information'
  | 'off_topic'
  | 'copyright'
  | 'personal_information'
  | 'external_links'
  | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'escalated' | 'resolved' | 'dismissed' | 'invalid';

export interface FilterRule {
  id: string;
  name: string;
  pattern: string;
  type: FilterType;
  action: FilterAction;
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  isRegex: boolean;
  caseSensitive: boolean;
  matchCount: number;
  lastMatchedAt?: string;
  createdAt: string;
  createdBy?: string;
  scope: 'global' | 'classroom' | 'channel';
  scopeId?: string;
}

export type FilterType = 'profanity' | 'spam' | 'link' | 'mention' | 'word' | 'phrase' | 'url' | 'email' | 'phone' | 'regex';
export type FilterAction = 'block' | 'warn' | 'flag' | 'mute' | 'replace';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  targetType: 'user' | 'message' | 'channel' | 'classroom' | 'report' | 'rule' | 'system';
  targetId?: string;
  targetName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  classroomId?: string;
  channelId?: string;
}

export interface ContentAnalysis {
  content: string;
  userId: string;
  channelId: string;
  timestamp: string;
  flags: ContentFlag[];
  riskScore: number;
  categories: string[];
  recommendations: string[];
}

export interface ContentFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  matchedText?: string;
  ruleId?: string;
  description: string;
}

export interface ModerationStats {
  totalActions: number;
  activeActions: number;
  totalWarnings: number;
  activeWarnings: number;
  totalBans: number;
  activeBans: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  filterRulesActive: number;
  contentFlagged: number;
  actionsThisWeek: number;
  topReasons: Record<string, number>;
}

export interface ModerationDashboard {
  stats: ModerationStats;
  recentActions: ModerationAction[];
  pendingReports: Report[];
  flaggedContent: ContentAnalysis[];
  activityTimeline: AuditLogEntry[];
}

export interface EscalationPolicy {
  id: string;
  name: string;
  triggerConditions: EscalationCondition[];
  actions: EscalationAction[];
  isActive: boolean;
}

export interface EscalationCondition {
  type: 'warning_count' | 'report_count' | 'time_period' | 'severity';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

export interface EscalationAction {
  type: 'notify' | 'assign' | 'escalate' | 'auto_ban';
  target?: string;
  message?: string;
}

export interface ModerationSettings {
  classroomId: string;
  autoModerationEnabled: boolean;
  profanityFilterEnabled: boolean;
  linkFilterEnabled: boolean;
  mentionFilterEnabled: boolean;
  spamFilterEnabled: boolean;
  requireApprovalForMedia: boolean;
  allowExternalLinks: boolean;
  maxMentionsPerMessage: number;
  maxLinksPerMessage: number;
  cooldownPeriod: number;
  warningThreshold: number;
  autoBanThreshold: number;
  updatedAt: string;
}

class ModerationEngine {
  private static instance: ModerationEngine;
  private actions: Map<string, ModerationAction> = new Map();
  private userActions: Map<string, string[]> = new Map();
  private reports: Map<string, Report> = new Map();
  private filterRules: Map<string, FilterRule> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private moderationSettings: Map<string, ModerationSettings> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private config: ModerationEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: ModerationEngineConfig = {}) {
    this.config = {
      enableAutoModeration: config.enableAutoModeration !== false,
      enableProfanityFilter: config.enableProfanityFilter !== false,
      enableReportSystem: config.enableReportSystem !== false,
      enableAuditLogging: config.enableAuditLogging !== false,
      enableContentAnalysis: config.enableContentAnalysis !== false,
      maxWarnings: config.maxWarnings || 3,
      autoBanThreshold: config.autoBanThreshold || 5,
      warningExpirationDays: config.warningExpirationDays || 30,
      maxFilterRules: config.maxFilterRules || 500
    };

    this.initializeDefaultFilterRules();
    this.initializeDefaultEscalationPolicies();
  }

  static getInstance(config?: ModerationEngineConfig): ModerationEngine {
    if (!ModerationEngine.instance) {
      ModerationEngine.instance = new ModerationEngine(config);
    }
    return ModerationEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private initializeDefaultFilterRules(): void {
    const defaultRules: Omit<FilterRule, 'id' | 'createdAt' | 'matchCount'>[] = [
      { name: 'Basic Spam', pattern: '\\b(buy|sell|discount|offer|click here|limited time)\\b', type: 'spam', action: 'flag', severity: 'medium', isActive: true, isRegex: true, caseSensitive: false, scope: 'global' },
      { name: 'External Links', pattern: '(http|https)://', type: 'link', action: 'flag', severity: 'low', isActive: true, isRegex: true, caseSensitive: false, scope: 'global' },
      { name: 'Email Pattern', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', type: 'email', action: 'block', severity: 'high', isActive: true, isRegex: true, caseSensitive: false, scope: 'global' },
      { name: 'Phone Pattern', pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b', type: 'phone', action: 'block', severity: 'high', isActive: true, isRegex: true, caseSensitive: false, scope: 'global' },
      { name: 'Mention Spam', pattern: '@everyone|@here', type: 'mention', action: 'warn', severity: 'medium', isActive: true, isRegex: true, caseSensitive: false, scope: 'global' }
    ];

    defaultRules.forEach(rule => {
      const id = `RULE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      this.filterRules.set(id, {
        ...rule,
        id,
        createdAt: new Date().toISOString()
      });
    });
  }

  private initializeDefaultEscalationPolicies(): void {
    const defaultPolicy: EscalationPolicy = {
      id: 'POLICY-DEFAULT',
      name: 'Default Escalation',
      triggerConditions: [
        { type: 'warning_count', operator: 'gte', value: 3 },
        { type: 'report_count', operator: 'gte', value: 5 },
        { type: 'severity', operator: 'eq', value: 3 }
      ],
      actions: [
        { type: 'notify', target: 'moderator', message: 'User has reached warning threshold' },
        { type: 'escalate', message: 'Auto-escalation triggered for user' }
      ],
      isActive: true
    };

    this.escalationPolicies.set(defaultPolicy.id, defaultPolicy);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.actions = new Map(Object.entries(data.actions || {}));
        this.userActions = new Map(Object.entries(data.userActions || {}));
        this.reports = new Map(Object.entries(data.reports || {}));
        this.filterRules = new Map(Object.entries(data.filterRules || {}));
        this.auditLog = data.auditLog || [];
        this.moderationSettings = new Map(Object.entries(data.settings || {}));
        this.escalationPolicies = new Map(Object.entries(data.escalationPolicies || {}));
      }
    } catch (error) {
      console.error('Failed to load moderation data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        actions: Object.fromEntries(this.actions),
        userActions: Object.fromEntries(this.userActions),
        reports: Object.fromEntries(this.reports),
        filterRules: Object.fromEntries(this.filterRules),
        auditLog: this.auditLog.slice(-1000),
        settings: Object.fromEntries(this.moderationSettings),
        escalationPolicies: Object.fromEntries(this.escalationPolicies)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save moderation data:', error);
    }
  }

  private logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    if (!this.config.enableAuditLogging) return;

    const auditEntry: AuditLogEntry = {
      ...entry,
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString()
    };

    this.auditLog.push(auditEntry);

    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    this.saveToStorage();
    this.emit('auditLogEntry', auditEntry);
  }

  // Moderation Actions
  takeAction(
    type: ActionType,
    targetUserId: string,
    targetUserName: string,
    moderatorId: string,
    moderatorName: string,
    classroomId: string,
    reason: string,
    options?: {
      duration?: number;
      metadata?: Record<string, any>;
      channelId?: string;
      details?: string;
    }
  ): ModerationAction {
    const action: ModerationAction = {
      id: `ACTION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type,
      targetUserId,
      targetUserName,
      moderatorId,
      moderatorName,
      classroomId,
      channelId: options?.channelId,
      reason,
      details: options?.details,
      createdAt: new Date().toISOString(),
      isActive: true,
      metadata: options?.metadata || {}
    };

    if (options?.duration) {
      action.expiresAt = new Date(Date.now() + options.duration).toISOString();
    }

    this.actions.set(action.id, action);

    const userActionIds = this.userActions.get(targetUserId) || [];
    userActionIds.push(action.id);
    this.userActions.set(targetUserId, userActionIds);

    this.logAudit({
      action: `moderation_action:${type}`,
      userId: moderatorId,
      userName: moderatorName,
      targetType: 'user',
      targetId: targetUserId,
      targetName: targetUserName,
      details: { reason, type, duration: options?.duration },
      classroomId,
      channelId: options?.channelId
    });

    this.saveToStorage();
    this.emit('moderationActionTaken', action);

    if (type === 'warning') {
      this.checkAutoEscalation(targetUserId, classroomId);
    }

    return action;
  }

  private checkAutoEscalation(userId: string, classroomId: string): void {
    const warnings = this.getActiveWarnings(userId, classroomId);
    const reports = this.getReports({ reportedUserId: userId, status: 'pending' });

    const policy = Array.from(this.escalationPolicies.values()).find(p => p.isActive);
    if (!policy) return;

    let shouldEscalate = false;

    for (const condition of policy.triggerConditions) {
      let value = 0;
      switch (condition.type) {
        case 'warning_count':
          value = warnings.length;
          break;
        case 'report_count':
          value = reports.length;
          break;
      }

      let matches = false;
      switch (condition.operator) {
        case 'gt': matches = value > condition.value; break;
        case 'lt': matches = value < condition.value; break;
        case 'eq': matches = value === condition.value; break;
        case 'gte': matches = value >= condition.value; break;
        case 'lte': matches = value <= condition.value; break;
      }

      if (matches) shouldEscalate = true;
    }

    if (shouldEscalate) {
      policy.actions.forEach(escalationAction => {
        this.emit('escalationTriggered', {
          userId,
          classroomId,
          action: escalationAction
        });
      });
    }
  }

  getAction(actionId: string): ModerationAction | undefined {
    return this.actions.get(actionId);
  }

  getUserActions(userId: string, classroomId?: string): ModerationAction[] {
    const actionIds = this.userActions.get(userId) || [];
    let actions = actionIds
      .map(id => this.actions.get(id))
      .filter((a): a is ModerationAction => a !== undefined);

    if (classroomId) {
      actions = actions.filter(a => a.classroomId === classroomId);
    }

    return actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getActiveWarnings(userId: string, classroomId: string): ModerationAction[] {
    const now = new Date().getTime();
    return this.getUserActions(userId, classroomId).filter(a => {
      if (a.type !== 'warning' || !a.isActive) return false;
      if (a.expiresAt) {
        return new Date(a.expiresAt).getTime() > now;
      }
      return true;
    });
  }

  getActiveBans(userId: string, classroomId: string): ModerationAction[] {
    const now = new Date().getTime();
    return this.getUserActions(userId, classroomId).filter(a => {
      if (!['temporary_ban', 'permanent_ban'].includes(a.type) || !a.isActive) return false;
      if (a.type === 'temporary_ban' && a.expiresAt) {
        return new Date(a.expiresAt).getTime() > now;
      }
      return a.type === 'permanent_ban';
    });
  }

  isUserBanned(userId: string, classroomId: string): boolean {
    return this.getActiveBans(userId, classroomId).length > 0;
  }

  isUserMuted(userId: string, classroomId: string): boolean {
    const now = new Date().getTime();
    const mutes = this.getUserActions(userId, classroomId).filter(a => {
      if (a.type !== 'mute' || !a.isActive) return false;
      if (a.expiresAt) {
        return new Date(a.expiresAt).getTime() > now;
      }
      return true;
    });
    return mutes.length > 0;
  }

  revokeAction(actionId: string, revokedBy: string, revokedByName: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    action.isActive = false;
    action.revokedAt = new Date().toISOString();
    action.revokedBy = revokedBy;

    this.logAudit({
      action: 'action_revoked',
      userId: revokedBy,
      userName: revokedByName,
      targetType: 'user',
      targetId: action.targetUserId,
      targetName: action.targetUserName,
      details: { originalActionId: actionId, type: action.type }
    });

    this.saveToStorage();
    this.emit('moderationActionRevoked', action);
    return true;
  }

  // Reports
  createReport(
    reporterId: string,
    reporterName: string,
    channelId: string,
    classroomId: string,
    type: ReportType,
    reason: string,
    options?: {
      reportedUserId?: string;
      reportedUserName?: string;
      messageId?: string;
      details?: string;
      evidence?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Report {
    if (!this.config.enableReportSystem) {
      throw new Error('Report system is disabled');
    }

    const report: Report = {
      id: `REPORT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      reporterId,
      reporterName,
      reportedUserId: options?.reportedUserId,
      reportedUserName: options?.reportedUserName,
      messageId: options?.messageId,
      channelId,
      classroomId,
      type,
      reason,
      details: options?.details,
      evidence: options?.evidence,
      status: 'pending',
      priority: options?.priority || this.determinePriority(type, reason),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reports.set(report.id, report);

    this.logAudit({
      action: 'report_created',
      userId: reporterId,
      userName: reporterName,
      targetType: 'report',
      targetId: report.id,
      details: { type, reason, channelId, classroomId }
    });

    this.saveToStorage();
    this.emit('reportCreated', report);

    return report;
  }

  private determinePriority(type: ReportType, reason: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes: ReportType[] = ['harassment', 'bullying', 'personal_information', 'copyright'];
    const highTypes: ReportType[] = ['inappropriate_content', 'offensive_language', 'false_information'];

    if (criticalTypes.includes(type)) return 'critical';
    if (highTypes.includes(type)) return 'high';
    if (reason.length > 100) return 'medium';
    return 'low';
  }

  getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  getReports(filter: {
    classroomId?: string;
    channelId?: string;
    status?: ReportStatus;
    reporterId?: string;
    reportedUserId?: string;
    type?: ReportType;
    priority?: string;
  } = {}): Report[] {
    let reports = Array.from(this.reports.values());

    if (filter.classroomId) {
      reports = reports.filter(r => r.classroomId === filter.classroomId);
    }
    if (filter.channelId) {
      reports = reports.filter(r => r.channelId === filter.channelId);
    }
    if (filter.status) {
      reports = reports.filter(r => r.status === filter.status);
    }
    if (filter.reporterId) {
      reports = reports.filter(r => r.reporterId === filter.reporterId);
    }
    if (filter.reportedUserId) {
      reports = reports.filter(r => r.reportedUserId === filter.reportedUserId);
    }
    if (filter.type) {
      reports = reports.filter(r => r.type === filter.type);
    }
    if (filter.priority) {
      reports = reports.filter(r => r.priority === filter.priority);
    }

    return reports.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getPendingReports(classroomId?: string): Report[] {
    return this.getReports({ classroomId, status: 'pending' });
  }

  getReportStats(classroomId?: string): {
    pending: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    byType: Record<ReportType, number>;
    averageResolutionTime: number;
  } {
    const reports = this.getReports({ classroomId });

    const byType: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    reports.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;

      if (r.status === 'resolved' && r.resolvedAt) {
        const created = new Date(r.createdAt).getTime();
        const resolved = new Date(r.resolvedAt).getTime();
        totalResolutionTime += resolved - created;
        resolvedCount++;
      }
    });

    return {
      pending: reports.filter(r => r.status === 'pending').length,
      reviewing: reports.filter(r => r.status === 'reviewing').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      dismissed: reports.filter(r => r.status === 'dismissed').length,
      byType: byType as Record<ReportType, number>,
      averageResolutionTime: resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / 60000) : 0
    };
  }

  updateReportStatus(
    reportId: string,
    status: ReportStatus,
    updatedBy?: string,
    updatedByName?: string,
    resolution?: string,
    assignedTo?: string
  ): Report | undefined {
    const report = this.reports.get(reportId);
    if (!report) return undefined;

    const previousStatus = report.status;
    report.status = status;
    report.updatedAt = new Date().toISOString();

    if (updatedBy) {
      report.resolvedBy = updatedBy;
    }
    if (resolution) {
      report.resolution = resolution;
    }
    if (assignedTo) {
      report.assignedTo = assignedTo;
    }

    if (['resolved', 'dismissed', 'invalid'].includes(status)) {
      report.resolvedAt = new Date().toISOString();
    }

    this.logAudit({
      action: `report_status_updated:${status}`,
      userId: updatedBy || 'system',
      userName: updatedByName || 'System',
      targetType: 'report',
      targetId: reportId,
      details: { previousStatus, newStatus: status, resolution }
    });

    this.saveToStorage();
    this.emit('reportStatusUpdated', report);

    return report;
  }

  assignReport(reportId: string, assigneeId: string, assigneeName: string): Report | undefined {
    const report = this.reports.get(reportId);
    if (!report) return undefined;

    report.assignedTo = assigneeId;
    report.status = 'reviewing';
    report.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('reportAssigned', { reportId, assigneeId, assigneeName });

    return report;
  }

  escalateReport(reportId: string): Report | undefined {
    const report = this.reports.get(reportId);
    if (!report) return undefined;

    report.status = 'escalated';
    report.escalationLevel = (report.escalationLevel || 0) + 1;
    report.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('reportEscalated', report);

    return report;
  }

  // Content Filtering
  checkContent(
    content: string,
    userId: string,
    channelId: string,
    classroomId: string
  ): { isAllowed: boolean; flags: ContentFlag[]; actions: string[]; riskScore: number } {
    if (!this.config.enableAutoModeration) {
      return { isAllowed: true, flags: [], actions: [], riskScore: 0 };
    }

    const flags: ContentFlag[] = [];
    const actions: string[] = [];
    const lowerContent = content.toLowerCase();

    this.filterRules.forEach(rule => {
      if (!rule.isActive) return;

      let pattern: RegExp;
      try {
        pattern = rule.isRegex
          ? new RegExp(rule.pattern, rule.caseSensitive ? '' : 'i')
          : new RegExp(rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), rule.caseSensitive ? '' : 'i');
      } catch {
        return;
      }

      const matches = content.match(pattern);
      if (matches) {
        const flag: ContentFlag = {
          type: rule.type,
          severity: rule.action === 'block' ? 'high' : rule.action === 'warn' ? 'medium' : 'low',
          matchedText: matches[0],
          ruleId: rule.id,
          description: `Matched filter rule: ${rule.name}`
        };

        flags.push(flag);

        if (!actions.includes(rule.action)) {
          actions.push(rule.action);
        }

        rule.matchCount++;
        rule.lastMatchedAt = new Date().toISOString();
      }
    });

    const uniqueFlags = flags.filter((flag, index, self) =>
      index === self.findIndex(f => f.type === flag.type)
    );

    const riskScore = this.calculateRiskScore(uniqueFlags);
    const isAllowed = !actions.includes('block');

    if (this.config.enableContentAnalysis) {
      this.logAudit({
        action: 'content_checked',
        userId,
        userName: '',
        targetType: 'message',
        details: { contentLength: content.length, flags: uniqueFlags.length, riskScore, isAllowed },
        channelId,
        classroomId
      });
    }

    return { isAllowed, flags: uniqueFlags, actions: [...new Set(actions)], riskScore };
  }

  private calculateRiskScore(flags: ContentFlag[]): number {
    if (flags.length === 0) return 0;

    let score = 0;
    flags.forEach(flag => {
      switch (flag.severity) {
        case 'low': score += 1; break;
        case 'medium': score += 3; break;
        case 'high': score += 5; break;
      }
    });

    return Math.min(100, score * 10);
  }

  analyzeContent(content: string, userId: string, channelId: string): ContentAnalysis {
    const check = this.checkContent(content, userId, channelId, '');

    const categories: string[] = [];
    const recommendations: string[] = [];

    if (check.flags.some(f => f.type === 'profanity')) {
      categories.push('Language');
      recommendations.push('Review community guidelines for appropriate language');
    }

    if (check.flags.some(f => f.type === 'spam')) {
      categories.push('Spam');
      recommendations.push('Avoid promotional or repetitive content');
    }

    if (check.flags.some(f => f.type === 'link')) {
      categories.push('External Links');
      recommendations.push('Be cautious with external links');
    }

    return {
      content,
      userId,
      channelId,
      timestamp: new Date().toISOString(),
      flags: check.flags,
      riskScore: check.riskScore,
      categories,
      recommendations
    };
  }

  // Filter Rules Management
  addFilterRule(
    rule: Omit<FilterRule, 'id' | 'createdAt' | 'matchCount'>
  ): FilterRule {
    if (this.filterRules.size >= this.config.maxFilterRules!) {
      throw new Error('Maximum number of filter rules reached');
    }

    const newRule: FilterRule = {
      ...rule,
      id: `RULE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      matchCount: 0
    };

    this.filterRules.set(newRule.id, newRule);

    this.logAudit({
      action: 'filter_rule_added',
      userId: rule.createdBy || 'system',
      userName: '',
      targetType: 'rule',
      targetId: newRule.id,
      targetName: newRule.name,
      details: { type: newRule.type, action: newRule.action, scope: newRule.scope }
    });

    this.saveToStorage();
    this.emit('filterRuleAdded', newRule);

    return newRule;
  }

  updateFilterRule(ruleId: string, updates: Partial<Omit<FilterRule, 'id' | 'createdAt'>>): FilterRule | undefined {
    const rule = this.filterRules.get(ruleId);
    if (!rule) return undefined;

    Object.assign(rule, updates);

    this.logAudit({
      action: 'filter_rule_updated',
      userId: 'system',
      userName: '',
      targetType: 'rule',
      targetId: ruleId,
      targetName: rule.name,
      details: updates
    });

    this.saveToStorage();
    this.emit('filterRuleUpdated', rule);

    return rule;
  }

  removeFilterRule(ruleId: string): boolean {
    const rule = this.filterRules.get(ruleId);
    if (!rule) return false;

    this.filterRules.delete(ruleId);

    this.logAudit({
      action: 'filter_rule_removed',
      userId: 'system',
      userName: '',
      targetType: 'rule',
      targetId: ruleId,
      targetName: rule.name,
      details: { type: rule.type, action: rule.action }
    });

    this.saveToStorage();
    this.emit('filterRuleRemoved', { ruleId });
    return true;
  }

  getFilterRules(filter?: {
    type?: FilterType;
    action?: FilterAction;
    isActive?: boolean;
    scope?: 'global' | 'classroom' | 'channel';
    scopeId?: string;
  }): FilterRule[] {
    let rules = Array.from(this.filterRules.values());

    if (filter?.type) {
      rules = rules.filter(r => r.type === filter.type);
    }
    if (filter?.action) {
      rules = rules.filter(r => r.action === filter.action);
    }
    if (filter?.isActive !== undefined) {
      rules = rules.filter(r => r.isActive === filter.isActive);
    }
    if (filter?.scope) {
      rules = rules.filter(r => r.scope === filter.scope);
    }
    if (filter?.scopeId) {
      rules = rules.filter(r => r.scopeId === filter.scopeId);
    }

    return rules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getActiveFilterRules(): FilterRule[] {
    return this.getFilterRules({ isActive: true });
  }

  // Moderation Settings
  getModerationSettings(classroomId: string): ModerationSettings {
    let settings = this.moderationSettings.get(classroomId);

    if (!settings) {
      settings = this.createDefaultSettings(classroomId);
      this.moderationSettings.set(classroomId, settings);
      this.saveToStorage();
    }

    return settings;
  }

  private createDefaultSettings(classroomId: string): ModerationSettings {
    return {
      classroomId,
      autoModerationEnabled: true,
      profanityFilterEnabled: true,
      linkFilterEnabled: true,
      mentionFilterEnabled: true,
      spamFilterEnabled: true,
      requireApprovalForMedia: false,
      allowExternalLinks: true,
      maxMentionsPerMessage: 5,
      maxLinksPerMessage: 3,
      cooldownPeriod: 0,
      warningThreshold: this.config.maxWarnings!,
      autoBanThreshold: this.config.autoBanThreshold!,
      updatedAt: new Date().toISOString()
    };
  }

  updateModerationSettings(classroomId: string, updates: Partial<Omit<ModerationSettings, 'classroomId' | 'updatedAt'>>): ModerationSettings {
    const settings = this.getModerationSettings(classroomId);
    Object.assign(settings, updates, { updatedAt: new Date().toISOString() });
    this.moderationSettings.set(classroomId, settings);
    this.saveToStorage();

    this.logAudit({
      action: 'moderation_settings_updated',
      userId: 'system',
      userName: '',
      targetType: 'classroom',
      targetId: classroomId,
      details: updates
    });

    this.emit('moderationSettingsUpdated', settings);
    return settings;
  }

  // Escalation Policies
  createEscalationPolicy(policy: Omit<EscalationPolicy, 'id'>): EscalationPolicy {
    const newPolicy: EscalationPolicy = {
      ...policy,
      id: `POLICY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };

    this.escalationPolicies.set(newPolicy.id, newPolicy);
    this.saveToStorage();

    this.emit('escalationPolicyCreated', newPolicy);
    return newPolicy;
  }

  getEscalationPolicies(): EscalationPolicy[] {
    return Array.from(this.escalationPolicies.values());
  }

  updateEscalationPolicy(policyId: string, updates: Partial<Omit<EscalationPolicy, 'id'>>): EscalationPolicy | undefined {
    const policy = this.escalationPolicies.get(policyId);
    if (!policy) return undefined;

    Object.assign(policy, updates);
    this.saveToStorage();

    this.emit('escalationPolicyUpdated', policy);
    return policy;
  }

  deleteEscalationPolicy(policyId: string): boolean {
    const deleted = this.escalationPolicies.delete(policyId);
    if (deleted) {
      this.saveToStorage();
      this.emit('escalationPolicyDeleted', { policyId });
    }
    return deleted;
  }

  // Audit Log
  getAuditLog(filter?: {
    userId?: string;
    targetType?: AuditLogEntry['targetType'];
    targetId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    classroomId?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let entries = [...this.auditLog];

    if (filter?.userId) {
      entries = entries.filter(e => e.userId === filter.userId);
    }
    if (filter?.targetType) {
      entries = entries.filter(e => e.targetType === filter.targetType);
    }
    if (filter?.targetId) {
      entries = entries.filter(e => e.targetId === filter.targetId);
    }
    if (filter?.action) {
      entries = entries.filter(e => e.action.includes(filter.action));
    }
    if (filter?.startDate) {
      entries = entries.filter(e => e.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      entries = entries.filter(e => e.timestamp <= filter.endDate!);
    }
    if (filter?.classroomId) {
      entries = entries.filter(e => e.classroomId === filter.classroomId);
    }

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filter?.limit ? entries.slice(0, filter.limit) : entries;
  }

  // Dashboard
  getModerationDashboard(classroomId: string): ModerationDashboard {
    const stats = this.getModerationStats(classroomId);
    const recentActions = this.getUserActions('')
      .filter(a => a.classroomId === classroomId)
      .slice(0, 10);
    const pendingReports = this.getPendingReports(classroomId);
    const activityTimeline = this.getAuditLog({ classroomId, limit: 20 });

    return {
      stats,
      recentActions,
      pendingReports,
      flaggedContent: [],
      activityTimeline
    };
  }

  getModerationStats(classroomId?: string): ModerationStats {
    const actions = classroomId
      ? Array.from(this.actions.values()).filter(a => a.classroomId === classroomId)
      : Array.from(this.actions.values());

    const reports = classroomId
      ? this.getReports({ classroomId })
      : Array.from(this.reports.values());

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const topReasons: Record<string, number> = {};
    actions.forEach(a => {
      topReasons[a.reason] = (topReasons[a.reason] || 0) + 1;
    });

    return {
      totalActions: actions.length,
      activeActions: actions.filter(a => a.isActive).length,
      totalWarnings: actions.filter(a => a.type === 'warning').length,
      activeWarnings: this.getActiveWarnings('', classroomId || '').length,
      totalBans: actions.filter(a => ['temporary_ban', 'permanent_ban'].includes(a.type)).length,
      activeBans: this.getActiveBans('', classroomId || '').length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      resolvedReports: reports.filter(r => ['resolved', 'dismissed'].includes(r.status)).length,
      filterRulesActive: this.getActiveFilterRules().length,
      contentFlagged: this.filterRules.values().reduce((sum, r) => sum + r.matchCount, 0),
      actionsThisWeek: actions.filter(a => new Date(a.createdAt) >= weekAgo).length,
      topReasons: Object.fromEntries(
        Object.entries(topReasons)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      )
    };
  }

  // Utility
  clearModerationForClassroom(classroomId: string): void {
    const actionIdsToDelete: string[] = [];
    const reportIdsToDelete: string[] = [];

    this.actions.forEach((action, id) => {
      if (action.classroomId === classroomId) {
        actionIdsToDelete.push(id);
      }
    });

    this.reports.forEach((report, id) => {
      if (report.classroomId === classroomId) {
        reportIdsToDelete.push(id);
      }
    });

    actionIdsToDelete.forEach(id => this.actions.delete(id));
    reportIdsToDelete.forEach(id => this.reports.delete(id));

    this.moderationSettings.delete(classroomId);

    this.saveToStorage();
    this.emit('classroomModerationCleared', { classroomId });
  }

  // Event System
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  getStats(): {
    totalActions: number;
    pendingReports: number;
    activeFilters: number;
    auditLogEntries: number;
    policies: number;
  } {
    return {
      totalActions: this.actions.size,
      pendingReports: this.getPendingReports().length,
      activeFilters: this.getActiveFilterRules().length,
      auditLogEntries: this.auditLog.length,
      policies: this.escalationPolicies.size
    };
  }
}

export default ModerationEngine;
