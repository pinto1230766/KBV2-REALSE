import { useMemo } from "react";
import { Calendar, Users, Home, LayoutGrid, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useUIStore } from "../store/useUIStore";
import { useTranslation } from "../hooks/useTranslation";

export function DashboardView() {
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = visits.filter(
      (v) => new Date(v.visitDate) >= now && v.status !== "cancelled"
    );
    const confirmed = visits.filter((v) => v.status === "confirmed");
    return { total: visits.length, upcoming: upcoming.length, confirmed: confirmed.length };
  }, [visits]);

  const upcomingVisits = useMemo(() => {
    const now = new Date();
    return visits
      .filter((v) => new Date(v.visitDate) >= now && v.status !== "cancelled")
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 5);
  }, [visits]);

  const statCards = [
    { label: t("total_visits"), value: stats.total, icon: Calendar, color: "text-primary", bg: "bg-primary/10", onClick: () => setActiveTab("planning") },
    { label: t("upcoming_visits"), value: stats.upcoming, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", onClick: () => setActiveTab("planning") },
    { label: t("total_speakers"), value: speakers.length, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10", onClick: () => setActiveTab("speakers") },
    { label: t("total_hosts"), value: hosts.length, icon: Home, color: "text-blue-500", bg: "bg-blue-500/10", onClick: () => setActiveTab("hosts") },
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="py-6 space-y-6">
      {/* Welcome */}
      <motion.p variants={item} className="text-xs text-muted-foreground uppercase tracking-widest">
        {t("welcome_message")}
      </motion.p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.button
            key={stat.label}
            variants={item}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={stat.onClick}
            className="premium-card p-4 sm:p-6 text-left"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
              {stat.label}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Upcoming Visits */}
      <motion.div variants={item} className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
            {t("upcoming_visits")}
          </h2>
        </div>
        {upcomingVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("no_visits")}</p>
        ) : (
          <div className="space-y-2">
            {upcomingVisits.map((visit, i) => (
              <motion.button
                key={visit.visitId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => {
                  useUIStore.getState().setPendingVisit(visit.visitId);
                  setActiveTab("planning");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{visit.nom}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {visit.congregation} · {new Date(visit.visitDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    visit.status === "confirmed" ? "status-confirmed"
                      : visit.status === "completed" ? "status-completed"
                      : visit.status === "cancelled" ? "status-cancelled"
                      : "status-scheduled"
                  }`}
                >
                  {t(visit.status)}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
