import { useMemo } from "react";
import { Calendar, Users, Home, LayoutGrid, TrendingUp } from "lucide-react";
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
    {
      label: t("total_visits"),
      value: stats.total,
      icon: Calendar,
      color: "text-primary-500",
      bg: "bg-primary-50 dark:bg-primary-900/20",
      onClick: () => setActiveTab("planning"),
    },
    {
      label: t("upcoming_visits"),
      value: stats.upcoming,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      onClick: () => setActiveTab("planning"),
    },
    {
      label: t("total_speakers"),
      value: speakers.length,
      icon: Users,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      onClick: () => setActiveTab("speakers"),
    },
    {
      label: t("total_hosts"),
      value: hosts.length,
      icon: Home,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      onClick: () => setActiveTab("hosts"),
    },
  ];

  return (
    <div className="py-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="premium-card p-4 sm:p-6 text-left hover:scale-[1.02] transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-foreground">{stat.value}</p>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
              {stat.label}
            </p>
          </button>
        ))}
      </div>

      {/* Upcoming Visits */}
      <div className="premium-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-5 h-5 text-primary-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
            {t("upcoming_visits")}
          </h2>
        </div>
        {upcomingVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("no_visits")}</p>
        ) : (
          <div className="space-y-2">
            {upcomingVisits.map((visit) => (
              <button
                key={visit.visitId}
                onClick={() => {
                  useUIStore.getState().setPendingVisit(visit.visitId);
                  setActiveTab("planning");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{visit.nom}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {visit.congregation} · {new Date(visit.visitDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    visit.status === "confirmed"
                      ? "status-confirmed"
                      : visit.status === "completed"
                      ? "status-completed"
                      : visit.status === "cancelled"
                      ? "status-cancelled"
                      : "status-scheduled"
                  }`}
                >
                  {t(visit.status)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
