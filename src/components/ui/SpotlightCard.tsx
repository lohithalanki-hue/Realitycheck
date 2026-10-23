import React from 'react';
import { motion } from 'motion/react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  enableTilt = false,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`glass-card relative overflow-hidden rounded-3xl transition-all duration-300 hover:border-white/40 ${className}`}
      {...(props as any)}
    >
      {/* Specular glass reflection layer (matching frosted credit card in reference photo) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.02] to-transparent" />

      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};
