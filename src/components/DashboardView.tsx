import { useMemo } from "react";
import { Calendar, Users, Home, TrendingUp, ChevronRight, Download, Upload, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, Host, Speaker } from "../store/visitTypes";

export function DashboardView() {
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowUserManual = useUIStore((s) => s.setShowUserManual);
  const { t, language } = useTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = visits.filter((v) => new Date(v.visitDate) >= now && v.status !== "cancelled");
    const confirmed = visits.filter((v) => v.status === "confirmed");
    const thisMonth = visits.filter((v) => {
      const d = new Date(v.visitDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return { total: visits.length, upcoming: upcoming.length, confirmed: confirmed.length, thisMonth: thisMonth.length };
  }, [visits]);

  const upcomingVisits = useMemo(() => {
    const now = new Date();
    return visits
      .filter((v) => new Date(v.visitDate) >= now && v.status !== "cancelled")
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 5);
  }, [visits]);

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";

  const handleExport = () => {
    const data = { visits, hosts, speakers, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kbv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("export_success"));
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.visits) data.visits.forEach((v: Visit) => useVisitStore.getState().addVisit(v));
        if (data.hosts) data.hosts.forEach((h: Host) => useHostStore.getState().addHost(h));
        if (data.speakers) data.speakers.forEach((s: Speaker) => useSpeakerStore.getState().addSpeaker(s));
        toast.success(t("import_success"));
      } catch {
        toast.error(t("import_error"));
      }
    };
    input.click();
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="py-4 md:py-6 space-y-5 md:space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">{t("dashboard")}</h2>
          <p className="text-base text-muted-foreground mt-0.5">{t("welcome_back")}</p>
        </div>
        <button
          onClick={() => setShowUserManual(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors touch-manipulation"
          title={t("user_manual") || "Mode d'emploi"}
        >
          <BookOpen className="w-5 h-5" />
          <span className="hidden sm:inline">{t("user_manual") || "Guide"}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* À venir */}
        <motion.button variants={item} whileHover={{ y: -2 }} onClick={() => setActiveTab("planning")}
          className="premium-card p-4 md:p-5 text-left">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("upcoming")}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-3xl md:text-4xl font-black text-foreground">{stats.upcoming}</p>
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </motion.button>

        {/* Confirmées */}
        <motion.button variants={item} whileHover={{ y: -2 }} onClick={() => setActiveTab("planning")}
          className="rounded-2xl p-4 md:p-5 text-left bg-amber-400 dark:bg-amber-500 text-white shadow-lg">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-white/80">{t("confirmed_count")}</p>
          <p className="text-3xl md:text-4xl font-black mt-2">{stats.confirmed}</p>
        </motion.button>

        {/* Orateurs */}
        <motion.button variants={item} whileHover={{ y: -2 }} onClick={() => setActiveTab("speakers")}
          className="premium-card p-4 md:p-5 text-left">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("speakers")}</p>
          <p className="text-3xl md:text-4xl font-black text-foreground mt-2">{speakers.length}</p>
        </motion.button>

        {/* Ce mois-ci */}
        <motion.button variants={item} whileHover={{ y: -2 }} onClick={() => setActiveTab("planning")}
          className="premium-card p-4 md:p-5 text-left">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-primary">{t("this_month")}</p>
          <p className="text-3xl md:text-4xl font-black text-foreground mt-2">{stats.thisMonth}</p>
        </motion.button>
      </div>

      {/* Recent Activities */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base md:text-lg font-black text-foreground">{t("recent_activities")}</h3>
          <button onClick={() => setActiveTab("planning")} className="text-sm font-semibold text-primary hover:underline">
            {t("see_all")}
          </button>
        </div>
        {upcomingVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("no_visits")}</p>
        ) : (
          <div className="space-y-2">
            {upcomingVisits.map((visit, i) => {
              const d = new Date(visit.visitDate);
              const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
              const dayNum = d.getDate();
              return (
                <motion.button
                  key={visit.visitId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => {
                    useUIStore.getState().setPendingVisit(visit.visitId);
                    setActiveTab("planning");
                  }}
                  className="w-full premium-card p-4 flex items-center gap-4 text-left hover:ring-1 hover:ring-primary/30 transition-all"
                >
                  {/* Date block */}
                  <div className="w-12 h-14 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{monthShort}</span>
                    <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{visit.nom}</p>
                    <p className="text-[10px] text-muted-foreground">📍 {visit.congregation}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
                  }`}>
                    {t(visit.status === "confirmed" ? "confirmed" : visit.status)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* KBV Premium Card */}
      <motion.div variants={item} className="rounded-2xl bg-card dark:bg-[hsl(220,30%,10%)] p-6 border border-border">
        <h3 className="text-lg font-black text-foreground">KBV v2 – Premium</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {language === "cv" ? "Bo ferramenta di planifikason lokal, otimizadu pa un esperiénsia fásil i fluidu." :
           language === "pt" ? "A sua ferramenta de planificação local, otimizada para uma experiência fácil e fluida." :
           "Votre outil de planification locale, optimisé pour une expérience tactile fluide."}
        </p>
        <div className="flex gap-3 mt-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleExport}
            className="px-5 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> {t("backup")}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleImport}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
