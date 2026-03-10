import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(onFinished, 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinished]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "exit" ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.3)_0%,transparent_70%)]" />

        {/* Modern Logo KBV FP */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative z-10"
        >
          {/* Logo container with gradient border */}
          <div className="relative">
            {/* Gradient border effect */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 opacity-80 blur-sm" />
            
            {/* Main logo box */}
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center shadow-2xl border border-slate-700/50 overflow-hidden">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '8px 8px' }} />
              
              {/* KBV text with gradient */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <span className="text-2xl font-black tracking-tight" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #fbbf24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  KBV
                </span>
                {/* FP with accent color */}
                <span className="text-lg font-bold tracking-wider text-slate-300 mt-0.5">
                  FP
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === "text" || phase === "exit" ? 1 : 0, y: phase === "text" || phase === "exit" ? 0 : 20 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 mt-8 text-center"
        >
          <h1 className="text-3xl font-black text-primary-foreground tracking-tight">
            KBV LYON
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.4em] text-primary-foreground/70">
            Coordination
          </p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "text" || phase === "exit" ? 1 : 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 mt-10 w-40 h-1 rounded-full bg-primary-foreground/20 overflow-hidden"
        >
          <motion.div
            className="h-full bg-primary-foreground/60 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
