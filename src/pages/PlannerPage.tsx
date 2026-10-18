import React, { useState } from 'react';
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
  Zap,
} from 'lucide-react';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/ui/CategoryBadge';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../lib/analytics/gapEngine';
import { ActivityLog, CategoryType, PriorityType, Task, TaskStatus } from '../types';

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

  // Log edit state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

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

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      category: quickCategory,
      plannedDate: selectedDate,
      estimatedDurationMinutes: Number(quickDuration) || 60,
      priority: 'medium',
      status: 'planned',
    });
    setQuickTitle('');
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
        startTimer(targetTask.title, targetTask.category, targetTask.id, false);
      }
    } else {
      if (!stopwatchCustomTitle.trim()) return;
      startTimer(stopwatchCustomTitle.trim(), stopwatchCategory, null, true);
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

  const timerDigits = activeTimer
    ? formatTimerDigits(activeTimer.elapsedSeconds)
    : { hours: '00', minutes: '00', seconds: '00' };

  const filteredLogs = logs.filter((log) => {
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      const matchTitle = log.taskTitle.toLowerCase().includes(q);
      const matchNotes = log.reflectionNotes?.toLowerCase().includes(q) || log.interruptionNotes?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const categories: CategoryType[] = [
    'Deep Work',
    'Meetings & Syncs',
    'Creative & Design',
    'Learning & Research',
    'Admin & Operations',
    'Health & Personal',
  ];

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* Header with Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Planner & Activity Tracker
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Calibrate scheduled intention against recorded real execution
          </p>
        </div>

        {/* Crystalmorphic Sub-View Pill */}
        <div className="flex rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl p-1 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setPlannerSubTab('schedule')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              plannerSubTab === 'schedule'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Schedule ({dayTasks.length})</span>
          </button>
          <button
            onClick={() => setPlannerSubTab('logger')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              plannerSubTab === 'logger'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Stopwatch & Logs ({logs.length})</span>
          </button>
        </div>
      </div>

      {plannerSubTab === 'schedule' ? (
        <>
          {/* Daily Capacity Budget Crystal Card */}
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Daily Capacity Allocation
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-xl font-black text-white">
                      {formatDuration(totalPlannedMinutes)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      / {(availableMinutes / 60).toFixed(1)}h available budget ({preferences.workHoursStart} - {preferences.workHoursEnd})
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-mono font-bold border backdrop-blur-md ${
                  isOverplanned
                    ? 'border-white/40 bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                    : 'border-white/20 bg-white/[0.06] text-white'
                }`}
              >
                {isOverplanned ? `Over capacity by +${formatDuration(overageMinutes)}` : `${formatDuration(availableMinutes - totalPlannedMinutes)} available`}
              </span>
            </div>

            <div className="relative z-10 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{ width: `${Math.min(100, Math.round((totalPlannedMinutes / availableMinutes) * 100))}%` }}
              />
            </div>

            {isOverplanned && (
              <div className="relative z-10 mt-4 flex items-start gap-3 rounded-xl border border-white/20 bg-white/[0.06] p-3.5 text-xs text-white backdrop-blur-md">
                <AlertTriangle className="h-4 w-4 shrink-0 text-white mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">
                    Planning Intelligence Warning: Overplanning Detected
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Your planned commitments exceed your configured available workday by {formatDuration(overageMinutes)}. Consider postponing non-urgent tasks to protect execution fidelity.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Inline Box */}
          <form
            onSubmit={handleQuickAdd}
            className="crystal-panel relative overflow-hidden flex flex-col sm:flex-row items-stretch gap-2.5 rounded-2xl p-2.5 backdrop-blur-2xl"
          >
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick-add task title (e.g. Conduct database failover drill)..."
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as CategoryType)}
              className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-black text-white">
                  {c}
                </option>
              ))}
            </select>

            <select
              value={quickDuration}
              onChange={(e) => setQuickDuration(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
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
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, descriptions, or tags..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3 py-1.5 text-xs text-zinc-300 focus:border-white focus:outline-none"
              >
                <option value="all" className="bg-black text-white">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-black text-white">
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3 py-1.5 text-xs text-zinc-300 focus:border-white focus:outline-none"
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
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-3 py-1.5 text-xs text-zinc-300 focus:border-white focus:outline-none"
              >
                <option value="all" className="bg-black text-white">All Statuses</option>
                <option value="planned" className="bg-black text-white">Planned</option>
                <option value="in_progress" className="bg-black text-white">In Progress</option>
                <option value="completed" className="bg-black text-white">Completed</option>
                <option value="postponed" className="bg-black text-white">Postponed</option>
                <option value="cancelled" className="bg-black text-white">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {sortedTasks.length === 0 ? (
              <div className="crystal-panel flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-8 text-center backdrop-blur-xl">
                <p className="text-sm font-semibold text-zinc-300">No matching tasks found.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Clear your search filters or schedule a new task for {selectedDate}.
                </p>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const isTimerActive = activeTimer?.taskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`crystal-panel group rounded-2xl transition-all duration-200 p-4 ${
                      task.status === 'completed'
                        ? 'opacity-70 bg-white/[0.02]'
                        : 'bg-white/[0.04] hover:border-white/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={() =>
                            setTaskStatus(
                              task.id,
                              task.status === 'completed' ? 'planned' : 'completed'
                            )
                          }
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            task.status === 'completed'
                              ? 'border-white bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'border-zinc-700 bg-zinc-900 hover:border-white'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-bold truncate ${
                                task.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            <PriorityBadge priority={task.priority} />
                            <StatusBadge status={task.status} />

                            {task.postponeCount && task.postponeCount > 0 ? (
                              <span className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                                Deferred {task.postponeCount}x (originally {task.postponedFrom})
                              </span>
                            ) : null}
                          </div>

                          {task.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-1">
                            <CategoryBadge category={task.category} size="sm" />
                            {task.scheduledStartTime && (
                              <span className="font-mono text-[11px] text-zinc-300">
                                @{task.scheduledStartTime}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-zinc-300">
                              Est: {formatDuration(task.estimatedDurationMinutes)}
                            </span>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-white/10"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {!isTimerActive ? (
                          <button
                            onClick={() => startTimer(task.title, task.category, task.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-white/40 hover:text-white transition-colors"
                            title="Start stopwatch tracking"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Track</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-xl border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-mono font-bold text-white shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            Recording
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setPreselectedLogTask(task);
                            setIsLogModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors shadow-sm"
                          title="Log actual completion time"
                        >
                          <Zap className="h-3.5 w-3.5 fill-white" />
                          <span>Log Time</span>
                        </button>

                        <button
                          onClick={() => setPostponingTaskId(task.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Postpone Task"
                        >
                          <MoveRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-400 hover:text-white transition-colors"
                          title="Edit task parameters"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Stopwatch and Logs Tab */
        <div className="space-y-6">
          {/* Active Live Stopwatch Station */}
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeTimer?.isRunning ? 'bg-white shadow-[0_0_8px_#fff] animate-ping' : 'bg-zinc-600'}`} />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    {activeTimer ? (activeTimer.isRunning ? 'Active Recording' : 'Timer Paused') : 'Stopwatch Ready'}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 font-mono text-5xl sm:text-6xl font-black tracking-tight text-white my-2">
                  <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">{timerDigits.hours}</span>
                  <span className="text-zinc-600">:</span>
                  <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">{timerDigits.minutes}</span>
                  <span className="text-zinc-600">:</span>
                  <span className="text-zinc-400">{timerDigits.seconds}</span>
                </div>

                {activeTimer && (
                  <div className="flex items-center gap-3 text-xs text-zinc-300">
                    <span className="font-semibold text-white truncate max-w-sm">
                      {activeTimer.taskTitle}
                    </span>
                    <CategoryBadge category={activeTimer.category} size="sm" />
                    {activeTimer.isUnplanned && (
                      <span className="text-zinc-300 font-mono text-[11px] border border-white/20 rounded-full px-2 py-0.5 bg-white/5">
                        ⚡ Spontaneous
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              {activeTimer ? (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {activeTimer.isRunning ? (
                    <button
                      onClick={pauseTimer}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={resumeTimer}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    onClick={addTimerInterruption}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/10"
                  >
                    <AlertCircle className="h-4 w-4 text-white" />
                    <span>+1 Interruption ({activeTimer.interruptionCount})</span>
                  </button>

                  <button
                    onClick={() => finishTimerAndSave()}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  >
                    <Square className="h-4 w-4 fill-black" />
                    <span>Finish & Save</span>
                  </button>

                  <button
                    onClick={discardTimer}
                    className="p-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    title="Discard Timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleStartNewTimer}
                  className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto"
                >
                  <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-0.5">
                    <button
                      type="button"
                      onClick={() => setStopwatchTaskType('planned')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        stopwatchTaskType === 'planned' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      From Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setStopwatchTaskType('unplanned')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        stopwatchTaskType === 'unplanned' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Unplanned
                    </button>
                  </div>

                  {stopwatchTaskType === 'planned' ? (
                    <select
                      required
                      value={stopwatchTaskId}
                      onChange={(e) => setStopwatchTaskId(e.target.value)}
                      className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white max-w-xs focus:border-white focus:outline-none"
                    >
                      <option value="" className="bg-black text-white">Select a planned task...</option>
                      {tasks
                        .filter((t) => t.status !== 'cancelled' && t.status !== 'completed')
                        .map((t) => (
                          <option key={t.id} value={t.id} className="bg-black text-white">
                            {t.title} ({t.estimatedDurationMinutes}m)
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Describe spontaneous activity..."
                        value={stopwatchCustomTitle}
                        onChange={(e) => setStopwatchCustomTitle(e.target.value)}
                        className="rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none min-w-[200px]"
                      />
                      <select
                        value={stopwatchCategory}
                        onChange={(e) => setStopwatchCategory(e.target.value as CategoryType)}
                        className="rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-zinc-300 focus:border-white focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c} className="bg-black text-white">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-black" />
                    <span>Track</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Historical Logs Table */}
          <div className="crystal-panel rounded-2xl p-5 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Recorded Execution History</h2>
                <p className="text-xs text-zinc-400">
                  {filteredLogs.length} verified logs with actual time expending
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search logs & reflections..."
                  className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-zinc-400">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Activity</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Actual Time</th>
                    <th className="pb-3">Variance</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => {
                    const linkedTask = log.taskId ? tasks.find((t) => t.id === log.taskId) : null;
                    const variance = linkedTask
                      ? log.actualDurationMinutes - linkedTask.estimatedDurationMinutes
                      : null;
                    const isEditing = editingLogId === log.id;

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 font-mono text-zinc-400 whitespace-nowrap">
                          {log.activityDate}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-white">{log.taskTitle}</div>
                          {log.reflectionNotes && (
                            <div className="mt-0.5 text-[11px] text-zinc-400 italic">
                              "{log.reflectionNotes}"
                            </div>
                          )}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <CategoryBadge category={log.category} size="sm" />
                        </td>
                        <td className="py-3 font-mono font-bold text-white whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editDuration}
                              onChange={(e) => setEditDuration(Number(e.target.value))}
                              className="w-16 rounded border border-white/20 bg-black px-2 py-1 text-xs font-mono text-white"
                            />
                          ) : (
                            formatDuration(log.actualDurationMinutes)
                          )}
                        </td>
                        <td className="py-3 whitespace-nowrap font-mono text-[11px]">
                          {variance !== null ? (
                            <span className="font-bold text-white">
                              {variance > 0 ? `+${variance}m overrun` : variance < 0 ? `${variance}m buffer` : 'Exact'}
                            </span>
                          ) : (
                            <span className="text-zinc-500">Standalone</span>
                          )}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  updateLog({
                                    ...log,
                                    actualDurationMinutes: editDuration,
                                    reflectionNotes: editNotes,
                                  });
                                  setEditingLogId(null);
                                }}
                                className="rounded bg-white px-2.5 py-1 text-[11px] font-black text-black shadow-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingLogId(log.id);
                                  setEditDuration(log.actualDurationMinutes);
                                  setEditNotes(log.reflectionNotes || '');
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteLog(log.id)}
                                className="p-1.5 text-zinc-400 hover:text-white"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Postpone Modal */}
      {postponingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="crystal-panel w-full max-w-md rounded-2xl p-6 shadow-2xl backdrop-blur-2xl">
            <h3 className="text-base font-bold text-white">Postpone Task</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Moving this task retains its original schedule history to track deferral patterns.
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Reschedule To
              </label>
              <input
                type="date"
                required
                value={postponeTargetDate}
                onChange={(e) => setPostponeTargetDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/70 px-3.5 py-2.5 text-xs font-mono text-white focus:border-white focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPostponingTaskId(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPostpone}
                className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                Confirm Postpone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
