import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Calendar, TrendingUp, ChevronRight, Download, Upload, BookOpen, Check, CreditCard } from "lucide-react";
import { isEventVisit } from "../lib/eventDetection";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useUIStore } from "../store/useUIStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, Host, Speaker } from "../store/visitTypes";
import { mergeHosts, mergeSpeakers, mergeVisits } from "../lib/dedup";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

export function DashboardView() {
  const visits = useVisitStore(useShallow((s) => s.visits));
  const hosts = useHostStore(useShallow((s) => s.hosts));
  const speakers = useSpeakerStore(useShallow((s) => s.speakers));
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowUserManual = useUIStore((s) => s.setShowUserManual);
  const { t, language } = useTranslation();
  
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'confirmed' | 'month'>('all');

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = visits.filter((v) => new Date(v.visitDate) >= now && v.status !== "cancelled");
    const confirmed = visits.filter((v) => v.status === "confirmed");
    const thisMonth = visits.filter((v) => {
      const d = new Date(v.visitDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyExpenses = thisMonth.reduce((sum, v) => sum + (v.expenses || []).reduce((s, e) => s + e.amount, 0), 0);
    
    // Monthly visits data (last 6 months + next 6 months)
    const monthsData: Record<string, number> = {};
    const monthsOrder: string[] = [];
    for (let i = -5; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
      monthsData[key] = 0;
      monthsOrder.push(key);
    }
    visits.forEach(v => {
      const d = new Date(v.visitDate);
      const key = d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
      if (monthsData[key] !== undefined) monthsData[key]++;
    });
    const visitsByMonth = monthsOrder.map(name => ({ name, visits: monthsData[name] }));

    // Host assignment rate
    const visitsWithHousing = visits.filter(v => 
      !isEventVisit(v) && 
      v.status !== "cancelled" && 
      (v.hostAssignments || []).some(ha => ha.role === 'hebergement')
    ).length;
    const visitsWithoutHousing = visits.filter(v => 
      !isEventVisit(v) && 
      v.status !== "cancelled" && 
      v.localSpeaker !== true &&
      !(v.hostAssignments || []).some(ha => ha.role === 'hebergement')
    ).length;
    const hostStats = [
      { name: 'Assignés', value: visitsWithHousing, color: '#10b981' },
      { name: 'Manquants', value: visitsWithoutHousing, color: '#ef4444' }
    ];

    // Most frequent speakers
    const speakerCounts: Record<string, { count: number; name: string }> = {};
    visits.forEach(v => {
      if (isEventVisit(v)) return;
      const key = v.nom.toLowerCase().trim();
      if (!speakerCounts[key]) speakerCounts[key] = { count: 0, name: v.nom };
      speakerCounts[key].count++;
    });
    const topSpeakers = Object.values(speakerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { 
      total: visits.length, 
      upcoming: upcoming.length, 
      confirmed: confirmed.length, 
      thisMonth: thisMonth.length, 
      monthlyExpenses,
      visitsByMonth,
      hostStats,
      topSpeakers
    };
  }, [visits, locale]);

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
        const { safeParseBackup } = await import("../lib/validation");
        const parsed = safeParseBackup(JSON.parse(text));
        if (!parsed.ok) { toast.error(t("import_error")); return; }
        const { data } = parsed;
        if (data.visits?.length) useVisitStore.getState().setVisits(mergeVisits(useVisitStore.getState().visits, data.visits as unknown as Visit[]));
        if (data.hosts?.length) useHostStore.getState().setHosts(mergeHosts(useHostStore.getState().hosts, data.hosts as unknown as Host[]));
        if (data.speakers?.length) useSpeakerStore.getState().setSpeakers(mergeSpeakers(useSpeakerStore.getState().speakers, data.speakers as unknown as Speaker[]));
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
        <motion.button variants={staggerItem} whileHover={{ y: -2 }} onClick={() => handleFilterClick('upcoming')}
          className={`glass-card p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${filter === 'upcoming' ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""}`}>
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("upcoming")}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black text-foreground">{stats.upcoming}</p>
            <Calendar className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </motion.button>

        <motion.button variants={staggerItem} whileHover={{ y: -2 }} onClick={() => handleFilterClick('confirmed')}
          className={`rounded-2xl p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${filter === 'confirmed' ? "bg-emerald-500 ring-2 ring-emerald-400 shadow-lg scale-[1.02]" : "bg-amber-400 dark:bg-amber-500"} text-white shadow-lg`}>
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-white/80">{t("confirmed_count")}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black">{stats.confirmed}</p>
            <Check className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white/80" />
          </div>
        </motion.button>

        <motion.button variants={staggerItem} whileHover={{ y: -2 }} onClick={() => handleFilterClick('month')}
          className={`glass-card p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between transition-all ${filter === 'month' ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""}`}>
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-primary">{t("this_month")}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl xs:text-3xl md:text-4xl font-black text-foreground">{stats.thisMonth}</p>
            <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-primary" />
          </div>
        </motion.button>

        <motion.div variants={staggerItem} className="rounded-2xl p-4 md:p-5 text-left min-h-[90px] flex flex-col justify-between bg-primary text-primary-foreground shadow-lg">
          <p className="text-[10px] xs:text-xs md:text-sm font-bold uppercase tracking-wider text-primary-foreground/80">{t("expenses")}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xl xs:text-2xl md:text-3xl font-black">{stats.monthlyExpenses.toFixed(2)} €</p>
            <CreditCard className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6 text-white/60" />
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <motion.div variants={staggerItem} className="glass-card p-4 xs:p-6 min-h-[300px]">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">{t("visits_by_month") || "Visites par mois"}</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.visitsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }} cursor={{ fill: 'var(--primary)', opacity: 0.05 }} />
                <Bar dataKey="visits" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass-card p-4 xs:p-6 min-h-[300px] flex flex-col">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">{t("host_assignment_rate") || "Taux d'hébergement"}</h3>
          <div className="flex-1 flex flex-col xs:flex-row items-center justify-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.hostStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.hostStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {stats.hostStats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-bold text-foreground">{s.name}: {s.value}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-black">Total Besoins</p>
                <p className="text-lg font-black text-foreground">{stats.hostStats.reduce((a, b) => a + b.value, 0)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Speakers */}
        <motion.div variants={staggerItem} className="glass-card p-4 xs:p-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4">Orateurs les plus sollicités</h3>
          <div className="space-y-3">
            {stats.topSpeakers.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{i + 1}</div>
                  <span className="text-sm font-bold text-foreground">{s.name}</span>
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{s.count} {s.count > 1 ? "visites" : "visite"}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={staggerItem} className="flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              {filter === 'all' ? t("recent_activities") : t(filter)}
            </h3>
            <button onClick={() => filter === 'all' ? setActiveTab("planning") : setFilter('all')} className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
              {filter === 'all' ? <>{t("see_all")} <ChevronRight className="w-3 h-3" /></> : t("all")}
            </button>
          </div>
          
          <div className="space-y-2 flex-1">
            {filteredVisits.length === 0 ? (
              <p className="text-xs text-muted-foreground py-12 text-center italic">{t("no_visits")}</p>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredVisits.map((visit, i) => {
                  const speaker = speakers.find((s) => s.nom.trim().toLowerCase() === visit.nom.trim().toLowerCase());
                  const isCouple = speaker?.householdType === "couple";
                  const d = new Date(visit.visitDate);
                  const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
                  
                  return (
                    <motion.button key={visit.visitId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => { useUIStore.getState().setPendingVisit(visit.visitId); setActiveTab("planning"); }}
                      className="w-full glass-card p-3 flex items-center gap-3 text-left hover:ring-1 hover:ring-primary/30 transition-all group relative overflow-hidden"
                    >
                      <div className="w-10 h-12 rounded-lg bg-muted/30 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{monthShort}</span>
                        <span className="text-base font-black text-foreground leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{isCouple && speaker?.spouseName ? `${speaker.nom} & ${speaker.spouseName}` : visit.nom}</p>
                        <p className="text-[10px] text-muted-foreground truncate">📍 {visit.congregation}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${visit.status === "confirmed" ? "status-confirmed" : "status-scheduled"}`}>
                        {t(visit.status)}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Premium Card */}
      <motion.div variants={staggerItem} className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2">KBV v2 – Coordination Premium</h3>
          <p className="text-sm text-indigo-100/80 mb-6 max-w-md">
            Gérez vos orateurs et hébergements avec fluidité sur tous vos appareils. Vos données sont sécurisées et synchronisées.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors backdrop-blur-md border border-white/10">
              <Download className="w-4 h-4" /> {t("backup")}
            </button>
            <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-50 transition-colors">
              <Upload className="w-4 h-4" /> Import
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
