import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Info, Zap } from 'lucide-react';
import { ActivityLog, Task } from '../../types';
import { formatDuration } from '../../lib/analytics/gapEngine';
import { CategoryBadge } from '../ui/CategoryBadge';

interface DayFlowTimelineProps {
  tasks: Task[];
  logs: ActivityLog[];
  selectedDate: string;
}

export const DayFlowTimeline: React.FC<DayFlowTimelineProps> = ({
  tasks,
  logs,
  selectedDate,
}) => {
  const [hoveredItem, setHoveredItem] = useState<{
    type: 'planned' | 'actual';
    title: string;
    category: any;
    duration: number;
    time?: string;
  } | null>(null);

  // Focus day window: 8:00 (480 mins) to 20:00 (1200 mins) = 720 mins range
  const START_HOUR = 8;
  const END_HOUR = 20;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const START_MINS = START_HOUR * 60;
  const TOTAL_MINS = TOTAL_HOURS * 60;

  const hoursMarks = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Position calculation helper (0% to 100%)
  const getPercent = (timeStr?: string, defaultIndex = 0, duration = 45) => {
    let startMin = START_MINS + defaultIndex * 60;
    if (timeStr) {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        startMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
    }
    const clampedStart = Math.max(START_MINS, Math.min(START_MINS + TOTAL_MINS, startMin));
    const leftPercent = ((clampedStart - START_MINS) / TOTAL_MINS) * 100;
    const widthPercent = Math.max(2.5, Math.min(100 - leftPercent, (duration / TOTAL_MINS) * 100));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const todayTasks = tasks.filter((t) => t.plannedDate === selectedDate && t.status !== 'cancelled');
  const todayLogs = logs.filter((l) => l.activityDate === selectedDate);

  // Current time position
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const nowPercent = ((currentMins - START_MINS) / TOTAL_MINS) * 100;
  const isNowVisible = nowPercent >= 0 && nowPercent <= 100;

  return (
    <div className="crystal-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-3xl border border-white/20 shadow-2xl space-y-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
            Interactive Day Flow
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Synchronized Timeline (8:00 AM – 8:00 PM)
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded bg-white/20 border border-white/30" />
            <span className="text-zinc-400">Planned Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded bg-white shadow-[0_0_8px_#fff]" />
            <span className="text-white font-bold">Logged Reality</span>
          </div>
        </div>
      </div>

      {/* Timeline Visual Canvas */}
      <div className="relative z-10 space-y-3 pt-2">
        {/* Hour Markers */}
        <div className="relative h-6 flex justify-between text-[10px] font-mono text-zinc-500 border-b border-white/10 pb-1 px-1">
          {hoursMarks.map((hour) => (
            <span key={hour} className="text-center">
              {hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`}
            </span>
          ))}
        </div>

        {/* Tracks Container */}
        <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3 space-y-2.5 overflow-hidden">
          {/* Vertical grid lines */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-3">
            {hoursMarks.map((h) => (
              <div key={h} className="h-full w-px bg-white/[0.04]" />
            ))}
          </div>

          {/* Current Time Indicator Line */}
          {isNowVisible && (
            <div
              className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_8px_#fff] pointer-events-none"
              style={{ left: `${nowPercent}%` }}
            >
              <div className="absolute -top-1 -left-1.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_10px_#fff] flex items-center justify-center text-[8px] text-black font-black">
                •
              </div>
            </div>
          )}

          {/* Track 1: Planned Intentions */}
          <div className="relative h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center">
            {todayTasks.length === 0 ? (
              <span className="text-[11px] text-zinc-600 font-mono px-3">No scheduled blocks planned</span>
            ) : (
              todayTasks.map((t, idx) => {
                const pos = getPercent(t.scheduledStartTime, idx, t.estimatedDurationMinutes);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: 'planned',
                        title: t.title,
                        category: t.category,
                        duration: t.estimatedDurationMinutes,
                        time: t.scheduledStartTime,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ left: pos.left, width: pos.width }}
                    className="absolute h-7 rounded-lg border border-white/20 bg-white/10 hover:bg-white/25 hover:border-white/50 cursor-pointer transition-colors flex items-center px-2 overflow-hidden shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-white truncate">{t.title}</span>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Track 2: Actual Logged Sessions */}
          <div className="relative h-9 rounded-xl bg-white/[0.02] border border-white/5 flex items-center">
            {todayLogs.length === 0 ? (
              <span className="text-[11px] text-zinc-600 font-mono px-3">No actual sessions logged yet</span>
            ) : (
              todayLogs.map((l, idx) => {
                const pos = getPercent(l.startedAt, idx, l.actualDurationMinutes);
                return (
                  <motion.div
                    key={l.id}
                    layout
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: 'actual',
                        title: l.taskTitle,
                        category: l.category,
                        duration: l.actualDurationMinutes,
                        time: l.startedAt,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ left: pos.left, width: pos.width }}
                    className="absolute h-7 rounded-lg border border-white bg-white text-black font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center px-2 overflow-hidden"
                  >
                    <span className="text-[10px] font-black text-black truncate">{l.taskTitle}</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Hover Popover Info Bar */}
        <div className="min-h-[36px] flex items-center justify-between text-xs px-2 pt-1">
          <AnimatePresence mode="wait">
            {hoveredItem ? (
              <motion.div
                key="hovered"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 flex-wrap"
              >
                <span className="font-mono text-zinc-400 uppercase text-[10px] font-bold">
                  {hoveredItem.type === 'planned' ? 'Intention:' : 'Verified Log:'}
                </span>
                <span className="font-bold text-white">{hoveredItem.title}</span>
                <CategoryBadge category={hoveredItem.category} size="sm" />
                <span className="font-mono text-zinc-300">
                  {formatDuration(hoveredItem.duration)}
                </span>
                {hoveredItem.time && (
                  <span className="font-mono text-zinc-400">@{hoveredItem.time}</span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5"
              >
                <Info className="h-3.5 w-3.5" />
                <span>Hover over any timeline block to inspect duration, category, and scheduled drift.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
