import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Visit } from "../store/visitTypes";
import { useTranslation } from "../hooks/useTranslation";

interface CalendarSidebarProps {
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
}

export function CalendarSidebar({ visits, onVisitClick }: CalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { t, language } = useTranslation();
  const [showMessages, setShowMessages] = useState(true);
  const [showReminders, setShowReminders] = useState(true);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const visitsByDate = useMemo(() => {
    const map: Record<string, Visit[]> = {};
    visits.forEach((v) => {
      const d = v.visitDate.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(v);
    });
    return map;
  }, [visits]);

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - offset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return dayNum;
  });

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const next = () => setCurrentMonth(new Date(year, month + 1, 1));

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";
  const monthName = currentMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const weekDays = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayVisits = visitsByDate[todayKey] || [];

  // Upcoming visits (next 7 days)
  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 30);
    return visits
      .filter((v) => {
        const d = new Date(v.visitDate);
        return d >= now && d <= weekLater && v.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 5);
  }, [visits]);

  const todayDateStr = today.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  return (
    <div className="p-5 h-full flex flex-col overflow-y-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-foreground capitalize">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="ml-1 text-[9px] font-bold text-primary uppercase tracking-widest">
            {t("today")}
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const hasVisit = visitsByDate[ds]?.length > 0;
          const isSunday = new Date(year, month, day).getDay() === 0;
          return (
            <button
              key={i}
              onClick={() => hasVisit && onVisitClick(visitsByDate[ds][0])}
              className={`relative h-8 rounded-md text-xs font-medium transition-colors ${
                isToday(day)
                  ? "bg-primary text-primary-foreground font-black"
                  : hasVisit
                  ? "text-primary font-bold"
                  : isSunday
                  ? "text-primary/50"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {day}
              {hasVisit && !isToday(day) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Programme du jour */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1">{t("program_today")}</h4>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">{todayDateStr}</p>
        {todayVisits.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("no_visits_today")}</p>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((v) => (
              <button key={v.visitId} onClick={() => onVisitClick(v)} className="w-full flex items-start gap-2 text-left hover:bg-muted/30 rounded-lg p-1.5 transition-colors">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-primary">{v.heure_visite || "11:30"}</p>
                  <p className="text-xs font-bold text-foreground">{v.nom}</p>
                  <p className="text-[10px] text-muted-foreground">{v.talkTheme || v.congregation}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages du jour */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("messages_today")}</h4>
          <button onClick={() => setShowMessages(!showMessages)} className="text-[10px] font-bold text-primary">
            {showMessages ? t("close") : t("view")}
          </button>
        </div>
        {showMessages && todayVisits.length > 0 && (
          <div className="space-y-1.5">
            {todayVisits.map((v) => (
              <div key={v.visitId} className="text-xs">
                <p className="font-bold text-foreground">{v.nom}</p>
                <p className="text-[10px] text-muted-foreground">{v.congregation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rappels à venir */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("upcoming_reminders")}</h4>
          <button onClick={() => setShowReminders(!showReminders)} className="text-[10px] font-bold text-primary">
            {showReminders ? t("close") : t("view")}
          </button>
        </div>
        {showReminders && (
          <div className="space-y-2">
            {upcomingReminders.map((v) => {
              const d = new Date(v.visitDate);
              const dateLabel = d.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit" }).toUpperCase();
              return (
                <button key={v.visitId} onClick={() => onVisitClick(v)} className="w-full text-left hover:bg-muted/30 rounded-lg p-1 transition-colors">
                  <p className="text-xs font-bold text-foreground">{v.nom}</p>
                  <p className="text-[10px] text-muted-foreground">{dateLabel} · {v.congregation}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
