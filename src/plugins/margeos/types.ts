// MargeOS shared types. Mirrored under src/plugins/margeos/types.ts so Vite
// picks them up (folders outside src/ are not part of the build).

export type AgentName =
  | "coordinator"
  | "qwen"
  | "merge"
  | "executor"
  | "planner"
  | "verifier"
  | "memory"
  | "teacher"
  | "coding"
  | "research"
  | "admin";

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  archived: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type FileKind = "file" | "folder";

export interface WorkspaceFile {
  id: string;
  user_id: string;
  workspace_id: string;
  parent_id: string | null;
  path: string;
  name: string;
  kind: FileKind;
  mime: string | null;
  size_bytes: number;
  content: string | null;
  storage_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TaskStatus =
  | "pending"
  | "planning"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface Task {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  assigned_agent: AgentName | null;
  plan: unknown;
  result: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type ExecStatus = "running" | "success" | "error" | "timeout";

export interface Execution {
  id: string;
  user_id: string;
  workspace_id: string | null;
  task_id: string | null;
  kind: string;
  command: string | null;
  status: ExecStatus;
  output: string | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  user_id: string;
  workspace_id: string | null;
  task_id: string | null;
  agent: AgentName | string;
  role: string;
  content: string;
  tokens: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type MemoryScope = "session" | "long_term" | "project" | "conversation";

export interface MemoryEntry {
  id: string;
  user_id: string;
  workspace_id: string | null;
  scope: MemoryScope;
  key: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  source: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MargeSession {
  id: string;
  user_id: string;
  workspace_id: string | null;
  label: string | null;
  state: Record<string, unknown>;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export type AnalyticsCategory =
  | "agent"
  | "terminal"
  | "tutor"
  | "memory"
  | "vault"
  | "workspace"
  | "file"
  | "session"
  | "ui";

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  workspace_id: string | null;
  category: AnalyticsCategory | string;
  event: string;
  subject: string | null;
  value: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** One row of public.margeos_analytics_summary(). */
export interface AnalyticsSummaryRow {
  category: string;
  event: string;
  events: number;
  total_value: number;
}

/** One row of public.margeos_analytics_timeseries(). */
export interface AnalyticsTimeseriesRow {
  day: string;
  category: string;
  events: number;
}

// ── Canonical Learning & Student Domain Models ──────────────

export interface CanonicalStudentProfile {
  userId: string;
  displayName: string;
  email?: string;
  grade?: number | string;
  preferredSubjects: string[];
  learningPace: 'slow' | 'medium' | 'fast' | 'adaptive';
  streakDays: number;
  totalStudyMinutes: number;
  completedLessonsCount: number;
  masteryLevels: Record<string, number>; // subject or topic -> percentage 0-100
  updatedAt: string;
}

export interface CanonicalRecommendation {
  id: string;
  userId: string;
  type: 'quiz' | 'review' | 'deep_dive' | 'practice_exam' | 'concept_node';
  title: string;
  description: string;
  targetSubject: string;
  targetTopic?: string;
  priorityScore: number; // 1-100
  estimatedMinutes: number;
  actionUrl?: string;
  reason: string;
  createdAt: string;
}

