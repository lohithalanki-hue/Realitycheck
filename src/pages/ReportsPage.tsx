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
import { useApp } from '../context/AppContext';
import {
  calculateCategoryBreakdown,
  calculateCompletionRate,
  calculatePlanningAccuracy,
  calculateTimeEstimationError,
  formatDuration,
} from '../lib/analytics/gapEngine';
import { exportFullDataAsJSON, importFullDataFromJSON } from '../lib/storage';

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
          l.actualDurationMinutes.toString(),
          l.completionStatus,
        ]);
      });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RealityCheck-Report-${currentWeek.startDate}-to-${currentWeek.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report CSV exported', 'success');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      displayName,
      title,
      timezone,
      weekStart,
      workHoursStart,
      workHoursEnd,
      dailyAvailableMinutes: Number(dailyAvailableMinutes) || 480,
    });
  };

  const handleExportJSON = () => {
    const dataStr = exportFullDataAsJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RealityCheck-Backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('All workspace data exported as JSON', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importFullDataFromJSON(content);
      if (success) {
        showToast('Backup restored successfully', 'success');
      } else {
        showToast('Invalid JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* Header with Sub-Tab Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Reports & Preferences
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Weekly execution audits, CSV export, and schedule parameters
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl p-1 self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'reports'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Weekly Reality Report</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeSubTab === 'settings'
                ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings & Data</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'reports' ? (
        <>
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap no-print">
            <select
              value={selectedWeekOffset}
              onChange={(e) => setSelectedWeekOffset(Number(e.target.value))}
              className="rounded-xl border border-white/15 bg-black/60 backdrop-blur-md px-3 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
            >
              <option value={0} className="bg-black text-white">Current Week ({currentWeek.startLabel} - {currentWeek.endLabel})</option>
              <option value={-1} className="bg-black text-white">Prior Week ({getWeekDates(-1).startLabel} - {getWeekDates(-1).endLabel})</option>
              <option value={-2} className="bg-black text-white">2 Weeks Ago ({getWeekDates(-2).startLabel} - {getWeekDates(-2).endLabel})</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-white/30 hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
              >
                <Printer className="h-3.5 w-3.5 fill-black" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Printable Report Crystal Canvas */}
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-white font-bold">
                  REALITYCHECK AUDIT DISPATCH
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Weekly Performance Review: {currentWeek.startLabel} – {currentWeek.endLabel}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Subject: {preferences.displayName} • Verification: Deterministic Intention Calibration
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-md px-4 py-2.5 text-center sm:text-right shadow-sm">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">Weekly Accuracy</span>
                <span className="font-mono text-2xl font-black text-white">{planningAccuracy}%</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Total Planned</span>
                <div className="mt-1 font-mono text-2xl font-black text-white">
                  {formatDuration(totalPlannedMinutes)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {eligibleTasks.length} commitments
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Total Logged Time</span>
                <div className="mt-1 font-mono text-2xl font-black text-white">
                  {formatDuration(totalActualMinutes)}
                </div>
                <div className="mt-0.5 flex items-center text-[10px] font-mono text-zinc-400">
                  {deltaHours >= 0 ? `+${deltaHours.toFixed(1)}h` : `${deltaHours.toFixed(1)}h`} vs prior week
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Net Intention Gap</span>
                <div className="mt-1 font-mono text-2xl font-black text-white">
                  {netGapMinutes > 0 ? `+${formatDuration(netGapMinutes)}` : formatDuration(netGapMinutes)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {netGapMinutes > 0 ? 'Budget overrun' : 'Under budget'}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <span className="text-[11px] font-mono uppercase text-zinc-400">Task Completion Rate</span>
                <div className="mt-1 font-mono text-2xl font-black text-white">
                  {completionRate}%
                </div>
                <div className="mt-0.5 flex items-center text-[10px] font-mono">
                  <span className="text-white flex items-center font-bold">
                    {deltaCompletion >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {deltaCompletion >= 0 ? `+${deltaCompletion}%` : `${deltaCompletion}%`}
                  </span>
                  <span className="text-zinc-500 ml-1">vs prior</span>
                </div>
              </div>
            </div>

            {/* Category Accuracy Table */}
            <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                Domain Accuracy Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] text-zinc-400">
                      <th className="pb-2">Domain</th>
                      <th className="pb-2">Planned</th>
                      <th className="pb-2">Actual Recorded</th>
                      <th className="pb-2">Net Gap</th>
                      <th className="pb-2 text-right">Planning Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeCategories.map((cat) => (
                      <tr key={cat.category}>
                        <td className="py-2.5 font-sans font-semibold text-white">{cat.category}</td>
                        <td className="py-2.5 text-zinc-400">{formatDuration(cat.plannedMinutes)}</td>
                        <td className="py-2.5 text-white font-bold">{formatDuration(cat.actualMinutes)}</td>
                        <td className="py-2.5 font-bold text-white">
                          {cat.gapMinutes > 0 ? `+${formatDuration(cat.gapMinutes)}` : formatDuration(cat.gapMinutes)}
                        </td>
                        <td className="py-2.5 text-right font-black text-white">{cat.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verified Audit Observations */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase font-bold text-white">
                  1. Calibration Anchor
                </span>
                <p className="text-xs text-white font-semibold">
                  {mostAccurateCategory
                    ? `${mostAccurateCategory.category} was your most calibrated domain.`
                    : 'Sufficient records needed.'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {mostAccurateCategory
                    ? `Achieved ${mostAccurateCategory.accuracy}% accuracy (${formatDuration(mostAccurateCategory.actualMinutes)} logged vs ${formatDuration(mostAccurateCategory.plannedMinutes)} planned).`
                    : 'Continue logging to identify your strongest planning anchor.'}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase font-bold text-white">
                  2. Primary Friction Point
                </span>
                <p className="text-xs text-white font-semibold">
                  {largestGapCategory && largestGapCategory.gapMinutes > 0
                    ? `${largestGapCategory.category} generated greatest time overrun.`
                    : 'Variance within nominal bounds.'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {largestGapCategory && largestGapCategory.gapMinutes > 0
                    ? `Accumulated ${formatDuration(largestGapCategory.gapMinutes)} beyond initial estimate.`
                    : 'Time commitments closely mirrored actual expending.'}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1 backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase font-bold text-white">
                  3. Estimation Bias Direction
                </span>
                <p className="text-xs text-white font-semibold">
                  {estimationStats.errorPercent > 10
                    ? `Systematic underestimation of ${estimationStats.errorPercent}%.`
                    : 'Balanced forecast calibration.'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Sample of {estimationStats.totalPairedTasks} recorded tasks indicates average overrun of {estimationStats.avgOverrunMinutes}m per task.
                </p>
              </div>
            </div>

            <div className="relative z-10 rounded-xl border border-white/20 bg-white/[0.06] p-4 flex items-start gap-3 backdrop-blur-md">
              <Sparkles className="h-5 w-5 shrink-0 text-white mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-white uppercase font-mono text-[10px]">
                  Prescribed Tactical Focus For Coming Week
                </span>
                <p className="text-zinc-200">
                  {largestGapCategory && largestGapCategory.gapMinutes > 60
                    ? `Allocate a mandatory 25% buffer on all upcoming "${largestGapCategory.category}" commitments before locking schedules.`
                    : 'Maintain current scheduling granularity and protect morning focus blocks from unscheduled interruptions.'}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Settings & Data Management View */
        <div className="space-y-6 max-w-3xl">
          <form onSubmit={handleSavePreferences} className="crystal-panel relative overflow-hidden rounded-2xl p-6 space-y-4 backdrop-blur-2xl">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <User className="h-4 w-4 text-white" />
              <h2 className="text-sm font-bold text-white">Operator Profile & Capacity Budget</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-400">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-400">
                  Daily Budget (Minutes)
                </label>
                <input
                  type="number"
                  min="60"
                  step="30"
                  value={dailyAvailableMinutes}
                  onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-mono text-white focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-400">
                  Workday Window
                </label>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <input
                    type="time"
                    value={workHoursStart}
                    onChange={(e) => setWorkHoursStart(e.target.value)}
                    className="rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-white"
                  />
                  <span className="text-zinc-500">to</span>
                  <input
                    type="time"
                    value={workHoursEnd}
                    onChange={(e) => setWorkHoursEnd(e.target.value)}
                    className="rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-400">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-white focus:outline-none"
                >
                  <option value="America/Los_Angeles (UTC-7)" className="bg-black text-white">America/Los Angeles (UTC-7)</option>
                  <option value="America/New_York (UTC-4)" className="bg-black text-white">America/New York (UTC-4)</option>
                  <option value="Europe/London (UTC+1)" className="bg-black text-white">Europe/London (UTC+1)</option>
                  <option value="Asia/Tokyo (UTC+9)" className="bg-black text-white">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
              >
                <Save className="h-3.5 w-3.5 fill-black" />
                <span>Save Parameters</span>
              </button>
            </div>
          </form>

          {/* Data Controls */}
          <div className="crystal-panel relative overflow-hidden rounded-2xl p-6 space-y-4 backdrop-blur-2xl">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <HardDrive className="h-4 w-4 text-white" />
              <h2 className="text-sm font-bold text-white">Workspace Data & Backup</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={resetDemoData}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 p-3 text-xs font-bold text-white hover:bg-white/20 transition-colors shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset 14-Day Demo Benchmark</span>
              </button>

              <button
                onClick={clearPersonalData}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Personal Records</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleExportJSON}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-white/30 hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-white/30 hover:text-white transition-colors cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Import JSON Backup</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
