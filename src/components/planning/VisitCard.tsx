import { motion } from "framer-motion";
import {
  AlertTriangle, Check, ChevronRight, Trash2, Clock, MapPin,
  Home, Utensils, Car, CalendarDays,
} from "lucide-react";
import type { Visit } from "../../store/visitTypes";
import type { Speaker } from "../../store/visitTypes";
import { isEventVisit } from "../../lib/eventDetection";
import { locationLabel as locationLabelHelper } from "../../lib/planningHelpers";

interface VisitCardProps {
  visit: Visit;
  index: number;
  locale: string;
  allVisits: Visit[];
  getSpeakerForVisit: (v: Visit) => Speaker | undefined;
  t: (k: string) => string;
  onOpen: (v: Visit) => void;
  onConfirm: (id: string) => void;
  onAskDelete: (id: string) => void;
}

export function VisitCard({
  visit, index, locale, allVisits, getSpeakerForVisit, t,
  onOpen, onConfirm, onAskDelete,
}: VisitCardProps) {
  const d = new Date(visit.visitDate);
  const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
  const dayNum = d.getDate();
  const sameNameNearby = allVisits.some(v =>
    v.visitId !== visit.visitId &&
    v.status !== "cancelled" &&
    v.nom.toLowerCase().trim() === visit.nom.toLowerCase().trim() &&
    Math.abs(new Date(v.visitDate).getTime() - new Date(visit.visitDate).getTime()) < 7 * 24 * 60 * 60 * 1000
  );
  const conflictSameDay = allVisits.some(v =>
    v.visitId !== visit.visitId &&
    v.status !== "cancelled" &&
    v.visitDate === visit.visitDate &&
    v.nom.toLowerCase().trim() !== visit.nom.toLowerCase().trim()
  );
  const locationLabel = (loc: string) => locationLabelHelper(loc, t);

  const renderBadge = () => {
    const assignments = visit.hostAssignments || [];
    const hasH = assignments.some(a => a.role === 'hebergement');
    const hasR = assignments.some(a => a.role === 'repas');
    const hasT = assignments.some(a => a.role === 'transport');
    const isOnline = visit.locationType === 'zoom' || visit.locationType === 'streaming';
    const isLocal = visit.localSpeaker || getSpeakerForVisit(visit)?.localSpeaker;
    if (isEventVisit(visit)) {
      return (
        <span className="ml-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-600 border border-violet-500/30 flex items-center gap-1">
          <CalendarDays className="w-2.5 h-2.5" /> {t("event_badge") !== "event_badge" ? t("event_badge") : "Événement"}
        </span>
      );
    }
    if (isOnline) return null;
    if (isLocal) {
      return (
        <span className="ml-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
          {t("local_speaker_badge")}
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 ml-1 border-l border-border/50 pl-2">
        <Home className={`w-3 h-3 ${hasH ? 'text-amber-500' : 'text-muted-foreground/20'}`} />
        <Utensils className={`w-3 h-3 ${hasR ? 'text-emerald-500' : 'text-muted-foreground/20'}`} />
        <Car className={`w-3 h-3 ${hasT ? 'text-blue-500' : 'text-muted-foreground/20'}`} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.02 }}
      className={`premium-card p-3 cursor-pointer transition-all ${(sameNameNearby || conflictSameDay) ? "ring-2 ring-amber-500/30" : "hover:ring-1 hover:ring-primary/30"}`}
      onClick={() => onOpen(visit)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-14 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0 relative">
          <span className="text-[8px] font-bold uppercase tracking-wider text-primary">{monthShort}</span>
          <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
          {sameNameNearby && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-background" title="Doublon potentiel (même orateur à une date proche)">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {conflictSameDay && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-background" title="Conflit : un autre orateur est déjà prévu ce jour-là">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-black text-foreground truncate">{visit.nom}</p>
          {visit.talkTheme && <p className="text-xs text-muted-foreground truncate mt-0.5">{visit.talkTheme}</p>}
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
              visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
            }`}>{t(visit.status)}</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{locationLabel(visit.locationType)}</span>
            {renderBadge()}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {visit.heure_visite || "11:30"}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {visit.congregation}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-center self-stretch justify-center pr-1">
          {visit.status !== "confirmed" && visit.status !== "completed" && (
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm(visit.visitId); }}
              className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
              title="Confirmer"
              aria-label="Confirmer la visite"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAskDelete(visit.visitId); }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            title="Supprimer"
            aria-label="Supprimer la visite"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 mt-auto" />
        </div>
      </div>
    </motion.div>
  );
}
