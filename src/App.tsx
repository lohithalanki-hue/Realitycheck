import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { LogActivityModal } from './components/modals/LogActivityModal';
import { RealityScoreModal } from './components/modals/RealityScoreModal';
import { TaskModal } from './components/modals/TaskModal';
import { CommandPalette } from './components/ui/CommandPalette';
import { AppProvider, useApp } from './context/AppContext';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { OverviewPage } from './pages/OverviewPage';
import { PlannerPage } from './pages/PlannerPage';
import { ReportsPage } from './pages/ReportsPage';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsTaskModalOpen,
    setIsLogModalOpen,
    activeTimer,
    pauseTimer,
    resumeTimer,
  } = useApp();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Window scroll progress for dynamic reveal feel (Dolby Atmos style)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text fields
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((open: boolean) => !open);
        return;
      }

      if (isInput) return;

      // Spacebar: Pause / Resume running timer
      if (e.code === 'Space' && activeTimer) {
        e.preventDefault();
        if (activeTimer.isRunning) {
          pauseTimer();
        } else {
          resumeTimer();
        }
        return;
      }

      // Quick key 'p': Open Plan Modal
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsTaskModalOpen(true);
        return;
      }

      // Quick key 'l': Open Log Modal
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLogModalOpen(true);
        return;
      }

      // Quick keys 1-4: Switch Tabs
      if (e.key === '1') setActiveTab('overview');
      if (e.key === '2') setActiveTab('planner');
      if (e.key === '3') setActiveTab('analytics');
      if (e.key === '4') setActiveTab('reports');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTimer, pauseTimer, resumeTimer, setIsTaskModalOpen, setIsLogModalOpen, setActiveTab]);

  // Automatically scroll to the top of the tab whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'planner':
        return <PlannerPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white overflow-x-hidden selection:bg-white/20 selection:text-white">
      {/* Top dynamic scroll progress line */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-white shadow-[0_0_8px_#fff] origin-left pointer-events-none"
      />

      {/* Ambient crystalline atmospheric layers */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-30" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-96 w-96 rounded-full bg-white/[0.03] blur-[150px]" />

      {/* Clean Full-width Sticky Top Header */}
      <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Main Content Area (smooth native window scroll with generous bottom clearance for dynamic island) */}
      <main className="relative z-10 flex-1 px-4 py-8 sm:px-8 pb-36">
        <div className="mx-auto max-w-6xl">{renderActiveTab()}</div>
      </main>

      {/* Floating Dynamic Island Navigation at Bottom */}
      <DynamicIsland />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Global Modals & Notifications */}
      <TaskModal />
      <LogActivityModal />
      <RealityScoreModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
