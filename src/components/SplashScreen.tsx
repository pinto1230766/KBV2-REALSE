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

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative z-10 w-24 h-24 rounded-3xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-primary-foreground/20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-5xl font-black text-primary-foreground"
          >
            K
          </motion.span>
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
