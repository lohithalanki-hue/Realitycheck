import {
  ActivityLog,
  CategoryType,
  DayMetric,
  Insight,
  RealityScoreDetails,
  Task,
} from '../../types';

/**
 * Formats a duration in minutes into a clean human readable string
 * e.g. "2h 45m" or "45m" or "0m"
 */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return '0m';
  const hours = Math.floor(Math.abs(rounded) / 60);
  const remainingMins = Math.abs(rounded) % 60;
  const sign = rounded < 0 ? '-' : '';

  if (hours === 0) return `${sign}${remainingMins}m`;
  if (remainingMins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${remainingMins}m`;
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1) + 'h';
}

/**
 * Calculates Task Completion Rate as a percentage (0 to 100).
 * Eligible tasks include: completed, in_progress, partially_completed, planned, postponed.
 * Cancelled tasks are excluded from the denominator.
 */
export function calculateCompletionRate(tasks: Task[]): number {
  const eligible = tasks.filter((t) => t.status !== 'cancelled');
  if (eligible.length === 0) return 0;
  const completed = eligible.filter((t) => t.status === 'completed').length;
  return Math.round((completed / eligible.length) * 100);
}

/**
 * Calculates Planning Accuracy as a percentage (0 to 100).
 * Formula: 1 - (|planned - actual| / max(planned, actual))
 */
export function calculatePlanningAccuracy(plannedMinutes: number, actualMinutes: number): number {
  if (plannedMinutes === 0 && actualMinutes === 0) return 100;
  if (plannedMinutes === 0 || actualMinutes === 0) return 0;

  const maxVal = Math.max(plannedMinutes, actualMinutes);
  const errorRatio = Math.abs(plannedMinutes - actualMinutes) / maxVal;
  const accuracy = Math.max(0, 1 - errorRatio);
  return Math.round(accuracy * 100);
}

/**
 * Calculates Time Estimation Error for tasks that have paired activity logs.
 * Returns:
 *  - errorPercent: e.g. +22% (underestimated) or -15% (overestimated)
 *  - totalPairedTasks: count of analyzed pairs
 *  - accurateCount: within +/- 15%
 *  - underestimatedCount: actual > planned * 1.15
 *  - overestimatedCount: actual < planned * 0.85
 */
export function calculateTimeEstimationError(
  tasks: Task[],
  logs: ActivityLog[]
): {
  errorPercent: number;
  totalPairedTasks: number;
  accurateCount: number;
  underestimatedCount: number;
  overestimatedCount: number;
  avgOverrunMinutes: number;
} {
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  // Aggregate logs per task
  const taskActuals = new Map<string, number>();
  logs.forEach((log) => {
    if (log.taskId) {
      taskActuals.set(log.taskId, (taskActuals.get(log.taskId) || 0) + log.actualDurationMinutes);
    }
  });

  let totalPlanned = 0;
  let totalActual = 0;
  let accurateCount = 0;
  let underestimatedCount = 0;
  let overestimatedCount = 0;
  let pairedCount = 0;

  taskActuals.forEach((actual, taskId) => {
    const task = taskMap.get(taskId);
    if (task && task.estimatedDurationMinutes > 0) {
      pairedCount++;
      totalPlanned += task.estimatedDurationMinutes;
      totalActual += actual;

      const ratio = actual / task.estimatedDurationMinutes;
      if (ratio >= 0.85 && ratio <= 1.15) {
        accurateCount++;
      } else if (ratio > 1.15) {
        underestimatedCount++;
      } else {
        overestimatedCount++;
      }
    }
  });

  if (pairedCount === 0 || totalPlanned === 0) {
    return {
      errorPercent: 0,
      totalPairedTasks: 0,
      accurateCount: 0,
      underestimatedCount: 0,
      overestimatedCount: 0,
      avgOverrunMinutes: 0,
    };
  }

  const errorPercent = Math.round(((totalActual - totalPlanned) / totalPlanned) * 100);
  const avgOverrunMinutes = Math.round((totalActual - totalPlanned) / pairedCount);

  return {
    errorPercent,
    totalPairedTasks: pairedCount,
    accurateCount,
    underestimatedCount,
    overestimatedCount,
    avgOverrunMinutes,
  };
}

/**
 * Calculates Reality Score (0-100) using deterministic weighted components:
 * - 40% Planning Accuracy
 * - 35% Task Completion Rate
 * - 25% Estimation Caliber (tasks within +/- 15% bounds)
 */
export function calculateRealityScore(
  tasks: Task[],
  logs: ActivityLog[],
  previousPeriodTasks: Task[] = [],
  previousPeriodLogs: ActivityLog[] = []
): RealityScoreDetails {
  if (tasks.length === 0 && logs.length === 0) {
    return {
      score: 0,
      planningAccuracyComponent: 0,
      completionRateComponent: 0,
      estimationCaliberComponent: 0,
      previousPeriodScore: null,
      delta: null,
      description: 'Insufficient activity data to compute your Reality Score. Plan tasks and log time to establish your baseline.',
      qualification: 'Moderate Drift',
    };
  }

  const totalPlannedMinutes = tasks.reduce((acc, t) => acc + (t.status !== 'cancelled' ? t.estimatedDurationMinutes : 0), 0);
  const totalActualMinutes = logs.reduce((acc, l) => acc + l.actualDurationMinutes, 0);

  const planningAcc = calculatePlanningAccuracy(totalPlannedMinutes, totalActualMinutes);
  const completionRate = calculateCompletionRate(tasks);
  const estimationStats = calculateTimeEstimationError(tasks, logs);

  const estimationCaliber =
    estimationStats.totalPairedTasks > 0
      ? Math.round((estimationStats.accurateCount / estimationStats.totalPairedTasks) * 100)
      : planningAcc; // fallback to planning accuracy if no paired logs yet

  const planningAccComponent = (planningAcc / 100) * 40;
  const completionComponent = (completionRate / 100) * 35;
  const estimationComponent = (estimationCaliber / 100) * 25;

  const rawScore = Math.round(planningAccComponent + completionComponent + estimationComponent);
  const score = Math.max(0, Math.min(100, rawScore));

  // Compute previous period if present
  let previousScore: number | null = null;
  let delta: number | null = null;

  if (previousPeriodTasks.length > 0 || previousPeriodLogs.length > 0) {
    const prevPlanned = previousPeriodTasks.reduce(
      (acc, t) => acc + (t.status !== 'cancelled' ? t.estimatedDurationMinutes : 0),
      0
    );
    const prevActual = previousPeriodLogs.reduce((acc, l) => acc + l.actualDurationMinutes, 0);
    const prevAcc = calculatePlanningAccuracy(prevPlanned, prevActual);
    const prevComp = calculateCompletionRate(previousPeriodTasks);
    const prevEst = calculateTimeEstimationError(previousPeriodTasks, previousPeriodLogs);
    const prevCaliber =
      prevEst.totalPairedTasks > 0 ? (prevEst.accurateCount / prevEst.totalPairedTasks) * 100 : prevAcc;

    previousScore = Math.round((prevAcc / 100) * 40 + (prevComp / 100) * 35 + (prevCaliber / 100) * 25);
    delta = score - previousScore;
  }

  let qualification: RealityScoreDetails['qualification'] = 'Moderate Drift';
  let description = '';

  if (score >= 85) {
    qualification = 'Optimal Alignment';
    description =
      'High synchronicity between intended agenda and actual execution. Time estimates are tightly bounded.';
  } else if (score >= 70) {
    qualification = 'Solid Execution';
    description =
      'Strong daily follow-through with manageable variance in task estimations and schedule adherence.';
  } else if (score >= 50) {
    qualification = 'Moderate Drift';
    description =
      'Notable variance observed between scheduled hours and actual execution, commonly driven by underestimation.';
  } else {
    qualification = 'Significant Gap';
    description =
      'Large divergence between planned obligations and actual logged time. Consider scheduling smaller atomic blocks.';
  }

  return {
    score,
    planningAccuracyComponent: Math.round(planningAccComponent),
    completionRateComponent: Math.round(completionComponent),
    estimationCaliberComponent: Math.round(estimationComponent),
    previousPeriodScore: previousScore,
    delta,
    description,
    qualification,
  };
}

/**
 * Builds day-by-day metrics for a given date range
 */
export function buildDailyMetrics(
  dates: string[],
  tasks: Task[],
  logs: ActivityLog[]
): DayMetric[] {
  return dates.map((dateStr) => {
    const dayTasks = tasks.filter((t) => t.plannedDate === dateStr && t.status !== 'cancelled');
    const dayLogs = logs.filter((l) => l.activityDate === dateStr);

    const plannedMinutes = dayTasks.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);
    const actualMinutes = dayLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
    const unplannedMinutes = dayLogs
      .filter((l) => l.isUnplanned)
      .reduce((sum, l) => sum + l.actualDurationMinutes, 0);

    const completedTasks = dayTasks.filter((t) => t.status === 'completed').length;
    const totalPlannedTasks = dayTasks.length;
    const completionRate = totalPlannedTasks > 0 ? Math.round((completedTasks / totalPlannedTasks) * 100) : 0;
    const planningAccuracy = calculatePlanningAccuracy(plannedMinutes, actualMinutes);
    const gapMinutes = actualMinutes - plannedMinutes;

    // Formatting date label: e.g. "Mon 14"
    const d = new Date(dateStr + 'T00:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

    return {
      date: dateStr,
      dayLabel,
      plannedMinutes,
      actualMinutes,
      completedTasks,
      totalPlannedTasks,
      completionRate,
      planningAccuracy,
      gapMinutes,
      unplannedMinutes,
    };
  });
}

/**
 * Calculates category breakdown comparing planned vs actual
 */
export function calculateCategoryBreakdown(
  tasks: Task[],
  logs: ActivityLog[]
): {
  category: CategoryType;
  plannedMinutes: number;
  actualMinutes: number;
  accuracy: number;
  gapMinutes: number;
  taskCount: number;
}[] {
  const categories: CategoryType[] = [
    'Deep Work',
    'Meetings & Syncs',
    'Creative & Design',
    'Learning & Research',
    'Admin & Operations',
    'Health & Personal',
  ];

  return categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat && t.status !== 'cancelled');
    const catLogs = logs.filter((l) => l.category === cat);

    const plannedMinutes = catTasks.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);
    const actualMinutes = catLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
    const accuracy = calculatePlanningAccuracy(plannedMinutes, actualMinutes);
    const gapMinutes = actualMinutes - plannedMinutes;

    return {
      category: cat,
      plannedMinutes,
      actualMinutes,
      accuracy,
      gapMinutes,
      taskCount: catTasks.length,
    };
  });
}

/**
 * Deterministic Rule-Based Pattern & Insight Detector
 */
export function detectPatterns(
  tasks: Task[],
  logs: ActivityLog[],
  workspace: 'demo' | 'personal'
): Insight[] {
  const insights: Insight[] = [];
  const lookbackPeriod = 'Last 14 days';

  if (tasks.length === 0 && logs.length === 0) {
    return [];
  }

  // 1. Estimation Error Pattern (Overrun / Underrun)
  const estStats = calculateTimeEstimationError(tasks, logs);
  if (estStats.totalPairedTasks >= 3) {
    if (estStats.errorPercent > 15) {
      insights.push({
        id: `${workspace}-pattern-est-under`,
        workspace,
        type: 'estimation_bias',
        title: 'Systematic Time Underestimation',
        observation: `Across ${estStats.totalPairedTasks} recorded tasks, actual execution took on average ${estStats.errorPercent}% longer than your initial estimates (${estStats.avgOverrunMinutes}m overrun per task).`,
        evidence: `Empirical sample: ${estStats.underestimatedCount} tasks exceeded +15% duration threshold, while ${estStats.accurateCount} tasks were within accurate bounds.`,
        observationPeriod: lookbackPeriod,
        confidence: estStats.totalPairedTasks >= 6 ? 'high' : 'medium',
        metricValue: `+${estStats.errorPercent}%`,
        suggestedExperiment: 'Apply an automatic 20% temporal buffer to upcoming tasks and monitor completion drift.',
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    } else if (estStats.errorPercent < -15) {
      insights.push({
        id: `${workspace}-pattern-est-over`,
        workspace,
        type: 'estimation_bias',
        title: 'Cautious Planning Overestimation',
        observation: `Actual time spent is ${Math.abs(estStats.errorPercent)}% less than scheduled, suggesting surplus buffers in task estimates.`,
        evidence: `Sample size of ${estStats.totalPairedTasks} paired records shows ${estStats.overestimatedCount} tasks finished significantly under allotted time.`,
        observationPeriod: lookbackPeriod,
        confidence: 'medium',
        metricValue: `${estStats.errorPercent}%`,
        suggestedExperiment: 'Attempt tightening timeboxes on familiar tasks to prevent Parkinson’s Law dilation.',
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Category Drift Pattern
  const categories = calculateCategoryBreakdown(tasks, logs);
  const significantCategories = categories.filter((c) => c.plannedMinutes > 120 || c.actualMinutes > 120);
  if (significantCategories.length > 0) {
    // Find category with largest positive gap (underestimated actual time)
    const sortedGaps = [...significantCategories].sort((a, b) => b.gapMinutes - a.gapMinutes);
    const worstGap = sortedGaps[0];
    if (worstGap && worstGap.gapMinutes > 60) {
      insights.push({
        id: `${workspace}-pattern-category-${worstGap.category.replace(/\s+/g, '-').toLowerCase()}`,
        workspace,
        type: 'category_drift',
        title: `${worstGap.category}: Greatest Scheduling Gap`,
        observation: `${worstGap.category} accumulated ${formatDuration(worstGap.gapMinutes)} more actual time than originally budgeted (${formatDuration(worstGap.actualMinutes)} actual vs ${formatDuration(worstGap.plannedMinutes)} planned).`,
        evidence: `Analyzed ${worstGap.taskCount} tasks in ${worstGap.category}. Planning accuracy is currently ${worstGap.accuracy}%.`,
        observationPeriod: lookbackPeriod,
        confidence: worstGap.taskCount >= 4 ? 'high' : 'medium',
        metricValue: `+${formatDuration(worstGap.gapMinutes)}`,
        suggestedExperiment: `Schedule ${worstGap.category} sessions with dedicated focus blocks free from interruptions.`,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Postponement Loop Pattern
  const postponedTasks = tasks.filter((t) => (t.postponeCount || 0) >= 2 || t.status === 'postponed');
  if (postponedTasks.length >= 2) {
    insights.push({
      id: `${workspace}-pattern-postponement`,
      workspace,
      type: 'postponement_loop',
      title: 'Recurring Task Postponement',
      observation: `${postponedTasks.length} tasks have been deferred or rescheduled multiple times without completion.`,
      evidence: `Repeated postponement detected on items including "${postponedTasks[0].title.slice(0, 32)}...".`,
      observationPeriod: lookbackPeriod,
      confidence: 'high',
      metricValue: `${postponedTasks.length} tasks`,
      suggestedExperiment: 'Deconstruct deferred tasks into 20-minute micro-actions or deliberately drop non-essential items.',
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Interruption Drag Pattern
  const logsWithInterruption = logs.filter((l) => (l.interruptionCount || 0) > 0 || !!l.interruptionNotes);
  if (logsWithInterruption.length >= 3) {
    const totalInterruptionMinutes = logsWithInterruption.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
    insights.push({
      id: `${workspace}-pattern-interruption`,
      workspace,
      type: 'interruption_drag',
      title: 'Interruption Overhead',
      observation: `Context switches or logged interruptions affected ${logsWithInterruption.length} recorded work sessions, correlating with extended completion durations.`,
      evidence: `${logsWithInterruption.length} sessions logged distinct interruptions, encompassing ${formatDuration(totalInterruptionMinutes)} of execution.`,
      observationPeriod: lookbackPeriod,
      confidence: 'medium',
      metricValue: `${logsWithInterruption.length} sessions`,
      suggestedExperiment: 'Batch asynchronous communications into two designated 25-minute windows daily.',
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Day of Week Execution Pattern
  const dayOfWeekMap: Record<number, { completed: number; total: number }> = {};
  tasks.forEach((t) => {
    if (t.status === 'cancelled') return;
    const day = new Date(t.plannedDate + 'T00:00:00').getDay(); // 0 is Sun, 1 is Mon...
    if (!dayOfWeekMap[day]) dayOfWeekMap[day] = { completed: 0, total: 0 };
    dayOfWeekMap[day].total++;
    if (t.status === 'completed') dayOfWeekMap[day].completed++;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let bestDayIndex = -1;
  let bestDayRate = -1;
  Object.entries(dayOfWeekMap).forEach(([dayStr, stats]) => {
    if (stats.total >= 3) {
      const rate = stats.completed / stats.total;
      if (rate > bestDayRate) {
        bestDayRate = rate;
        bestDayIndex = Number(dayStr);
      }
    }
  });

  if (bestDayIndex !== -1 && bestDayRate >= 0.75) {
    const dayName = dayNames[bestDayIndex];
    insights.push({
      id: `${workspace}-pattern-peak-day`,
      workspace,
      type: 'peak_performance_day',
      title: `${dayName} Peak Velocity`,
      observation: `${dayName}s demonstrate your highest task completion rate at ${Math.round(bestDayRate * 100)}%.`,
      evidence: `Derived from ${dayOfWeekMap[bestDayIndex].completed} completed tasks out of ${dayOfWeekMap[bestDayIndex].total} planned across ${dayName}s.`,
      observationPeriod: lookbackPeriod,
      confidence: 'medium',
      metricValue: `${Math.round(bestDayRate * 100)}%`,
      suggestedExperiment: `Front-load complex deep-work initiatives onto ${dayName} when follow-through is highest.`,
      dismissed: false,
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}
