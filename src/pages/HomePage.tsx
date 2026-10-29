import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  ArrowRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../lib/sound';

/**
 * HD Celestial Twinkle & Glint Canvas
 * Renders microscopic, high-definition star sparkles and dynamic 4-point
 * diamond diffraction glints that breathe dynamically with the HD galaxy.
 */
interface HDSparkle {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
  glint: boolean;
  alphaMultiplier: number;
}

const HDStarlightOverlay: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // High precision sparkling star nodes
    const sparkles: HDSparkle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.025 + 0.01,
      glint: Math.random() > 0.35,
      alphaMultiplier: Math.random() * 0.4 + 0.6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isLight = theme === 'light';

      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.phase += s.speed;
        const alpha = (Math.sin(s.phase) * 0.45 + 0.55) * s.alphaMultiplier;

        // Draw star point
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(30, 45, 65, ${alpha * 0.5})`
          : `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.fill();

        // 4-point cross diffraction glint
        if (s.glint && alpha > 0.55) {
          const len = s.size * 4;
          ctx.beginPath();
          ctx.moveTo(s.x - len, s.y);
          ctx.lineTo(s.x + len, s.y);
          ctx.moveTo(s.x, s.y - len);
          ctx.lineTo(s.x, s.y + len);
          ctx.strokeStyle = isLight
            ? `rgba(50, 65, 85, ${alpha * 0.4})`
            : `rgba(255, 255, 255, ${alpha * 0.55})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();

          // Soft stellar halo
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = isLight
            ? `rgba(70, 90, 120, ${alpha * 0.1})`
            : `rgba(224, 242, 254, ${alpha * 0.2})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    />
  );
};

