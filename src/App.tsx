import { useEffect, useMemo, useState, useCallback } from "react";
import { Toaster } from "sonner";
import { SplashScreen } from "./components/SplashScreen";
import { usePWA } from "./hooks/usePWA";
import {
  LayoutGrid,
  Users,
  Settings,
  Home,
  Calendar,
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
import { useSettingsStore } from "./store/useSettingsStore";
import type { AppTab } from "./store/useUIStore";
import { useTranslation } from "./hooks/useTranslation";
import { useReminderEngine } from "./hooks/useReminderEngine";
import { useAutoSync } from "./hooks/useAutoSync";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { UserManualPage } from "./components/UserManualPage";
import { KbvLogo } from "./components/KbvLogo";
import { AppLayout } from "./components/layout/AppLayout";
import { SearchResult } from "./components/layout/Header";

function App() {
  const { isStandalone } = usePWA();
  const [showSplash, setShowSplash] = useState(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
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
  const showUserManual = useUIStore((s) => s.showUserManual);
  const settings = useSettingsStore((s) => s.settings);
  const congregationName = settings?.congregation?.name || "";
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const pendingVisitId = useUIStore((s) => s.pendingVisitId);
  const setShowUserManual = useUIStore((s) => s.setShowUserManual);
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

    // Auto-patch absolute paths to relative for Electron/PWA compatibility
    speakers.forEach(s => {
      if (!s.photoUrl && s.nom.trim().toLowerCase() === "jean dupont") {
        useSpeakerStore.getState().updateSpeaker(s.id, { photoUrl: "./images/speakers/speakers.jpg" });
      } else if (s.photoUrl && s.photoUrl.startsWith("/")) {
        useSpeakerStore.getState().updateSpeaker(s.id, { photoUrl: "." + s.photoUrl });
      } else if (s.photoUrl && s.photoUrl.startsWith("images/")) {
        useSpeakerStore.getState().updateSpeaker(s.id, { photoUrl: "./" + s.photoUrl });
      }
    });

    hosts.forEach(h => {
      if (!h.photoUrl && h.nom.trim().toLowerCase() === "marie martin") {
        useHostStore.getState().updateHost(h.id, { photoUrl: "./images/hosts/host.jpg" });
      } else if (h.photoUrl && h.photoUrl.startsWith("/")) {
        useHostStore.getState().updateHost(h.id, { photoUrl: "." + h.photoUrl });
      } else if (h.photoUrl && h.photoUrl.startsWith("images/")) {
        useHostStore.getState().updateHost(h.id, { photoUrl: "./" + h.photoUrl });
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline, speakers, hosts]);

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

  const handleResultClick = (result: SearchResult) => {
    setIsSearchFocused(false);
    setSearchTerm("");
    if (result.type === "visit" && result.payload) {
      setPendingVisit((result.payload as { visitId: string }).visitId);
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

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("kbv-onboarding-done", "true");
    setShowOnboarding(false);
  }, []);

  if (activeTab === "install") {
    return (
      <div className="h-full w-full">
        {showSplash && <SplashScreen onFinished={hideSplash} />}
        <InstallPage />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {showSplash && <SplashScreen onFinished={hideSplash} />}
      {!showSplash && showOnboarding && (
        <OnboardingWizard 
          onComplete={handleOnboardingComplete} 
          onShowUserManual={() => setShowUserManual(true)} 
        />
      )}

      {/* Main Interface Refactored */}
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        congregationName={congregationName}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        searchResults={searchResults}
        handleResultClick={handleResultClick}
        navItems={navItems}
        sidebar={
          <CalendarSidebar
            visits={visits}
            onVisitClick={(visit) => {
              setPendingVisit(visit.visitId);
              setActiveTab("planning");
            }}
            onSyncNow={() => runSync(false)}
          />
        }
      >
        <div className="h-full w-full">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "planning" && <PlanningHub />}
          {activeTab === "speakers" && <SpeakerList />}
          {activeTab === "hosts" && <GlobalHostList />}
          {activeTab === "settings" && (
            showUserManual ? (
              <UserManualPage onBack={() => setShowUserManual(false)} />
            ) : (
              <SettingsPage onShowUserManual={() => setShowUserManual(true)} />
            )
          )}
        </div>
      </AppLayout>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
