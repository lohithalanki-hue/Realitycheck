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
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { ScrollStageIndicator, Stage } from '../components/ui/ScrollStageIndicator';
import { useApp } from '../context/AppContext';
import {
  calculateCategoryBreakdown,
  calculateCompletionRate,
  calculatePlanningAccuracy,
  calculateTimeEstimationError,
  formatDuration,
} from '../lib/analytics/gapEngine';
import { CategoryType, Experiment, Insight, Task } from '../types';

const ANALYTICS_STAGES: Stage[] = [
  { id: 'analytics-hero', number: '01', label: 'Empirical Truth' },
  { id: 'analytics-metrics', number: '02', label: 'Core Metrics' },
  { id: 'analytics-accuracy', number: '03', label: 'Estimation Bias' },
  { id: 'analytics-categories', number: '04', label: 'Category & Patterns' },
];

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
    { name: 'Overestimated (<15% under)', value: estimationStats.overestimatedCount, color: 'rgba(255, 255, 255, 0.25)' },
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
    <div className="relative space-y-44 sm:space-y-52 pb-48">
      {/* Chapter navigation rail */}
      <ScrollStageIndicator stages={ANALYTICS_STAGES} />

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 1: HERO & AUDIT HORIZON (Slow Dolby Atmosphere)       */}
      {/* ------------------------------------------------------------- */}
      <section id="analytics-hero" className="relative pt-6 sm:pt-16 text-center min-h-[70vh] flex flex-col justify-center">
        <ScrollReveal mode="inView" duration={1.8} yOffset={40} blurAmount={12}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-2xl mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-pulse" />
            <span className="font-medium">Diagnostic Audit</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-zinc-400">{filteredTasks.length} Commitments Analyzed</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            See where your hours really go.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Honest diagnostic metrics discover recurring blind spots between your good intentions and actual execution.
          </p>

          {/* Sub-tab view toggle pill & Audit window */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="inline-flex rounded-full border border-white/20 bg-white/[0.04] p-1.5 backdrop-blur-2xl shadow-xl">
              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
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
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                  activeSubTab === 'patterns'
                    ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    : 'text-zinc-400 hover:text-white'
              }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Pattern Lab ({insights.length})</span>
              </button>
            </div>

            {activeSubTab === 'analytics' && (
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.04] p-1 backdrop-blur-2xl">
                {(['7d', '14d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase font-mono transition-all ${
                      dateRange === range
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 2: THE CORE DIAGNOSTIC METRICS                        */}
      {/* ------------------------------------------------------------- */}
      <section id="analytics-metrics" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 01
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              The Big Picture Numbers
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Macro performance across the audited window ({dateRange.toUpperCase()}) measured against empirical reality.
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Staggered Diagnostic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScrollReveal mode="inView" delay={0.1} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Net Time Gap</span>
                  <Clock className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-5 font-mono text-3xl font-black text-white">
                  {netGapMinutes > 0 ? `+${formatDuration(netGapMinutes)}` : formatDuration(netGapMinutes)}
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                {netGapMinutes > 0 ? 'Logged hours exceeded schedule' : 'Executed within planned allocation'}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.22} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Planning Accuracy</span>
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-white">{overallAccuracy}%</span>
                  <span className="text-xs text-zinc-400">fidelity</span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                Across {filteredTasks.length} planned commitments
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.34} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Task Follow-Through</span>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-white">{completionRate}%</span>
                  <span className="text-xs text-zinc-400">completed</span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                {filteredTasks.filter((t) => t.status === 'completed').length} of {filteredTasks.length} done
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.46} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Logged Time</span>
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 font-mono text-3xl font-black text-white">
                  {formatDuration(totalActualMinutes)}
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                Across {filteredLogs.length} verified sessions
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 3: ESTIMATION BIAS & DAY-OF-WEEK RHYTHM               */}
      {/* ------------------------------------------------------------- */}
      <section id="analytics-accuracy" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 02
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Estimation Bias & Weekly Rhythm
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Understand whether you habitually underestimate complex tasks and which days of the week deliver your highest execution rate.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* Pie Chart: Estimation Bias */}
          <ScrollReveal mode="inView" delay={0.12} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 backdrop-blur-3xl border border-white/20 shadow-2xl h-full flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Estimation Bias Breakdown
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">±15% Tolerance</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000000',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-white/10 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Accurate</span>
                    <span className="font-mono text-xl font-bold text-white">{estimationStats.accurateCount}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Underestimated</span>
                    <span className="font-mono text-xl font-bold text-white">{estimationStats.underestimatedCount}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Overestimated</span>
                    <span className="font-mono text-xl font-bold text-white">{estimationStats.overestimatedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Bar Chart: Day of Week Cadence */}
          <ScrollReveal mode="inView" delay={0.25} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 backdrop-blur-3xl border border-white/20 shadow-2xl h-full flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    Day-of-Week Follow-Through Rate
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">% Tasks Completed</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="day" stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                      <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000000',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="completionRate" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-zinc-400 flex items-center justify-between">
                  <span>Weekly velocity pattern</span>
                  <span className="font-bold text-white">Peak: Wednesday & Thursday</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 4: CATEGORY BREAKDOWN & PATTERN LAB                   */}
      {/* ------------------------------------------------------------- */}
      <section id="analytics-categories" className="space-y-10 scroll-mt-28">
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
                Category Drift & Pattern Lab
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Compare planned vs. actual allocations by category, and launch behavioral experiments to eliminate recurring time leaks.
              </p>
            </div>

            <button
              onClick={() => setIsNewExpModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Launch Experiment</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Category Table Card */}
        <ScrollReveal mode="inView" delay={0.15} duration={1.8} yOffset={70} blurAmount={10}>
          <div className="crystal-panel relative overflow-hidden rounded-3xl p-4 sm:p-7 backdrop-blur-3xl border border-white/20 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Category Allocation Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 font-mono uppercase">
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Planned Time</th>
                    <th className="pb-3 font-semibold">Actual Logged</th>
                    <th className="pb-3 font-semibold">Variance Gap</th>
                    <th className="pb-3 font-semibold">Accuracy</th>
                    <th className="pb-3 font-semibold text-right">Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5">
                        <CategoryBadge category={cat.category} size="sm" />
                      </td>
                      <td className="py-3.5 font-mono text-zinc-300">{formatDuration(cat.plannedMinutes)}</td>
                      <td className="py-3.5 font-mono text-white font-bold">{formatDuration(cat.actualMinutes)}</td>
                      <td className="py-3.5 font-mono">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            cat.gapMinutes > 30
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'text-zinc-400'
                          }`}
                        >
                          {cat.gapMinutes > 0 ? `+${formatDuration(cat.gapMinutes)}` : formatDuration(cat.gapMinutes)}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono font-bold text-white">{cat.accuracy}%</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setInspectingCategory(cat.category)}
                          className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                        >
                          Inspect Tasks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* Pattern Lab Experiments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {insights.map((insight, idx) => (
            <ScrollReveal
              key={insight.id}
              mode="inView"
              delay={0.12 * (idx + 1)}
              duration={1.8}
              yOffset={70}
              blurAmount={10}
            >
              <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col justify-between h-full">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-black font-black">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-mono uppercase text-zinc-400 font-bold">
                        Observed Pattern
                      </span>
                    </div>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-mono font-bold text-white">
                      {insight.metricValue}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white">{insight.title}</h4>
                    <p className="mt-2 text-xs text-zinc-300 leading-relaxed">{insight.observation}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-zinc-300 space-y-1">
                    <span className="font-bold text-white uppercase font-mono text-[10px] block">
                      Hypothesis Protocol:
                    </span>
                    <p>{insight.suggestedExperiment}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => voteInsight(insight.id, 'helpful')}
                      className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Helpful"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => voteInsight(insight.id, 'unhelpful')}
                      className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleLaunchFromInsight(insight)}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-sm"
                  >
                    Launch as Experiment
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Drilldown Category Inspection Modal */}
      {inspectingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="crystal-panel relative max-w-xl w-full rounded-3xl p-7 backdrop-blur-3xl border border-white/25 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CategoryBadge category={inspectingCategory} />
                <h3 className="text-xl font-bold text-white">Task Audit</h3>
              </div>
              <button
                onClick={() => setInspectingCategory(null)}
                className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Auditing all commitments planned under {inspectingCategory} in this window:
            </p>

            <div className="space-y-2.5">
              {inspectedTasks.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No tasks recorded in this category for this window.</p>
              ) : (
                inspectedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{t.title}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{t.plannedDate} • {t.status}</div>
                    </div>
                    <span className="font-mono font-bold text-white">{formatDuration(t.estimatedDurationMinutes)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Experiment Modal */}
      {isNewExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="crystal-panel relative max-w-lg w-full rounded-3xl p-7 backdrop-blur-3xl border border-white/25 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create New Behavioral Experiment</h3>
              <button
                onClick={() => setIsNewExpModalOpen(false)}
                className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchExperiment} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1.5">Experiment Title</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. 15-Minute Buffer Protocol for Deep Work"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1.5">Target Hypothesis</label>
                <textarea
                  required
                  rows={3}
                  value={expHypothesis}
                  onChange={(e) => setExpHypothesis(e.target.value)}
                  placeholder="If I pad complex tasks by 15 minutes, will my schedule overrun decrease by 50%?"
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1.5">Target Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none"
                >
                  <option value="All" className="bg-black text-white">All Categories</option>
                  <option value="Deep Work" className="bg-black text-white">Deep Work</option>
                  <option value="Meetings & Syncs" className="bg-black text-white">Meetings & Syncs</option>
                  <option value="Creative & Design" className="bg-black text-white">Creative & Design</option>
                  <option value="Learning & Research" className="bg-black text-white">Learning & Research</option>
                  <option value="Admin & Operations" className="bg-black text-white">Admin & Operations</option>
                  <option value="Health & Personal" className="bg-black text-white">Health & Personal</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewExpModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-white px-5 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-sm"
                >
                  Start Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
