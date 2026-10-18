import React from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface RealityScoreRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const RealityScoreRing: React.FC<RealityScoreRingProps> = ({
  score,
  size = 140,
  strokeWidth = 9,
  className = '',
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer ambient crystal glow orb behind the ring */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute h-32 w-32 rounded-full bg-white/15 blur-2xl"
      />

      <svg
        width={size}
        height={size}
        className="-rotate-90 transform drop-shadow-[0_0_15px_rgba(255,255,255,0.65)]"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-800/80"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Glowing Pure White Progress Stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Numerical count-up in the center */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline">
          <AnimatedNumber
            value={score}
            duration={1200}
            className="font-mono text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          / 100
        </span>
      </div>
    </div>
  );
};
