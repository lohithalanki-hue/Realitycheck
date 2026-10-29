import {
  ActiveTimerState,
  ActivityLog,
  Experiment,
  Task,
  UserPreferences,
} from '../types';
import {
  defaultUserPreferences,
  generateDemoExperiments,
  generateDemoLogs,
  generateDemoTasks,
} from './demoData';

const STORAGE_KEYS = {
  PREFS: 'rc_user_preferences_v2',
  PERSONAL_TASKS: 'rc_personal_tasks_v2',
  PERSONAL_LOGS: 'rc_personal_logs_v2',
  PERSONAL_EXPERIMENTS: 'rc_personal_experiments_v2',
  TIMER: 'rc_active_timer_v2',
};

// Clean up legacy v1 demo data on initial load
try {
  if (typeof window !== 'undefined' && !localStorage.getItem('rc_v2_clean_init')) {
    localStorage.removeItem('rc_personal_tasks_v1');
    localStorage.removeItem('rc_personal_logs_v1');
    localStorage.removeItem('rc_personal_experiments_v1');
    localStorage.removeItem('rc_demo_tasks_v1');
    localStorage.removeItem('rc_demo_logs_v1');
    localStorage.removeItem('rc_demo_experiments_v1');
    localStorage.setItem('rc_v2_clean_init', 'true');
  }
} catch (e) {
  // Ignore localStorage exceptions in restricted contexts
}

// Simple event dispatcher for storage changes
const listeners: Set<() => void> = new Set();
export function subscribeToStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

// User Preferences
export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse preferences from localStorage', e);
  }
  return defaultUserPreferences;
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
    notify();
  } catch (e) {
    console.error('Failed to save preferences to localStorage', e);
  }
}

// Tasks - Starts with empty array (no initial data)
export function loadTasks(workspace: 'demo' | 'personal' = 'personal'): Task[] {
  const key = STORAGE_KEYS.PERSONAL_TASKS;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse tasks', e);
  }

  // Fresh workspace starts empty
  return [];
}

export function saveTasks(workspace: 'demo' | 'personal' = 'personal', tasks: Task[]): void {
  const key = STORAGE_KEYS.PERSONAL_TASKS;
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
    notify();
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

// Activity Logs - Starts with empty array (no initial data)
export function loadLogs(workspace: 'demo' | 'personal' = 'personal'): ActivityLog[] {
  const key = STORAGE_KEYS.PERSONAL_LOGS;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse logs', e);
  }

  // Fresh workspace starts empty
  return [];
}

export function saveLogs(workspace: 'demo' | 'personal' = 'personal', logs: ActivityLog[]): void {
  const key = STORAGE_KEYS.PERSONAL_LOGS;
  try {
    localStorage.setItem(key, JSON.stringify(logs));
    notify();
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

// Experiments - Starts with empty array (no initial data)
export function loadExperiments(workspace: 'demo' | 'personal' = 'personal'): Experiment[] {
  const key = STORAGE_KEYS.PERSONAL_EXPERIMENTS;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse experiments', e);
  }

  return [];
}

export function saveExperiments(workspace: 'demo' | 'personal' = 'personal', experiments: Experiment[]): void {
  const key = STORAGE_KEYS.PERSONAL_EXPERIMENTS;
  try {
    localStorage.setItem(key, JSON.stringify(experiments));
    notify();
  } catch (e) {
    console.error('Failed to save experiments', e);
  }
}

// Timer
export function loadActiveTimer(): ActiveTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse timer', e);
  }
  return null;
}

export function saveActiveTimer(timer: ActiveTimerState | null): void {
  try {
    if (timer) {
      localStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(timer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TIMER);
    }
    notify();
  } catch (e) {
    console.error('Failed to save timer', e);
  }
}

// Management & Reset
export function resetDemoWorkspace(): void {
  saveTasks('demo', generateDemoTasks());
  saveLogs('demo', generateDemoLogs());
  saveExperiments('demo', generateDemoExperiments());
}

export function clearPersonalWorkspace(): void {
  saveTasks('personal', []);
  saveLogs('personal', []);
  saveExperiments('personal', []);
  saveActiveTimer(null);
}

export function exportFullDataAsJSON(): string {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    preferences: loadUserPreferences(),
    demo: {
      tasks: loadTasks('demo'),
      logs: loadLogs('demo'),
      experiments: loadExperiments('demo'),
    },
    personal: {
      tasks: loadTasks('personal'),
      logs: loadLogs('personal'),
      experiments: loadExperiments('personal'),
    },
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importFullDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.preferences) saveUserPreferences(data.preferences);
    if (data.personal) {
      if (Array.isArray(data.personal.tasks)) saveTasks('personal', data.personal.tasks);
      if (Array.isArray(data.personal.logs)) saveLogs('personal', data.personal.logs);
      if (Array.isArray(data.personal.experiments)) saveExperiments('personal', data.personal.experiments);
    }
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}
