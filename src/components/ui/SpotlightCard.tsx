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
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`crystal-panel relative overflow-hidden rounded-2xl transition-colors duration-200 hover:border-white/30 ${className}`}
      {...(props as any)}
    >
      {/* Crystalline diagonal glass specular sheen */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-80"
      />

      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};
