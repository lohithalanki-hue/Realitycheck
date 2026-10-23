import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  MessageSquare,
  MoreVertical,
  MoveRight,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/ui/CategoryBadge';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ScrollStageIndicator, Stage } from '../components/ui/ScrollStageIndicator';
import { useApp } from '../context/AppContext';
import {
  calculateHonestEstimate,
  formatDuration,
  parseNaturalTaskInput,
} from '../lib/analytics/gapEngine';
import { ActivityLog, CategoryType, PriorityType, Task, TaskStatus } from '../types';

const PLANNER_STAGES: Stage[] = [
  { id: 'planner-hero', number: '01', label: 'Capacity & Budget' },
  { id: 'planner-controls', number: '02', label: 'Quick Add & Filter' },
  { id: 'planner-schedule', number: '03', label: 'Day Schedule' },
  { id: 'planner-logger', number: '04', label: 'Stopwatch & Logs' },
];

export const PlannerPage: React.FC = () => {
  const {
    tasks,
    logs,
    selectedDate,
    setSelectedDate,
    addTask,
    updateTask,
    deleteTask,
    postponeTask,
    setTaskStatus,
    setIsTaskModalOpen,
    setEditingTask,
    setIsLogModalOpen,
    setPreselectedLogTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    addTimerInterruption,
    finishTimerAndSave,
    discardTimer,
    activeTimer,
    preferences,
    updateLog,
    deleteLog,
  } = useApp();

  // Tab switch between Schedule and Stopwatch/Logs
  const [plannerSubTab, setPlannerSubTab] = useState<'schedule' | 'logger'>('schedule');

  // Filters for Schedule
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<CategoryType>('Deep Work');
  const [quickDuration, setQuickDuration] = useState(60);

  // Focus mode options (Stopwatch vs Pomodoro)
  const [focusModeType, setFocusModeType] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(25);

  // Postpone modal state
  const [postponingTaskId, setPostponingTaskId] = useState<string | null>(null);
  const [postponeTargetDate, setPostponeTargetDate] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00Z');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // Stopwatch state
  const [stopwatchTaskType, setStopwatchTaskType] = useState<'planned' | 'unplanned'>('unplanned');
  const [stopwatchTaskId, setStopwatchTaskId] = useState<string>('');
  const [stopwatchCustomTitle, setStopwatchCustomTitle] = useState('');
  const [stopwatchCategory, setStopwatchCategory] = useState<CategoryType>('Deep Work');

  // Daily budget calculations
  const dayTasks = tasks.filter((t) => t.plannedDate === selectedDate);
  const eligibleDayTasks = dayTasks.filter((t) => t.status !== 'cancelled');

  const totalPlannedMinutes = eligibleDayTasks.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);
  const availableMinutes = preferences.dailyAvailableMinutes || 480;
  const isOverplanned = totalPlannedMinutes > availableMinutes;
  const overageMinutes = totalPlannedMinutes - availableMinutes;

  const filteredTasks = dayTasks.filter((task) => {
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    if (selectedStatusFilter !== 'all' && task.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.scheduledStartTime && b.scheduledStartTime) {
      return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
    }
    if (a.scheduledStartTime) return -1;
    if (b.scheduledStartTime) return 1;
    const priorityWeight: Record<PriorityType, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  // Natural language parsing on quick title change
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
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const parsed = parseNaturalTaskInput(quickTitle.trim());

    addTask({
      title: parsed.title || quickTitle.trim(),
      category: quickCategory || parsed.category,
      plannedDate: selectedDate,
      scheduledStartTime: parsed.startTime,
      estimatedDurationMinutes: Number(quickDuration) || parsed.durationMinutes || 60,
      priority: parsed.priority || 'medium',
      status: 'planned',
    });
    setQuickTitle('');
  };

  const applyTemplate = (templateTitle: string, templateCategory: CategoryType, templateMins: number) => {
    addTask({
      title: templateTitle,
      category: templateCategory,
      plannedDate: selectedDate,
      estimatedDurationMinutes: templateMins,
      priority: 'medium',
      status: 'planned',
    });
  };

  const handleConfirmPostpone = () => {
    if (!postponingTaskId) return;
    postponeTask(postponingTaskId, postponeTargetDate);
    setPostponingTaskId(null);
  };

  const handleStartNewTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (stopwatchTaskType === 'planned') {
      const targetTask = tasks.find((t) => t.id === stopwatchTaskId);
      if (targetTask) {
        startTimer(
          targetTask.title,
          targetTask.category,
          targetTask.id,
          false,
          focusModeType,
          pomodoroMinutes
        );
      }
    } else {
      if (!stopwatchCustomTitle.trim()) return;
      startTimer(
        stopwatchCustomTitle.trim(),
        stopwatchCategory,
        null,
        true,
        focusModeType,
        pomodoroMinutes
      );
      setStopwatchCustomTitle('');
    }
  };

  const formatTimerDigits = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return {
      hours: hrs.toString().padStart(2, '0'),
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative space-y-44 sm:space-y-52 pb-48">
      {/* Chapter navigation rail */}
      <ScrollStageIndicator stages={PLANNER_STAGES} />

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 1: HERO & WORKDAY CAPACITY (Slow Dolby Atmosphere)     */}
      {/* ------------------------------------------------------------- */}
      <section id="planner-hero" className="relative pt-6 sm:pt-16 text-center min-h-[70vh] flex flex-col justify-center">
        <ScrollReveal mode="inView" duration={1.8} yOffset={40} blurAmount={12}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-2xl mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-pulse" />
            <span className="font-medium">{formattedDate}</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-zinc-400">
              {eligibleDayTasks.length} {eligibleDayTasks.length === 1 ? 'Commitment' : 'Commitments'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Plan your hours with calm honesty.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Scheduling within your genuine workday capacity protects you from evening burnout and builds a realistic rhythm.
          </p>

          {/* Sub-tab view toggle pill */}
          <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/[0.04] p-1.5 backdrop-blur-2xl shadow-xl">
            <button
              onClick={() => setPlannerSubTab('schedule')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                plannerSubTab === 'schedule'
                  ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Today's Schedule</span>
            </button>
            <button
              onClick={() => setPlannerSubTab('logger')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                plannerSubTab === 'logger'
                  ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Live Stopwatch & Logs</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Big Workday Capacity Hero Card */}
        <ScrollReveal mode="inView" delay={0.25} duration={1.9} yOffset={60} blurAmount={14}>
          <div className="crystal-panel relative max-w-3xl mx-auto mt-12 rounded-3xl p-7 sm:p-9 backdrop-blur-3xl text-left border border-white/20 shadow-[0_35px_120px_rgba(0,0,0,0.95)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Capacity Ledger
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {formatDuration(totalPlannedMinutes)} scheduled of {formatDuration(availableMinutes)} workday
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-mono font-bold border ${
                      isOverplanned
                        ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                        : 'border-white/20 bg-white/10 text-white'
                    }`}
                  >
                    {isOverplanned
                      ? `Overbooked by ${formatDuration(overageMinutes)}`
                      : `${formatDuration(availableMinutes - totalPlannedMinutes)} buffer remaining`}
                  </span>
                </div>
              </div>

              {/* Visual gauge progress bar */}
              <div className="space-y-2">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-black/60 border border-white/15 p-0.5">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700 shadow-[0_0_12px_#fff]"
                    style={{
                      width: `${Math.min((totalPlannedMinutes / availableMinutes) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>0h Start</span>
                  <span>Target: {availableMinutes / 60}h Working Budget</span>
                  <span>{isOverplanned ? 'Overloaded' : 'Balanced'}</span>
                </div>
              </div>

              {isOverplanned && (
                <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-4 text-xs text-zinc-200 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <p>
                    You have planned more work than your available hours allow today. Consider postponing non-urgent tasks to tomorrow to keep your day calm and realistic.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 2: QUICK PLANNING & SMART FILTERS                    */}
      {/* ------------------------------------------------------------- */}
      <section id="planner-controls" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 02
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Quick Task Creation & Smart Filters
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Add new tasks naturally or slice your day by focus category, priority, or completion status.
            </p>
          </div>
        </ScrollReveal>

        {/* 1-Tap Quick Templates */}
        <ScrollReveal mode="inView" delay={0.1} duration={1.6} yOffset={30}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">Instant Templates:</span>
            <button
              onClick={() => applyTemplate('Morning Standup & Sync', 'Meetings & Syncs', 15)}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + ⚡ Standup (15m)
            </button>
            <button
              onClick={() => applyTemplate('Deep Focus Flow Block', 'Deep Work', 90)}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + 🧠 Deep Flow (90m)
            </button>
            <button
              onClick={() => applyTemplate('Inbox Zero & Team Comms', 'Admin & Operations', 30)}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + 📬 Inbox & Slacks (30m)
            </button>
            <button
              onClick={() => applyTemplate('Recharge Walk & Coffee', 'Health & Personal', 15)}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              + ☕ Recharge Break (15m)
            </button>
          </div>
        </ScrollReveal>

        {/* Quick Add Inline Box */}
        <ScrollReveal mode="inView" delay={0.15} duration={1.8} yOffset={60} blurAmount={10}>
          <form
            onSubmit={handleQuickAdd}
            className="crystal-panel flex flex-col sm:flex-row items-stretch gap-3 rounded-2xl p-3.5 backdrop-blur-2xl border border-white/20 shadow-xl"
          >
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => handleQuickTitleChange(e.target.value)}
                placeholder="What do you want to accomplish? Try &quot;Database failover drill for 1h at 3pm&quot;..."
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
              />
            </div>

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
              value={quickDuration}
              onChange={(e) => setQuickDuration(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            >
              <option value={15} className="bg-black text-white">15m</option>
              <option value={30} className="bg-black text-white">30m</option>
              <option value={45} className="bg-black text-white">45m</option>
              <option value={60} className="bg-black text-white">1h</option>
              <option value={90} className="bg-black text-white">1.5h</option>
              <option value={120} className="bg-black text-white">2h</option>
              <option value={180} className="bg-black text-white">3h</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-6 py-2.5 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </form>
        </ScrollReveal>

        {/* Filter Bar */}
        <ScrollReveal mode="inView" delay={0.25} duration={1.8} yOffset={50} blurAmount={8}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, descriptions, or tags..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3.5 py-2 text-xs text-zinc-300 focus:border-white focus:outline-none"
              >
                <option value="all" className="bg-black text-white">All Categories</option>
                <option value="Deep Work" className="bg-black text-white">Deep Work</option>
                <option value="Meetings & Syncs" className="bg-black text-white">Meetings & Syncs</option>
                <option value="Creative & Design" className="bg-black text-white">Creative & Design</option>
                <option value="Learning & Research" className="bg-black text-white">Learning & Research</option>
                <option value="Admin & Operations" className="bg-black text-white">Admin & Operations</option>
                <option value="Health & Personal" className="bg-black text-white">Health & Personal</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3.5 py-2 text-xs text-zinc-300 focus:border-white focus:outline-none"
              >
                <option value="all" className="bg-black text-white">All Priorities</option>
                <option value="critical" className="bg-black text-white">Critical</option>
                <option value="high" className="bg-black text-white">High</option>
                <option value="medium" className="bg-black text-white">Medium</option>
                <option value="low" className="bg-black text-white">Low</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3.5 py-2 text-xs text-zinc-300 focus:border-white focus:outline-none"
              >
                <option value="all" className="bg-black text-white">All Statuses</option>
                <option value="planned" className="bg-black text-white">Planned</option>
                <option value="in_progress" className="bg-black text-white">In Progress</option>
                <option value="completed" className="bg-black text-white">Completed</option>
                <option value="postponed" className="bg-black text-white">Postponed</option>
              </select>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 3: TIME-BLOCKED DAY SCHEDULE (Sequential Revelations) */}
      {/* ------------------------------------------------------------- */}
      <section id="planner-schedule" className="space-y-10 scroll-mt-28">
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
                Today's Action Schedule
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Execute your day block by block. Start the live stopwatch, log time, or postpone with one click.
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
              <span>Add Custom Task</span>
            </button>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <ScrollReveal mode="inView" duration={1.6} yOffset={40}>
              <div className="crystal-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-12 text-center backdrop-blur-2xl">
                <Calendar className="h-8 w-8 text-zinc-500 mb-2" />
                <p className="text-sm font-bold text-white">No tasks match your filter criteria</p>
                <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                  Add a task above or clear your filters to view your commitments for this day.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            sortedTasks.map((task, index) => {
              const isTimerRunning = activeTimer?.taskId === task.id;
              const isCompleted = task.status === 'completed';
              const honestCalc = calculateHonestEstimate(task.estimatedDurationMinutes, task.category, tasks, logs);

              return (
                <ScrollReveal
                  key={task.id}
                  mode="inView"
                  delay={Math.min(index * 0.09, 0.4)}
                  duration={1.6}
                  yOffset={50}
                  blurAmount={8}
                >
                  <div
                    className={`crystal-panel group relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl border transition-all duration-300 ${
                      isCompleted
                        ? 'border-white/10 bg-white/[0.02] opacity-70'
                        : 'border-white/15 bg-white/[0.04] hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Task Content */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <button
                          onClick={() =>
                            setTaskStatus(task.id, isCompleted ? 'planned' : 'completed')
                          }
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            isCompleted
                              ? 'border-white bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'border-white/20 bg-black/60 hover:border-white text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`text-base font-bold truncate ${
                                isCompleted ? 'line-through text-zinc-500' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            <CategoryBadge category={task.category} size="sm" />
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />

                            {/* 1-Click Honest Multiplier Applicator */}
                            {honestCalc.hasAdjustment && !isCompleted && (
                              <button
                                onClick={() =>
                                  updateTask({
                                    ...task,
                                    estimatedDurationMinutes: honestCalc.recommendedMinutes,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-mono text-white hover:bg-white hover:text-black transition-all shadow-sm"
                                title={`${honestCalc.explanation} Click to update estimate.`}
                              >
                                <Wand2 className="h-3 w-3" />
                                <span>⚡ Honest: {formatDuration(honestCalc.recommendedMinutes)}</span>
                              </button>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2">{task.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap pt-0.5">
                            <span className="font-mono text-zinc-300 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              {formatDuration(task.estimatedDurationMinutes)}
                            </span>
                            {task.scheduledStartTime && (
                              <span className="font-mono text-zinc-400">
                                @ {task.scheduledStartTime}
                              </span>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1.5">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isTimerRunning ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startTimer(task.title, task.category, task.id, false, 'stopwatch')}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
                              title="Start live stopwatch"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Timer</span>
                            </button>
                            <button
                              onClick={() => startTimer(task.title, task.category, task.id, false, 'pomodoro', 25)}
                              className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-2.5 py-2 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/15 transition-colors"
                              title="Start 25m Pomodoro"
                            >
                              <span>25m Pomo</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-xs font-mono font-bold text-white shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            Running
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setPreselectedLogTask(task);
                            setIsLogModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors shadow-sm"
                          title="Log activity manually"
                        >
                          <Zap className="h-3.5 w-3.5 fill-white" />
                          <span>Log</span>
                        </button>

                        <button
                          onClick={() => {
                            setPostponingTaskId(task.id);
                          }}
                          className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Postpone to tomorrow"
                        >
                          <MoveRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 rounded-xl border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 4: LIVE FOCUS STOPWATCH & LOGS                       */}
      {/* ------------------------------------------------------------- */}
      <section id="planner-logger" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 04
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Live Focus Stopwatch & Activity Logs
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Track focused blocks down to the second, account for interruptions, and inspect verified logs.
            </p>
          </div>
        </ScrollReveal>

        {/* Active Stopwatch Card */}
        {activeTimer ? (
          <ScrollReveal mode="inView" delay={0.12} duration={1.8} yOffset={60} blurAmount={12}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 sm:p-9 backdrop-blur-3xl border border-white/25 shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-7">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      {activeTimer.mode === 'pomodoro' ? 'Pomodoro Focus Block' : 'Open Stopwatch'}
                    </span>
                    <CategoryBadge category={activeTimer.category} size="sm" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">{activeTimer.taskTitle}</h3>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-mono text-zinc-400">
                    <span>Started @ {new Date(activeTimer.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{activeTimer.interruptionCount} interruptions recorded</span>
                  </div>
                </div>

                {/* Big Digital Numbers */}
                <div className="flex items-center gap-3">
                  {(() => {
                    if (activeTimer.mode === 'pomodoro' && activeTimer.targetDurationMinutes) {
                      const remainSec = Math.max(0, activeTimer.targetDurationMinutes * 60 - activeTimer.elapsedSeconds);
                      const digits = formatTimerDigits(remainSec);
                      return (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 mb-1">Time Remaining</span>
                          <div className="font-mono text-4xl sm:text-6xl font-black text-white tracking-widest px-6 py-3 rounded-2xl bg-black/80 border border-white/20 shadow-inner">
                            {digits.minutes}:{digits.seconds}
                          </div>
                        </div>
                      );
                    }
                    const digits = formatTimerDigits(activeTimer.elapsedSeconds);
                    return (
                      <div className="font-mono text-4xl sm:text-6xl font-black text-white tracking-widest px-6 py-3 rounded-2xl bg-black/80 border border-white/20 shadow-inner">
                        {digits.hours}:{digits.minutes}:{digits.seconds}
                      </div>
                    );
                  })()}
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {!activeTimer.isRunning ? (
                    <button
                      onClick={resumeTimer}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={() => addTimerInterruption()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>+ Interruption ({activeTimer.interruptionCount})</span>
                  </button>

                  <button
                    onClick={() => finishTimerAndSave('Completed session')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Log</span>
                  </button>

                  <button
                    onClick={discardTimer}
                    className="p-2.5 rounded-xl border border-white/10 text-zinc-500 hover:text-white transition-colors"
                    title="Discard session"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          /* Start New Stopwatch / Pomodoro Form */
          <ScrollReveal mode="inView" delay={0.12} duration={1.8} yOffset={60} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl border border-white/20 shadow-xl">
              <form onSubmit={handleStartNewTimer} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Focus Session Launcher
                    </span>
                    <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-0.5">
                      <button
                        type="button"
                        onClick={() => setFocusModeType('stopwatch')}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          focusModeType === 'stopwatch' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                        }`}
                      >
                        Open Stopwatch
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusModeType('pomodoro')}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          focusModeType === 'pomodoro' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                        }`}
                      >
                        Pomodoro Block
                      </button>
                    </div>
                  </div>

                  <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-0.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setStopwatchTaskType('planned')}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        stopwatchTaskType === 'planned' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Planned Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setStopwatchTaskType('unplanned')}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        stopwatchTaskType === 'unplanned' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Spontaneous Focus
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  {stopwatchTaskType === 'planned' ? (
                    <select
                      value={stopwatchTaskId}
                      onChange={(e) => setStopwatchTaskId(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-white focus:border-white focus:outline-none"
                    >
                      <option value="" className="bg-black text-white">Select a planned task from today...</option>
                      {eligibleDayTasks.map((t) => (
                        <option key={t.id} value={t.id} className="bg-black text-white">
                          {t.title} ({t.category} • {formatDuration(t.estimatedDurationMinutes)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={stopwatchCustomTitle}
                      onChange={(e) => setStopwatchCustomTitle(e.target.value)}
                      placeholder="What are you focusing on right now?..."
                      className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                    />
                  )}

                  {stopwatchTaskType === 'unplanned' && (
                    <select
                      value={stopwatchCategory}
                      onChange={(e) => setStopwatchCategory(e.target.value as CategoryType)}
                      className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-white focus:border-white focus:outline-none"
                    >
                      <option value="Deep Work" className="bg-black text-white">Deep Work</option>
                      <option value="Meetings & Syncs" className="bg-black text-white">Meetings & Syncs</option>
                      <option value="Creative & Design" className="bg-black text-white">Creative & Design</option>
                      <option value="Learning & Research" className="bg-black text-white">Learning & Research</option>
                      <option value="Admin & Operations" className="bg-black text-white">Admin & Operations</option>
                      <option value="Health & Personal" className="bg-black text-white">Health & Personal</option>
                    </select>
                  )}

                  {focusModeType === 'pomodoro' && (
                    <select
                      value={pomodoroMinutes}
                      onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                      className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
                    >
                      <option value={15} className="bg-black text-white">15m Sprint</option>
                      <option value={25} className="bg-black text-white">25m Standard</option>
                      <option value={45} className="bg-black text-white">45m Deep Flow</option>
                      <option value={60} className="bg-black text-white">60m Power Block</option>
                    </select>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] shrink-0"
                  >
                    <Play className="h-4 w-4" />
                    <span>Launch Focus</span>
                  </button>
                </div>
              </form>
            </div>
          </ScrollReveal>
        )}

        {/* Today's Activity Logs List */}
        <ScrollReveal mode="inView" delay={0.24} duration={1.8} yOffset={70} blurAmount={10}>
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl border border-white/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Logged Sessions for {formattedDate} ({logs.filter((l) => l.activityDate === selectedDate).length})
              </span>
            </div>

            <div className="space-y-3">
              {logs.filter((l) => l.activityDate === selectedDate).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No time recorded yet today. Use the stopwatch or Log button to add an entry.</p>
              ) : (
                logs
                  .filter((l) => l.activityDate === selectedDate)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{log.taskTitle}</span>
                          <CategoryBadge category={log.category} size="sm" />
                          {log.isUnplanned && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                              Spontaneous
                            </span>
                          )}
                        </div>
                        {(log.reflectionNotes || log.interruptionNotes) && (
                          <p className="text-zinc-400 text-[11px]">{log.reflectionNotes || log.interruptionNotes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-white">
                          {formatDuration(log.actualDurationMinutes)}
                        </span>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                          title="Delete log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Postpone Task Modal */}
      <AnimatePresence>
        {postponingTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="crystal-panel relative max-w-md w-full rounded-3xl p-6 sm:p-7 backdrop-blur-3xl border border-white/25 shadow-2xl space-y-5"
            >
              <h3 className="text-xl font-bold text-white">Postpone Commitment</h3>
              <p className="text-xs text-zinc-300">
                Rescheduling protects your capacity. Choose the target date to move this task to:
              </p>

              <div>
                <input
                  type="date"
                  value={postponeTargetDate}
                  onChange={(e) => setPostponeTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostponingTaskId(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPostpone}
                  className="rounded-xl bg-white px-5 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-sm"
                >
                  Confirm Postpone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
