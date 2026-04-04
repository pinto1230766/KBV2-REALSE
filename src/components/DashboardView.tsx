import { useMemo, useState } from "react";
import { Calendar, Users, Home, TrendingUp, ChevronRight, Download, Upload, BookOpen, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
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
  
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'confirmed' | 'month'>('all');

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

  // Handle filter selection
  const handleFilterClick = (newFilter: typeof filter) => {
    setFilter(prev => prev === newFilter ? 'all' : newFilter);
  };

  const filteredVisits = useMemo(() => {
    const sorted = [...visits]
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (filter) {
      case 'upcoming':
        return sorted.filter(v => new Date(v.visitDate) >= now && v.status !== "cancelled");
      case 'confirmed':
        return sorted.filter(v => v.status === 'confirmed');
      case 'month':
        return sorted.filter(v => {
          const d = new Date(v.visitDate);
          return d >= startOfMonth && d <= endOfMonth;
        });
      default:
        // Default behavior: show only next 5 upcoming
        return sorted.filter(v => new Date(v.visitDate) >= now && v.status !== "cancelled").slice(0, 5);
    }
  }, [visits, filter]);

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

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="py-4 md:py-6 space-y-5 md:space-y-6">
      {/* Title */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-foreground leading-tight">{t("dashboard")}</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5">{t("welcome_back")}</p>
        </div>
        <button
          onClick={() => {
            setShowUserManual(true);
            setActiveTab("settings");
          }}
          className="flex items-center gap-2 px-3 xs:px-4 py-2 text-xs xs:text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors touch-manipulation"
          title={t("user_manual") || "Mode d'emploi"}
        >
          <BookOpen className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
          <span>{t("user_manual") || "Guide"}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* À venir */}
        <motion.button 
          variants={staggerItem} 
          whileHover={{ y: -2 }} 
          onClick={() => handleFilterClick('upcoming')}
          className={`glass-card p-2.5 xs:p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${
            filter === 'upcoming' ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
          }`}
        >
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("upcoming")}</p>
          <div className="flex items-center gap-2 mt-1 xs:mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black text-foreground">{stats.upcoming}</p>
            <Calendar className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </motion.button>

        {/* Confirmées */}
        <motion.button 
          variants={staggerItem} 
          whileHover={{ y: -2 }} 
          onClick={() => handleFilterClick('confirmed')}
          className={`rounded-2xl p-2.5 xs:p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${
            filter === 'confirmed' ? "bg-emerald-500 ring-2 ring-emerald-400 shadow-lg scale-[1.02]" : "bg-amber-400 dark:bg-amber-500"
          } text-white shadow-lg`}
        >
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-white/80">{t("confirmed_count")}</p>
          <div className="flex items-center gap-2 mt-1 xs:mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black">{stats.confirmed}</p>
            <Check className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white/80" />
          </div>
        </motion.button>

        {/* Orateurs */}
        <motion.button variants={staggerItem} whileHover={{ y: -2 }} onClick={() => setActiveTab("speakers")}
          className="glass-card p-2.5 xs:p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between">
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("speakers")}</p>
          <p className="text-2xl xs:text-3xl md:text-4xl font-black text-foreground">{speakers.length}</p>
        </motion.button>

        {/* Ce mois-ci */}
        <motion.button 
          variants={staggerItem} 
          whileHover={{ y: -2 }} 
          onClick={() => handleFilterClick('month')}
          className={`glass-card p-2.5 xs:p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${
            filter === 'month' ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
          }`}
        >
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-primary">{t("this_month")}</p>
          <div className="flex items-center gap-2 mt-1 xs:mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black text-foreground">{stats.thisMonth}</p>
            <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </motion.button>
      </div>

      {/* Recent Activities */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base md:text-lg font-black text-foreground">
            {filter === 'all' ? t("recent_activities") : 
             filter === 'upcoming' ? t("upcoming_visits") :
             filter === 'confirmed' ? t("confirmed_count") :
             filter === 'month' ? t("this_month") : t("recent_activities")}
          </h3>
          <button 
            onClick={() => filter === 'all' ? setActiveTab("planning") : setFilter('all')} 
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {filter === 'all' ? (
              <>{t("see_all")} <ChevronRight className="w-3 h-3" /></>
            ) : (
              <>{t("all")}</>
            )}
          </button>
        </div>
        {filteredVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("no_visits")}</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredVisits.map((visit, i) => {
                const speaker = speakers.find((s) => s.nom.trim().toLowerCase() === visit.nom.trim().toLowerCase());
                const isCouple = speaker?.householdType === "couple";
                const displayName = isCouple && speaker?.spouseName ? `${speaker.nom} & ${speaker.spouseName}` : visit.nom;

                const d = new Date(visit.visitDate);
                const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
                const dayNum = d.getDate();
                return (
                  <motion.button
                    key={visit.visitId}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      useUIStore.getState().setPendingVisit(visit.visitId);
                      setActiveTab("planning");
                    }}
                    className="w-full glass-card p-4 flex items-center gap-4 text-left hover:ring-1 hover:ring-primary/30 transition-all group overflow-hidden"
                  >
                    {/* Subtle glass highlight on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="relative z-10 w-12 h-14 rounded-xl bg-muted/30 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{monthShort}</span>
                      <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
                    </div>

                    <div className="flex -space-x-3 overflow-hidden">
                      {isCouple ? (
                        <>
                          <div className="w-9 h-9 rounded-full ring-2 ring-background bg-muted overflow-hidden flex-shrink-0">
                            {speaker?.photoUrl ? (
                              <img src={speaker.photoUrl} alt={speaker.nom} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground/50" /></div>
                            )}
                          </div>
                          <div className="w-9 h-9 rounded-full ring-2 ring-background bg-muted overflow-hidden flex-shrink-0">
                            {speaker?.spousePhotoUrl ? (
                              <img src={speaker.spousePhotoUrl} alt={speaker.spouseName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground/50" /></div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {speaker?.photoUrl ? (
                            <img src={speaker.photoUrl} alt={visit.nom} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground/50" /></div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">📍 {visit.congregation}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                      visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
                    }`}>
                      {t(visit.status === "confirmed" ? "confirmed" : visit.status)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* KBV Premium Card */}
      <motion.div variants={staggerItem} className="relative rounded-2xl bg-gradient-to-br from-card to-card/50 p-4 xs:p-6 border border-border overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 transition-colors group-hover:bg-primary/10" />
        
        <div className="relative z-10">
          <h3 className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">KBV v2 – Premium</h3>
          <p className="text-xs xs:text-sm text-muted-foreground mt-1 max-w-md">
            {language === "cv" ? "Bo ferramenta di planifikason lokal, otimizadu pa un esperiénsia fásil i fluidu." :
             language === "pt" ? "A sua ferramenta de planificação local, otimizada para une expérience fácil e fluida." :
             "Votre outil de planification locale, optimisé pour une expérience tactile fluide."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 xs:gap-3 mt-4">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleExport}
              className="w-full sm:w-auto px-5 py-2.5 justify-center rounded-xl bg-muted/50 backdrop-blur-sm text-foreground text-xs font-bold hover:bg-muted/80 transition-colors flex items-center gap-2 border border-border/50">
              <Download className="w-4 h-4 flex-shrink-0" /> {t("backup")}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleImport}
              className="w-full sm:w-auto px-5 py-2.5 justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2">
              <Upload className="w-4 h-4 flex-shrink-0" /> Import
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
