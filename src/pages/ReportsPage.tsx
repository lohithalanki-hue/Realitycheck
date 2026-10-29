import React, { useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Keyboard,
  Printer,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
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
import { exportFullDataAsJSON, importFullDataFromJSON } from '../lib/storage';

const REPORTS_STAGES: Stage[] = [
  { id: 'reports-hero', number: '01', label: 'Retrospective' },
  { id: 'reports-summary', number: '02', label: 'Weekly Delta' },
  { id: 'reports-ledger', number: '03', label: 'Export Ledger' },
  { id: 'reports-settings', number: '04', label: 'Workspace & Data' },
];

export const ReportsPage: React.FC = () => {
  const {
    tasks,
    logs,
    selectedDate,
    showToast,
    preferences,
    updatePreferences,
    resetDemoData,
    clearPersonalData,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'settings'>('reports');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);

  // Settings form local state
  const [displayName, setDisplayName] = useState(preferences.displayName);
  const [title, setTitle] = useState(preferences.title || '');
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [weekStart, setWeekStart] = useState(preferences.weekStart);
  const [workHoursStart, setWorkHoursStart] = useState(preferences.workHoursStart);
  const [workHoursEnd, setWorkHoursEnd] = useState(preferences.workHoursEnd);
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(preferences.dailyAvailableMinutes);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getWeekDates = (offset: number) => {
    const end = new Date(selectedDate + 'T00:00:00Z');
    end.setDate(end.getDate() + offset * 7);

    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      startLabel: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      endLabel: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const currentWeek = getWeekDates(selectedWeekOffset);
  const previousWeek = getWeekDates(selectedWeekOffset - 1);

  const weekTasks = tasks.filter(
    (t) => t.plannedDate >= currentWeek.startDate && t.plannedDate <= currentWeek.endDate
  );
  const weekLogs = logs.filter(
    (l) => l.activityDate >= currentWeek.startDate && l.activityDate <= currentWeek.endDate
  );

  const prevWeekTasks = tasks.filter(
    (t) => t.plannedDate >= previousWeek.startDate && t.plannedDate <= previousWeek.endDate
  );
  const prevWeekLogs = logs.filter(
    (l) => l.activityDate >= previousWeek.startDate && l.activityDate <= previousWeek.endDate
  );

  const eligibleTasks = weekTasks.filter((t) => t.status !== 'cancelled');
  const totalPlannedMinutes = eligibleTasks.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0);
  const totalActualMinutes = weekLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
  const netGapMinutes = totalActualMinutes - totalPlannedMinutes;

  const completionRate = calculateCompletionRate(weekTasks);
  const planningAccuracy = calculatePlanningAccuracy(totalPlannedMinutes, totalActualMinutes);

  const prevActualMinutes = prevWeekLogs.reduce((sum, l) => sum + l.actualDurationMinutes, 0);
  const prevCompletionRate = calculateCompletionRate(prevWeekTasks);
  const prevAccuracy = calculatePlanningAccuracy(
    prevWeekTasks.reduce((sum, t) => sum + (t.status !== 'cancelled' ? t.estimatedDurationMinutes : 0), 0),
    prevActualMinutes
  );

  const deltaCompletion = completionRate - prevCompletionRate;
  const deltaHours = (totalActualMinutes - prevActualMinutes) / 60;

  const catBreakdown = calculateCategoryBreakdown(weekTasks, weekLogs);
  const activeCategories = catBreakdown.filter((c) => c.plannedMinutes > 0 || c.actualMinutes > 0);
  const sortedByAccuracy = [...activeCategories].sort((a, b) => b.accuracy - a.accuracy);
  const mostAccurateCategory = sortedByAccuracy[0];

  const sortedByGap = [...activeCategories].sort((a, b) => Math.abs(b.gapMinutes) - Math.abs(a.gapMinutes));
  const largestGapCategory = sortedByGap[0];
  const estimationStats = calculateTimeEstimationError(weekTasks, weekLogs);

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Type', 'Planned Minutes', 'Actual Minutes', 'Variance', 'Status'];
    const rows: string[][] = [];

    weekTasks.forEach((t) => {
      const linkedLog = weekLogs.find((l) => l.taskId === t.id);
      rows.push([
        t.plannedDate,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        'Planned Task',
        t.estimatedDurationMinutes.toString(),
        linkedLog ? linkedLog.actualDurationMinutes.toString() : '0',
        linkedLog ? (linkedLog.actualDurationMinutes - t.estimatedDurationMinutes).toString() : '0',
        t.status,
      ]);
    });

    weekLogs
      .filter((l) => l.isUnplanned)
      .forEach((l) => {
        rows.push([
          l.activityDate,
          `"${l.taskTitle.replace(/"/g, '""')}"`,
          l.category,
          'Spontaneous Activity',
          '0',
          l.actualDurationMinutes.toString(),
          `+${l.actualDurationMinutes}`,
          'completed',
        ]);
      });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RealityCheck_Audit_${currentWeek.startDate}_to_${currentWeek.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Weekly CSV audit export generated', 'success');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      displayName,
      title,
      timezone,
      weekStart,
      workHoursStart,
      workHoursEnd,
      dailyAvailableMinutes: Number(dailyAvailableMinutes),
    });
    showToast('Preferences saved successfully', 'success');
  };

  const handleDownloadBackup = () => {
    exportFullDataAsJSON();
    showToast('Full JSON backup downloaded', 'success');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = importFullDataFromJSON(text);
      if (success) {
        showToast('Data imported successfully. Reloading...', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast('Invalid backup file schema', 'error');
      }
    } catch {
      showToast('Error reading uploaded file', 'error');
    }
  };

  return (
    <div className="relative space-y-44 sm:space-y-52 pb-48">
      {/* Chapter navigation rail */}
      <ScrollStageIndicator stages={REPORTS_STAGES} />

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 1: HERO & WEEKLY RETROSPECTIVE (Slow Dolby Atmosphere) */}
      {/* ------------------------------------------------------------- */}
      <section id="reports-hero" className="relative pt-6 sm:pt-16 text-center min-h-[70vh] flex flex-col justify-center">
        <ScrollReveal mode="inView" duration={1.8} yOffset={40} blurAmount={12}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-2xl mb-6 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#fff] animate-pulse" />
            <span className="font-medium">Audit Period</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-zinc-400">
              {currentWeek.startLabel} – {currentWeek.endLabel}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Weekly audit & executive ledger.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Step back, celebrate honest follow-through, and export your verified hours for team stakeholders or billing records.
          </p>

          {/* Sub-tab view toggle pill */}
          <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/[0.04] p-1.5 backdrop-blur-2xl shadow-xl">
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeSubTab === 'reports'
                  ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Weekly Retrospective</span>
            </button>
            <button
              onClick={() => setActiveSubTab('settings')}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeSubTab === 'settings'
                  ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Workspace & Data Control</span>
            </button>
          </div>

          {/* Week offset navigator */}
          {activeSubTab === 'reports' && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setSelectedWeekOffset((w) => w - 1)}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors font-mono"
              >
                ← Previous Week
              </button>
              <button
                onClick={() => setSelectedWeekOffset(0)}
                className={`rounded-full px-4 py-1.5 text-xs font-mono transition-colors ${
                  selectedWeekOffset === 0
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'border border-white/15 text-zinc-400 hover:text-white'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => setSelectedWeekOffset((w) => w + 1)}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors font-mono"
              >
                Next Week →
              </button>
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 2: WEEK-OVER-WEEK DELTA & VELOCITY                    */}
      {/* ------------------------------------------------------------- */}
      <section id="reports-summary" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="text-center sm:text-left space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 01
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Week-Over-Week Velocity Delta
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Comparison between this 7-day window and the preceding cycle to gauge consistency and drift.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScrollReveal mode="inView" delay={0.1} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Weekly Follow-Through</span>
                  <Calendar className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">{completionRate}%</span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    {deltaCompletion >= 0 ? <ArrowUpRight className="h-3 w-3 text-white" /> : <ArrowDownRight className="h-3 w-3 text-zinc-400" />}
                    {deltaCompletion >= 0 ? `+${deltaCompletion}%` : `${deltaCompletion}%`}
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                {weekTasks.filter((t) => t.status === 'completed').length} of {weekTasks.length} commitments done
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.22} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Total Logged Volume</span>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">
                    {(totalActualMinutes / 60).toFixed(1)}h
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    {deltaHours >= 0 ? `+${deltaHours.toFixed(1)}h` : `${deltaHours.toFixed(1)}h`} vs prior
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                Across {weekLogs.length} verified sessions
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.34} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Planning Fidelity</span>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 flex items-baseline justify-between">
                  <span className="font-mono text-3xl font-black text-white">{planningAccuracy}%</span>
                  <span className="text-xs font-mono text-zinc-400">
                    {planningAccuracy - prevAccuracy >= 0 ? `+${planningAccuracy - prevAccuracy}%` : `${planningAccuracy - prevAccuracy}%`}
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                Net Gap: {netGapMinutes > 0 ? `+${formatDuration(netGapMinutes)}` : formatDuration(netGapMinutes)}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal mode="inView" delay={0.46} duration={1.8} yOffset={80} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/30 h-full flex flex-col justify-between shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase font-mono tracking-wider">
                  <span>Highest Accuracy</span>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="mt-5 font-mono text-xl font-black text-white truncate">
                  {mostAccurateCategory ? mostAccurateCategory.category : 'N/A'}
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-xs text-zinc-400">
                {mostAccurateCategory ? `${mostAccurateCategory.accuracy}% fidelity` : 'No category data'}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 3: CATEGORY AUDIT LEDGER & EXPORT TOOLS               */}
      {/* ------------------------------------------------------------- */}
      <section id="reports-ledger" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-white/40" />
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Chapter 02
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Category Ledger & Export Tools
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                Download a clean CSV spreadsheet audit for billing, or print a formatted snapshot for your records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV Audit</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Breakdown table card */}
        <ScrollReveal mode="inView" delay={0.15} duration={1.8} yOffset={70} blurAmount={10}>
          <div className="crystal-panel relative overflow-hidden rounded-3xl p-4 sm:p-7 backdrop-blur-3xl border border-white/20 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Weekly Time Allocation Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 font-mono uppercase">
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Planned Time</th>
                    <th className="pb-3 font-semibold">Actual Logged</th>
                    <th className="pb-3 font-semibold">Net Variance</th>
                    <th className="pb-3 font-semibold">Fidelity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {catBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-bold text-white">{cat.category}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CHAPTER 4: WORKSPACE SETTINGS & DATA SOVEREIGNTY              */}
      {/* ------------------------------------------------------------- */}
      <section id="reports-settings" className="space-y-10 scroll-mt-28">
        <ScrollReveal mode="inView" duration={1.7} yOffset={50} blurAmount={10}>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-white/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Chapter 03
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Workspace Settings & Data Sovereignty
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Configure your workday capacity parameters or download full portable JSON backups of your data.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* Workday Configuration Form */}
          <ScrollReveal mode="inView" delay={0.12} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 sm:p-9 backdrop-blur-3xl border border-white/20 shadow-2xl h-full flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
              <form onSubmit={handleSaveSettings} className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-lg font-bold text-white">Workday Capacity Setup</h3>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-semibold block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-semibold block mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lead Engineer"
                    className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 font-semibold block mb-1">Work Hours Start</label>
                    <input
                      type="time"
                      value={workHoursStart}
                      onChange={(e) => setWorkHoursStart(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-semibold block mb-1">Work Hours End</label>
                    <input
                      type="time"
                      value={workHoursEnd}
                      onChange={(e) => setWorkHoursEnd(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-semibold block mb-1">
                    Daily Capacity Target ({dailyAvailableMinutes / 60} hours)
                  </label>
                  <input
                    type="range"
                    min={120}
                    max={720}
                    step={30}
                    value={dailyAvailableMinutes}
                    onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
                    <span>2 hours</span>
                    <span>8 hours standard</span>
                    <span>12 hours max</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(preferences.displayName);
                      setTitle(preferences.title || '');
                      setWorkHoursStart(preferences.workHoursStart);
                      setWorkHoursEnd(preferences.workHoursEnd);
                      setDailyAvailableMinutes(preferences.dailyAvailableMinutes);
                      showToast('Changes reset to current settings', 'info');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Reset unsaved edits"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Changes</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-100 transition-all shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Parameters</span>
                  </button>
                </div>
              </form>
            </div>
          </ScrollReveal>

          {/* Backup, Restore, and Reset */}
          <ScrollReveal mode="inView" delay={0.25} duration={1.8} yOffset={70} blurAmount={10}>
            <div className="crystal-panel relative overflow-hidden rounded-3xl p-7 sm:p-9 backdrop-blur-3xl border border-white/20 shadow-2xl h-full flex flex-col justify-between">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-lg font-bold text-white">Data Sovereignty & Backups</h3>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your data stays 100% in your local browser storage. You can create a complete portable backup or import existing records anytime.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/20 transition-all shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import JSON Backup</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="pt-6 border-t border-white/10 space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                    Danger Zone
                  </span>

                  <div>
                    {confirmClearData ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs">
                        <span className="text-red-400 font-semibold text-center sm:text-left">
                          Permanently clear all tasks & logs? Workspace will start clean.
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              clearPersonalData();
                              setConfirmClearData(false);
                            }}
                            className="rounded-xl bg-red-600 px-3.5 py-1.5 font-bold text-white shadow-md hover:bg-red-500 transition-colors"
                          >
                            Yes, Clear All
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearData(false)}
                            className="rounded-xl border border-white/20 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearData(true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear All Workspace Data & Start Fresh</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};
