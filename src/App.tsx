import React, { useEffect, useState } from 'react';
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
  const { activeTab } = useApp();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Ambient crystalline atmospheric layers */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-30" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-96 w-96 rounded-full bg-white/[0.03] blur-[150px]" />

      {/* Clean Full-width Sticky Top Header */}
      <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      {/* Main Content Area (padded at bottom to accommodate floating dynamic island) */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-32">
        <div className="mx-auto max-w-7xl">{renderActiveTab()}</div>
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
