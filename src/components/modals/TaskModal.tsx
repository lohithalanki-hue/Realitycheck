import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Sparkles, Tag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryType, PriorityType, Task } from '../../types';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    selectedDate,
    preferences,
    tasks,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('Deep Work');
  const [plannedDate, setPlannedDate] = useState(selectedDate);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(60);
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPlannedDate(editingTask.plannedDate);
      setScheduledStartTime(editingTask.scheduledStartTime || '');
      setEstimatedDurationMinutes(editingTask.estimatedDurationMinutes);
      setPriority(editingTask.priority);
      setTagsInput(editingTask.tags ? editingTask.tags.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Deep Work');
      setPlannedDate(selectedDate);
      setScheduledStartTime('09:30');
      setEstimatedDurationMinutes(60);
      setPriority('medium');
      setTagsInput('');
    }
    setError('');
  }, [editingTask, isTaskModalOpen, selectedDate]);

  const categories: CategoryType[] = [
    'Deep Work',
    'Meetings & Syncs',
    'Creative & Design',
    'Learning & Research',
    'Admin & Operations',
    'Health & Personal',
  ];

  const priorities: PriorityType[] = ['low', 'medium', 'high', 'critical'];

  const dayPlannedMinutes = tasks
    .filter((t) => t.plannedDate === plannedDate && t.id !== editingTask?.id && t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);

  const prospectiveTotal = dayPlannedMinutes + (Number(estimatedDurationMinutes) || 0);
  const availableMinutes = preferences.dailyAvailableMinutes || 480;
  const isOverplanning = prospectiveTotal > availableMinutes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    const duration = Number(estimatedDurationMinutes);
    if (isNaN(duration) || duration <= 0) {
      setError('Please provide a realistic duration (> 0 minutes).');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingTask) {
      updateTask({
        ...editingTask,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        plannedDate,
        scheduledStartTime: scheduledStartTime || undefined,
        estimatedDurationMinutes: duration,
        priority,
        tags,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        plannedDate,
        scheduledStartTime: scheduledStartTime || undefined,
        estimatedDurationMinutes: duration,
        priority,
        status: 'planned',
        tags,
      });
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <AnimatePresence>
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
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
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingTask ? 'Edit Scheduled Task' : 'Plan New Task'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Commit an intended outcome with an honest time estimate
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
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

              {isOverplanning && (
                <div className="rounded-xl border border-white/25 bg-white/[0.06] p-3 text-xs text-zinc-200">
                  <span className="font-bold text-white">Overplanning Alert:</span> Total planned time for {plannedDate} will reach{' '}
                  {(prospectiveTotal / 60).toFixed(1)}h, exceeding your {availableMinutes / 60}h available budget.
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Architect distributed caching layer"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Description / Intended Deliverable
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explicit scope, constraints, and success criteria..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-none"
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
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/15 bg-black/60 p-1">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-lg py-1.5 text-[11px] font-mono uppercase font-bold transition-all ${
                          priority === p
                            ? 'bg-white text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Est. Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={estimatedDurationMinutes}
                    onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500">Quick estimate:</span>
                {[25, 45, 60, 90, 120, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedDurationMinutes(mins)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-mono border transition-colors ${
                      estimatedDurationMinutes === mins
                        ? 'border-white bg-white text-black font-bold shadow-sm'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. backend, redis, pr-review"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
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
                  {editingTask ? 'Save Changes' : 'Schedule Task'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
