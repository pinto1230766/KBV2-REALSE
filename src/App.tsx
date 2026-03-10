import { useEffect, useMemo, useState, useCallback } from "react";
import { Toaster } from "sonner";
import { SplashScreen } from "./components/SplashScreen";
import { usePWA } from "./hooks/usePWA";
import {
  Search,
  LayoutGrid,
  Users,
  Settings,
  Home,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardView } from "./components/DashboardView";
import { InstallPage } from "./components/InstallPage";
import { PlanningHub } from "./components/PlanningHub";
import { SpeakerList } from "./components/SpeakerList";
import { GlobalHostList } from "./components/GlobalHostList";
import { SettingsPage } from "./components/SettingsPage";
import { CalendarSidebar } from "./components/CalendarSidebar";
import { useVisitStore } from "./store/useVisitStore";
import { useHostStore } from "./store/useHostStore";
import { useSpeakerStore } from "./store/useSpeakerStore";
import { useUIStore } from "./store/useUIStore";
import type { AppTab } from "./store/useUIStore";
import { useTranslation } from "./hooks/useTranslation";
import { useReminderEngine } from "./hooks/useReminderEngine";
import { NotificationCenter } from "./components/NotificationCenter";
import { useAutoSync } from "./hooks/useAutoSync";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { OnboardingWizard } from "./components/OnboardingWizard";

function App() {
  const { isStandalone } = usePWA();
  const [showSplash, setShowSplash] = useState(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    return standalone;
  });
  const hideSplash = useCallback(() => setShowSplash(false), []);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("kbv-onboarding-done");
  });

  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const setIsOnline = useUIStore((s) => s.setIsOnline);
  const { t } = useTranslation();
  const { pendingCount } = useReminderEngine();
  const { runSync } = useAutoSync();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline]);

  const trimmedTerm = searchTerm.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (trimmedTerm.length < 2) return [];

    const visitMatches = visits
      .filter(
        (v) =>
          v.nom.toLowerCase().includes(trimmedTerm) ||
          v.congregation.toLowerCase().includes(trimmedTerm) ||
          (v.talkTheme || "").toLowerCase().includes(trimmedTerm)
      )
      .slice(0, 3)
      .map((v) => ({ id: v.visitId, label: v.nom, sublabel: v.congregation, type: "visit" as const, payload: v }));

    const speakerMatches = speakers
      .filter((s) => s.nom.toLowerCase().includes(trimmedTerm))
      .slice(0, 3)
      .map((s) => ({ id: s.id, label: s.nom, sublabel: s.congregation, type: "speaker" as const }));

    const hostMatches = hosts
      .filter((h) => h.nom.toLowerCase().includes(trimmedTerm))
      .slice(0, 3)
      .map((h) => ({ id: h.id, label: h.nom, sublabel: h.adresse || "Hôte", type: "host" as const }));

    return [...visitMatches, ...speakerMatches, ...hostMatches];
  }, [trimmedTerm, visits, speakers, hosts]);

  const handleResultClick = (result: (typeof searchResults)[number]) => {
    setIsSearchFocused(false);
    setSearchTerm("");
    if (result.type === "visit") {
      setPendingVisit((result as any).payload.visitId);
      setActiveTab("planning");
      return;
    }
    if (result.type === "speaker") {
      setActiveTab("speakers");
      return;
    }
    setActiveTab("hosts");
  };

  const navItems: Array<{ id: AppTab; label: string; icon: LucideIcon }> = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutGrid },
    { id: "planning", label: t("planning"), icon: Calendar },
    { id: "speakers", label: t("speakers"), icon: Users },
    { id: "hosts", label: t("hosts"), icon: Home },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  if (activeTab === "install") {
    return (
      <>
        {showSplash && <SplashScreen onFinished={hideSplash} />}
        <InstallPage />
      </>
    );
  }

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("kbv-onboarding-done", "true");
    setShowOnboarding(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinished={hideSplash} />}
      {!showSplash && showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
    <div className="flex h-screen w-screen overflow-x-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between bg-card shadow-sm transition-colors gap-4 border-b border-border safe-top">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-lg font-black text-primary-foreground">K</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                Coordination
              </p>
              <h1 className="text-lg md:text-xl font-black text-foreground">KBV LYON</h1>
            </div>
          </div>

          {/* Desktop Nav — hidden on phone, shown on tablet+ */}
          <nav className="hidden md:flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative py-2 px-1 text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${
                  activeTab === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Notifications + Search */}
          <div className="flex items-center gap-2 flex-1 max-w-xs md:max-w-sm justify-end">
            <button
              onClick={() => setActiveTab("install")}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              title="Installer l'app"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <NotificationCenter />
            <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-full border border-border text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-widest text-foreground placeholder:text-muted-foreground"
            />
            {isSearchFocused && trimmedTerm && (
              <div className="absolute z-20 mt-2 w-full rounded-2xl bg-card border border-border shadow-xl">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4">{t("no_results")}</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="p-2 rounded-xl bg-primary/10 text-primary">
                            {result.type === "visit" ? (
                              <MapPin className="w-4 h-4" />
                            ) : result.type === "speaker" ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Home className="w-4 h-4" />
                            )}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{result.label}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {result.sublabel}
                            </p>
                          </div>
                          <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
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

        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 px-4 md:px-8 pb-24 md:pb-8 overflow-y-auto overscroll-contain">
          {activeTab === "dashboard" ? (
            <DashboardView />
          ) : activeTab === "planning" ? (
            <PlanningHub />
          ) : activeTab === "speakers" ? (
            <SpeakerList />
          ) : activeTab === "hosts" ? (
            <GlobalHostList />
          ) : (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Sidebar Calendar — shown on large tablets & desktop */}
      <aside className="w-[360px] bg-card border-l border-border hidden lg:block">
        <CalendarSidebar
          visits={visits}
          onVisitClick={(visit) => {
            setPendingVisit(visit.visitId);
            setActiveTab("planning");
          }}
          onSyncNow={() => runSync(false)}
        />
      </aside>

      {/* Mobile Bottom Navigation — phone only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl min-w-[56px] transition-colors ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-primary" : ""}`} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Offline floating indicator */}
      <OfflineIndicator />

      <Toaster position="top-right" richColors closeButton />
    </div>
    </>
  );
}

export default App;
