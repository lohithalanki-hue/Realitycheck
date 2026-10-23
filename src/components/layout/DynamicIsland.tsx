import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  FileText,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Square,
  Zap,
} from 'lucide-react';
import { NavigationTab, useApp } from '../../context/AppContext';

export const DynamicIsland: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeTimer,
    pauseTimer,
    resumeTimer,
    addTimerInterruption,
    finishTimerAndSave,
    activeWorkspace,
    setWorkspace,
    realityScore,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  const tabs: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'planner', label: 'Planner & Log', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics & Lab', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Config', icon: FileText },
  ];

  const formatTimerDigits = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-auto pointer-events-auto">
      <motion.div
        layout
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className={`crystal-panel relative overflow-hidden border border-white/20 bg-black/40 shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.35)] backdrop-blur-2xl ring-1 ring-white/10 ${
          isExpanded ? 'rounded-[40px] p-3' : 'rounded-full p-1.5'
        }`}
      >
        {/* Specular glass reflection layer */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent" />

        {/* Expanded Vertical Drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 overflow-hidden border-b border-white/[0.1] px-3 pb-3 pt-1 mb-1.5"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Workspace Switcher */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Workspace:</span>
                  <div className="flex rounded-full bg-black/50 p-0.5 border border-white/15 flex-1 sm:flex-none">
                    <button
                      onClick={() => setWorkspace('demo')}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                        activeWorkspace === 'demo'
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      14d Demo
                    </button>
                    <button
                      onClick={() => setWorkspace('personal')}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                        activeWorkspace === 'personal'
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Personal
                    </button>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-2.5 py-0.5 text-[11px] text-zinc-200">
                    <Flame className="h-3 w-3 fill-white text-white" />
                    <span className="font-bold">12d Streak</span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-mono text-white">
                    <span className="font-bold">Score: {realityScore.score}/100</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Island Horizontal Dock */}
        <div className="relative z-10 flex items-center justify-between gap-1 sm:gap-2 px-1">
          {/* 4 Core Tabs with Rounded Full Pill */}
          <div className="flex items-center gap-1 flex-1 sm:flex-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors flex-1 sm:flex-none justify-center ${
                    isActive ? 'text-black font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="islandActiveTab"
                      className="absolute inset-0 rounded-full bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.4)]"
                      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10 shrink-0" />
                  <span className="relative z-10 hidden sm:inline whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Live Timer Widget */}
          {activeTimer && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 pl-3 pr-1.5 py-1 text-xs shadow-md"
            >
              <span className="relative flex h-2 w-2">
                {activeTimer.isRunning && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              </span>

              {activeTimer.mode === 'pomodoro' && activeTimer.targetDurationMinutes ? (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] text-zinc-400 uppercase">Focus</span>
                  <span className="font-bold text-white">
                    {(() => {
                      const remainSec = Math.max(
                        0,
                        activeTimer.targetDurationMinutes * 60 - activeTimer.elapsedSeconds
                      );
                      return formatTimerDigits(remainSec);
                    })()}
                  </span>
                </div>
              ) : (
                <span className="font-mono font-bold text-white text-xs">
                  {formatTimerDigits(activeTimer.elapsedSeconds)}
                </span>
              )}

              <div className="flex items-center gap-1 ml-1">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="p-1 rounded-full text-zinc-300 hover:text-white"
                    title="Pause"
                  >
                    <Pause className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="p-1 rounded-full text-white"
                    title="Resume"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}

                <button
                  onClick={addTimerInterruption}
                  className="p-1 rounded-full text-zinc-300 hover:text-white"
                  title={`Log Interruption (${activeTimer.interruptionCount})`}
                >
                  <AlertCircle className="h-3 w-3" />
                </button>

                <button
                  onClick={() => finishTimerAndSave()}
                  className="p-1 rounded-full text-zinc-300 hover:text-white"
                  title="Finish & Save Session"
                >
                  <Square className="h-3 w-3 fill-white" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Expand / Collapse Island Drawer Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-full p-2 text-zinc-400 hover:bg-white/15 hover:text-white transition-colors ml-0.5"
            title={isExpanded ? 'Collapse Island Tray' : 'Expand Island Tray'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
