import { useState } from "react";
import { Bell, X, Send, Copy, Check, Clock, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useNotificationStore,
  type AppNotification,
  type ReminderType,
} from "../store/useNotificationStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";

const typeLabels: Record<ReminderType, Record<string, string>> = {
  j7: { fr: "Rappel J-7 : Confirmer", cv: "Lembra J-7 : Konfirmâ", pt: "Lembrete D-7 : Confirmar" },
  j2: { fr: "Rappel J-2 : Préparer", cv: "Lembra J-2 : Preparâ", pt: "Lembrete D-2 : Preparar" },
  j1_thanks: { fr: "J+1 : Remercier", cv: "J+1 : Agradese", pt: "D+1 : Agradecer" },
};

const typeColors: Record<ReminderType, string> = {
  j7: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  j2: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20",
  j1_thanks: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
};

const typeIcons: Record<ReminderType, string> = {
  j7: "📞",
  j2: "📋",
  j1_thanks: "🙏",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { language } = useTranslation();
  const { notifications, dismissNotification, markSent, clearAll } =
    useNotificationStore();

  const pending = notifications.filter((n) => n.status === "pending");
  const history = notifications.filter((n) => n.status !== "pending").slice(-10);

  const sendWhatsApp = (n: AppNotification) => {
    if (!n.whatsappMessage) return;
    navigator.clipboard.writeText(n.whatsappMessage);
    if (n.whatsappPhone) {
      const cleaned = n.whatsappPhone.replace(/\s/g, "");
      const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(n.whatsappMessage)}`;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    markSent(n.id);
    toast.success("✅ Message copié + WhatsApp ouvert");
  };

  const copyMessage = (n: AppNotification) => {
    if (!n.whatsappMessage) return;
    navigator.clipboard.writeText(n.whatsappMessage);
    toast.success("📋 Message copié !");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString(
        language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR",
        { weekday: "short", day: "numeric", month: "short" }
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {pending.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black flex items-center justify-center animate-pulse">
            {pending.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-[380px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-foreground">
                    Notifications
                  </span>
                  {pending.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {pending.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        clearAll();
                        toast.success("🗑️ Notifications effacées");
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title="Tout effacer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Pending */}
                {pending.length === 0 && history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs font-medium">Aucune notification</p>
                  </div>
                ) : (
                  <>
                    {pending.length > 0 && (
                      <div className="p-2 space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 pt-1">
                          {language === "cv" ? "Pendentis" : language === "pt" ? "Pendentes" : "En attente"}
                        </p>
                        {pending.map((n) => (
                          <NotificationCard
                            key={n.id}
                            notification={n}
                            language={language}
                            formatDate={formatDate}
                            onSendWhatsApp={() => sendWhatsApp(n)}
                            onCopy={() => copyMessage(n)}
                            onDismiss={() => dismissNotification(n.id)}
                          />
                        ))}
                      </div>
                    )}
                    {history.length > 0 && (
                      <div className="p-2 space-y-2 border-t border-border">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 pt-1">
                          {language === "cv" ? "Istóriku" : language === "pt" ? "Histórico" : "Historique"}
                        </p>
                        {history.map((n) => (
                          <NotificationCard
                            key={n.id}
                            notification={n}
                            language={language}
                            formatDate={formatDate}
                            onSendWhatsApp={() => sendWhatsApp(n)}
                            onCopy={() => copyMessage(n)}
                            onDismiss={() => dismissNotification(n.id)}
                            isHistory
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({
  notification: n,
  language,
  formatDate,
  onSendWhatsApp,
  onCopy,
  onDismiss,
  isHistory = false,
}: {
  notification: AppNotification;
  language: string;
  formatDate: (d: string) => string;
  onSendWhatsApp: () => void;
  onCopy: () => void;
  onDismiss: () => void;
  isHistory?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-xl border p-3 ${isHistory ? "opacity-60" : ""} ${typeColors[n.type]}`}
    >
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-lg">{typeIcons[n.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{n.speakerName}</p>
          <p className="text-[10px] opacity-75">
            {typeLabels[n.type][language] || typeLabels[n.type].fr} • {formatDate(n.visitDate)}
          </p>
        </div>
        {n.status === "sent" && (
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        )}
        {n.status === "pending" && (
          <Clock className="w-4 h-4 opacity-50 flex-shrink-0" />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {n.whatsappMessage && (
              <pre className="mt-2 p-2 rounded-lg bg-background/50 text-[10px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto font-sans">
                {n.whatsappMessage}
              </pre>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              {n.whatsappPhone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendWhatsApp();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  WhatsApp
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground text-[10px] font-bold hover:bg-muted/80 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {language === "cv" ? "Kopia" : language === "pt" ? "Copiar" : "Copier"}
              </button>
              {n.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-muted-foreground text-[10px] font-bold hover:bg-muted transition-colors ml-auto"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
