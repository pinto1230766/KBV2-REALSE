import { useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3, Check, X, MapPin, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useUIStore } from "../store/useUIStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, VisitStatus } from "../store/visitTypes";

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

export function PlanningHub() {
  const visits = useVisitStore((s) => s.visits);
  const addVisit = useVisitStore((s) => s.addVisit);
  const updateVisit = useVisitStore((s) => s.updateVisit);
  const deleteVisit = useVisitStore((s) => s.deleteVisit);
  const pendingVisitId = useUIStore((s) => s.pendingVisitId);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [filter, setFilter] = useState<VisitStatus | "all">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredVisits = useMemo(() => {
    const sorted = [...visits].sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
    if (filter === "all") return sorted;
    return sorted.filter((v) => v.status === filter);
  }, [visits, filter]);

  const [form, setForm] = useState({
    nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "",
    locationType: "kingdom_hall" as Visit["locationType"],
    speakerPhone: "", notes: "", status: "scheduled" as VisitStatus,
  });

  const resetForm = () => {
    setForm({ nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "", locationType: "kingdom_hall", speakerPhone: "", notes: "", status: "scheduled" });
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
    toast.success(t("visit_deleted"));
  };

  const handleConfirm = (visitId: string) => {
    updateVisit(visitId, { status: "confirmed" });
    toast.success(t("visit_confirmed"));
  };

  const openEdit = (visit: Visit) => {
    setForm({
      nom: visit.nom, congregation: visit.congregation, visitDate: visit.visitDate,
      talkNoOrType: visit.talkNoOrType, talkTheme: visit.talkTheme || "",
      locationType: visit.locationType, speakerPhone: visit.speakerPhone || "",
      notes: visit.notes || "", status: visit.status,
    });
    setEditingVisit(visit);
    setShowForm(true);
  };

  const statusFilters: Array<{ id: VisitStatus | "all"; label: string }> = [
    { id: "all", label: t("all") },
    { id: "scheduled", label: t("scheduled") },
    { id: "confirmed", label: t("confirmed") },
    { id: "completed", label: t("completed") },
    { id: "cancelled", label: t("cancelled") },
  ];

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {t("planning")}
        </h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("add_visit")}
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Visit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                {editingVisit ? t("edit_visit") : t("add_visit")}
              </h3>
              <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("visit_date")}</label>
                <input className="input-soft text-sm" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
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
              {editingVisit && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("status")}</label>
                  <select className="input-soft text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VisitStatus })}>
                    <option value="scheduled">{t("scheduled")}</option>
                    <option value="confirmed">{t("confirmed")}</option>
                    <option value="completed">{t("completed")}</option>
                    <option value="cancelled">{t("cancelled")}</option>
                  </select>
                </div>
              )}
              <textarea className="input-soft text-sm min-h-[80px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                  {editingVisit ? t("save") : t("add")}
                </motion.button>
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors">
                  {t("cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm font-bold text-foreground">{t("confirm_delete_visit")}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">
                  {t("yes_delete")}
                </button>
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
                  {t("cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visit List */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("no_visits")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredVisits.map((visit, i) => (
              <motion.div
                key={visit.visitId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
                className={`premium-card p-4 cursor-pointer ${
                  pendingVisitId === visit.visitId ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setPendingVisit(visit.visitId === pendingVisitId ? null : visit.visitId)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{visit.nom}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        visit.status === "confirmed" ? "status-confirmed"
                          : visit.status === "completed" ? "status-completed"
                          : visit.status === "cancelled" ? "status-cancelled"
                          : "status-scheduled"
                      }`}>
                        {t(visit.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      {visit.congregation} · {new Date(visit.visitDate).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {visit.talkTheme && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {visit.talkNoOrType} — {visit.talkTheme}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(visit); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {visit.status !== "confirmed" && visit.status !== "completed" && (
                      <button onClick={(e) => { e.stopPropagation(); handleConfirm(visit.visitId); }} className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(visit.visitId); }} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
