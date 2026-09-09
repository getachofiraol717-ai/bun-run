/**
 * WorkspaceAnalytics.ts
 *
 * Engine for tracking and analyzing workspace usage patterns and productivity metrics.
 */

const STORAGE_KEY = 'workspace_analytics_data';

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  duration?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface MetricData {
  total: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface ProductivityMetrics {
  codingTime: MetricData;
  debuggingTime: MetricData;
  readingTime: MetricData;
  totalTime: MetricData;
  linesWritten: number;
  linesDeleted: number;
  filesCreated: number;
  filesEdited: number;
  sessionsCount: number;
}

export interface LanguageMetrics {
  language: string;
  timeSpent: number;
  filesEdited: number;
  linesWritten: number;
  percentage: number;
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  totalTime: number;
  lastAccessed: string;
  filesCount: number;
  languages: string[];
}

export interface DailySummary {
  date: string;
  codingTime: number;
  debuggingTime: number;
  readingTime: number;
  sessionsCount: number;
  filesCreated: number;
  filesEdited: number;
  linesWritten: number;
}

export class WorkspaceAnalytics {
  private static instance: WorkspaceAnalytics;
  private events: AnalyticsEvent[] = [];
  private sessionStart: string | null = null;
  private sessionActivities: Map<string, number> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private maxEvents: number = 10000;
  private dailySummaries: Map<string, DailySummary> = new Map();

  private constructor() {}

  static getInstance(): WorkspaceAnalytics {
    if (!WorkspaceAnalytics.instance) {
      WorkspaceAnalytics.instance = new WorkspaceAnalytics();
    }
    return WorkspaceAnalytics.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.dailySummaries = new Map(Object.entries(data.dailySummaries || {}));
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events: this.events.slice(-this.maxEvents),
        dailySummaries: Object.fromEntries(this.dailySummaries)
      }));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  // Event Tracking
  trackEvent(
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type,
      category,
      action,
      label,
      value,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.updateDailySummary(event);
    this.saveState();
    this.emit('eventTracked', event);
  }

  trackCodingEvent(action: string, metadata?: Record<string, any>): void {
    this.trackEvent('coding', 'editor', action, undefined, undefined, metadata);
  }

  trackDebugEvent(action: string, metadata?: Record<string, any>): void {
    this.trackEvent('debug', 'debugger', action, undefined, undefined, metadata);
  }

  trackFileEvent(action: string, metadata?: Record<string, any>): void {
    this.trackEvent('file', 'explorer', action, undefined, undefined, metadata);
  }

  trackProjectEvent(action: string, projectId: string, metadata?: Record<string, any>): void {
    this.trackEvent('project', 'project', action, projectId, undefined, metadata);
  }

  trackAIEvent(action: string, metadata?: Record<string, any>): void {
    this.trackEvent('ai', 'ai', action, undefined, undefined, metadata);
  }

  // Session Tracking
  startSession(): void {
    this.sessionStart = new Date().toISOString();
    this.sessionActivities.clear();
    this.trackEvent('session', 'session', 'start');
  }

  endSession(): void {
    if (this.sessionStart) {
      const duration = Date.now() - new Date(this.sessionStart).getTime();
      this.trackEvent('session', 'session', 'end', undefined, duration);
      this.sessionStart = null;
      this.sessionActivities.clear();
    }
  }

  recordActivity(type: string, duration: number): void {
    const current = this.sessionActivities.get(type) || 0;
    this.sessionActivities.set(type, current + duration);
  }

  // Daily Summary
  private updateDailySummary(event: AnalyticsEvent): void {
    const date = event.timestamp.split('T')[0];
    let summary = this.dailySummaries.get(date);

    if (!summary) {
      summary = {
        date,
        codingTime: 0,
        debuggingTime: 0,
        readingTime: 0,
        sessionsCount: 0,
        filesCreated: 0,
        filesEdited: 0,
        linesWritten: 0
      };
      this.dailySummaries.set(date, summary);
    }

    switch (event.category) {
      case 'editor':
        summary.codingTime += event.duration || 0;
        if (event.action === 'create') summary.filesCreated++;
        if (event.action === 'edit') summary.filesEdited++;
        break;
      case 'debugger':
        summary.debuggingTime += event.duration || 0;
        break;
      case 'ai':
        summary.readingTime += event.duration || 0;
        break;
    }

    if (event.action === 'session_start') {
      summary.sessionsCount++;
    }

    if (event.metadata?.linesWritten) {
      summary.linesWritten += event.metadata.linesWritten;
    }
  }

  getDailySummary(date: string): DailySummary | undefined {
    return this.dailySummaries.get(date);
  }

  getDailySummaries(startDate: string, endDate: string): DailySummary[] {
    const summaries: DailySummary[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      const summary = this.dailySummaries.get(date);
      if (summary) {
        summaries.push(summary);
      } else {
        summaries.push({
          date,
          codingTime: 0,
          debuggingTime: 0,
          readingTime: 0,
          sessionsCount: 0,
          filesCreated: 0,
          filesEdited: 0,
          linesWritten: 0
        });
      }
    }

    return summaries;
  }

  // Query Methods
  getEvents(filters?: {
    category?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AnalyticsEvent[] {
    let filtered = [...this.events];

    if (filters?.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters?.action) {
      filtered = filtered.filter(e => e.action === filters.action);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  getEventCount(filters?: {
    category?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): number {
    return this.getEvents(filters).length;
  }

  // Metrics Calculation
  calculateMetric(events: AnalyticsEvent[], valueKey: 'value' | 'duration'): MetricData {
    const values = events.map(e => e[valueKey] || 0).filter(v => v > 0);

    if (values.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, trend: 'stable', changePercent: 0 };
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;

    if (firstAvg > 0) {
      changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
    }

    return { total, average, min, max, trend, changePercent };
  }

  getProductivityMetrics(startDate?: string, endDate?: string): ProductivityMetrics {
    const filters = { startDate, endDate };
    const codingEvents = this.getEvents({ ...filters, category: 'editor' });
    const debugEvents = this.getEvents({ ...filters, category: 'debugger' });
    const aiEvents = this.getEvents({ ...filters, category: 'ai' });

    const codingTime = this.calculateMetric(codingEvents, 'duration');
    const debuggingTime = this.calculateMetric(debugEvents, 'duration');
    const readingTime = this.calculateMetric(aiEvents, 'duration');

    const totalTime: MetricData = {
      total: codingTime.total + debuggingTime.total + readingTime.total,
      average: codingTime.average + debuggingTime.average + readingTime.average,
      min: 0,
      max: codingTime.max + debuggingTime.max + readingTime.max,
      trend: 'stable',
      changePercent: 0
    };

    let linesWritten = 0;
    let linesDeleted = 0;
    let filesCreated = 0;
    let filesEdited = 0;

    codingEvents.forEach(event => {
      if (event.metadata?.linesWritten) linesWritten += event.metadata.linesWritten;
      if (event.metadata?.linesDeleted) linesDeleted += event.metadata.linesDeleted;
      if (event.action === 'create') filesCreated++;
      if (event.action === 'edit') filesEdited++;
    });

    return {
      codingTime,
      debuggingTime,
      readingTime,
      totalTime,
      linesWritten,
      linesDeleted,
      filesCreated,
      filesEdited,
      sessionsCount: this.getEventCount({ ...filters, category: 'session', action: 'start' })
    };
  }

  getLanguageMetrics(startDate?: string, endDate?: string): LanguageMetrics[] {
    const events = this.getEvents({ category: 'editor', startDate, endDate });
    const languageTimes: Map<string, number> = new Map();
    const languageFiles: Map<string, number> = new Map();
    const languageLines: Map<string, number> = new Map();

    events.forEach(event => {
      if (event.metadata?.language) {
        const lang = event.metadata.language;
        languageTimes.set(lang, (languageTimes.get(lang) || 0) + (event.duration || 0));
        languageFiles.set(lang, (languageFiles.get(lang) || 0) + 1);
        languageLines.set(lang, (languageLines.get(lang) || 0) + (event.metadata?.linesWritten || 0));
      }
    });

    const totalTime = Array.from(languageTimes.values()).reduce((a, b) => a + b, 0);

    return Array.from(languageTimes.entries()).map(([language, timeSpent]) => ({
      language,
      timeSpent,
      filesEdited: languageFiles.get(language) || 0,
      linesWritten: languageLines.get(language) || 0,
      percentage: totalTime > 0 ? (timeSpent / totalTime) * 100 : 0
    })).sort((a, b) => b.timeSpent - a.timeSpent);
  }

  getProjectMetrics(): ProjectMetrics[] {
    const projectTimes: Map<string, { time: number; lastAccess: string; files: Set<string>; languages: Set<string> }> = new Map();

    this.events.forEach(event => {
      if (event.category === 'project' && event.label) {
        const projectId = event.label;
        if (!projectTimes.has(projectId)) {
          projectTimes.set(projectId, { time: 0, lastAccess: event.timestamp, files: new Set(), languages: new Set() });
        }
        const data = projectTimes.get(projectId)!;
        data.time += event.duration || 0;
        if (event.timestamp > data.lastAccess) {
          data.lastAccess = event.timestamp;
        }
        if (event.metadata?.fileId) {
          data.files.add(event.metadata.fileId);
        }
        if (event.metadata?.language) {
          data.languages.add(event.metadata.language);
        }
      }
    });

    return Array.from(projectTimes.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: projectId,
      totalTime: data.time,
      lastAccessed: data.lastAccess,
      filesCount: data.files.size,
      languages: Array.from(data.languages)
    })).sort((a, b) => b.totalTime - a.totalTime);
  }

  // Time Series Analysis
  getTimeSeriesData(
    metric: 'codingTime' | 'debuggingTime' | 'readingTime' | 'sessionsCount' | 'filesCreated' | 'filesEdited' | 'linesWritten',
    startDate: string,
    endDate: string
  ): TimeSeriesData[] {
    const summaries = this.getDailySummaries(startDate, endDate);

    return summaries.map(summary => ({
      date: summary.date,
      value: summary[metric]
    }));
  }

  // Trend Analysis
  getTrendAnalysis(days: number = 7): {
    codingTrend: 'up' | 'down' | 'stable';
    debugTrend: 'up' | 'down' | 'stable';
    overallTrend: 'up' | 'down' | 'stable';
    changePercentage: number;
  } {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const metrics = this.getProductivityMetrics(startDate, endDate);

    const codingTrend = metrics.codingTime.trend;
    const debugTrend = metrics.debuggingTime.trend;

    let overallTrend: 'up' | 'down' | 'stable' = 'stable';
    if (codingTrend === 'up' || debugTrend === 'up') overallTrend = 'up';
    else if (codingTrend === 'down' && debugTrend === 'down') overallTrend = 'down';

    const changePercentage = metrics.totalTime.changePercent;

    return { codingTrend, debugTrend, overallTrend, changePercentage };
  }

  // Export
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        events: this.events,
        dailySummaries: Object.fromEntries(this.dailySummaries)
      }, null, 2);
    }

    // CSV format
    const headers = ['id', 'type', 'category', 'action', 'label', 'value', 'timestamp'];
    const rows = this.events.map(e =>
      headers.map(h => String((e as any)[h] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // Cleanup
  clearData(): void {
    this.events = [];
    this.dailySummaries.clear();
    this.saveState();
    this.emit('dataCleared', {});
  }

  clearOldData(daysToKeep: number = 90): void {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    this.events = this.events.filter(e => e.timestamp >= cutoff);

    this.dailySummaries.forEach((summary, date) => {
      if (date < cutoff.split('T')[0]) {
        this.dailySummaries.delete(date);
      }
    });

    this.saveState();
    this.emit('oldDataCleared', { daysKept: daysToKeep });
  }

  // Events
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
}

export default WorkspaceAnalytics;
