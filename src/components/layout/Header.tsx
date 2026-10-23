import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Command,
  Moon,
  Plus,
  Sun,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const {
    selectedDate,
    setSelectedDate,
    setIsTaskModalOpen,
    setIsLogModalOpen,
    setEditingTask,
    setPreselectedLogTask,
    activeWorkspace,
    preferences,
    toggleSound,
  } = useApp();

  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00Z');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00Z');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate('2026-10-18');
  };

  const isToday = selectedDate === '2026-10-18';
  const displayDate = new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.1] bg-black/85 px-4 backdrop-blur-2xl sm:px-8">
      {/* Left: Brand Identity & Date Navigator */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-mono text-xs font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            RC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white">RealityCheck</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-white border border-white/20">
                v2.4
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-white/15 hidden sm:block" />

        {/* Date Selector Group */}
        <div className="flex items-center rounded-xl border border-white/[0.14] bg-white/[0.04] backdrop-blur-md p-0.5 shadow-sm">
          <button
            onClick={handlePrevDay}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleToday}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isToday
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            {isToday ? 'Today' : displayDate}
          </button>

          <button
            onClick={handleNextDay}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div className="relative ml-1 hidden items-center sm:flex">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Ribbon: Transposed Plan & Log Options, Command Palette, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Workspace Chip */}
        <span
          className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-[11px] font-mono font-bold text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          </span>
          {activeWorkspace === 'demo' ? '14d Demo' : 'Personal'}
        </span>

        {/* Command Palette Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-md px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white transition-colors"
        >
          <Command className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-400">Search...</span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-white/10">
            ⌘K
          </kbd>
        </motion.button>

        {/* Plan Task Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.06] backdrop-blur-md px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/[0.12] transition-colors"
          title="Plan New Task"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Plan Task</span>
          <span className="sm:hidden">Plan</span>
        </motion.button>

        {/* Pure White Log Activity Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setPreselectedLogTask(null);
            setIsLogModalOpen(true);
          }}
          className="animate-crystal-shimmer relative inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 sm:px-4 py-1.5 text-xs font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:bg-zinc-100"
          title="Log Actual Time"
        >
          <Zap className="h-3.5 w-3.5 fill-black text-black" />
          <span className="hidden sm:inline">Log Activity</span>
          <span className="sm:hidden">Log</span>
        </motion.button>

        {/* Sound FX Toggle Button */}
        <button
          onClick={toggleSound}
          className="rounded-xl border border-white/[0.12] bg-white/[0.04] p-2 text-zinc-400 hover:border-white/30 hover:text-white transition-colors"
          title={preferences.soundEnabled === false ? 'Unmute focus bells' : 'Mute focus bells'}
        >
          {preferences.soundEnabled === false ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-white" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-white/[0.12] bg-white/[0.04] p-2 text-zinc-400 hover:border-white/30 hover:text-white transition-colors"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* User Identity Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] pl-1.5 pr-2.5 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black text-[10px] font-black">
            AR
          </div>
          <span className="text-xs font-bold text-white">Alex</span>
        </div>
      </div>
    </header>
  );
};
