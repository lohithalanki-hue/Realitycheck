import React from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Compass,
  FileText,
  Pause,
  Play,
  Square,
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
    theme,
  } = useApp();

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
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[96%] sm:w-auto pointer-events-auto px-1 sm:px-0">
      <motion.div
        layout
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className={`crystal-panel relative overflow-hidden rounded-full p-1 sm:p-1.5 backdrop-blur-2xl transition-colors duration-300 ${
          theme === 'light'
            ? 'border-black/10 bg-white/85 shadow-[0_20px_45px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.9)] ring-1 ring-black/5'
            : 'border-white/20 bg-black/40 shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.35)] ring-1 ring-white/10'
        }`}
      >
        {/* Specular glass reflection layer */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent" />

        {/* Dynamic Island Horizontal Dock */}
        <div className="relative z-10 flex items-center justify-between gap-1 sm:gap-2 px-0.5 sm:px-1">
          {/* 4 Core Tabs with Rounded Full Pill */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-1 sm:flex-none justify-around sm:justify-start">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  data-stay-dark={isActive ? 'true' : undefined}
                  data-active={isActive ? 'true' : undefined}
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className={`relative flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold transition-colors flex-1 sm:flex-none justify-center shrink-0 ${
                    isActive
                      ? theme === 'light'
                        ? '!text-white font-black'
                        : '!text-black font-black'
                      : theme === 'light'
                      ? 'text-zinc-600 hover:text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="islandActiveTab"
                      className={`absolute inset-0 rounded-full z-0 ${
                        theme === 'light'
                          ? 'bg-[#111418] shadow-md'
                          : 'bg-white shadow-[0_0_16px_rgba(255,255,255,0.4)]'
                      }`}
                      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    />
                  )}
                  <Icon
                    className={`h-4 w-4 relative z-10 shrink-0 ${
                      isActive
                        ? theme === 'light'
                          ? '!text-white !stroke-white'
                          : '!text-black !stroke-black'
                        : ''
                    }`}
                  />
                  <span
                    className={`relative z-10 hidden sm:inline whitespace-nowrap ${
                      isActive
                        ? theme === 'light'
                          ? '!text-white font-black'
                          : '!text-black font-black'
                        : ''
                    }`}
                  >
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
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full border pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-1 text-xs shadow-md shrink-0 ${
                theme === 'light'
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'border-white/30 bg-white/10 text-white'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {activeTimer.isRunning && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      theme === 'light' ? 'bg-zinc-900' : 'bg-white'
                    }`}
                  />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    theme === 'light'
                      ? 'bg-zinc-900 shadow-[0_0_6px_rgba(0,0,0,0.5)]'
                      : 'bg-white shadow-[0_0_6px_#fff]'
                  }`}
                />
              </span>

              {activeTimer.mode === 'pomodoro' && activeTimer.targetDurationMinutes ? (
                <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs">
                  <span
                    className={`text-[9px] sm:text-[10px] uppercase hidden sm:inline ${
                      theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    Focus
                  </span>
                  <span
                    className={`font-bold text-xs ${
                      theme === 'light' ? 'text-zinc-900' : 'text-white'
                    }`}
                  >
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
                <span
                  className={`font-mono font-bold text-xs ${
                    theme === 'light' ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {formatTimerDigits(activeTimer.elapsedSeconds)}
                </span>
              )}

              <div className="flex items-center gap-0.5 sm:gap-1 ml-0.5">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseTimer}
                    className={`p-1 rounded-full ${
                      theme === 'light'
                        ? 'text-zinc-700 hover:text-black'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                    title="Pause"
                  >
                    <Pause className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className={`p-1 rounded-full ${
                      theme === 'light' ? 'text-black font-bold' : 'text-white'
                    }`}
                    title="Resume"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}

                <button
                  onClick={addTimerInterruption}
                  className={`p-1 rounded-full ${
                    theme === 'light'
                      ? 'text-zinc-700 hover:text-black'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  title={`Log Interruption (${activeTimer.interruptionCount})`}
                >
                  <AlertCircle className="h-3 w-3" />
                </button>

                <button
                  onClick={() => finishTimerAndSave()}
                  className={`p-1 rounded-full ${
                    theme === 'light'
                      ? 'text-zinc-700 hover:text-black'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  title="Finish & Save Session"
                >
                  <Square
                    className={`h-3 w-3 ${
                      theme === 'light' ? 'fill-zinc-900 text-zinc-900' : 'fill-white text-white'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
