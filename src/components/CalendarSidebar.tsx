import { useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Mail, Bell, User, Send, RefreshCw, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Visit } from "../store/visitTypes";
import { useTranslation } from "../hooks/useTranslation";
import { useSettingsStore } from "../store/useSettingsStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useUIStore } from "../store/useUIStore";

interface CalendarSidebarProps {
  visits: Visit[];
  onVisitClick: (visit: Visit) => void;
  onSyncNow?: () => void;
}

export function CalendarSidebar({ visits, onVisitClick, onSyncNow }: CalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { t, language } = useTranslation();
  const [showMessages, setShowMessages] = useState(true);
  const [showReminders, setShowReminders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const congregation = useSettingsStore((s) => s.settings.congregation);
  const updateCongregation = useSettingsStore((s) => s.updateCongregation);
  const lastSyncAt = congregation.lastSyncAt;
  const allNotifications = useNotificationStore((s) => s.notifications);
  const pendingNotifications = useMemo(() => allNotifications.filter((n) => n.status === "pending"), [allNotifications]);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);

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

  // Upcoming visits (next 30 days)
  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const later = new Date(now);
    later.setDate(later.getDate() + 30);
    return visits
      .filter((v) => {
        const d = new Date(v.visitDate);
        return d >= now && d <= later && v.status !== "cancelled";
      })
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 5);
  }, [visits]);

  const pendingMessages = todayVisits.length;
  const reminderCount = pendingNotifications.length;

  const todayDateStr = today.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  // Format last sync time
  const lastSyncLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : null;

  // Open today's first visit in messages tab
  const handleMailClick = () => {
    if (todayVisits.length > 0) {
      setPendingVisit(todayVisits[0].visitId);
      setActiveTab("planning");
    } else {
      toast.info("Aucune visite prévue aujourd'hui");
    }
  };

  // Open the first pending notification's visit
  const handleBellClick = () => {
    if (pendingNotifications.length > 0) {
      const first = pendingNotifications[0];
      setPendingVisit(first.visitId);
      setActiveTab("planning");
    } else {
      toast.info("Aucune notification en attente");
    }
  };

  // Send WhatsApp for a reminder
  const sendQuickWhatsApp = (visit: Visit) => {
    const phone = visit.speakerPhone?.replace(/\s/g, "") || "";
    const prenom = visit.nom.split(" ")[0];
    const dateFormatted = new Date(visit.visitDate + "T00:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
    const msg = `Bonjour ${prenom}, un petit rappel pour votre visite prévue le ${dateFormatted}. À bientôt ! 🙏`;
    
    navigator.clipboard.writeText(msg);
    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo trop volumineuse (max 2Mo)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      updateCongregation({ responsablePhoto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-5 h-full flex flex-col overflow-y-auto">
      {/* ─── Admin Header ─── */}
      <div className="flex items-center justify-between mb-5">
        {/* Icônes alignées à gauche */}
        <div className="flex items-center gap-2">
          {/* Mail: opens today's visit messages */}
          <button
            onClick={handleMailClick}
            title={t("messages_today")}
            className="relative p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Mail className="w-5 h-5 text-muted-foreground" />
            {pendingMessages > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-black flex items-center justify-center px-1">
                {pendingMessages}
              </span>
            )}
          </button>
          {/* Bell: opens first pending notification visit */}
          <button
            onClick={handleBellClick}
            title={t("upcoming_reminders")}
            className="relative p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Bell className={`w-5 h-5 ${reminderCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            {reminderCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center px-1 animate-pulse">
                {reminderCount}
              </span>
            )}
          </button>
          {/* Sync button */}
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              title="Synchroniser"
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Admin name + avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">{congregation.responsableName || "Administrateur"}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {lastSyncLabel ? `Sync ${lastSyncLabel}` : "Administrateur"}
            </p>
          </div>
          <div className="relative">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
            >
              {congregation.responsablePhoto ? (
                <img 
                  src={congregation.responsablePhoto} 
                  alt="Photo admin" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary-foreground" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              aria-label="Télécharger une photo"
              title="Télécharger une photo"
            />
          </div>
        </div>
      </div>

      {/* ─── Calendar Header ─── */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-foreground capitalize">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} title="Mois précédent" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={next} title="Mois suivant" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="ml-2 text-[10px] font-black text-primary uppercase tracking-widest">
            {t("today")}
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-5">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dateStr(day);
          const dayVisits = visitsByDate[ds] || [];
          const hasVisit = dayVisits.length > 0;
          const isSunday = new Date(year, month, day).getDay() === 0;
          return (
            <button
              key={i}
              onClick={() => hasVisit && onVisitClick(dayVisits[0])}
              className={`relative h-9 rounded-lg text-xs font-semibold transition-all ${
                isToday(day)
                  ? "bg-primary text-primary-foreground font-black shadow-md"
                  : hasVisit
                  ? "text-primary font-bold hover:bg-primary/10"
                  : isSunday
                  ? "text-primary/40"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {day}
              {hasVisit && !isToday(day) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Programme du jour ─── */}
      <div className="mb-5">
        <h4 className="text-sm font-black text-foreground mb-0.5">{t("program_today")}</h4>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{todayDateStr}</p>
        {todayVisits.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("no_visits_today")}</p>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((v) => (
              <button key={v.visitId} onClick={() => onVisitClick(v)} className="w-full flex items-center gap-3 text-left bg-muted/30 hover:bg-muted/60 rounded-xl p-3 transition-colors">
                <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-primary">{v.heure_visite || "11:30"}</p>
                  <p className="text-sm font-bold text-foreground truncate">{v.nom}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{v.talkTheme || v.congregation}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Messages du jour (with quick WhatsApp) ─── */}
      {todayVisits.length > 0 && (
        <div className="mb-5 premium-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("messages_today")}</h4>
            <button onClick={() => setShowMessages(!showMessages)} className="text-[10px] font-bold text-primary">
              {showMessages ? t("close") : t("view")}
            </button>
          </div>
          <AnimatePresence>
            {showMessages && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-2">
                  {todayVisits.map((v) => (
                    <div key={v.visitId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{v.nom}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{v.congregation}</p>
                      </div>
                      {/* Quick WhatsApp send */}
                      <button
                        onClick={() => sendQuickWhatsApp(v)}
                        title="Envoyer rappel WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      {/* Open detail */}
                      <button
                        onClick={() => onVisitClick(v)}
                        title="Voir détails"
                        className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Rappels à venir ─── */}
      <div className="flex-1 premium-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("upcoming_reminders")}</h4>
          <button onClick={() => setShowReminders(!showReminders)} className="text-[10px] font-bold text-primary">
            {showReminders ? t("close") : t("view")}
          </button>
        </div>
        <AnimatePresence>
          {showReminders && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-3">
                {upcomingReminders.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">{t("no_visits")}</p>
                )}
                {upcomingReminders.map((v) => {
                  const d = new Date(v.visitDate);
                  const daysUntil = Math.ceil((d.getTime() - today.getTime()) / 86400000);
                  const dateLabel = d.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit" }).toUpperCase();
                  const urgencyColor = daysUntil <= 2 ? "text-destructive" : daysUntil <= 7 ? "text-amber-600" : "text-muted-foreground";
                  return (
                    <button key={v.visitId} onClick={() => onVisitClick(v)} className="w-full text-left hover:bg-muted/30 rounded-xl p-2 transition-colors border-b border-border/50 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{v.nom}</p>
                        <span className={`text-[9px] font-black ${urgencyColor}`}>
                          J-{daysUntil}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{dateLabel} · {v.congregation}</p>
                      {v.talkTheme && (
                        <p className="text-[10px] text-primary/70 italic truncate">{v.talkTheme}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
