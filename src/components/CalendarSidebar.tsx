import { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Visit } from "../store/visitTypes";

interface CalendarSidebarProps {
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
}

export function CalendarSidebar({ visits, onVisitClick }: CalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start

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

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const next = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const todayVisits = visitsByDate[
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  ] || [];

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground capitalize">{monthName}</h3>
        <button onClick={next} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((d) => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const hasVisit = visitsByDate[ds]?.length > 0;
          return (
            <button
              key={i}
              onClick={() => {
                if (hasVisit) onVisitClick(visitsByDate[ds][0]);
              }}
              className={`relative h-9 rounded-lg text-xs font-medium transition-colors ${
                isToday(day)
                  ? "bg-primary text-primary-foreground font-black"
                  : hasVisit
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 font-bold"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {day}
              {hasVisit && !isToday(day) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today's Visits */}
      <div className="mt-6 flex-1 overflow-y-auto">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
          Aujourd'hui
        </h4>
        {todayVisits.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune visite aujourd'hui</p>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((v) => (
              <button
                key={v.visitId}
                onClick={() => onVisitClick(v)}
                className="w-full p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-left hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <p className="text-xs font-bold text-foreground">{v.nom}</p>
                <p className="text-[10px] text-muted-foreground">{v.congregation}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
