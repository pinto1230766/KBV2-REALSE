import { motion } from "framer-motion";

export function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? "Disable" : "Enable"}
      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <motion.div
        layout
        className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-1"
        style={{ left: enabled ? "calc(100% - 24px)" : "4px" }}
      />
    </button>
  );
}
