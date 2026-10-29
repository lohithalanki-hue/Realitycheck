import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDown,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  Crosshair,
  Flame,
  ListTodo,
  Play,
  Plus,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Wand2,
  Zap,
} from 'lucide-react';
import { DayFlowTimeline } from '../components/charts/DayFlowTimeline';
import { PlannedVsActualChart } from '../components/charts/PlannedVsActualChart';
import { RealityScoreRing } from '../components/charts/RealityScoreRing';
import { CategoryBadge, PriorityBadge } from '../components/ui/CategoryBadge';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ScrollStageIndicator, Stage } from '../components/ui/ScrollStageIndicator';
import { useApp } from '../context/AppContext';
import {
  buildDailyMetrics,
  calculateCompletionRate,
  calculateHonestEstimate,
  calculatePlanningAccuracy,
  calculateWorkdayForecast,
  formatDuration,
  parseNaturalTaskInput,
} from '../lib/analytics/gapEngine';
import { CategoryType, PriorityType, Task } from '../types';

const OVERVIEW_STAGES: Stage[] = [
  { id: 'chapter-hero', number: '01', label: 'Reality Score' },
  { id: 'chapter-targets', number: '02', label: 'Goal Reality Check' },
  { id: 'chapter-balance', number: '03', label: 'Activity Balance' },
  { id: 'chapter-tasks', number: '04', label: 'To-Do Action Hub' },
  { id: 'chapter-timeline', number: '05', label: 'Timeline Flow' },
  { id: 'chapter-wave', number: '06', label: 'Reality Wave' },
  { id: 'chapter-insights', number: '07', label: 'Habit Insights' },
];

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
    addTask,
    theme,
  } = useApp();

  // Quick task add inline state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDuration, setQuickDuration] = useState(45);
  const [quickCategory, setQuickCategory] = useState<CategoryType>('Deep Work');
  const [quickPriority, setQuickPriority] = useState<PriorityType>('medium');

  // Filter for Goal & Target Reality Check module
  const [targetFilter, setTargetFilter] = useState<'all' | 'priority' | 'pending' | 'completed'>('all');

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

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const pendingTargetsCount = Math.max(0, todayTasks.length - completedCount);
  const timeDifferenceMins = todayActualMins - todayPlannedMins;

  // Key priority goals & target statistics
  const priorityTargets = todayTasks.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  );
  const completedPriorityTargets = priorityTargets.filter(
    (t) => t.status === 'completed'
  ).length;

  // Reality forecast calculation
  const workdayForecast = calculateWorkdayForecast(todayTasks, todayLogs, 1.18);

  const activeInsight = insights.find((i) => !i.dismissed) || {
    id: 'default-insight',
    title: 'Deep Work Follow-Through',
    observation: 'You complete 85% of your scheduled deep work targets when scheduled before 2:00 PM.',
    evidence: 'Based on your last 14 days of tracked activity to-dos.',
    suggestedExperiment: 'Place your #1 priority goal in the morning block for maximum target follow-through.',
    metricValue: '85% Target Rate',
    confidence: 'high' as const,
    observationPeriod: 'Last 14 days',
    dismissed: false,
    workspace: 'personal' as const,
    type: 'completion_velocity' as const,
    createdAt: new Date().toISOString(),
  };

  const sortedTodayTasks = [...todayTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const timeA = a.scheduledStartTime || '99:99';
    const timeB = b.scheduledStartTime || '99:99';
    return timeA.localeCompare(timeB);
  });

  // Filtered tasks for the Goal Reality Check section
  const targetCheckTasks = sortedTodayTasks.filter((task) => {
    if (targetFilter === 'priority') {
      return task.priority === 'critical' || task.priority === 'high';
    }
    if (targetFilter === 'pending') {
      return task.status !== 'completed';
    }
    if (targetFilter === 'completed') {
      return task.status === 'completed';
    }
    return true;
  });

  // Natural language auto-parser on input
  const handleQuickTitleChange = (val: string) => {
    setQuickTitle(val);
    if (val.length > 5) {
      const parsed = parseNaturalTaskInput(val);
      if (parsed.durationMinutes && parsed.durationMinutes !== quickDuration) {
        setQuickDuration(parsed.durationMinutes);
      }
      if (parsed.category && parsed.category !== quickCategory) {
        setQuickCategory(parsed.category);
      }
      if (parsed.priority && parsed.priority !== quickPriority) {
        setQuickPriority(parsed.priority);
      }
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const parsed = parseNaturalTaskInput(quickTitle.trim());

    addTask({
      title: parsed.title || quickTitle.trim(),
      category: quickCategory || parsed.category,
      plannedDate: selectedDate,
      scheduledStartTime: parsed.startTime,
      estimatedDurationMinutes: Number(quickDuration) || parsed.durationMinutes || 45,
      priority: parsed.priority || quickPriority || 'medium',
      status: 'planned',
    });
    setQuickTitle('');
  };

  const applyTemplate = (
    templateTitle: string,
    templateCategory: CategoryType,
    templateMins: number,
    priority: PriorityType = 'medium'
  ) => {
    addTask({
      title: templateTitle,
      category: templateCategory,
      plannedDate: selectedDate,
      estimatedDurationMinutes: templateMins,
      priority,
      status: 'planned',
    });
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative space-y-44 sm:space-y-56 pb-48">
      {/* Floating chapter navigation rail */}
      <ScrollStageIndicator stages={OVERVIEW_STAGES} />

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 1: CINEMATIC HERO (Target Reality Alignment)          */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-hero" className="relative pt-6 sm:pt-16 text-center min-h-[75vh] flex flex-col justify-center">
        <ScrollReveal mode="inView" duration={1.8} yOffset={40} blurAmount={12}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-2xl mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-pulse" />
            <span className="font-medium">{formattedDate}</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-zinc-400">Personal Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Are you hitting the goals and activity targets you planned?
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            RealityCheck holds an honest mirror to your daily to-dos, activities, and targets — comparing what you committed to do against what was actually completed.
          </p>
        </ScrollReveal>

        {/* Central Reality Alignment Hero Card (White Ring) */}
        <ScrollReveal mode="inView" delay={0.25} duration={1.9} yOffset={60} blurAmount={14}>
          <div className="crystal-panel relative max-w-2xl mx-auto mt-12 rounded-3xl p-7 sm:p-9 backdrop-blur-3xl text-left border border-white/20 shadow-[0_35px_120px_rgba(0,0,0,0.95)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-7 sm:gap-9">
              {/* Animated White Ring */}
              <div className="shrink-0">
                <RealityScoreRing score={realityScore.score} size={155} strokeWidth={10} />
              </div>

              {/* Score Narrative */}
              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Target Reality Score
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                    {realityScore.qualification}
                  </span>
                </div>

                <div className="text-2xl font-black text-white">
                  {todayTasks.length === 0
                    ? 'No to-do targets scheduled for today yet.'
                    : completedCount === todayTasks.length
                    ? '100% Reality Check! All daily targets completed.'
                    : completedCount > 0
                    ? `${completedCount} of ${todayTasks.length} activity targets completed.`
                    : 'Your daily targets are waiting for you to execute.'}
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {todayTasks.length === 0
                    ? "You haven't committed to any to-do targets for today yet. Add your first goal below to start your reality check!"
                    : `You have completed ${completedCount} of ${todayTasks.length} target to-dos (${todayCompletionRate}% follow-through) with ${
                        priorityTargets.length > 0
                          ? `${completedPriorityTargets} of ${priorityTargets.length} key goals nailed`
                          : 'steady progress'
                      }. Total active effort: ${formatDuration(todayActualMins)} logged.`}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => setIsScoreModalOpen(true)}
                    className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    How is this reality score calculated?
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Scroll invitation indicator */}
        <ScrollReveal mode="inView" delay={0.5} duration={1.5} yOffset={25}>
          <div className="mt-16 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
            <span className="tracking-widest uppercase font-mono text-[10px] text-zinc-400">
              Scroll down to run your target reality check
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowDown className="h-4 w-4 text-zinc-400" />
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 2: GOAL & TARGET REALITY CHECK (Interactive To-Do Hub)*/}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-targets" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-white/40" />
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Chapter 01
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Goal & Target Reality Check</span>
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Check off your activity targets as you accomplish them in reality. Each completed to-do directly fuels your Reality Score and closes your target gap.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Goal / Target</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Reality Check Status Banner with Live Progress Bar */}
        <ScrollReveal mode="inView" delay={0.1} duration={1.7} yOffset={60}>
          <div className="crystal-panel relative overflow-hidden rounded-3xl p-6 sm:p-7 backdrop-blur-3xl border border-white/20 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black font-bold text-xs">
                    <Target className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                    Daily Reality Check Status
                  </span>
                </div>

                <div className="text-lg sm:text-xl font-bold text-white">
                  {todayTasks.length === 0 ? (
                    'No daily targets committed yet.'
                  ) : completedCount === todayTasks.length ? (
                    '🎉 Target Reality Check: Mastered! All daily goal targets achieved.'
                  ) : todayCompletionRate >= 50 ? (
                    `⚡ Target Reality Check: Strong pace! ${completedCount} of ${todayTasks.length} activity targets completed.`
                  ) : (
                    `⏳ Target Reality Check: ${pendingTargetsCount} targets remaining to achieve your daily commitment.`
                  )}
                </div>

                {/* Progress track */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>
                      {completedCount} of {todayTasks.length} to-dos completed
                    </span>
                    <span className="font-bold text-white">{todayCompletionRate}% Reality Rate</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${todayCompletionRate}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-white shadow-[0_0_12px_#fff]"
                    />
                  </div>
                </div>
              </div>

              {/* Target Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:border-l md:border-white/10 md:pl-6 shrink-0">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Key Goals</span>
                  <span className="font-mono text-lg font-black text-white mt-0.5 block">
                    {completedPriorityTargets}/{priorityTargets.length}
                  </span>
                  <span className="text-[10px] text-zinc-500">Priority targets</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Pending</span>
                  <span className="font-mono text-lg font-black text-white mt-0.5 block">
                    {pendingTargetsCount}
                  </span>
                  <span className="text-[10px] text-zinc-500">Remaining to-dos</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-3 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Logged Effort</span>
                  <span className="font-mono text-lg font-black text-white mt-0.5 block">
                    {formatDuration(todayActualMins)}
                  </span>
                  <span className="text-[10px] text-zinc-500">Active work</span>
                </div>
              </div>
            </div>

            {/* Filter Pills for Targets */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-zinc-500 font-mono text-[11px] mr-1">Filter Targets:</span>
                <button
                  onClick={() => setTargetFilter('all')}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    targetFilter === 'all'
                      ? theme === 'light'
                        ? 'bg-zinc-900 text-white font-bold shadow-sm'
                        : 'bg-white text-black font-bold shadow-sm'
                      : theme === 'light'
                      ? 'border border-zinc-200 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                      : 'border border-white/15 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All Activities ({todayTasks.length})
                </button>
                <button
                  onClick={() => setTargetFilter('priority')}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    targetFilter === 'priority'
                      ? theme === 'light'
                        ? 'bg-zinc-900 text-white font-bold shadow-sm'
                        : 'bg-white text-black font-bold shadow-sm'
                      : theme === 'light'
                      ? 'border border-zinc-200 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                      : 'border border-white/15 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🎯 Priority Goals ({priorityTargets.length})
                </button>
                <button
                  onClick={() => setTargetFilter('pending')}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    targetFilter === 'pending'
                      ? theme === 'light'
                        ? 'bg-zinc-900 text-white font-bold shadow-sm'
                        : 'bg-white text-black font-bold shadow-sm'
                      : theme === 'light'
                      ? 'border border-zinc-200 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                      : 'border border-white/15 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ⏳ Pending ({pendingTargetsCount})
                </button>
                <button
                  onClick={() => setTargetFilter('completed')}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    targetFilter === 'completed'
                      ? theme === 'light'
                        ? 'bg-zinc-900 text-white font-bold shadow-sm'
                        : 'bg-white text-black font-bold shadow-sm'
                      : theme === 'light'
                      ? 'border border-zinc-200 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                      : 'border border-white/15 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ✅ Done ({completedCount})
                </button>
              </div>

              {pendingTargetsCount > 0 && (
                <span className="text-zinc-400 font-mono text-[11px]">
                  {pendingTargetsCount} {pendingTargetsCount === 1 ? 'target' : 'targets'} left for today
                </span>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Target Cards Interactive Checklist */}
        <div className="space-y-3.5">
          {targetCheckTasks.length === 0 ? (
            <ScrollReveal mode="inView" duration={1.6} yOffset={30}>
              <div className="crystal-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-12 text-center backdrop-blur-2xl">
                <Target className="h-8 w-8 text-zinc-500 mb-2" />
                <p className="text-sm font-bold text-white">
                  {targetFilter === 'completed'
                    ? 'No targets completed yet today'
                    : targetFilter === 'pending'
                    ? 'All targets completed! Outstanding execution!'
                    : 'No targets matching this filter'}
                </p>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  {targetFilter === 'pending'
                    ? 'You have cleared all scheduled commitments. Great job maintaining reality alignment!'
                    : 'Add a new goal target above to build your daily plan.'}
                </p>
              </div>
            </ScrollReveal>
          ) : (
            targetCheckTasks.map((task, index) => {
              const isCompleted = task.status === 'completed';
              const isTimerRunningOnThis = activeTimer?.taskId === task.id;
              const honestCalc = calculateHonestEstimate(
                task.estimatedDurationMinutes,
                task.category,
                tasks,
                logs
              );
              const isKeyTarget = task.priority === 'critical' || task.priority === 'high';

              return (
                <ScrollReveal
                  key={task.id}
                  mode="inView"
                  delay={Math.min(index * 0.08, 0.35)}
                  duration={1.6}
                  yOffset={40}
                  blurAmount={8}
                >
                  <div
                    className={`crystal-panel group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                      isCompleted
                        ? 'border-white/10 bg-white/[0.02] opacity-75'
                        : isKeyTarget
                        ? 'border-white/30 bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.03)]'
                        : 'border-white/15 bg-white/[0.04] hover:border-white/30'
                    }`}
                  >
                    {/* Left: Interactive Checkbox & Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() =>
                          setTaskStatus(task.id, isCompleted ? 'planned' : 'completed')
                        }
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          isCompleted
                            ? 'border-white bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                            : 'border-white/30 bg-black/60 hover:border-white text-transparent'
                        }`}
                        title={isCompleted ? 'Mark as not done' : 'Mark to-do target completed!'}
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-bold truncate ${
                              isCompleted ? 'line-through text-zinc-500' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </span>

                          {isKeyTarget && (
                            <span className="rounded-full bg-white text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm">
                              🎯 Key Target
                            </span>
                          )}

                          <CategoryBadge category={task.category} size="sm" />
                          <PriorityBadge priority={task.priority} />

                          {isCompleted ? (
                            <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Target Met
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                              Target Pending
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1">{task.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          <span className="font-mono text-[11px] text-zinc-300">
                            Planned: {formatDuration(task.estimatedDurationMinutes)}
                          </span>
                          {task.scheduledStartTime && (
                            <span className="font-mono text-[11px] text-zinc-400">
                              @{task.scheduledStartTime}
                            </span>
                          )}
                          {honestCalc.hasAdjustment && !isCompleted && (
                            <span
                              className="font-mono text-[10px] text-zinc-400"
                              title={honestCalc.explanation}
                            >
                              • Honest buffer: {formatDuration(honestCalc.recommendedMinutes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-0 border-zinc-200/80 dark:border-white/10 justify-start sm:justify-end shrink-0">
                      {!isTimerRunningOnThis ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              startTimer(task.title, task.category, task.id, false, 'stopwatch')
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              theme === 'light'
                                ? 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                                : 'border-white/15 bg-white/[0.04] text-white hover:bg-white/15'
                            }`}
                            title="Start Stopwatch"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Stopwatch</span>
                          </button>
                          <button
                            onClick={() =>
                              startTimer(task.title, task.category, task.id, false, 'pomodoro', 25)
                            }
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-mono transition-colors ${
                              theme === 'light'
                                ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
                                : 'border-white/15 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/15'
                            }`}
                            title="Start 25m Pomodoro"
                          >
                            <span>25m Pomo</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold shadow-sm ${
                            theme === 'light'
                              ? 'border-zinc-900 bg-zinc-100 text-zinc-900'
                              : 'border-white/30 bg-white/15 text-white'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full animate-ping ${
                              theme === 'light' ? 'bg-zinc-900' : 'bg-white'
                            }`}
                          />
                          Timer Running
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setPreselectedLogTask(task);
                          setIsLogModalOpen(true);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors shadow-sm ${
                          theme === 'light'
                            ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-black'
                            : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Log completed time"
                      >
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        <span>Log Time</span>
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 3: THE ACTIVITY & TO-DO REALITY BALANCE               */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-balance" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 02
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              The Activity & To-Do Balance
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              An honest, objective comparison of your planned activity targets versus your actual completed to-dos and real hours logged.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Activity Reality Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Target Activities Set */}
          <ScrollReveal mode="inView" delay={0.1} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase font-mono tracking-wider">
                    1. Target Activities
                  </span>
                  <ListTodo className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">
                    <AnimatedNumber value={todayTasks.length} />
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    to-do targets set
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Key goals</span>
                <span className="font-bold text-white">
                  {priorityTargets.length} high priority
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Checked Off & Done */}
          <ScrollReveal mode="inView" delay={0.22} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase font-mono tracking-wider">
                    2. Checked Off & Done
                  </span>
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">
                    <AnimatedNumber value={completedCount} />
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    activities completed
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Key goals met</span>
                <span className="font-bold text-white">
                  {completedPriorityTargets} of {priorityTargets.length} nailed
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Target Reality Follow-Through */}
          <ScrollReveal mode="inView" delay={0.34} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase font-mono tracking-wider">
                    3. Target Reality Rate
                  </span>
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">
                    <AnimatedNumber value={todayCompletionRate} format="percent" />
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    goal completion
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Execution status</span>
                <span className="font-bold text-white">
                  {completedCount === todayTasks.length && todayTasks.length > 0
                    ? 'All targets cleared!'
                    : `${pendingTargetsCount} remaining`}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 4: Activity Reality Gap */}
          <ScrollReveal mode="inView" delay={0.46} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold uppercase font-mono tracking-wider">
                    4. Activity Gap
                  </span>
                  <Crosshair className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">
                    {pendingTargetsCount === 0 && todayTasks.length > 0
                      ? 'Zero Gap'
                      : `${pendingTargetsCount} Left`}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {pendingTargetsCount === 0 ? 'Aligned' : 'Pending to-dos'}
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Active effort</span>
                <span className="font-bold text-white">
                  {formatDuration(todayActualMins)} logged
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Reality Forecast Bar */}
        {todayTasks.length > 0 && (
          <ScrollReveal mode="inView" delay={0.2} duration={1.7} yOffset={40}>
            <div className="crystal-panel rounded-2xl p-4 sm:p-5 backdrop-blur-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Honest Workday Target Forecast
                  </div>
                  <div className="text-sm font-bold text-white">
                    At your current activity pace, you will complete remaining to-do targets around{' '}
                    <span className="underline underline-offset-4 font-mono text-white">
                      {workdayForecast.predictedEndTimeStr}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-mono text-zinc-200">
                  {pendingTargetsCount} targets ({formatDuration(workdayForecast.remainingMinutes)}) remaining effort
                </span>
              </div>
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 4: TO-DO ACTION HUB & QUICK ADD                      */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-tasks" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-white/40" />
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Chapter 03
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                To-Do Action Hub
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Add priority targets naturally (e.g. &quot;Client review 45m high priority at 2pm&quot;) or pick a 1-tap template to commit immediately.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* 1-Tap Quick Templates */}
        <ScrollReveal mode="inView" delay={0.1} duration={1.6} yOffset={30}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">Instant Target Presets:</span>
            <button
              onClick={() => applyTemplate('🎯 Ship Critical Milestone', 'Deep Work', 90, 'critical')}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/20 transition-colors whitespace-nowrap font-bold"
            >
              + 🎯 Critical Milestone (90m)
            </button>
            <button
              onClick={() => applyTemplate('Morning Standup & Sync', 'Meetings & Syncs', 15, 'medium')}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + ⚡ Standup (15m)
            </button>
            <button
              onClick={() => applyTemplate('Deep Focus Architecture Block', 'Deep Work', 90, 'high')}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + 🧠 Deep Flow (90m)
            </button>
            <button
              onClick={() => applyTemplate('Inbox Zero & Team Comms', 'Admin & Operations', 30, 'medium')}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + 📬 Inbox Zero (30m)
            </button>
            <button
              onClick={() => applyTemplate('Recharge Walk & Exercise', 'Health & Personal', 30, 'medium')}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + 🏃 Health & Exercise (30m)
            </button>
          </div>
        </ScrollReveal>

        {/* Quick Natural Language Task Input */}
        <ScrollReveal mode="inView" delay={0.15} duration={1.8} yOffset={60} blurAmount={10}>
          <form
            onSubmit={handleQuickSubmit}
            className="crystal-panel flex flex-col sm:flex-row items-stretch gap-3 rounded-2xl p-3.5 backdrop-blur-2xl border border-white/20 shadow-xl"
          >
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => handleQuickTitleChange(e.target.value)}
              placeholder="What is your next goal or target to-do? Try &quot;Deploy API fixes 45m high priority at 2pm&quot;..."
              className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
            />

            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as CategoryType)}
              className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-white focus:outline-none"
            >
              <option value="Deep Work" className="bg-black text-white">Deep Work</option>
              <option value="Meetings & Syncs" className="bg-black text-white">Meetings & Syncs</option>
              <option value="Creative & Design" className="bg-black text-white">Creative & Design</option>
              <option value="Learning & Research" className="bg-black text-white">Learning & Research</option>
              <option value="Admin & Operations" className="bg-black text-white">Admin & Operations</option>
              <option value="Health & Personal" className="bg-black text-white">Health & Personal</option>
            </select>

            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as PriorityType)}
              className="rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-xs font-semibold text-zinc-200 focus:border-white focus:outline-none"
            >
              <option value="critical" className="bg-black text-white">Critical Target</option>
              <option value="high" className="bg-black text-white">High Target</option>
              <option value="medium" className="bg-black text-white">Medium Target</option>
              <option value="low" className="bg-black text-white">Low Target</option>
            </select>

            <select
              value={quickDuration}
              onChange={(e) => setQuickDuration(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            >
              <option value={15} className="bg-black text-white">15m</option>
              <option value={30} className="bg-black text-white">30m</option>
              <option value={45} className="bg-black text-white">45m</option>
              <option value={60} className="bg-black text-white">1 hour</option>
              <option value={90} className="bg-black text-white">1.5 hours</option>
              <option value={120} className="bg-black text-white">2 hours</option>
            </select>

            <button
              type="submit"
              className={`rounded-xl px-6 py-2.5 text-xs font-black transition-all shrink-0 ${
                theme === 'light'
                  ? 'bg-zinc-900 text-white hover:bg-black shadow-md'
                  : 'bg-white text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
              }`}
            >
              Commit Target
            </button>
          </form>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 5: SYNCHRONIZED ACTIVITY FLOW & TIMELINE             */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-timeline" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 04
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Synchronized Activity Flow
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              An interactive chronological map contrasting when you intended to execute your target to-dos versus where your hours actually went.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal mode="inView" delay={0.15} duration={1.8} yOffset={70} blurAmount={12}>
          <DayFlowTimeline tasks={todayTasks} logs={todayLogs} selectedDate={selectedDate} />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 6: 14-DAY REALITY WAVE                               */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-wave" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 05
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              The 14-Day Reality Wave
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Visualize how your activity targets align with reality over the past 14 days in continuous flow.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal mode="inView" delay={0.2} duration={1.9} yOffset={80} blurAmount={12}>
          <PlannedVsActualChart data={dailyMetrics} />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 7: HELPFUL PERSONAL INSIGHTS & HABITS                */}
      {/* ------------------------------------------------------------- */}
      <section id="chapter-insights" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 06
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Goal & Habit Reality Insights
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Real empirical observations derived from your target execution to help you accomplish your daily commitments with calm confidence.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {/* Main Insight Card */}
          <ScrollReveal mode="inView" delay={0.12} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 sm:p-9 backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col justify-between h-full">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Target Execution Pattern
                    </span>
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-mono font-bold text-white">
                    {activeInsight.metricValue}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">{activeInsight.title}</h3>
                  <p className="mt-2.5 text-sm text-zinc-300 leading-relaxed">
                    {activeInsight.observation}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-zinc-300 space-y-1.5">
                  <span className="font-bold text-white uppercase font-mono text-[10px] block">
                    Actionable Suggestion:
                  </span>
                  <p className="leading-relaxed">{activeInsight.suggestedExperiment}</p>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Was this insight helpful?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => voteInsight(activeInsight.id, 'helpful')}
                    className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Helpful"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => voteInsight(activeInsight.id, 'unhelpful')}
                    className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Habit Building & Consistency Card */}
          <ScrollReveal mode="inView" delay={0.28} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 sm:p-9 backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col justify-between h-full">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black">
                    <Flame className="h-4 w-4 fill-black" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Target Consistency Habit
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Target Execution Discipline</h3>
                  <p className="mt-2.5 text-sm text-zinc-300 leading-relaxed">
                    Checking off your activity targets builds deep momentum. Holding a daily reality check keeps goals grounded in real execution rather than wishful thinking.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  <div className="rounded-xl border border-white/10 bg-black/60 p-4">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">Weekly Target Rate</span>
                    <span className="font-mono text-2xl font-black text-white mt-1 block">85%</span>
                    <span className="text-[10px] text-zinc-500">To-dos completed</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-4">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">Target Reality</span>
                    <span className="font-mono text-2xl font-black text-white mt-1 block">Optimal</span>
                    <span className="text-[10px] text-zinc-500">Commitment caliber</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Keep it up!</span>
                <button
                  onClick={() => {
                    setPreselectedLogTask(null);
                    setIsLogModalOpen(true);
                  }}
                  className={`rounded-xl px-5 py-2.5 text-xs font-black transition-all shadow-sm ${
                    theme === 'light'
                      ? 'bg-zinc-900 text-white hover:bg-black'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  Log an activity now
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};
