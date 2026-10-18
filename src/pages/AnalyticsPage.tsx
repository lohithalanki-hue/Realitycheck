import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Filter,
  FlaskConical,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { useApp } from '../context/AppContext';
import {
  calculateCategoryBreakdown,
  calculateCompletionRate,
  calculatePlanningAccuracy,
  calculateTimeEstimationError,
  formatDuration,
} from '../lib/analytics/gapEngine';
import { CategoryType, Experiment, Insight, Task } from '../types';

export const AnalyticsPage: React.FC = () => {
  const {
    tasks,
    logs,
    selectedDate,
    insights,
    experiments,
    addExperiment,
    updateExperiment,
    voteInsight,
    activeWorkspace,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'patterns'>('analytics');
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [inspectingCategory, setInspectingCategory] = useState<CategoryType | null>(null);

  // New Experiment modal state
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expHypothesis, setExpHypothesis] = useState('');
  const [expAction, setExpAction] = useState('');
  const [expCategory, setExpCategory] = useState<CategoryType | 'All'>('Deep Work');

  // Filter tasks & logs by dateRange
  const now = new Date(selectedDate + 'T00:00:00Z');
  const daysLimit = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 999;

  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() - daysLimit);
  const minDateStr = minDate.toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (t.plannedDate > selectedDate || t.plannedDate < minDateStr) return false;
    if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false;
    return true;
  });

  const filteredLogs = logs.filter((l) => {
    if (l.activityDate > selectedDate || l.activityDate < minDateStr) return false;
    if (selectedCategoryFilter !== 'all' && l.category !== selectedCategoryFilter) return false;
    return true;
  });

  const totalPlannedMinutes = filteredTasks
    .filter((t) => t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);

  const totalActualMinutes = filteredLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
  const netGapMinutes = totalActualMinutes - totalPlannedMinutes;
  const overallAccuracy = calculatePlanningAccuracy(totalPlannedMinutes, totalActualMinutes);
  const completionRate = calculateCompletionRate(filteredTasks);
  const estimationStats = calculateTimeEstimationError(filteredTasks, filteredLogs);
  const categoryBreakdown = calculateCategoryBreakdown(filteredTasks, filteredLogs);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayPerformance = daysOfWeek.map((dayLabel, index) => {
    const dayTasks = filteredTasks.filter((t) => {
      const d = new Date(t.plannedDate + 'T00:00:00Z').getDay();
      return d === index && t.status !== 'cancelled';
    });
    const completed = dayTasks.filter((t) => t.status === 'completed').length;
    const rate = dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0;
    return {
      day: dayLabel,
      completionRate: rate,
      taskCount: dayTasks.length,
    };
  });

  const pieData = [
    { name: 'Accurate (±15%)', value: estimationStats.accurateCount, color: '#FFFFFF' },
    { name: 'Underestimated (>15% over)', value: estimationStats.underestimatedCount, color: 'rgba(255, 255, 255, 0.6)' },
    { name: 'Overestimated (<15% under)', value: estimationStats.overestimatedCount, color: 'rgba(255, 255, 255, 0.3)' },
  ].filter((d) => d.value > 0);

  const inspectedTasks = inspectingCategory
    ? filteredTasks.filter((t) => t.category === inspectingCategory)
    : [];

  const handleLaunchExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expHypothesis.trim()) return;

    addExperiment({
      title: expTitle.trim(),
      hypothesis: expHypothesis.trim(),
      actionProtocol: expAction.trim() || 'Log daily execution drift for 7 consecutive days.',
      targetCategory: expCategory,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      notes: 'Initiated from Pattern Lab discovery.',
    });

    setIsNewExpModalOpen(false);
    setExpTitle('');
    setExpHypothesis('');
    setExpAction('');
  };

  const handleLaunchFromInsight = (insight: Insight) => {
    addExperiment({
      patternId: insight.id,
      title: `Experiment: ${insight.title}`,
      hypothesis: `Testing hypothesis for ${insight.title}. Target: eliminate observed variance.`,
      actionProtocol: insight.suggestedExperiment,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      notes: `Observed evidence: ${insight.evidence}`,
    });
  };

  const activeExperiments = experiments.filter((e) => e.status === 'active');

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* Header with Sub-Tab Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Reality Analytics & Pattern Lab
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Empirical diagnostic metrics and behavioral hypothesis experiments
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl p-1 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Performance Analytics</span>
          </button>
          <button
            onClick={() => setActiveSubTab('patterns')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'patterns'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Pattern Lab ({insights.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' ? (
        <>
          {/* Range bar */}
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
              Audit Window
            </span>
            <div className="flex rounded-full border border-white/15 bg-white/[0.04] p-0.5">
              {(['7d', '14d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase font-mono transition-all ${
                    dateRange === range
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Aggregate Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10 text-xs text-zinc-400 font-medium">Net Intention Gap</div>
              <div className="relative z-10 mt-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-white">
                  {netGapMinutes > 0 ? `+${formatDuration(netGapMinutes)}` : formatDuration(netGapMinutes)}
                </span>
              </div>
              <div className="relative z-10 mt-2 text-[11px] text-zinc-400">
                {netGapMinutes > 0 ? 'Total logged time exceeded original schedule' : 'Executed within planned allocation'}
              </div>
            </div>

            <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10 text-xs text-zinc-400 font-medium">Planning Accuracy</div>
              <div className="relative z-10 mt-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-white">
                  {overallAccuracy}%
                </span>
                <span className="text-xs text-zinc-400">fidelity</span>
              </div>
              <div className="relative z-10 mt-2 text-[11px] text-zinc-400">
                Across {filteredTasks.length} planned commitments
              </div>
            </div>

            <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10 text-xs text-zinc-400 font-medium">Estimation Caliber Bias</div>
              <div className="relative z-10 mt-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-white">
                  {estimationStats.errorPercent > 0 ? `+${estimationStats.errorPercent}%` : `${estimationStats.errorPercent}%`}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  ({estimationStats.avgOverrunMinutes}m / task)
                </span>
              </div>
              <div className="relative z-10 mt-2 text-[11px] text-zinc-400">
                {estimationStats.underestimatedCount} underestimated vs {estimationStats.accurateCount} calibrated
              </div>
            </div>

            <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10 text-xs text-zinc-400 font-medium">Completion Velocity</div>
              <div className="relative z-10 mt-2 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-white">
                  {completionRate}%
                </span>
                <span className="text-xs text-zinc-400">
                  ({filteredTasks.filter((t) => t.status === 'completed').length} completed)
                </span>
              </div>
              <div className="relative z-10 mt-2 text-[11px] text-zinc-400">
                Ratio of eligible commitments executed
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Category Allocation & Gap</h2>
                  <p className="text-xs text-zinc-400">Planned hours vs actual logged hours per focus domain</p>
                </div>
                <span className="text-[11px] text-zinc-400">Click a bar to inspect source tasks</span>
              </div>

              <div className="relative z-10 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryBreakdown.map((c) => ({
                      category: c.category.replace(' & ', ' '),
                      fullCategory: c.category,
                      plannedHours: Number((c.plannedMinutes / 60).toFixed(1)),
                      actualHours: Number((c.actualMinutes / 60).toFixed(1)),
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length) {
                        setInspectingCategory(e.activePayload[0].payload.fullCategory);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="category" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip
                      formatter={(value: any) => [`${value} hrs`]}
                      contentStyle={{ backgroundColor: '#000000', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                    />
                    <Bar dataKey="plannedHours" name="Planned" fill="rgba(255,255,255,0.4)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="actualHours" name="Actual" fill="#FFFFFF" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {inspectingCategory && (
                <div className="relative z-10 mt-4 rounded-xl border border-white/20 bg-white/10 p-3 flex items-center justify-between text-xs backdrop-blur-md">
                  <span className="text-white">
                    Inspecting: <strong className="text-white underline">{inspectingCategory}</strong> ({inspectedTasks.length} tasks)
                  </span>
                  <button
                    onClick={() => setInspectingCategory(null)}
                    className="text-zinc-400 hover:text-white underline text-[11px]"
                  >
                    Clear inspection
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 crystal-panel relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <h2 className="text-sm font-bold text-white tracking-tight">Time Estimation Calibration</h2>
                <p className="text-xs text-zinc-400">Distribution of forecast accuracy across paired tasks</p>

                <div className="h-52 w-full mt-2">
                  {pieData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      Insufficient task-log pairs to calculate distribution
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [`${val} tasks`, name]}
                          contentStyle={{ backgroundColor: '#000000', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 12, color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="relative z-10 space-y-1.5 border-t border-white/10 pt-3">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="h-2 w-2 rounded-full border border-white/20" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </span>
                    <span className="font-mono font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekday Performance */}
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-white tracking-tight">Weekday Execution Caliber</h2>
              <p className="text-xs text-zinc-400">Completion rate patterns by day of the week</p>

              <div className="grid grid-cols-7 gap-3 mt-4">
                {dayPerformance.map((dp) => (
                  <div
                    key={dp.day}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center flex flex-col items-center justify-between backdrop-blur-md hover:border-white/25 transition-all"
                  >
                    <span className="text-xs font-mono font-semibold text-zinc-400">{dp.day}</span>
                    <div className="my-2">
                      <span className="font-mono text-xl font-black text-white">
                        {dp.completionRate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">{dp.taskCount} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inspection Table if category clicked */}
          {inspectingCategory && (
            <div className="crystal-panel rounded-2xl p-5 animate-slide-up backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={inspectingCategory} />
                  <h3 className="text-sm font-bold text-white">Underlying Source Records</h3>
                </div>
                <button
                  onClick={() => setInspectingCategory(null)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-zinc-400">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Task</th>
                      <th className="pb-2">Estimated</th>
                      <th className="pb-2">Actual Recorded</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inspectedTasks.map((t) => {
                      const linkedLog = logs.find((l) => l.taskId === t.id);
                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-mono text-zinc-400">{t.plannedDate}</td>
                          <td className="py-2.5 font-semibold text-white">{t.title}</td>
                          <td className="py-2.5 font-mono text-zinc-300">
                            {formatDuration(t.estimatedDurationMinutes)}
                          </td>
                          <td className="py-2.5 font-mono font-bold text-white">
                            {linkedLog ? formatDuration(linkedLog.actualDurationMinutes) : '—'}
                          </td>
                          <td className="py-2.5 font-mono text-zinc-400 capitalize">{t.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Pattern Lab View */
        <div className="space-y-6">
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-4 flex items-start gap-3.5 backdrop-blur-2xl">
            <Info className="h-5 w-5 shrink-0 text-white mt-0.5" />
            <div className="space-y-1 text-xs text-zinc-300">
              <span className="font-bold text-white">Empirical Behavioral Analysis</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Patterns are statistical observations of past planning decisions—never moral labels. Formulate practical experiments to tighten execution calibration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="crystal-panel relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between hover:border-white/30 transition-all backdrop-blur-2xl"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase text-white">
                          PATTERN
                        </span>
                        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-white">
                          {insight.confidence} Confidence
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-white">{insight.title}</h3>
                    </div>

                    {insight.metricValue && (
                      <span className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs font-bold text-white">
                        {insight.metricValue}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs leading-relaxed text-zinc-300">
                    <span className="font-semibold text-zinc-400 uppercase text-[10px] font-mono block mb-1">
                      OBSERVATION
                    </span>
                    {insight.observation}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-400 uppercase text-[10px] font-mono block mb-1">
                      EMPIRICAL EVIDENCE ({insight.observationPeriod})
                    </span>
                    {insight.evidence}
                  </div>

                  <div className="rounded-xl border border-white/25 bg-white/[0.08] p-3 text-xs text-zinc-200 backdrop-blur-md">
                    <span className="font-bold text-white uppercase text-[10px] font-mono block mb-1">
                      SUGGESTED EXPERIMENT
                    </span>
                    {insight.suggestedExperiment}
                  </div>
                </div>

                <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => voteInsight(insight.id, 'helpful')}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      title="Helpful"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => voteInsight(insight.id, 'unhelpful')}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleLaunchFromInsight(insight)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>Run Experiment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Experiments */}
          {activeExperiments.length > 0 && (
            <div className="crystal-panel rounded-2xl p-5 backdrop-blur-2xl">
              <h2 className="text-sm font-bold text-white tracking-tight mb-3">Active Behavioral Experiments</h2>
              <div className="space-y-3">
                {activeExperiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff] animate-pulse" />
                        <h3 className="text-xs font-bold text-white">{exp.title}</h3>
                      </div>
                      <p className="text-xs text-zinc-300">{exp.hypothesis}</p>
                    </div>

                    <button
                      onClick={() =>
                        updateExperiment({
                          ...exp,
                          status: 'completed',
                          endDate: new Date().toISOString().split('T')[0],
                          resultOutcome: 'Tested protocol successfully.',
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-black hover:bg-zinc-100 shadow-sm self-end md:self-auto"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
