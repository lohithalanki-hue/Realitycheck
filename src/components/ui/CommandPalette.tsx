import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  CalendarDays,
  Clock,
  Compass,
  FileText,
  Flame,
  FlaskConical,
  Home,
  Laptop,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { NavigationTab, useApp } from '../../context/AppContext';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  category: 'Navigation' | 'Quick Actions' | 'Preferences';
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    navigateToHome,
    setActiveTab,
    setIsTaskModalOpen,
    setIsLogModalOpen,
    setEditingTask,
    setPreselectedLogTask,
    preferences,
    updatePreferences,
    startTimer,
    toggleSound,
    theme,
    toggleTheme,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      title: 'Go to Home Page',
      subtitle: 'RealityCheck animated welcome & landing page',
      icon: Home,
      shortcut: 'H',
      action: () => navigateToHome(),
      category: 'Navigation',
    },
    {
      id: 'nav-overview',
      title: 'Go to Overview',
      subtitle: 'Execution command center & Reality Score',
      icon: Compass,
      shortcut: '1',
      action: () => setActiveTab('overview'),
      category: 'Navigation',
    },
    {
      id: 'nav-planner',
      title: 'Go to Planner & Activity Tracker',
      subtitle: 'Daily schedule, capacity budget & live stopwatch',
      icon: CalendarDays,
      shortcut: '2',
      action: () => setActiveTab('planner'),
      category: 'Navigation',
    },
    {
      id: 'nav-analytics',
      title: 'Go to Reality Analytics & Pattern Lab',
      subtitle: 'Deep-dive charts & behavioral experiments',
      icon: BarChart3,
      shortcut: '3',
      action: () => setActiveTab('analytics'),
      category: 'Navigation',
    },
    {
      id: 'nav-reports',
      title: 'Go to Reports & Preferences',
      subtitle: 'Weekly audit dispatch, CSV export & configuration',
      icon: FileText,
      shortcut: '4',
      action: () => setActiveTab('reports'),
      category: 'Navigation',
    },

    // Quick Actions
    {
      id: 'act-plan',
      title: 'Plan New Task',
      subtitle: 'Add a commitment with duration estimate',
      icon: Plus,
      shortcut: 'P',
      action: () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
      },
      category: 'Quick Actions',
    },
    {
      id: 'act-log',
      title: 'Log Actual Activity',
      subtitle: 'Record real time expended to calibrate gap',
      icon: Zap,
      shortcut: 'L',
      action: () => {
        setPreselectedLogTask(null);
        setIsLogModalOpen(true);
      },
      category: 'Quick Actions',
    },
    {
      id: 'act-pomodoro',
      title: 'Start 25m Pomodoro Focus Block',
      subtitle: 'Dedicated deep work sprint with soothing chime',
      icon: Clock,
      action: () => {
        startTimer('Pomodoro Deep Work', 'Deep Work', null, true, 'pomodoro', 25);
      },
      category: 'Quick Actions',
    },
    {
      id: 'act-toggle-sound',
      title: preferences.soundEnabled === false ? 'Unmute Focus Bells & Chimes' : 'Mute Focus Sound FX',
      subtitle: preferences.soundEnabled === false ? 'Enable crystal audio feedback' : 'Run silently without audio',
      icon: preferences.soundEnabled === false ? Moon : Sparkles,
      action: () => toggleSound(),
      category: 'Preferences',
    },
    {
      id: 'act-toggle-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: theme === 'dark' ? 'Clean frosted titanium appearance' : 'OLED deep black crystalline aesthetic',
      icon: Sun,
      action: () => toggleTheme(),
      category: 'Preferences',
    },
  ];

  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 ${
              theme === 'light' ? 'bg-zinc-900/40 backdrop-blur-md' : 'bg-black/85 backdrop-blur-xl'
            }`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`relative w-full max-w-xl overflow-hidden rounded-3xl p-0 shadow-2xl z-10 ${
              theme === 'light'
                ? 'bg-white border border-zinc-200 text-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
                : 'crystal-panel border-white/20 text-white backdrop-blur-3xl'
            }`}
          >
            {/* Search Input Box */}
            <div
              className={`flex items-center border-b px-4 py-3.5 ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/10'
              }`}
            >
              <Search
                className={`h-4 w-4 shrink-0 mr-3 ${
                  theme === 'light' ? 'text-zinc-600' : 'text-white'
                }`}
              />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search page (e.g. 'Planner', 'Log', 'Demo')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`w-full bg-transparent text-sm focus:outline-none ${
                  theme === 'light' ? 'text-zinc-900 placeholder-zinc-400' : 'text-white placeholder-zinc-500'
                }`}
              />
              <button
                onClick={onClose}
                className={`rounded-xl p-1 transition-colors ${
                  theme === 'light'
                    ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div
                  className={`p-8 text-center text-xs ${
                    theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'
                  }`}
                >
                  No matching commands found.
                </div>
              ) : (
                filtered.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                        isSelected
                          ? theme === 'light'
                            ? 'bg-zinc-100 text-zinc-900 border border-zinc-300 shadow-sm'
                            : 'bg-white/15 text-white border border-white/30 shadow-sm'
                          : theme === 'light'
                          ? 'text-zinc-700 hover:bg-zinc-50 border border-transparent'
                          : 'text-zinc-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isSelected
                              ? theme === 'light'
                                ? 'bg-zinc-900 text-white font-bold shadow-sm'
                                : 'bg-white text-black font-bold'
                              : theme === 'light'
                              ? 'bg-zinc-100 text-zinc-600'
                              : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-xs font-bold truncate ${
                              theme === 'light' ? 'text-zinc-900' : 'text-white'
                            }`}
                          >
                            {cmd.title}
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                            }`}
                          >
                            {cmd.subtitle}
                          </div>
                        </div>
                      </div>

                      {cmd.shortcut && (
                        <kbd
                          className={`rounded px-2 py-0.5 text-[10px] font-mono border ${
                            theme === 'light'
                              ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              : 'bg-white/10 text-zinc-300 border-white/10'
                          }`}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-between border-t px-4 py-2.5 text-[11px] font-mono ${
                theme === 'light'
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-600'
                  : 'border-white/10 bg-black/60 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span className={`font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                RealityCheck
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
