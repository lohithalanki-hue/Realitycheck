import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'number' | 'percent' | 'hours-mins';
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  format = 'number',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const targetValue = value;

    if (startValue === targetValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easeProgress;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  if (format === 'percent') {
    return <span className={className}>{displayValue}%</span>;
  }

  if (format === 'hours-mins') {
    const hrs = Math.floor(Math.abs(displayValue) / 60);
    const mins = Math.abs(displayValue) % 60;
    const sign = displayValue < 0 ? '-' : '';

    if (hrs === 0) return <span className={className}>{sign}{mins}m</span>;
    if (mins === 0) return <span className={className}>{sign}{hrs}h</span>;
    return <span className={className}>{sign}{hrs}h {mins}m</span>;
  }

  return <span className={className}>{displayValue}</span>;
};
