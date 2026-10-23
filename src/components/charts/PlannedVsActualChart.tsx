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
        <div className="glass-card rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl border border-white/25">
          <div className="text-xs font-bold text-white mb-2">
            {label} ({pData.date})
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-[#929B91]">
                <span className="h-2 w-2 rounded-full bg-[#86E3CE]/70" />
                Planned Intention:
              </span>
              <span className="font-semibold text-white">{formatDuration(planned)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-[#C6F66A]">
                <span className="h-2 w-2 rounded-full bg-[#C6F66A] shadow-[0_0_6px_#C6F66A]" />
                Actual Logged:
              </span>
              <span className="font-bold text-[#C6F66A]">{formatDuration(actual)}</span>
            </div>
            <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between gap-6">
              <span className="text-[11px] text-[#929B91]">Variance Gap:</span>
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
    <div className="glass-card relative overflow-hidden rounded-3xl p-6 backdrop-blur-2xl">
      {/* Specular sheen overlay matching reference photo */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.02] to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Planned vs Actual Execution
            </h3>
            <span className="rounded-full bg-[#C6F66A]/10 border border-[#C6F66A]/25 px-2 py-0.5 text-[10px] font-mono text-[#C6F66A]">
              Frosted Horizon
            </span>
          </div>
          <p className="text-xs text-[#929B91]">
            Comparing scheduled intention against recorded real hours
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-3 mr-2 text-xs">
            <span className="flex items-center gap-1.5 text-[#929B91]">
              <span className="h-2 w-2 rounded-full bg-[#86E3CE]/70" />
              Planned
            </span>
            <span className="flex items-center gap-1.5 text-[#C6F66A]">
              <span className="h-2 w-2 rounded-full bg-[#C6F66A] shadow-[0_0_6px_#C6F66A]" />
              Actual
            </span>
          </div>

          <div className="flex rounded-full border border-white/15 bg-white/[0.05] p-0.5 backdrop-blur-md">
            <button
              onClick={() => setChartType('area')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                chartType === 'area'
                  ? 'bg-white/20 text-white shadow-sm font-bold border border-white/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                chartType === 'bar'
                  ? 'bg-white/20 text-white shadow-sm font-bold border border-white/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bars
            </button>
          </div>

          <div className="flex rounded-full border border-white/15 bg-white/[0.05] p-0.5 backdrop-blur-md">
            <button
              onClick={() => setViewRange('7d')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewRange === '7d'
                  ? 'bg-white/20 text-white font-bold border border-white/25 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setViewRange('14d')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                viewRange === '14d'
                  ? 'bg-white/20 text-white font-bold border border-white/25 shadow-sm'
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
        <div className="relative z-10 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-center p-6 backdrop-blur-md">
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
                  <linearGradient id="actualGradLime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6F66A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C6F66A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="plannedGradMint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86E3CE" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#86E3CE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#929B91" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#929B91" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="plannedHours"
                  stroke="#86E3CE"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#plannedGradMint)"
                />
                <Area
                  type="monotone"
                  dataKey="actualHours"
                  stroke="#C6F66A"
                  strokeWidth={2.75}
                  fillOpacity={1}
                  fill="url(#actualGradLime)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartFormattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#929B91" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#929B91" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar dataKey="plannedHours" fill="#86E3CE" radius={[4, 4, 0, 0]} opacity={0.65} maxBarSize={28} />
                <Bar dataKey="actualHours" fill="#C6F66A" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
