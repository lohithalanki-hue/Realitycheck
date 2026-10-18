import React from 'react';
import { motion, Variants } from 'motion/react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Square,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { MiniSparkline } from '../components/charts/MiniSparkline';
import { PlannedVsActualChart } from '../components/charts/PlannedVsActualChart';
import { RealityScoreRing } from '../components/charts/RealityScoreRing';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/ui/CategoryBadge';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { useApp } from '../context/AppContext';
import {
  buildDailyMetrics,
  calculateCompletionRate,
  calculatePlanningAccuracy,
  formatDuration,
} from '../lib/analytics/gapEngine';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
};

export const OverviewPage: React.FC = () => {
  const {
    tasks,
    logs,
    selectedDate,
    realityScore,
    setIsScoreModalOpen,
    setIsTaskModalOpen,
    setIsLogModalOpen,
    setEditingTask,
    setPreselectedLogTask,
    startTimer,
    setTaskStatus,
    activeTimer,
    insights,
    voteInsight,
    preferences,
  } = useApp();

  const dates14: string[] = [];
  const base = new Date(selectedDate + 'T00:00:00Z');
  for (let i = 13; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    dates14.push(d.toISOString().split('T')[0]);
  }
  const dailyMetrics = buildDailyMetrics(dates14, tasks, logs);

  const todayTasks = tasks.filter((t) => t.plannedDate === selectedDate && t.status !== 'cancelled');
  const todayLogs = logs.filter((l) => l.activityDate === selectedDate);

  const todayPlannedMins = todayTasks.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);
  const todayActualMins = todayLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
  const todayCompletionRate = calculateCompletionRate(todayTasks);
  const todayAccuracy = calculatePlanningAccuracy(todayPlannedMins, todayActualMins);

  const last7Days = dailyMetrics.slice(-7);
  const plannedTrend = last7Days.map((d) => d.plannedMinutes);
  const actualTrend = last7Days.map((d) => d.actualMinutes);
  const completionTrend = last7Days.map((d) => d.completionRate);
  const accuracyTrend = last7Days.map((d) => d.planningAccuracy);

  const activeInsight = insights.find((i) => !i.dismissed) || {
    id: 'default-insight',
    title: 'Deep Work Estimation Bias',
    observation: 'You underestimate deep work tasks by approximately 32% across complex architectural blocks.',
    evidence: 'Measured across 8 engineering tasks over the past 14 days.',
    suggestedExperiment: 'Add a 20-minute buffer to deep work blocks before locking daily schedule.',
    metricValue: '+32%',
    confidence: 'high' as const,
    observationPeriod: 'Last 14 days',
    dismissed: false,
    workspace: 'demo' as const,
    type: 'estimation_bias' as const,
    createdAt: new Date().toISOString(),
  };

  const sortedTodayTasks = [...todayTasks].sort((a, b) => {
    const timeA = a.scheduledStartTime || '99:99';
    const timeB = b.scheduledStartTime || '99:99';
    return timeA.localeCompare(timeB);
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Top Greeting */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Execution Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md px-2.5 py-0.5 text-[11px] font-mono text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              Real-time sync
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Intention calibration for{' '}
            <span className="text-white font-medium">
              {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Hero Section: The Reality Score & Gap Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Reality Score Card (5 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <SpotlightCard className="p-6 h-full flex flex-col justify-between" enableTilt={true}>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    The Reality Score
                  </span>
                </div>
                <button
                  onClick={() => setIsScoreModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:underline transition-all"
                >
                  <span>Formula breakdown</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {/* Circular Animated SVG Ring */}
              <div className="my-5 flex flex-col sm:flex-row items-center gap-6">
                <RealityScoreRing score={realityScore.score} />

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                    <span>{realityScore.qualification}</span>
                  </div>

                  {realityScore.delta !== null && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-xs font-mono">
                      <span className="text-white font-bold">
                        {realityScore.delta >= 0 ? `+${realityScore.delta}` : realityScore.delta} pts
                      </span>
                      <span className="text-zinc-500 text-[11px]">vs prior 7 days</span>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-zinc-300 line-clamp-3">
                    {realityScore.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdown Mini Bar */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/[0.08] pt-3.5 text-center">
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400">Accuracy (40%)</div>
                <div className="font-mono text-xs font-bold text-white mt-0.5">
                  <AnimatedNumber value={realityScore.planningAccuracyComponent} />/40
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400">Completion (35%)</div>
                <div className="font-mono text-xs font-bold text-white mt-0.5">
                  <AnimatedNumber value={realityScore.completionRateComponent} />/35
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-zinc-400">Estimation (25%)</div>
                <div className="font-mono text-xs font-bold text-white mt-0.5">
                  <AnimatedNumber value={realityScore.estimationCaliberComponent} />/25
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* 4 Key Metric Cards (7 cols) with Mini Sparklines & Animated Count-up */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Planned Time */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">Planned Time</span>
                  <Clock className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={todayPlannedMins} format="hours-mins" />
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      / {(preferences.dailyAvailableMinutes / 60).toFixed(0)}h budget
                    </span>
                  </div>
                  <MiniSparkline data={plannedTrend.length > 1 ? plannedTrend : [60, 120, 180, 240, 280]} color="#FFFFFF" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                <span>Committed Bandwidth</span>
                <span className="font-mono font-bold text-white">
                  {Math.round((todayPlannedMins / preferences.dailyAvailableMinutes) * 100)}%
                </span>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 2: Actual Time */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">Actual Time Logged</span>
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={todayActualMins} format="hours-mins" />
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {todayActualMins - todayPlannedMins >= 0
                        ? `+${formatDuration(todayActualMins - todayPlannedMins)}`
                        : formatDuration(todayActualMins - todayPlannedMins)}
                    </span>
                  </div>
                  <MiniSparkline data={actualTrend.length > 1 ? actualTrend : [45, 90, 150, 200, 260]} color="#FFFFFF" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                <span>Logged Sessions</span>
                <span className="font-mono font-bold text-white">
                  {todayLogs.length} verified logs
                </span>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 3: Completion Rate */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">Task Completion Rate</span>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={todayCompletionRate} format="percent" />
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      ({todayTasks.filter((t) => t.status === 'completed').length}/{todayTasks.length} tasks)
                    </span>
                  </div>
                  <MiniSparkline data={completionTrend.length > 1 ? completionTrend : [50, 60, 75, 80, 85]} color="#FFFFFF" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                <span>Execution Follow-through</span>
                <span className="font-mono font-bold text-white">
                  {todayCompletionRate >= 75 ? 'Optimal' : 'Active Drift'}
                </span>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 4: Planning Accuracy */}
          <motion.div variants={itemVariants}>
            <SpotlightCard className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">Planning Accuracy</span>
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={todayAccuracy} format="percent" />
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {todayAccuracy >= 80 ? 'Calibrated' : 'Variance'}
                    </span>
                  </div>
                  <MiniSparkline data={accuracyTrend.length > 1 ? accuracyTrend : [65, 70, 72, 85, 88]} color="#FFFFFF" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                <span>Variance Threshold</span>
                <span className="font-mono font-bold text-white">
                  {todayAccuracy >= 80 ? '±10% Bound' : '>15% Overrun'}
                </span>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>

      {/* Planned vs Actual Dynamic Chart */}
      <motion.div variants={itemVariants}>
        <PlannedVsActualChart data={dailyMetrics} />
      </motion.div>

      {/* Two Column Section: Today's Timeline + Insight of the Day */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Execution Timeline (8 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
          <div className="crystal-panel rounded-2xl p-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Today's Execution Timeline
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedTodayTasks.length} commitments planned for {selectedDate}
                </p>
              </div>
            </div>

            {sortedTodayTasks.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/40 text-center p-6">
                <p className="text-xs font-medium text-zinc-400">No scheduled tasks for this date.</p>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200"
                >
                  <Plus className="h-3 w-3" />
                  Schedule First Task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedTodayTasks.map((task) => {
                  const isTimerActiveForTask = activeTimer?.taskId === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.005 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-3.5 hover:border-white/25 hover:bg-white/[0.06] transition-all"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1 flex flex-col items-center">
                          <button
                            onClick={() =>
                              setTaskStatus(
                                task.id,
                                task.status === 'completed' ? 'planned' : 'completed'
                              )
                            }
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              task.status === 'completed'
                                ? 'border-white bg-white text-black'
                                : 'border-zinc-700 bg-black hover:border-white'
                            }`}
                          >
                            {task.status === 'completed' && <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold truncate ${
                                task.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />
                          </div>

                          <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                            <CategoryBadge category={task.category} size="sm" />
                            {task.scheduledStartTime && (
                              <span className="font-mono text-[11px] text-zinc-300">
                                @{task.scheduledStartTime}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-zinc-300">
                              Planned: {formatDuration(task.estimatedDurationMinutes)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isTimerActiveForTask ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startTimer(task.title, task.category, task.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white hover:border-white/40 hover:bg-white/10"
                            title="Start Stopwatch"
                          >
                            <Play className="h-3 w-3" />
                            <span>Track</span>
                          </motion.button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-mono font-bold text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Active
                          </span>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPreselectedLogTask(task);
                            setIsLogModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/25"
                        >
                          <Zap className="h-3 w-3 fill-white" />
                          <span>Log Time</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Insight of the Day (4 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <SpotlightCard className="p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Insight of the Day</h3>
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  Empirical Rule
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/20 bg-white/[0.05] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{activeInsight.title}</span>
                    <span className="font-mono text-xs font-black text-white">
                      {activeInsight.metricValue}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                    {activeInsight.observation}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-200 block mb-0.5 font-mono text-[10px] uppercase">
                    Empirical Evidence ({activeInsight.observationPeriod}):
                  </span>
                  {activeInsight.evidence}
                </div>

                <div className="rounded-xl border border-white/20 bg-white/[0.04] p-3 text-[11px] text-zinc-300">
                  <span className="font-bold text-white block mb-0.5 font-mono text-[10px] uppercase">
                    Suggested Tactical Action:
                  </span>
                  {activeInsight.suggestedExperiment}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-zinc-500 text-[11px]">Helpful observation?</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => voteInsight(activeInsight.id, 'helpful')}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => voteInsight(activeInsight.id, 'unhelpful')}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </motion.div>
  );
};
