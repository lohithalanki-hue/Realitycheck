import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatDuration } from '../../lib/analytics/gapEngine';
import { DayMetric } from '../../types';

interface ChartProps {
  data: DayMetric[];
}

export const PlannedVsActualChart: React.FC<ChartProps> = ({ data }) => {
  const [viewRange, setViewRange] = useState<'7d' | '14d'>('7d');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const displayData = viewRange === '7d' ? data.slice(-7) : data;

  const chartFormattedData = displayData.map((d) => ({
    name: d.dayLabel,
    date: d.date,
    plannedHours: Number((d.plannedMinutes / 60).toFixed(2)),
    actualHours: Number((d.actualMinutes / 60).toFixed(2)),
    plannedMinutes: d.plannedMinutes,
    actualMinutes: d.actualMinutes,
    gapMinutes: d.gapMinutes,
  }));

  const hasData = chartFormattedData.some((d) => d.plannedMinutes > 0 || d.actualMinutes > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      const planned = pData.plannedMinutes;
      const actual = pData.actualMinutes;
      const gap = pData.gapMinutes;

      return (
        <div className="crystal-panel rounded-xl p-3.5 shadow-2xl backdrop-blur-2xl border border-white/20">
          <div className="text-xs font-bold text-white mb-2">
            {label} ({pData.date})
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                Planned Intention:
              </span>
              <span className="font-semibold text-white">{formatDuration(planned)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                Actual Logged:
              </span>
              <span className="font-bold text-white">{formatDuration(actual)}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between gap-6">
              <span className="text-[11px] text-zinc-400">Variance Gap:</span>
              <span className="text-[11px] font-bold text-white">
                {gap > 0 ? `+${formatDuration(gap)} overrun` : gap < 0 ? `${formatDuration(gap)} buffer` : 'Exact match'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="crystal-panel relative overflow-hidden rounded-2xl p-5 backdrop-blur-2xl">
      {/* Specular sheen overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Planned vs Actual Execution
            </h3>
            <span className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-mono text-white">
              Crystalline Wave
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Comparing scheduled intention against recorded real hours
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-3 mr-2 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Planned
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              Actual
            </span>
          </div>

          <div className="flex rounded-lg border border-white/10 bg-black/60 p-0.5">
            <button
              onClick={() => setChartType('area')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                chartType === 'area'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bars
            </button>
          </div>

          <div className="flex rounded-lg border border-white/10 bg-black/60 p-0.5">
            <button
              onClick={() => setViewRange('7d')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewRange === '7d'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewRange('14d')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewRange === '14d'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="relative z-10 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/40 text-center p-6">
          <p className="text-xs font-medium text-zinc-400">No time records logged for this window.</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Schedule tasks in the Planner and log actual time to visualize your execution gap.
          </p>
        </div>
      ) : (
        <div className="relative z-10 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartFormattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="plannedHours"
                  stroke="#71717A"
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#plannedGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="actualHours"
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#actualGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartFormattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                <Bar dataKey="plannedHours" fill="#3F3F46" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="actualHours" fill="#FFFFFF" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
