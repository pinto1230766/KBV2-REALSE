import React from "react";
import { Search, MapPin, User, Home, MessageSquare, Download } from "lucide-react";
import { KbvLogo } from "../KbvLogo";
import { useTranslation } from "../../hooks/useTranslation";
import { AppTab } from "../../store/useUIStore";
import { LucideIcon } from "lucide-react";

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: "visit" | "speaker" | "host";
  payload?: unknown;
}

interface HeaderProps {
  congregationName: string;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  searchResults: SearchResult[];
  handleResultClick: (result: SearchResult) => void;
  navItems: Array<{ id: AppTab; label: string; icon: LucideIcon }>;
}

export const Header: React.FC<HeaderProps> = ({
  congregationName,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  isSearchFocused,
  setIsSearchFocused,
  searchResults,
  handleResultClick,
  navItems,
}) => {
  const { t } = useTranslation();

  return (
    <header className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between glass-header shadow-sm transition-all gap-4 border-b border-border/50 sticky top-0 z-30 safe-top">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden shadow-lg bg-primary/20 p-0.5">
          <KbvLogo className="w-full h-full" />
        </div>
        <div className="hidden sm:block">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.35em] text-primary/80">
            Coordination
          </p>
          <h1 className="text-lg md:text-xl font-black text-foreground">
            KBV {congregationName && `- ${congregationName}`}
          </h1>
        </div>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative py-3 px-2 lg:px-3 text-xs lg:text-sm uppercase tracking-wider font-bold transition-all whitespace-nowrap rounded-lg hover:bg-primary/10 ${
              activeTab === item.id
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              {item.label}
            </span>
            {activeTab === item.id && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Notifications + Search */}
      <div className="flex items-center gap-2 flex-1 max-w-xs md:max-w-sm justify-end">
        <button
          onClick={() => setActiveTab("install")}
          className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
          title="Installer l'app"
        >
          <Download className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="relative flex-1 max-w-[200px] md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            className="w-full pl-9 pr-4 py-2.5 md:py-3 bg-muted/50 rounded-full border border-border/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 glass-effect"
          />
          {isSearchFocused && searchTerm.trim().length >= 2 && (
            <div className="absolute z-20 mt-2 w-full rounded-2xl glass-card border border-border/50 shadow-2xl overflow-hidden animate-slide-up">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">{t("no_results")}</p>
              ) : (
                <ul className="divide-y divide-border/30">
                  {searchResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 md:py-4 text-left hover:bg-primary/10 transition-colors"
                      >
                        <span className="p-2 rounded-xl bg-primary/20 text-primary">
                          {result.type === "visit" ? (
                            <MapPin className="w-5 h-5" />
                          ) : result.type === "speaker" ? (
                            <User className="w-5 h-5" />
                          ) : (
                            <Home className="w-5 h-5" />
                          )}
                        </span>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-foreground">{result.label}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            {result.sublabel}
                          </p>
                        </div>
                        <MessageSquare className="w-5 h-5 text-muted-foreground/30" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
