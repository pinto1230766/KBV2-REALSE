import React from "react";
import { LucideIcon } from "lucide-react";
import { AppTab } from "../../store/useUIStore";

interface MobileNavProps {
  navItems: Array<{ id: AppTab; label: string; icon: LucideIcon }>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ navItems, activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-header border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl min-w-0 flex-1 transition-all duration-300 ${
              activeTab === item.id
                ? "text-primary bg-primary/10 shadow-inner translate-y-[-2px]"
                : "text-muted-foreground"
            }`}
          >
            <item.icon 
              className={`w-6 h-6 transition-transform ${activeTab === item.id ? "scale-110" : ""}`} 
            />
            <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight truncate max-w-full ${activeTab === item.id ? "opacity-100" : "opacity-70"}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <span className="w-1 h-1 bg-primary rounded-full absolute bottom-1" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