export const HomePage: React.FC = () => {
  const {
    navigateToApp,
    theme,
    toggleTheme,
    preferences,
    toggleSound,
  } = useApp();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax mouse tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcut: Press Enter or Space to open the app
  const handleLaunch = useCallback(() => {
    soundEffects.playFocusStart(preferences.soundEnabled);
    navigateToApp('overview');
  }, [navigateToApp, preferences.soundEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || (e.key === ' ' && e.target === document.body)) {
        e.preventDefault();
        handleLaunch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch]);

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden flex flex-col justify-between selection:bg-white/20 selection:text-white transition-colors duration-1000 ${
        theme === 'light'
          ? 'bg-[#F5F6F8] text-[#0A0D14]'
          : 'bg-[#020305] text-white'
      }`}
    >
      {/* ==================================================================== */}
      {/* 1. CINEMATIC 8K ULTRA-HD CELESTIAL GALAXY BACKDROP                   */}
      {/* ==================================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Parallax Container for Full Widescreen 16:9 Artwork */}
        <motion.div
          animate={{
            x: mousePos.x * 20,
            y: mousePos.y * 20,
            scale: 1.06,
          }}
          transition={{ type: 'spring', damping: 45, stiffness: 65 }}
          className="relative h-full w-full"
        >
          {/* Ultra-HD 16:9 Masterpiece Backdrop */}
          <img
            src="/assets/celestial_galaxy_hd.jpg"
            alt="Ultra HD Celestial Galaxy with Crescent Moon and Botanical Starlight"
            className={`h-full w-full object-cover object-center transition-all duration-700 ${
              theme === 'light'
                ? 'invert contrast-125 brightness-95 opacity-80 mix-blend-multiply'
                : 'opacity-100 brightness-105 contrast-110'
            }`}
          />

          {/* Cinematic Edge Vignette: seamlessly dissolves to pitch black */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
              theme === 'light'
                ? 'bg-gradient-to-t from-[#F5F6F8] via-transparent to-[#F5F6F8]/80 shadow-[inset_0_0_100px_#F5F6F8]'
                : 'bg-gradient-to-t from-[#020305] via-transparent to-[#020305]/80 shadow-[inset_0_0_120px_#020305]'
            }`}
          />

          {/* Radial Center Contrast Scrim so typography remains laser-sharp */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
              theme === 'light'
                ? 'bg-[radial-gradient(circle_at_center,rgba(245,246,248,0.75)_0%,rgba(245,246,248,0.2)_60%,transparent_100%)]'
                : 'bg-[radial-gradient(circle_at_center,rgba(2,3,5,0.75)_0%,rgba(2,3,5,0.2)_65%,transparent_100%)]'
            }`}
          />
        </motion.div>
      </div>

      {/* Dynamic Starlight Twinkle & Glint Canvas Overlay */}
      <HDStarlightOverlay theme={theme} />

      {/* ==================================================================== */}
      {/* 2. TOP CURATORIAL BAR                                                */}
      {/* ==================================================================== */}
      <header className="relative z-20 flex w-full items-center justify-between px-8 py-8 sm:px-16">
        {/* Minimalist Wordmark with Star Point */}
        <div className="flex items-center gap-3 select-none">
          <div
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              theme === 'light'
                ? 'bg-zinc-900'
                : 'bg-white shadow-[0_0_12px_#fff]'
            }`}
          />
          <span className="font-monteilga text-base tracking-wide font-normal opacity-90 drop-shadow-md">
            realitycheck
          </span>
        </div>

        {/* Quiet Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`p-2 transition-opacity duration-200 hover:opacity-100 ${
              preferences.soundEnabled ? 'opacity-85' : 'opacity-35'
            }`}
            title={preferences.soundEnabled ? 'Acoustic feedback on' : 'Acoustic feedback off'}
          >
            {preferences.soundEnabled ? (
              <Volume2 className="h-4 w-4 stroke-[1.8]" />
            ) : (
              <VolumeX className="h-4 w-4 stroke-[1.8]" />
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 opacity-85 transition-opacity duration-200 hover:opacity-100"
            title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 stroke-[1.8]" />
            ) : (
              <Sun className="h-4 w-4 stroke-[1.8]" />
            )}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. REFINED, PRODUCTION-READY EDITORIAL CENTERPIECE                  */}
      {/* ==================================================================== */}
      <main className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center select-none">
        {/* Curatorial Header Stamp */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 sm:mb-6 flex items-center gap-3 text-[11px] font-mono tracking-[0.3em] uppercase"
        >
          <span
            className={`h-px w-8 transition-colors ${
              theme === 'light' ? 'bg-zinc-400' : 'bg-white/25'
            }`}
          />
          <span
            className={`transition-colors font-medium tracking-[0.35em] ${
              theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'
            }`}
          >
            TEMPORAL CALIBRATION
          </span>
          <span
            className={`h-px w-8 transition-colors ${
              theme === 'light' ? 'bg-zinc-400' : 'bg-white/25'
            }`}
          />
        </motion.div>

        {/* Masterpiece Headline: "Reality Check" in Pure Monteilga */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative inline-flex items-center justify-center my-2"
        >
          <h1 className="font-monteilga text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-normal tracking-normal leading-[0.92] text-white drop-shadow-[0_4px_45px_rgba(0,0,0,0.98)]">
            <span
              className={`transition-colors duration-500 ${
                theme === 'light' ? 'text-zinc-950' : 'text-white'
              }`}
            >
              Reality
            </span>
            <span
              className={`italic font-light ml-3 sm:ml-6 transition-colors duration-500 ${
                theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'
              }`}
            >
              Check
            </span>
          </h1>

          {/* Minimal Luminous Stellar Beacon */}
          <motion.span
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.95, 1.25, 0.95],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute -right-3 -top-1 sm:-right-6 sm:top-2 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${
              theme === 'light'
                ? 'bg-zinc-900 shadow-[0_0_12px_rgba(0,0,0,0.4)]'
                : 'bg-white shadow-[0_0_22px_#fff]'
            }`}
          />
        </motion.div>

        {/* Subtext: High-contrast Editorial Italic Book Serif */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`font-editorial-subtext mx-auto mt-6 sm:mt-8 max-w-xl text-xl sm:text-2xl md:text-3xl font-light italic leading-relaxed tracking-wide drop-shadow-[0_2px_22px_rgba(0,0,0,0.95)] ${
            theme === 'light' ? 'text-zinc-700' : 'text-zinc-200'
          }`}
        >
          The quiet delta between what you plan and how your finite hours are truly lived.
        </motion.p>

        {/* ================================================================== */}
        {/* 4. SLEEK, PRODUCTION-READY ENTRY TRIGGER                           */}
        {/* ================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 sm:mt-12 flex flex-col items-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLaunch}
            className="group relative inline-flex items-center gap-3.5 rounded-full px-8 py-3.5 text-sm sm:text-base font-medium tracking-wide transition-all duration-300 bg-black hover:bg-zinc-950 text-white border border-white/20 hover:border-white/45 shadow-[0_20px_45px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.25)]"
            title="Open RealityCheck workspace (↵ Enter)"
          >
            {/* Delicate Home Glyph */}
            <Home className="h-4 w-4 stroke-[1.8] text-zinc-200 transition-transform duration-300 group-hover:scale-110" />

            {/* Action Text */}
            <span>Enter Workspace</span>

            {/* Sliding Arrow */}
            <ArrowRight className="h-3.5 w-3.5 stroke-[2] text-zinc-300 transition-transform duration-300 group-hover:translate-x-1" />

            {/* Keyboard shortcut hint */}
            <span className="ml-1 text-[10px] font-mono tracking-widest uppercase opacity-45 group-hover:opacity-90 transition-opacity">
              ↵
            </span>
          </motion.button>
        </motion.div>
      </main>

      {/* ==================================================================== */}
      {/* 5. UNDERSTATED CURATORIAL FOOTER                                     */}
      {/* ==================================================================== */}
      <footer className="relative z-20 flex w-full items-center justify-between px-8 py-8 sm:px-16 text-[10px] font-mono tracking-[0.25em] uppercase opacity-50 select-none">
        <div>
          <span>Calibrated · Local-First</span>
        </div>
        <div>
          <span>Preserving Finite Hours</span>
        </div>
      </footer>
    </div>
  );
};
