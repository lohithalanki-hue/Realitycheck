import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Clock,
  Download,
  Moon,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportFullDataAsJSON } from '../../lib/storage';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    preferences,
    updatePreferences,
    theme,
    toggleTheme,
    toggleSound,
    clearPersonalData,
    showToast,
  } = useApp();

  const [name, setName] = useState(preferences.displayName || 'Alex');
  const [role, setRole] = useState(preferences.title || '');
  const [workHoursStart, setWorkHoursStart] = useState(preferences.workHoursStart || '09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState(preferences.workHoursEnd || '18:00');
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(
    preferences.dailyAvailableMinutes || 480
  );
  const [confirmClearData, setConfirmClearData] = useState(false);

  // Reset form inputs back to currently saved preferences
  const handleResetChanges = () => {
    setName(preferences.displayName || 'Alex');
    setRole(preferences.title || '');
    setWorkHoursStart(preferences.workHoursStart || '09:00');
    setWorkHoursEnd(preferences.workHoursEnd || '18:00');
    setDailyAvailableMinutes(preferences.dailyAvailableMinutes || 480);
    showToast('Changes reset to current settings', 'info');
  };

  // Reset preferences to default values
  const handleResetToDefaults = () => {
    setName('Alex');
    setRole('');
    setWorkHoursStart('09:00');
    setWorkHoursEnd('18:00');
    setDailyAvailableMinutes(480);
    updatePreferences({
      displayName: 'Alex',
      title: '',
      workHoursStart: '09:00',
      workHoursEnd: '18:00',
      dailyAvailableMinutes: 480,
    });
    showToast('Settings reset to default values', 'success');
  };

  useEffect(() => {
    if (isSettingsModalOpen) {
      setName(preferences.displayName || 'Alex');
      setRole(preferences.title || '');
      setWorkHoursStart(preferences.workHoursStart || '09:00');
      setWorkHoursEnd(preferences.workHoursEnd || '18:00');
      setDailyAvailableMinutes(preferences.dailyAvailableMinutes || 480);
    }
  }, [isSettingsModalOpen, preferences]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      displayName: name.trim() || 'User',
      title: role.trim(),
      workHoursStart,
      workHoursEnd,
      dailyAvailableMinutes,
    });
    showToast('Preferences updated successfully', 'success');
    setIsSettingsModalOpen(false);
  };

  const handleDownloadBackup = () => {
    try {
      const json = exportFullDataAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RealityCheck_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('JSON backup exported', 'success');
    } catch (e) {
      showToast('Failed to export backup', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsModalOpen(false)}
            className={`fixed inset-0 ${
              theme === 'light' ? 'bg-zinc-900/40 backdrop-blur-md' : 'bg-black/80 backdrop-blur-md'
            }`}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`relative w-full max-w-lg overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto ${
              theme === 'light'
                ? 'bg-white border border-zinc-200 text-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
                : 'crystal-panel border border-white/20 text-white backdrop-blur-3xl'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b pb-4 ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-black shadow-sm ${
                    theme === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-black'
                  }`}
                >
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    Account & Preferences
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Configure your profile, theme, and capacity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className={`rounded-xl p-1.5 transition-colors ${
                  theme === 'light'
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-6">
              {/* Profile Section */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <span
                    className={`text-xs font-mono uppercase tracking-wider font-bold ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Identity
                  </span>
                </div>

                <div>
                  <label
                    className={`text-xs font-semibold block mb-1 ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name..."
                    className={`w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                        : 'border border-white/15 bg-black/60 text-white placeholder-zinc-500 focus:border-white'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`text-xs font-semibold block mb-1 ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Job Title / Focus Area
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lead Engineer, Product Designer..."
                    className={`w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                        : 'border border-white/15 bg-black/60 text-white placeholder-zinc-500 focus:border-white'
                    }`}
                  />
                </div>
              </div>

              {/* Theme & Appearance Section */}
              <div
                className={`space-y-3.5 pt-4 border-t ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <span
                    className={`text-xs font-mono uppercase tracking-wider font-bold ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Theme & Appearance
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                    }}
                    className={`flex flex-col items-start gap-2.5 rounded-2xl p-4 border text-left transition-all ${
                      theme === 'dark'
                        ? 'border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/20'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          theme === 'dark'
                            ? 'bg-black border border-white/20 text-white'
                            : 'bg-zinc-800 text-white shadow-sm'
                        }`}
                      >
                        <Moon className="h-4 w-4" />
                      </div>
                      {theme === 'dark' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                        Dark Mode
                      </div>
                      <div className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        OLED crystalline deep black
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                    }}
                    className={`flex flex-col items-start gap-2.5 rounded-2xl p-4 border text-left transition-all ${
                      theme === 'light'
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-900'
                        : 'border-white/15 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          theme === 'light'
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-white text-black border border-black/10'
                        }`}
                      >
                        <Sun className="h-4 w-4" />
                      </div>
                      {theme === 'light' && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        Light Mode
                      </div>
                      <div className={`text-[10px] mt-0.5 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        Frosted titanium crisp white
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Audio & Sound Section */}
              <div
                className={`space-y-3 pt-4 border-t ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {preferences.soundEnabled !== false ? (
                      <Volume2 className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`} />
                    ) : (
                      <VolumeX className="h-4 w-4 text-zinc-500" />
                    )}
                    <div>
                      <span className={`text-xs font-bold block ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                        Focus Bells & Audio
                      </span>
                      <span className={`text-[11px] ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Synthesized crystal chimes on timer completion and task check-offs
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSound}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.soundEnabled !== false
                        ? theme === 'light'
                          ? 'bg-zinc-900'
                          : 'bg-white'
                        : theme === 'light'
                        ? 'bg-zinc-300'
                        : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                        theme === 'light' ? 'bg-white' : 'bg-black'
                      } ${preferences.soundEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Workday Capacity Section */}
              <div
                className={`space-y-3.5 pt-4 border-t ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <span
                    className={`text-xs font-mono uppercase tracking-wider font-bold ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Workday Schedule & Capacity
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`text-xs font-semibold block mb-1 ${
                        theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={workHoursStart}
                      onChange={(e) => setWorkHoursStart(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                        theme === 'light'
                          ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                          : 'border border-white/15 bg-black/60 text-white focus:border-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs font-semibold block mb-1 ${
                        theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={workHoursEnd}
                      onChange={(e) => setWorkHoursEnd(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                        theme === 'light'
                          ? 'border border-zinc-300 bg-white text-zinc-900 focus:border-zinc-900'
                          : 'border border-white/15 bg-black/60 text-white focus:border-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div
                    className={`flex items-center justify-between text-xs font-semibold mb-1 ${
                      theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    <span>Daily Capacity Target</span>
                    <span className={`font-mono font-bold ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                      {(dailyAvailableMinutes / 60).toFixed(1)} hours ({dailyAvailableMinutes}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={720}
                    step={30}
                    value={dailyAvailableMinutes}
                    onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                    className={`w-full ${theme === 'light' ? 'accent-zinc-900' : 'accent-white'}`}
                  />
                  <div
                    className={`flex justify-between text-[10px] font-mono mt-1 ${
                      theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'
                    }`}
                  >
                    <span>2h minimal</span>
                    <span>8h standard</span>
                    <span>12h max</span>
                  </div>
                </div>
              </div>

              {/* Data & Backup Section */}
              <div
                className={`space-y-3 pt-4 border-t ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                    theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  Data Sovereignty & Reset
                </span>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                      theme === 'light'
                        ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      theme === 'light'
                        ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                        : 'border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Reset parameters to initial default values"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Defaults</span>
                  </button>
                </div>

                {confirmClearData ? (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs"
                  >
                    <span className="text-red-500 font-semibold text-center sm:text-left">
                      Permanently clear all tasks & logs? Workspace will start clean.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          clearPersonalData();
                          setConfirmClearData(false);
                          setIsSettingsModalOpen(false);
                        }}
                        className="rounded-xl bg-red-600 px-3.5 py-1.5 font-bold text-white shadow-md hover:bg-red-500 transition-colors"
                      >
                        Yes, Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearData(false)}
                        className={`rounded-xl border px-3 py-1.5 transition-colors ${
                          theme === 'light'
                            ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                            : 'border-white/20 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearData(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/15 hover:border-red-500/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Workspace & Start Fresh</span>
                  </button>
                )}
              </div>

              {/* Form Actions with Dedicated Reset Changes Button */}
              <div
                className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                  theme === 'light' ? 'border-zinc-200' : 'border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={handleResetChanges}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    theme === 'light'
                      ? 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm'
                      : 'border-white/15 text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                  title="Discard changes and restore currently saved preferences"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Changes</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                      theme === 'light'
                        ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-black transition-all ${
                      theme === 'light'
                        ? 'bg-zinc-900 text-white hover:bg-black shadow-md'
                        : 'bg-white text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    }`}
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
