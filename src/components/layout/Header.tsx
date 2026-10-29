import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Command,
  Plus,
  Search,
  Settings,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const {
    navigateToHome,
    selectedDate,
    setSelectedDate,
    setIsTaskModalOpen,
    setIsLogModalOpen,
    setEditingTask,
    setPreselectedLogTask,
    preferences,
    theme,
    setIsSettingsModalOpen,
  } = useApp();

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
  const displayDateMobile = new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const firstName = preferences.displayName
    ? preferences.displayName.trim().split(' ')[0]
    : 'User';

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between px-3 sm:px-8 backdrop-blur-2xl transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-white/80 text-[#0F141C]'
          : 'bg-black/85 text-white'
      }`}
    >
      {/* Left: Clean, Modern, Iconic Brand & Date Navigator */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Modern Minimalist RealityCheck Logo (Click returns to Home) */}
        <div
          role="button"
          tabIndex={0}
          onClick={navigateToHome}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigateToHome();
            }
          }}
          className="flex items-center gap-2 cursor-pointer select-none group transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl py-0.5 px-0.5 sm:px-1"
          title="Return to RealityCheck Home Page"
        >
          {/* Razor-sharp precision check-circle badge */}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 shrink-0 ${
              theme === 'light'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4.5 w-4.5 stroke-[2.6] fill-none ${
                theme === 'light' ? 'stroke-white' : 'stroke-black'
              }`}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 12A9.5 9.5 0 1 1 12 2.5a9.5 9.5 0 0 1 6.5 2.6" />
              <path d="m8.5 12 3 3L22 4" />
            </svg>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span
              className={`font-monteilga text-xl font-normal tracking-tight leading-none ${
                theme === 'light' ? 'text-zinc-900' : 'text-white'
              }`}
            >
              reality
              <span
                className={`font-light italic ml-1 ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                check
              </span>
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                theme === 'light'
                  ? 'bg-zinc-900 shadow-[0_0_6px_rgba(0,0,0,0.3)]'
                  : 'bg-white shadow-[0_0_6px_#fff]'
              }`}
            />
          </div>
        </div>

        <div
          className={`h-5 w-px hidden sm:block ${
            theme === 'light' ? 'bg-zinc-200' : 'bg-white/15'
          }`}
        />

        {/* Date Selector Group */}
        <div
          className={`flex items-center rounded-xl border p-0.5 shadow-sm transition-colors ${
            theme === 'light'
              ? 'border-zinc-200 bg-zinc-100 text-zinc-800'
              : 'border-white/[0.14] bg-white/[0.04] text-white backdrop-blur-md'
          }`}
        >
          <button
            onClick={handlePrevDay}
            className={`rounded-lg p-1 sm:p-1.5 transition-colors ${
              theme === 'light'
                ? 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleToday}
            className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isToday
                ? theme === 'light'
                  ? 'bg-zinc-900 text-white font-bold shadow-sm'
                  : 'bg-white text-black font-bold shadow-sm'
                : theme === 'light'
                ? 'text-zinc-700 hover:bg-zinc-200'
                : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span className="sm:hidden">{isToday ? 'Today' : displayDateMobile}</span>
            <span className="hidden sm:inline">{isToday ? 'Today' : displayDate}</span>
          </button>

          <button
            onClick={handleNextDay}
            className={`rounded-lg p-1 sm:p-1.5 transition-colors ${
              theme === 'light'
                ? 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
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
            <div
              className={`rounded-lg p-1.5 transition-colors ${
                theme === 'light'
                  ? 'text-zinc-600 hover:bg-zinc-200'
                  : 'text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Search, Plan, Log, Settings/Profile Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenCommandPalette}
          className={`flex lg:hidden items-center justify-center h-8 w-8 rounded-xl border transition-colors ${
            theme === 'light'
              ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 shadow-sm'
              : 'border-white/[0.12] bg-white/[0.04] backdrop-blur-md text-zinc-300 hover:text-white'
          }`}
          title="Search & Commands (⌘K)"
        >
          <Search className="h-3.5 w-3.5" />
        </motion.button>

        {/* Command Palette Trigger Button (Desktop) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenCommandPalette}
          className={`hidden lg:flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
            theme === 'light'
              ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 shadow-sm'
              : 'border-white/[0.12] bg-white/[0.04] backdrop-blur-md text-zinc-300 hover:border-white/30 hover:text-white'
          }`}
        >
          <Command className={`h-3.5 w-3.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <span className={theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}>Search...</span>
          <kbd
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono border ${
              theme === 'light'
                ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                : 'bg-white/10 text-zinc-300 border-white/10'
            }`}
          >
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
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border h-8 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            theme === 'light'
              ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm'
              : 'border-white/20 bg-white/[0.06] backdrop-blur-md text-white hover:border-white/40 hover:bg-white/[0.12]'
          }`}
          title="Plan New Task"
        >
          <Plus className={`h-3.5 w-3.5 shrink-0 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`} />
          <span className="hidden sm:inline">Plan Task</span>
        </motion.button>

        {/* Log Activity Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setPreselectedLogTask(null);
            setIsLogModalOpen(true);
          }}
          className={`animate-crystal-shimmer relative inline-flex items-center justify-center gap-1.5 rounded-xl h-8 px-2.5 sm:px-4 py-1.5 text-xs font-black transition-all ${
            theme === 'light'
              ? 'bg-zinc-900 text-white shadow-sm hover:bg-black'
              : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-zinc-100'
          }`}
          title="Log Actual Time"
        >
          <Zap className={`h-3.5 w-3.5 shrink-0 ${theme === 'light' ? 'fill-white text-white' : 'fill-black text-black'}`} />
          <span className="hidden sm:inline">Log Activity</span>
        </motion.button>

        {/* Interactive User & Settings Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsSettingsModalOpen(true)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border h-8 p-1 sm:pl-1.5 sm:pr-2.5 transition-all shadow-sm ${
            theme === 'light'
              ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 hover:border-zinc-300'
              : 'border-white/[0.15] bg-white/[0.05] text-white hover:border-white/40 hover:bg-white/10'
          }`}
          title="Open Settings & Preferences (Change Name, Dark/Light Mode, Capacity)"
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shadow-sm shrink-0 ${
              theme === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-black'
            }`}
          >
            {getInitials(preferences.displayName || 'Alex')}
          </div>
          <span className="hidden sm:inline text-xs font-bold truncate max-w-[75px] sm:max-w-[100px]">
            {firstName}
          </span>
          <Settings className={`hidden sm:block h-3 w-3 shrink-0 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`} />
        </motion.button>
      </div>
    </header>
  );
};
