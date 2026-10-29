import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Clock, Heart, ShieldCheck, Target, TrendingUp, X, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RealityScoreModal: React.FC = () => {
  const { isScoreModalOpen, setIsScoreModalOpen, realityScore, theme } = useApp();

  return (
    <AnimatePresence>
      {isScoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsScoreModalOpen(false)}
            className={`fixed inset-0 ${
              theme === 'light' ? 'bg-zinc-900/40 backdrop-blur-md' : 'bg-black/85 backdrop-blur-xl'
            }`}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={`relative w-full max-w-lg overflow-hidden rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto ${
              theme === 'light'
                ? 'bg-white border border-zinc-200 text-zinc-900 shadow-[0_25px_60px_rgba(0,0,0,0.12)]'
                : 'crystal-panel border-white/20 text-white backdrop-blur-3xl'
            }`}
          >
            {/* Specular sheen (dark mode only) */}
            {theme === 'dark' && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
            )}

            {/* Header */}
            <div
              className={`relative z-10 flex items-center justify-between border-b pb-4 ${
                theme === 'light' ? 'border-zinc-200' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-black ${
                    theme === 'light'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  }`}
                >
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    Your Reality Score
                  </h2>
                  <p className={`text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    How closely your day matched your intention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className={`rounded-xl p-1 transition-colors ${
                  theme === 'light'
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Score Hero */}
            <div
              className={`relative z-10 mt-5 rounded-2xl p-5 text-center overflow-hidden border ${
                theme === 'light'
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-900'
                  : 'border-white/20 bg-white/[0.04] backdrop-blur-md'
              }`}
            >
              <div className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Today's Alignment
              </div>
              <div className="my-2 flex items-baseline justify-center gap-2">
                <span
                  className={`font-mono text-5xl font-black ${
                    theme === 'light' ? 'text-zinc-950' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  }`}
                >
                  {realityScore.score}%
                </span>
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${
                  theme === 'light'
                    ? 'border-zinc-300 bg-white text-zinc-900'
                    : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                <span>{realityScore.qualification}</span>
                {realityScore.delta !== null && (
                  <span
                    className={`font-mono text-[11px] ${
                      theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'
                    }`}
                  >
                    ({realityScore.delta >= 0 ? `+${realityScore.delta}%` : `${realityScore.delta}%`} vs prior week)
                  </span>
                )}
              </div>
              <p
                className={`mt-3 text-xs leading-relaxed max-w-md mx-auto ${
                  theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'
                }`}
              >
                {realityScore.description}
              </p>
            </div>

            {/* Simple Breakdown for Everyday People */}
            <div className="relative z-10 mt-6 space-y-3">
              <h3
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
                }`}
              >
                What creates this Reality Score?
              </h3>

              <div
                className={`rounded-xl border p-3.5 space-y-1 ${
                  theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-white/[0.03] backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`} />
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      1. Activity & To-Do Follow-Through
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-black ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                    {realityScore.completionRateComponent} / 35 pts
                  </span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  How many of your planned goals and activity to-dos did you actually check off today? Measures pure commitment execution.
                </p>
              </div>

              <div
                className={`rounded-xl border p-3.5 space-y-1 ${
                  theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-white/[0.03] backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`} />
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      2. Effort & Pacing Alignment
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-black ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                    {realityScore.planningAccuracyComponent} / 40 pts
                  </span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Did your total active hours match what you scheduled? Rewards realistic pacing rather than packing too much into a single day.
                </p>
              </div>

              <div
                className={`rounded-xl border p-3.5 space-y-1 ${
                  theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-white/[0.03] backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`} />
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                      3. Estimate Caliber
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-black ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>
                    {realityScore.estimationCaliberComponent} / 25 pts
                  </span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Were individual tasks close to their estimated time (within 15 minutes)? Helps you get better at guessing realistic task lengths.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex justify-end">
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className={`rounded-xl px-5 py-2 text-xs font-black transition-all ${
                  theme === 'light'
                    ? 'bg-zinc-900 text-white hover:bg-black shadow-md'
                    : 'bg-white text-black hover:bg-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                }`}
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
