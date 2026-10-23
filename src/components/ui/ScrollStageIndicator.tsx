import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface Stage {
  id: string;
  number: string;
  label: string;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'chapter-hero', number: '01', label: 'The Big Picture' },
  { id: 'chapter-balance', number: '02', label: 'Daily Balance' },
  { id: 'chapter-tasks', number: '03', label: 'Action Checklist' },
  { id: 'chapter-wave', number: '04', label: 'Wave of Time' },
  { id: 'chapter-insights', number: '05', label: 'Personal Insights' },
];

interface ScrollStageIndicatorProps {
  stages?: Stage[];
}

export const ScrollStageIndicator: React.FC<ScrollStageIndicatorProps> = ({
  stages = DEFAULT_STAGES,
}) => {
  const [activeStage, setActiveStage] = useState(stages[0]?.id || '');
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  useEffect(() => {
    if (stages.length === 0) return;
    setActiveStage(stages[0].id);

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.42;

      for (let i = stages.length - 1; i >= 0; i--) {
        const el = document.getElementById(stages[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveStage(stages[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stages]);

  const scrollToStage = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      aria-label="Chapter Navigation"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto"
    >
      <div className="crystal-panel rounded-full p-2 backdrop-blur-2xl border border-white/15 flex flex-col gap-2.5 shadow-2xl">
        {stages.map((stage) => {
          const isActive = activeStage === stage.id;
          const isHovered = hoveredStage === stage.id;

          return (
            <div
              key={stage.id}
              className="relative flex items-center justify-end group"
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {/* Flyout Label on Hover or when Active */}
              <AnimatePresence>
                {(isHovered || isActive) && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-9 whitespace-nowrap px-3 py-1 rounded-full bg-black/90 border border-white/20 text-[11px] font-mono tracking-wider backdrop-blur-xl pointer-events-none flex items-center gap-2 shadow-lg"
                  >
                    <span className="text-zinc-400">{stage.number}</span>
                    <span className={isActive ? 'text-white font-bold' : 'text-zinc-300'}>
                      {stage.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dot Button */}
              <button
                onClick={() => scrollToStage(stage.id)}
                className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? 'h-7 w-7 bg-white text-black font-mono text-[10px] font-black shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                    : 'h-6 w-6 bg-white/10 hover:bg-white/25 text-transparent hover:text-white font-mono text-[9px]'
                }`}
                aria-label={`Jump to ${stage.label}`}
              >
                {isActive ? (
                  stage.number
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 group-hover:hidden" />
                )}
                {!isActive && (
                  <span className="hidden group-hover:inline text-[9px] font-mono text-white">
                    {stage.number}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
