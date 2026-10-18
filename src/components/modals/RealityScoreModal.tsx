import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Info, ShieldCheck, Target, TrendingUp, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RealityScoreModal: React.FC = () => {
  const { isScoreModalOpen, setIsScoreModalOpen, realityScore } = useApp();

  return (
    <AnimatePresence>
      {isScoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsScoreModalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="crystal-panel relative w-full max-w-xl overflow-hidden rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto backdrop-blur-3xl"
          >
            {/* Specular sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">The Reality Score Explained</h2>
                  <p className="text-xs text-zinc-400">Deterministic Intention–Action Alignment Formula</p>
                </div>
              </div>
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="rounded-xl p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Score Hero */}
            <div className="relative z-10 mt-5 rounded-2xl border border-white/20 bg-white/[0.04] p-5 text-center overflow-hidden backdrop-blur-md">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />

              <div className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                Current Index
              </div>
              <div className="my-2 flex items-baseline justify-center gap-2">
                <span className="font-mono text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  {realityScore.score}
                </span>
                <span className="text-lg font-bold text-zinc-500">/ 100</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white shadow-sm">
                <span>{realityScore.qualification}</span>
                {realityScore.delta !== null && (
                  <span className="font-mono text-[11px] text-zinc-300">
                    ({realityScore.delta >= 0 ? `+${realityScore.delta}` : realityScore.delta} vs prior week)
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-300 max-w-md mx-auto">
                {realityScore.description}
              </p>
            </div>

            {/* Formula Breakdown */}
            <div className="relative z-10 mt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Deterministic Formula Breakdown
              </h3>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">1. Planning Accuracy</span>
                  </div>
                  <span className="font-mono text-xs font-black text-white">
                    {realityScore.planningAccuracyComponent} / 40 pts
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Measures aggregate time variance: <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">1 - (|planned - actual| / max(planned, actual))</code>. Rewards calibrated time commitments over optimistic under-budgeting.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">2. Task Completion Rate</span>
                  </div>
                  <span className="font-mono text-xs font-black text-white">
                    {realityScore.completionRateComponent} / 35 pts
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Ratio of completed tasks over eligible scheduled commitments (excluding cancelled items). Demonstrates daily follow-through consistency.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">3. Estimation Caliber</span>
                  </div>
                  <span className="font-mono text-xs font-black text-white">
                    {realityScore.estimationCaliberComponent} / 25 pts
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Percentage of discrete tasks completed within a tight ±15% variance window of the original forecast.
                </p>
              </div>

              {/* Composite Calculation summary */}
              <div className="rounded-xl border border-white/20 bg-white/[0.06] p-4 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold text-white">Composite Reality Score</span>
                </div>
                <span className="font-mono text-sm font-black text-white">
                  {realityScore.score} / 100
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex justify-end">
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="rounded-xl bg-white px-5 py-2 text-xs font-black text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
