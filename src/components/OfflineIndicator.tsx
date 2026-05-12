import { WifiOff } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";

/** Small floating pill shown when offline — appears above bottom nav on mobile */
export function OfflineIndicator() {
  const isOnline = useUIStore((s) => s.isOnline);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg border border-border"
          style={{ background: "hsl(var(--card))" }}
        >
          <WifiOff className="w-3.5 h-3.5 text-destructive" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Hors-ligne
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
