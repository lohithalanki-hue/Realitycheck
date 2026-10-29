import React, { useRef } from 'react';
import { motion, MotionProps, useScroll, useTransform } from 'motion/react';

export interface ScrollRevealProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blurAmount?: number;
  scaleFrom?: number;
  mode?: 'inView' | 'scrub' | 'parallax';
  threshold?: number;
  once?: boolean;
}

/**
 * ScrubReveal: Scroll-position driven reveal for elements that
 * explicitly opt into continuous scroll scrubbing.
 */
const ScrubReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  yOffset = 60,
  blurAmount = 10,
  scaleFrom = 0.94,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center 55%'],
  });

  const scrubOpacity = useTransform(scrollYProgress, [0, 0.2, 0.95], [0, 0.35, 1]);
  const scrubY = useTransform(scrollYProgress, [0, 0.95], [yOffset, 0]);
  const scrubScale = useTransform(scrollYProgress, [0, 0.95], [scaleFrom, 1]);
  const scrubBlur = useTransform(
    scrollYProgress,
    [0, 0.85],
    [`blur(${blurAmount}px)`, 'blur(0px)']
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <motion.div
        style={{
          opacity: scrubOpacity,
          y: scrubY,
          scale: scrubScale,
          filter: scrubBlur,
        }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * InViewReveal: Slow, weighted cinematic deceleration with optical lens deblurring.
 * Powered by whileInView for 100% hydration safety, zero crashes, and Apple/Dolby Atmos smooth arrivals.
 */
const InViewReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 1.2,
  yOffset = 32,
  blurAmount = 8,
  scaleFrom = 0.96,
  threshold = 0.05,
  once = true,
  ...props
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: yOffset,
        scale: scaleFrom,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once: true, amount: threshold, margin: '0px 0px 40px 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Dolby Atmos / Apple ultra-smooth luxury ease
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Cinematic Scroll-Reveal wrapper for Dolby Atmos & Apple-style dynamic scrolling websites.
 * Once an element appears, it stays permanently visible and doesn't disappear when scrolling up.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  mode = 'inView',
  ...props
}) => {
  return <InViewReveal {...props} />;
};
