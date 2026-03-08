import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const next = () => setCurrentMonth(new Date(year, month + 1, 1));

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";
  const monthName = currentMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });

  const weekDays = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayVisits = visitsByDate[todayKey] || [];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground capitalize">
          {monthName}
        </h3>
        <button onClick={next} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const hasVisit = visitsByDate[ds]?.length > 0;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasVisit && onVisitClick(visitsByDate[ds][0])}
              className={`relative h-9 rounded-lg text-xs font-medium transition-colors ${
                isToday(day)
                  ? "bg-primary text-primary-foreground font-black"
                  : hasVisit
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {day}
              {hasVisit && !isToday(day) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex-1 overflow-y-auto">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
          {t("today")}
        </h4>
        {todayVisits.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("no_visits_today")}</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {todayVisits.map((v) => (
                <motion.button
                  key={v.visitId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onVisitClick(v)}
                  className="w-full p-3 rounded-xl bg-primary/10 text-left hover:bg-primary/15 transition-colors"
                >
                  <p className="text-xs font-bold text-foreground">{v.nom}</p>
                  <p className="text-[10px] text-muted-foreground">{v.congregation}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
