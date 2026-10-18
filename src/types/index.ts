export type CategoryType =
  | 'Deep Work'
  | 'Meetings & Syncs'
  | 'Creative & Design'
  | 'Learning & Research'
  | 'Admin & Operations'
  | 'Health & Personal';

export type PriorityType = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'partially_completed'
  | 'postponed'
  | 'cancelled';

export interface Task {
  id: string;
  workspace: 'demo' | 'personal';
  title: string;
  description?: string;
  category: CategoryType;
  plannedDate: string; // YYYY-MM-DD
  scheduledStartTime?: string; // HH:mm
  estimatedDurationMinutes: number;
  priority: PriorityType;
  status: TaskStatus;
  postponedFrom?: string; // Original plannedDate if postponed
  postponeCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  workspace: 'demo' | 'personal';
  taskId?: string | null; // Nullable for spontaneous/unplanned activities
  taskTitle: string;
  category: CategoryType;
  actualDurationMinutes: number;
  completionStatus: 'completed' | 'partial' | 'abandoned';
  interruptionNotes?: string;
  interruptionCount?: number;
  reflectionNotes?: string;
  activityDate: string; // YYYY-MM-DD
  startedAt?: string;
  endedAt?: string;
  isUnplanned: boolean;
  createdAt: string;
}

export interface ActiveTimerState {
  taskId: string | null;
  taskTitle: string;
  category: CategoryType;
  startTime: number; // epoch ms
  elapsedSeconds: number;
  isRunning: boolean;
  interruptionCount: number;
  isUnplanned: boolean;
}

export interface UserPreferences {
  displayName: string;
  title?: string;
  timezone: string;
  weekStart: 'monday' | 'sunday';
  workHoursStart: string; // "09:00"
  workHoursEnd: string; // "18:00"
  dailyAvailableMinutes: number; // default 480 mins (8h)
  durationUnit: 'minutes' | 'hours';
  activeWorkspace: 'demo' | 'personal';
  overplanningAlertThreshold: number; // e.g. 100% of available time
}

export interface Insight {
  id: string;
  workspace: 'demo' | 'personal';
  type:
    | 'estimation_bias'
    | 'gap_spike'
    | 'completion_velocity'
    | 'category_drift'
    | 'postponement_loop'
    | 'peak_performance_day'
    | 'interruption_drag';
  title: string;
  observation: string;
  evidence: string;
  observationPeriod: string;
  confidence: 'high' | 'medium' | 'low';
  metricValue?: string;
  suggestedExperiment: string;
  dismissed: boolean;
  helpfulVote?: 'helpful' | 'unhelpful' | null;
  createdAt: string;
}

export interface Experiment {
  id: string;
  workspace: 'demo' | 'personal';
  patternId?: string;
  title: string;
  hypothesis: string;
  actionProtocol: string;
  targetCategory?: CategoryType | 'All';
  status: 'not_started' | 'active' | 'completed' | 'abandoned';
  startDate?: string;
  endDate?: string;
  notes?: string;
  resultOutcome?: string;
}

export interface RealityScoreDetails {
  score: number; // 0 - 100
  planningAccuracyComponent: number; // 0 - 40
  completionRateComponent: number; // 0 - 35
  estimationCaliberComponent: number; // 0 - 25
  previousPeriodScore: number | null;
  delta: number | null;
  description: string;
  qualification: 'Optimal Alignment' | 'Solid Execution' | 'Moderate Drift' | 'Significant Gap';
}

export interface DayMetric {
  date: string;
  dayLabel: string;
  plannedMinutes: number;
  actualMinutes: number;
  completedTasks: number;
  totalPlannedTasks: number;
  completionRate: number;
  planningAccuracy: number;
  gapMinutes: number; // actual - planned
  unplannedMinutes: number;
}
