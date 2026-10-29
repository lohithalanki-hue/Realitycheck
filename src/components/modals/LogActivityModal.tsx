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
    theme,
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
            className={`fixed inset-0 ${
              theme === 'light' ? 'bg-zinc-900/40 backdrop-blur-md' : 'bg-black/85 backdrop-blur-xl'
            }`}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`relative w-full max-w-xl overflow-hidden rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90dvh] overflow-y-auto ${
              theme === 'light'
                ? 'bg-white border border-zinc-200 text-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
                : 'glass-card text-white backdrop-blur-3xl'
            }`}
          >
            {/* Specular sheen (dark mode only) */}
            {theme === 'dark' && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-transparent" />
            )}

            {/* Header */}
            <div
              className={`relative z-10 flex items-center justify-between border-b pb-4 ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-2xl font-black ${
                    theme === 'light'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-[#C6F66A] text-[#080A09] shadow-[0_0_15px_rgba(198,246,106,0.4)]'
                  }`}
                >
                  <Zap
                    className={`h-4 w-4 ${
                      theme === 'light' ? 'text-white fill-white' : 'fill-[#080A09] text-[#080A09]'
                    }`}
                  />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    Log Actual Activity
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-[#929B91]'}`}>
                    Record true time expending to feed the Reality Gap Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLogModalOpen(false);
                  setPreselectedLogTask(null);
                }}
                className={`rounded-2xl p-1 transition-colors ${
                  theme === 'light'
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative z-10 mt-5 space-y-4">
              {error && (
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold ${
                    theme === 'light'
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-rose-500/35 bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                    theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                  }`}
                >
                  Select Associated Task (or log spontaneous)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleTaskSelectionChange(e.target.value)}
                  className={`w-full rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none ${
                    theme === 'light'
                      ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                      : 'border border-white/20 bg-black/50 text-white focus:border-[#C6F66A]'
                  }`}
                >
                  <option
                    value="unplanned"
                    className={theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#101412] text-white'}
                  >
                    ⚡ Spontaneous / Unplanned Activity
                  </option>
                  <optgroup
                    label="Planned Commitments"
                    className={theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#101412] text-white'}
                  >
                    {tasks
                      .filter((t) => t.status !== 'cancelled')
                      .map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          className={theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#101412] text-white'}
                        >
                          [{t.plannedDate}] {t.title} ({t.estimatedDurationMinutes}m est)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                    theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                  }`}
                >
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="What did you actually work on?"
                  className={`w-full rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none ${
                    theme === 'light'
                      ? 'border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-zinc-900'
                      : 'border border-white/20 bg-black/50 text-white placeholder-zinc-500 focus:border-[#C6F66A]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                      theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                    }`}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className={`w-full rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                        : 'border border-white/20 bg-black/50 text-white focus:border-[#C6F66A]'
                    }`}
                  >
                    {categories.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className={theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#101412] text-white'}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                      theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                    }`}
                  >
                    Execution Outcome
                  </label>
                  <div
                    className={`grid grid-cols-3 gap-1.5 rounded-2xl p-1 ${
                      theme === 'light'
                        ? 'border border-zinc-200 bg-zinc-100'
                        : 'border border-white/20 bg-black/50'
                    }`}
                  >
                    {(['completed', 'partial', 'abandoned'] as const).map((status) => {
                      const isSelected = completionStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setCompletionStatus(status)}
                          className={`rounded-xl py-1.5 text-[11px] font-mono uppercase font-bold transition-all ${
                            isSelected
                              ? theme === 'light'
                                ? 'bg-zinc-900 text-white shadow-sm'
                                : 'bg-[#C6F66A] text-[#080A09] shadow-sm'
                              : theme === 'light'
                              ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider ${
                        theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                      }`}
                    >
                      Actual Duration (Minutes) *
                    </label>
                    {variance !== null && (
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          theme === 'light' ? 'text-emerald-700' : 'text-[#C6F66A]'
                        }`}
                      >
                        {variance > 0
                          ? `+${variance}m overrun`
                          : variance < 0
                          ? `${variance}m buffer`
                          : 'Exact match'}
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
                    className={`w-full rounded-2xl px-3.5 py-2 text-sm font-mono focus:outline-none ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                        : 'border border-white/20 bg-black/50 text-white focus:border-[#C6F66A]'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                      theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                    }`}
                  >
                    Activity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className={`w-full rounded-2xl px-3.5 py-2 text-xs font-mono focus:outline-none ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                        : 'border border-white/20 bg-black/50 text-white focus:border-[#C6F66A]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[11px] ${theme === 'light' ? 'text-zinc-500' : 'text-[#929B91]'}`}>
                  Quick set:
                </span>
                {[15, 25, 45, 60, 90, 120, 150].map((mins) => {
                  const isSelected = actualDurationMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setActualDurationMinutes(mins)}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-mono border transition-colors ${
                        isSelected
                          ? theme === 'light'
                            ? 'border-zinc-900 bg-zinc-900 text-white font-bold shadow-sm'
                            : 'border-[#C6F66A]/40 bg-[#C6F66A]/15 text-[#C6F66A] font-bold shadow-sm'
                          : theme === 'light'
                          ? 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  );
                })}
              </div>

              <div
                className={`rounded-2xl p-3.5 ${
                  theme === 'light'
                    ? 'border border-zinc-200 bg-zinc-50'
                    : 'border border-white/15 bg-white/[0.04] backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>
                    Interruptions & Context Switches
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInterruptionCount((c) => Math.max(0, c - 1))}
                      className={`rounded-xl px-2.5 py-0.5 text-xs transition-colors ${
                        theme === 'light'
                          ? 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm'
                          : 'border border-white/10 bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      -
                    </button>
                    <span
                      className={`font-mono text-xs font-bold w-4 text-center ${
                        theme === 'light' ? 'text-zinc-900' : 'text-[#C6F66A]'
                      }`}
                    >
                      {interruptionCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInterruptionCount((c) => c + 1)}
                      className={`rounded-xl px-2.5 py-0.5 text-xs transition-colors ${
                        theme === 'light'
                          ? 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm'
                          : 'border border-white/10 bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
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
                  className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                    theme === 'light'
                      ? 'border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-zinc-900'
                      : 'border border-white/15 bg-black/50 text-zinc-200 placeholder-zinc-500 focus:border-[#C6F66A]'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
                    theme === 'light' ? 'text-zinc-600' : 'text-[#929B91]'
                  }`}
                >
                  Retrospective Reflection (Why did variance occur?)
                </label>
                <input
                  type="text"
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="e.g. Underestimated API test setup; took 20m longer."
                  className={`w-full rounded-2xl px-3.5 py-2 text-xs focus:outline-none ${
                    theme === 'light'
                      ? 'border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-zinc-900'
                      : 'border border-white/20 bg-black/50 text-white placeholder-zinc-500 focus:border-[#C6F66A]'
                  }`}
                />
              </div>

              <div
                className={`flex items-center justify-end gap-3 border-t pt-4 ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsLogModalOpen(false);
                    setPreselectedLogTask(null);
                  }}
                  className={`rounded-2xl px-4 py-2 text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`rounded-2xl px-5 py-2 text-xs font-black transition-all ${
                    theme === 'light'
                      ? 'bg-zinc-900 text-white hover:bg-black shadow-md'
                      : 'bg-[#C6F66A] text-[#080A09] hover:bg-[#b8eb5a] shadow-[0_0_15px_rgba(198,246,106,0.4)]'
                  }`}
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
