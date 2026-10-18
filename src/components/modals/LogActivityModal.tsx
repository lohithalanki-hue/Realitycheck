import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Clock, Zap, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryType, Task } from '../../types';

export const LogActivityModal: React.FC = () => {
  const {
    isLogModalOpen,
    setIsLogModalOpen,
    preselectedLogTask,
    setPreselectedLogTask,
    tasks,
    addLog,
    selectedDate,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('unplanned');
  const [taskTitle, setTaskTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Deep Work');
  const [actualDurationMinutes, setActualDurationMinutes] = useState(45);
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'partial' | 'abandoned'>('completed');
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [interruptionNotes, setInterruptionNotes] = useState('');
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [activityDate, setActivityDate] = useState(selectedDate);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedLogTask) {
      setSelectedTaskId(preselectedLogTask.id);
      setTaskTitle(preselectedLogTask.title);
      setCategory(preselectedLogTask.category);
      setActualDurationMinutes(preselectedLogTask.estimatedDurationMinutes);
      setActivityDate(preselectedLogTask.plannedDate);
    } else {
      setSelectedTaskId('unplanned');
      setTaskTitle('');
      setCategory('Deep Work');
      setActualDurationMinutes(45);
      setActivityDate(selectedDate);
    }
    setCompletionStatus('completed');
    setInterruptionCount(0);
    setInterruptionNotes('');
    setReflectionNotes('');
    setError('');
  }, [preselectedLogTask, isLogModalOpen, selectedDate]);

  const categories: CategoryType[] = [
    'Deep Work',
    'Meetings & Syncs',
    'Creative & Design',
    'Learning & Research',
    'Admin & Operations',
    'Health & Personal',
  ];

  const handleTaskSelectionChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId === 'unplanned') {
      setTaskTitle('');
      setCategory('Deep Work');
    } else {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setTaskTitle(found.title);
        setCategory(found.category);
        setActualDurationMinutes(found.estimatedDurationMinutes);
        setActivityDate(found.plannedDate);
      }
    }
  };

  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const plannedMinutes = currentTask ? currentTask.estimatedDurationMinutes : null;
  const variance = plannedMinutes !== null ? actualDurationMinutes - plannedMinutes : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setError('Activity title is required.');
      return;
    }
    const mins = Number(actualDurationMinutes);
    if (isNaN(mins) || mins <= 0) {
      setError('Please provide a realistic duration (> 0 minutes).');
      return;
    }

    addLog({
      taskId: selectedTaskId === 'unplanned' ? null : selectedTaskId,
      taskTitle: taskTitle.trim(),
      category,
      actualDurationMinutes: mins,
      completionStatus,
      interruptionCount,
      interruptionNotes: interruptionNotes.trim() || undefined,
      reflectionNotes: reflectionNotes.trim() || undefined,
      activityDate,
      isUnplanned: selectedTaskId === 'unplanned',
    });

    setIsLogModalOpen(false);
    setPreselectedLogTask(null);
  };

  return (
    <AnimatePresence>
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsLogModalOpen(false);
              setPreselectedLogTask(null);
            }}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="crystal-panel relative w-full max-w-xl overflow-hidden rounded-3xl p-6 shadow-2xl z-10 backdrop-blur-3xl"
          >
            {/* Specular sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  <Zap className="h-4 w-4 fill-black text-black" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Log Actual Activity</h2>
                  <p className="text-xs text-zinc-400">
                    Record true time expending to feed the Reality Gap Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLogModalOpen(false);
                  setPreselectedLogTask(null);
                }}
                className="rounded-xl p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 mt-5 space-y-4">
              {error && (
                <div className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs text-white">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Select Associated Task (or log spontaneous)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleTaskSelectionChange(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                >
                  <option value="unplanned" className="bg-black text-white">⚡ Spontaneous / Unplanned Activity</option>
                  <optgroup label="Planned Commitments" className="bg-black text-white">
                    {tasks
                      .filter((t) => t.status !== 'cancelled')
                      .map((t) => (
                        <option key={t.id} value={t.id} className="bg-black text-white">
                          [{t.plannedDate}] {t.title} ({t.estimatedDurationMinutes}m est)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="What did you actually work on?"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-black text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Execution Outcome
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/15 bg-black/60 p-1">
                    {(['completed', 'partial', 'abandoned'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCompletionStatus(status)}
                        className={`rounded-lg py-1.5 text-[11px] font-mono uppercase font-bold transition-all ${
                          completionStatus === status
                            ? 'bg-white text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Actual Duration (Minutes) *
                    </label>
                    {variance !== null && (
                      <span className="font-mono text-[11px] font-bold text-white">
                        {variance > 0 ? `+${variance}m overrun` : variance < 0 ? `${variance}m buffer` : 'Exact match'}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={actualDurationMinutes}
                    onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Activity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Quick set:</span>
                {[15, 25, 45, 60, 90, 120, 150].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setActualDurationMinutes(mins)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-mono border transition-colors ${
                      actualDurationMinutes === mins
                        ? 'border-white bg-white text-black font-bold shadow-sm'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    Interruptions & Context Switches
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInterruptionCount((c) => Math.max(0, c - 1))}
                      className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs text-zinc-300 hover:bg-white/20"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-white w-4 text-center">
                      {interruptionCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInterruptionCount((c) => c + 1)}
                      className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs text-zinc-300 hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={interruptionNotes}
                  onChange={(e) => setInterruptionNotes(e.target.value)}
                  placeholder="e.g. Unscheduled Slack inquiry on incident triage"
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Retrospective Reflection (Why did variance occur?)
                </label>
                <input
                  type="text"
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="e.g. Underestimated API test setup; took 20m longer."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setPreselectedLogTask(null);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="rounded-xl bg-white px-5 py-2 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                >
                  Save Activity Log
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
