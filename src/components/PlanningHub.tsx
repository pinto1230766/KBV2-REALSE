import { useState, useMemo } from "react";
import {
  Plus, Trash2, Edit3, Check, ChevronRight, Clock, MapPin, Archive, AlertTriangle,
  X, Info, Users, MessageSquare, CreditCard, Star, Phone, Calendar as CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, VisitStatus } from "../store/visitTypes";

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

type DetailTab = "infos" | "hosts" | "messages" | "expenses" | "feedback";

export function PlanningHub() {
  const visits = useVisitStore((s) => s.visits);
  const addVisit = useVisitStore((s) => s.addVisit);
  const updateVisit = useVisitStore((s) => s.updateVisit);
  const deleteVisit = useVisitStore((s) => s.deleteVisit);
  const pendingVisitId = useUIStore((s) => s.pendingVisitId);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const congregation = useSettingsStore((s) => s.settings.congregation);
  const speakers = useSpeakerStore((s) => s.speakers);
  const { t, language } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [viewVisit, setViewVisit] = useState<Visit | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("infos");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";

  const now = new Date();
  const { upcomingVisits, archivedVisits } = useMemo(() => {
    const sorted = [...visits].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    const upcoming = sorted.filter((v) => new Date(v.visitDate) >= now || v.status === "scheduled" || v.status === "confirmed");
    const archived = sorted.filter((v) => v.status === "completed" || v.status === "cancelled");
    return { upcomingVisits: upcoming, archivedVisits: archived };
  }, [visits]);

  const displayedVisits = showArchived ? archivedVisits : upcomingVisits;

  // Detail form state (for the full fiche)
  const [detailForm, setDetailForm] = useState<Partial<Visit>>({});

  const [form, setForm] = useState({
    nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "",
    locationType: "kingdom_hall" as Visit["locationType"],
    speakerPhone: "", notes: "", status: "scheduled" as VisitStatus, heure_visite: congregation?.time || "11:30",
  });

  const resetForm = () => {
    setForm({ nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "", locationType: "kingdom_hall", speakerPhone: "", notes: "", status: "scheduled", heure_visite: congregation?.time || "11:30" });
    setEditingVisit(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.nom || !form.visitDate) return;
    if (editingVisit) {
      updateVisit(editingVisit.visitId, form);
      toast.success(t("visit_updated"));
    } else {
      addVisit({ ...form, visitId: generateId() } as Visit);
      toast.success(t("visit_added"));
    }
    resetForm();
  };

  const handleDelete = (visitId: string) => {
    deleteVisit(visitId);
    setConfirmDeleteId(null);
    setViewVisit(null);
    toast.success(t("visit_deleted"));
  };

  const openDetail = (visit: Visit) => {
    setViewVisit(visit);
    setDetailForm({ ...visit });
    setDetailTab("infos");
  };

  const saveDetail = () => {
    if (!viewVisit) return;
    updateVisit(viewVisit.visitId, detailForm);
    toast.success(t("visit_updated"));
    setViewVisit(null);
  };

  const closeDetail = () => {
    setViewVisit(null);
    setDetailForm({});
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const locationLabel = (loc: string) => {
    if (loc === "kingdom_hall") return t("in_person");
    if (loc === "zoom") return "Zoom";
    if (loc === "streaming") return "Streaming";
    return t("other");
  };

  // Find speaker info for detail view
  const getSpeakerForVisit = (visit: Visit) => {
    return speakers.find((s) => s.nom.toLowerCase() === visit.nom.toLowerCase());
  };

  const detailTabs: Array<{ id: DetailTab; label: string; icon: any }> = [
    { id: "infos", label: t("infos"), icon: Info },
    { id: "hosts", label: t("hosts"), icon: Users },
    { id: "messages", label: t("messages_tab"), icon: MessageSquare },
    { id: "expenses", label: t("expenses"), icon: CreditCard },
    { id: "feedback", label: t("feedback_label"), icon: Star },
  ];

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("upcoming")}</p>
          <p className="text-3xl font-black text-foreground">{upcomingVisits.length}</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> {t("schedule")}
        </motion.button>
        <button onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${showArchived ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Archive className="w-4 h-4" /> {t("archived")} ({archivedVisits.length})
        </button>
      </div>

      {/* Visit Grid */}
      {displayedVisits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{t("no_visits")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {displayedVisits.map((visit, i) => {
              const d = new Date(visit.visitDate);
              const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
              const dayNum = d.getDate();
              return (
                <motion.div
                  key={visit.visitId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className={`premium-card p-4 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${pendingVisitId === visit.visitId ? "ring-2 ring-primary" : ""}`}
                  onClick={() => openDetail(visit)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-14 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-primary">{monthShort}</span>
                      <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{visit.nom}</p>
                      {visit.talkTheme && <p className="text-xs text-muted-foreground truncate mt-0.5">{visit.talkTheme}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
                        }`}>{t(visit.status)}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                          {locationLabel(visit.locationType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {visit.heure_visite || "11:30"}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {visit.congregation}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {visit.status !== "confirmed" && visit.status !== "completed" && (
                        <button onClick={(e) => { e.stopPropagation(); updateVisit(visit.visitId, { status: "confirmed" }); toast.success(t("visit_confirmed")); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(visit.visitId); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ============ VISIT DETAIL MODAL ============ */}
      <AnimatePresence>
        {viewVisit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeDetail}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="w-full max-w-3xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const speaker = getSpeakerForVisit(viewVisit);
                const visitD = new Date(viewVisit.visitDate);
                const dayLabel = visitD.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
                return (
                  <div className="max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start gap-4">
                        {/* Speaker photo */}
                        {speaker?.photoUrl ? (
                          <img src={speaker.photoUrl} alt={viewVisit.nom} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-black text-foreground">{viewVisit.nom}</h2>
                          {speaker?.spouseName && (
                            <p className="text-sm text-primary font-medium">& {speaker.spouseName}</p>
                          )}
                          <p className="text-sm font-medium text-foreground mt-1">{dayLabel}</p>
                          <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                            {detailForm.date_arrivee && <p>{t("arrival")} : {detailForm.date_arrivee} · {detailForm.heure_arrivee || "--:--"}</p>}
                            <p>{t("meeting")} : {viewVisit.visitDate} · {viewVisit.heure_visite || "11:30"}</p>
                            {detailForm.date_depart && <p>{t("departure")} : {detailForm.date_depart} · {detailForm.heure_depart || "--:--"}</p>}
                          </div>
                        </div>
                        <button onClick={closeDetail} className="p-2 rounded-xl hover:bg-muted transition-colors">
                          <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Detail Tabs */}
                      <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide border-b border-border pb-0">
                        {detailTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setDetailTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
                              detailTab === tab.id
                                ? "text-primary border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground"
                            }`}
                          >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 space-y-6">
                      {/* INFOS TAB */}
                      {detailTab === "infos" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("visit_details")}</p>

                          {/* Talk theme & number */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_theme")}</p>
                            <input className="input-soft text-base font-bold" value={detailForm.talkTheme || ""} onChange={(e) => setDetailForm({ ...detailForm, talkTheme: e.target.value })} placeholder={t("talk_theme")} />
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_number")}</p>
                            <input className="input-soft text-2xl font-black w-32" value={detailForm.talkNoOrType || ""} onChange={(e) => setDetailForm({ ...detailForm, talkNoOrType: e.target.value })} />
                          </div>

                          {/* Speaker phone */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_phone")}</p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                              <input className="input-soft text-sm" value={detailForm.speakerPhone || ""} onChange={(e) => setDetailForm({ ...detailForm, speakerPhone: e.target.value })} placeholder="+33..." />
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("phone_whatsapp_hint")}</p>
                          </div>

                          {/* Dates: arrivée / réunion / départ */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("arrival_date")}</p>
                              <input className="input-soft text-sm" type="date" value={detailForm.date_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, date_arrivee: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("meeting_date")}</p>
                              <input className="input-soft text-sm" type="date" value={detailForm.visitDate || ""} onChange={(e) => setDetailForm({ ...detailForm, visitDate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("departure_date")}</p>
                              <input className="input-soft text-sm" type="date" value={detailForm.date_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, date_depart: e.target.value })} />
                            </div>
                          </div>

                          {/* Times: arrivée / réunion / départ */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("arrival_time")}</p>
                              <input className="input-soft text-sm" type="time" value={detailForm.heure_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_arrivee: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("meeting_time")}</p>
                              <input className="input-soft text-sm" type="time" value={detailForm.heure_visite || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_visite: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("departure_time")}</p>
                              <input className="input-soft text-sm" type="time" value={detailForm.heure_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_depart: e.target.value })} />
                            </div>
                          </div>

                          {/* Location & Status */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("location")}</p>
                              <select className="input-soft text-sm" value={detailForm.locationType || "kingdom_hall"} onChange={(e) => setDetailForm({ ...detailForm, locationType: e.target.value as Visit["locationType"] })}>
                                <option value="kingdom_hall">{t("in_person")}</option>
                                <option value="zoom">Zoom</option>
                                <option value="streaming">Streaming</option>
                                <option value="other">{t("other")}</option>
                              </select>
                              <p className="text-[10px] text-muted-foreground">{t("location_hint")}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("status")}</p>
                              <select className="input-soft text-sm" value={detailForm.status || "scheduled"} onChange={(e) => setDetailForm({ ...detailForm, status: e.target.value as VisitStatus })}>
                                <option value="scheduled">{t("scheduled")}</option>
                                <option value="confirmed">{t("confirmed")}</option>
                                <option value="completed">{t("completed")}</option>
                                <option value="cancelled">{t("cancelled")}</option>
                              </select>
                            </div>
                          </div>

                          {/* Hosts summary */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("hosts")}</p>
                            <div className="p-3 rounded-xl bg-muted/30 border border-border">
                              {detailForm.hostAssignments && detailForm.hostAssignments.length > 0 ? (
                                <p className="text-sm font-bold text-foreground">
                                  {detailForm.hostAssignments.map((ha) =>
                                    `${ha.hostName || "?"} (${t(ha.role)}${ha.day ? " · " + ha.day : ""}${ha.time ? " · " + ha.time : ""})`
                                  ).join(", ")}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">{t("no_hosts_assigned")}</p>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("hosts_hint")}</p>
                          </div>

                          {/* Régime & Allergies */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("dietary_allergies")}</p>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_label")}</p>
                              <input className="input-soft text-sm" placeholder={t("speaker_allergies_placeholder")} value={detailForm.speakerDietary || ""} onChange={(e) => setDetailForm({ ...detailForm, speakerDietary: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("spouse_label")}</p>
                              <input className="input-soft text-sm" placeholder={t("spouse_allergies_placeholder")} value={detailForm.spouseDietary || ""} onChange={(e) => setDetailForm({ ...detailForm, spouseDietary: e.target.value })} />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("visit_notes")}</p>
                            <textarea className="input-soft text-sm min-h-[80px] resize-y w-full" placeholder={t("add_notes_placeholder")} value={detailForm.notes || ""} onChange={(e) => setDetailForm({ ...detailForm, notes: e.target.value })} />
                            <p className="text-[10px] text-muted-foreground">{t("visit_notes_hint")}</p>
                          </div>
                        </motion.div>
                      )}

                      {/* HOSTS TAB */}
                      {detailTab === "hosts" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("host_management")}</p>
                          {detailForm.hostAssignments && detailForm.hostAssignments.length > 0 ? (
                            <div className="space-y-2">
                              {detailForm.hostAssignments.map((ha, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                                  <div>
                                    <p className="text-sm font-bold text-foreground">{ha.hostName}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{t(ha.role)} {ha.day && `· ${ha.day}`} {ha.time && `· ${ha.time}`}</p>
                                  </div>
                                  {ha.hostPhone && (
                                    <a href={`tel:${ha.hostPhone}`} className="text-primary">
                                      <Phone className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">{t("no_hosts_assigned")}</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* MESSAGES TAB */}
                      {detailTab === "messages" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("messages_section")}</p>
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{t("messages_coming_soon")}</p>
                          </div>
                        </motion.div>
                      )}

                      {/* EXPENSES TAB */}
                      {detailTab === "expenses" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("expenses_section")}</p>
                          <div className="text-center py-8 text-muted-foreground">
                            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{t("expenses_coming_soon")}</p>
                          </div>
                        </motion.div>
                      )}

                      {/* FEEDBACK TAB */}
                      {detailTab === "feedback" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("feedback_section")}</p>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("rating")}</p>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button key={n} onClick={() => setDetailForm({ ...detailForm, feedbackRating: n })}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                      (detailForm.feedbackRating || 0) >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}>
                                    <Star className="w-5 h-5" fill={(detailForm.feedbackRating || 0) >= n ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("feedback_comment")}</p>
                              <textarea className="input-soft text-sm min-h-[80px] resize-y w-full" placeholder={t("feedback_placeholder")} value={detailForm.feedback || ""} onChange={(e) => setDetailForm({ ...detailForm, feedback: e.target.value })} />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Save button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={saveDetail}
                        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest"
                      >
                        {t("save")}
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("add_visit")}</h3>
              <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("visit_date")}</label>
                  <input className="input-soft text-sm" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("time")}</label>
                  <input className="input-soft text-sm" type="time" value={form.heure_visite} onChange={(e) => setForm({ ...form, heure_visite: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-soft text-sm" placeholder={t("talk_number")} value={form.talkNoOrType} onChange={(e) => setForm({ ...form, talkNoOrType: e.target.value })} />
                <input className="input-soft text-sm" placeholder={t("talk_theme")} value={form.talkTheme} onChange={(e) => setForm({ ...form, talkTheme: e.target.value })} />
              </div>
              <input className="input-soft text-sm" placeholder={t("phone")} value={form.speakerPhone} onChange={(e) => setForm({ ...form, speakerPhone: e.target.value })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("location")}</label>
                <select className="input-soft text-sm" value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value as Visit["locationType"] })}>
                  <option value="kingdom_hall">{t("kingdom_hall")}</option>
                  <option value="zoom">{t("zoom")}</option>
                  <option value="streaming">{t("streaming")}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
              <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{t("add")}</motion.button>
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm font-bold text-foreground">{t("confirm_delete_visit")}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">{t("yes_delete")}</button>
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}