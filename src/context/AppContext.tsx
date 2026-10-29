import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  calculateCategoryBreakdown,
  calculateCompletionRate,
  calculatePlanningAccuracy,
  calculateRealityScore,
  calculateTimeEstimationError,
  detectPatterns,
} from '../lib/analytics/gapEngine';
import {
  clearPersonalWorkspace,
  loadActiveTimer,
  loadExperiments,
  loadLogs,
  loadTasks,
  loadUserPreferences,
  resetDemoWorkspace,
  saveActiveTimer,
  saveExperiments,
  saveLogs,
  saveTasks,
  saveUserPreferences,
  subscribeToStore,
} from '../lib/storage';
import { soundEffects } from '../lib/sound';
import {
  ActiveTimerState,
  ActivityLog,
  CategoryType,
  Experiment,
  Insight,
  RealityScoreDetails,
  Task,
  TaskStatus,
  UserPreferences,
} from '../types';

export type NavigationTab = 'overview' | 'planner' | 'analytics' | 'reports';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  // Navigation & Workspace
  isHomePage: boolean;
  setIsHomePage: (open: boolean) => void;
  navigateToApp: (tab?: NavigationTab) => void;
  navigateToHome: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeWorkspace: 'demo' | 'personal';
  setWorkspace: (ws: 'demo' | 'personal') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (d: string) => void;
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  toggleSound: () => void;

  // Data
  tasks: Task[];
  logs: ActivityLog[];
  experiments: Experiment[];
  insights: Insight[];
  realityScore: RealityScoreDetails;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'workspace' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  postponeTask: (taskId: string, newDate: string) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;

  // Log Actions
  addLog: (log: Omit<ActivityLog, 'id' | 'workspace' | 'createdAt'>) => ActivityLog;
  updateLog: (log: ActivityLog) => void;
  deleteLog: (logId: string) => void;

  // Experiment Actions
  addExperiment: (exp: Omit<Experiment, 'id' | 'workspace'>) => void;
  updateExperiment: (exp: Experiment) => void;

  // Insights
  dismissInsight: (id: string) => void;
  voteInsight: (id: string, vote: 'helpful' | 'unhelpful') => void;

  // Timer
  activeTimer: ActiveTimerState | null;
  startTimer: (
    title: string,
    category: CategoryType,
    taskId?: string | null,
    isUnplanned?: boolean,
    mode?: 'stopwatch' | 'pomodoro',
    targetMinutes?: number
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addTimerInterruption: () => void;
  finishTimerAndSave: (notes?: string, reflection?: string) => void;
  discardTimer: () => void;

  // UI Modals
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (t: Task | null) => void;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  preselectedLogTask: Task | null;
  setPreselectedLogTask: (t: Task | null) => void;
  isScoreModalOpen: boolean;
  setIsScoreModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  // Feedback & Reset
  toasts: ToastMessage[];
  showToast: (title: string, type?: ToastMessage['type'], description?: string) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
  clearPersonalData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());
  const activeWorkspace: 'demo' | 'personal' = 'personal';
  const setWorkspace = useCallback((_ws: 'demo' | 'personal') => {
    // Workspace is locked to personal only
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('rc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('rc_theme', theme);
    } catch (e) {
      // Ignore
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [isHomePage, setIsHomePage] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  const navigateToApp = useCallback((tab?: NavigationTab) => {
    if (tab) setActiveTab(tab);
    setIsHomePage(false);
    soundEffects.playFocusStart(preferences.soundEnabled);
  }, [preferences.soundEnabled]);

  const navigateToHome = useCallback(() => {
    setIsHomePage(true);
  }, []);
  // Default to today's date in local time reference (2026-10-18)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-18');

  // Stored state
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks('personal'));
  const [logs, setLogs] = useState<ActivityLog[]>(() => loadLogs('personal'));
  const [experiments, setExperiments] = useState<Experiment[]>(() => loadExperiments('personal'));
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => loadActiveTimer());

  // Dismissed & voted insights stored per workspace in memory/state
  const [dismissedInsightIds, setDismissedInsightIds] = useState<Set<string>>(new Set());
  const [insightVotes, setInsightVotes] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [preselectedLogTask, setPreselectedLogTask] = useState<Task | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, type: ToastMessage['type'] = 'info', description?: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync with storage on workspace change
  useEffect(() => {
    setTasks(loadTasks(activeWorkspace));
    setLogs(loadLogs(activeWorkspace));
    setExperiments(loadExperiments(activeWorkspace));
  }, [activeWorkspace]);

  // Subscribe to storage changes
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setTasks(loadTasks(activeWorkspace));
      setLogs(loadLogs(activeWorkspace));
      setExperiments(loadExperiments(activeWorkspace));
      setActiveTimer(loadActiveTimer());
      setPreferences(loadUserPreferences());
    });
    return unsub;
  }, [activeWorkspace]);

  // Handle active timer interval calculation
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      setActiveTimer((curr) => {
        if (!curr || !curr.isRunning) return curr;
        const nextSeconds = curr.elapsedSeconds + 1;
        if (
          curr.mode === 'pomodoro' &&
          curr.targetDurationMinutes &&
          nextSeconds === curr.targetDurationMinutes * 60
        ) {
          soundEffects.playTimerDone(preferences.soundEnabled !== false);
          showToast(
            'Pomodoro focus target completed!',
            'success',
            'Time for a brief recharge break.'
          );
        }
        return {
          ...curr,
          elapsedSeconds: nextSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isRunning, preferences.soundEnabled, showToast]);



  const updatePreferences = useCallback((newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      saveUserPreferences(updated);
      return updated;
    });
    showToast('Preferences updated', 'success');
  }, [showToast]);

  // Task actions
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'workspace' | 'createdAt' | 'updatedAt'>): Task => {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...taskData,
        id: 'task-' + Math.random().toString(36).substring(2, 9),
        workspace: activeWorkspace,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveTasks(activeWorkspace, updated);
      showToast('Task scheduled', 'success', `"${newTask.title}" added to ${newTask.plannedDate}.`);
      return newTask;
    },
    [activeWorkspace, tasks, showToast]
  );

  const updateTask = useCallback(
    (task: Task) => {
      const updated = tasks.map((t) => (t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t));
      setTasks(updated);
      saveTasks(activeWorkspace, updated);
      showToast('Task updated', 'success');
    },
    [activeWorkspace, tasks, showToast]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      saveTasks(activeWorkspace, updated);
      showToast('Task removed', 'info', target?.title);
    },
    [activeWorkspace, tasks, showToast]
  );

  const postponeTask = useCallback(
    (taskId: string, newDate: string) => {
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            plannedDate: newDate,
            status: 'postponed' as TaskStatus,
            postponedFrom: t.postponedFrom || t.plannedDate,
            postponeCount: (t.postponeCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      setTasks(updated);
      saveTasks(activeWorkspace, updated);
      showToast('Task postponed', 'warning', `Moved to ${newDate}. Postpone count incremented.`);
    },
    [activeWorkspace, tasks, showToast]
  );

  const setTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      setTasks(updated);
      saveTasks(activeWorkspace, updated);
      if (status === 'completed') {
        soundEffects.playTaskComplete(preferences.soundEnabled !== false);
        showToast('Task completed!', 'success');
      }
    },
    [activeWorkspace, tasks, preferences.soundEnabled, showToast]
  );

  // Activity Log actions
  const addLog = useCallback(
    (logData: Omit<ActivityLog, 'id' | 'workspace' | 'createdAt'>): ActivityLog => {
      const now = new Date().toISOString();
      const newLog: ActivityLog = {
        ...logData,
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        workspace: activeWorkspace,
        createdAt: now,
      };

      const updated = [newLog, ...logs];
      setLogs(updated);
      saveLogs(activeWorkspace, updated);

      // If tied to a task, update task status if completed
      if (newLog.taskId && newLog.completionStatus === 'completed') {
        setTasks((prev) => {
          const uTasks = prev.map((t) =>
            t.id === newLog.taskId && t.status !== 'completed' ? { ...t, status: 'completed' as TaskStatus } : t
          );
          saveTasks(activeWorkspace, uTasks);
          return uTasks;
        });
      }

      showToast(
        'Activity logged',
        'success',
        `Recorded ${newLog.actualDurationMinutes}m for "${newLog.taskTitle}".`
      );
      return newLog;
    },
    [activeWorkspace, logs, showToast]
  );

  const updateLog = useCallback(
    (log: ActivityLog) => {
      const updated = logs.map((l) => (l.id === log.id ? log : l));
      setLogs(updated);
      saveLogs(activeWorkspace, updated);
      showToast('Activity record updated', 'success');
    },
    [activeWorkspace, logs, showToast]
  );

  const deleteLog = useCallback(
    (logId: string) => {
      const updated = logs.filter((l) => l.id !== logId);
      setLogs(updated);
      saveLogs(activeWorkspace, updated);
      showToast('Activity record deleted', 'info');
    },
    [activeWorkspace, logs, showToast]
  );

  // Experiment actions
  const addExperiment = useCallback(
    (expData: Omit<Experiment, 'id' | 'workspace'>) => {
      const newExp: Experiment = {
        ...expData,
        id: 'exp-' + Math.random().toString(36).substring(2, 9),
        workspace: activeWorkspace,
      };
      const updated = [newExp, ...experiments];
      setExperiments(updated);
      saveExperiments(activeWorkspace, updated);
      showToast('Experiment launched', 'success', newExp.title);
    },
    [activeWorkspace, experiments, showToast]
  );

  const updateExperiment = useCallback(
    (exp: Experiment) => {
      const updated = experiments.map((e) => (e.id === exp.id ? exp : e));
      setExperiments(updated);
      saveExperiments(activeWorkspace, updated);
      showToast('Experiment updated', 'success');
    },
    [activeWorkspace, experiments, showToast]
  );

  // Insights actions
  const dismissInsight = useCallback((id: string) => {
    setDismissedInsightIds((prev) => new Set(prev).add(id));
  }, []);

  const voteInsight = useCallback((id: string, vote: 'helpful' | 'unhelpful') => {
    setInsightVotes((prev) => ({ ...prev, [id]: vote }));
  }, []);

  // Timer actions
  const startTimer = useCallback(
    (
      title: string,
      category: CategoryType,
      taskId: string | null = null,
      isUnplanned = false,
      mode: 'stopwatch' | 'pomodoro' = 'stopwatch',
      targetMinutes?: number
    ) => {
      const newTimer: ActiveTimerState = {
        taskId,
        taskTitle: title,
        category,
        startTime: Date.now(),
        elapsedSeconds: 0,
        isRunning: true,
        interruptionCount: 0,
        isUnplanned,
        mode,
        targetDurationMinutes: mode === 'pomodoro' ? targetMinutes || 25 : undefined,
      };
      setActiveTimer(newTimer);
      saveActiveTimer(newTimer);
      soundEffects.playFocusStart(preferences.soundEnabled !== false);
      showToast(
        mode === 'pomodoro' ? 'Pomodoro Focus Started' : 'Focus Stopwatch Started',
        'info',
        mode === 'pomodoro' ? `Target: ${targetMinutes || 25}m on "${title}"` : `Tracking "${title}"`
      );
    },
    [preferences.soundEnabled, showToast]
  );

  const pauseTimer = useCallback(() => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, isRunning: false };
    setActiveTimer(updated);
    saveActiveTimer(updated);
  }, [activeTimer]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, isRunning: true };
    setActiveTimer(updated);
    saveActiveTimer(updated);
  }, [activeTimer]);

  const addTimerInterruption = useCallback(() => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, interruptionCount: activeTimer.interruptionCount + 1 };
    setActiveTimer(updated);
    saveActiveTimer(updated);
    showToast('Interruption logged (+1)', 'warning', 'Context switch recorded for analytics.');
  }, [activeTimer, showToast]);

  const finishTimerAndSave = useCallback(
    (notes = '', reflection = '') => {
      if (!activeTimer) return;
      const durationMins = Math.max(1, Math.round(activeTimer.elapsedSeconds / 60));

      addLog({
        taskId: activeTimer.taskId,
        taskTitle: activeTimer.taskTitle,
        category: activeTimer.category,
        actualDurationMinutes: durationMins,
        completionStatus: 'completed',
        interruptionCount: activeTimer.interruptionCount,
        interruptionNotes: notes || undefined,
        reflectionNotes: reflection || undefined,
        activityDate: selectedDate,
        isUnplanned: activeTimer.isUnplanned,
      });

      soundEffects.playTimerDone(preferences.soundEnabled !== false);
      setActiveTimer(null);
      saveActiveTimer(null);
    },
    [activeTimer, selectedDate, addLog, preferences.soundEnabled]
  );

  const toggleSound = useCallback(() => {
    const nextVal = preferences.soundEnabled === false ? true : false;
    updatePreferences({ soundEnabled: nextVal });
    if (nextVal) {
      soundEffects.playTaskComplete(true);
      showToast('Sound effects enabled', 'info');
    } else {
      showToast('Sound muted', 'info');
    }
  }, [preferences.soundEnabled, updatePreferences, showToast]);

  const discardTimer = useCallback(() => {
    setActiveTimer(null);
    saveActiveTimer(null);
    showToast('Timer discarded', 'info');
  }, [showToast]);

  // Reset helpers
  const resetDemoData = useCallback(() => {
    resetDemoWorkspace();
    setTasks(loadTasks('demo'));
    setLogs(loadLogs('demo'));
    setExperiments(loadExperiments('demo'));
    showToast('Demo data reset', 'success', 'Restored 14 days of benchmark datasets.');
  }, [showToast]);

  const clearPersonalData = useCallback(() => {
    clearPersonalWorkspace();
    setTasks([]);
    setLogs([]);
    setExperiments([]);
    showToast('Personal data cleared', 'info', 'Workspace is now empty and ready for fresh input.');
  }, [showToast]);

  // Deterministic analytics derivations
  const realityScore = useMemo(() => {
    // Current 7-day period vs previous 7-day period
    const currentBase = new Date(selectedDate + 'T00:00:00Z');
    const prevBase = new Date(currentBase);
    prevBase.setDate(prevBase.getDate() - 7);

    const prevDateStr = prevBase.toISOString().split('T')[0];

    // Filter tasks up to selectedDate
    const currentTasks = tasks.filter((t) => t.plannedDate <= selectedDate && t.plannedDate > prevDateStr);
    const currentLogs = logs.filter((l) => l.activityDate <= selectedDate && l.activityDate > prevDateStr);

    const priorBase = new Date(prevBase);
    priorBase.setDate(priorBase.getDate() - 7);
    const priorDateStr = priorBase.toISOString().split('T')[0];

    const prevTasks = tasks.filter((t) => t.plannedDate <= prevDateStr && t.plannedDate > priorDateStr);
    const prevLogs = logs.filter((l) => l.activityDate <= prevDateStr && l.activityDate > priorDateStr);

    return calculateRealityScore(currentTasks, currentLogs, prevTasks, prevLogs);
  }, [tasks, logs, selectedDate]);

  const insights = useMemo(() => {
    const raw = detectPatterns(tasks, logs, activeWorkspace);
    return raw
      .filter((i) => !dismissedInsightIds.has(i.id))
      .map((i) => ({
        ...i,
        helpfulVote: insightVotes[i.id] || null,
      }));
  }, [tasks, logs, activeWorkspace, dismissedInsightIds, insightVotes]);

  const value = {
    isHomePage,
    setIsHomePage,
    navigateToApp,
    navigateToHome,
    activeTab,
    setActiveTab,
    activeWorkspace,
    setWorkspace,
    theme,
    toggleTheme,
    selectedDate,
    setSelectedDate,
    preferences,
    updatePreferences,
    toggleSound,
    tasks,
    logs,
    experiments,
    insights,
    realityScore,
    addTask,
    updateTask,
    deleteTask,
    postponeTask,
    setTaskStatus,
    addLog,
    updateLog,
    deleteLog,
    addExperiment,
    updateExperiment,
    dismissInsight,
    voteInsight,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    addTimerInterruption,
    finishTimerAndSave,
    discardTimer,
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    isLogModalOpen,
    setIsLogModalOpen,
    preselectedLogTask,
    setPreselectedLogTask,
    isScoreModalOpen,
    setIsScoreModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    toasts,
    showToast,
    dismissToast,
    resetDemoData,
    clearPersonalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
