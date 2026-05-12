import { motion } from "framer-motion";
import type { Visit, VisitStatus } from "../../store/visitTypes";

export interface AddVisitFormState {
  nom: string;
  congregation: string;
  visitDate: string;
  talkNoOrType: string;
  talkTheme: string;
  locationType: Visit["locationType"];
  speakerPhone: string;
  notes: string;
  status: VisitStatus;
  heure_visite: string;
}

interface AddVisitFormProps {
  form: AddVisitFormState;
  setForm: (f: AddVisitFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  t: (k: string) => string;
}

export function AddVisitForm({ form, setForm, onSubmit, onCancel, t }: AddVisitFormProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("add_visit")}</h3>
        <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("visit_date")}</label><input className="input-soft text-sm" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("visit_date")} /></div>
          <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("time")}</label><input className="input-soft text-sm" type="time" value={form.heure_visite} onChange={(e) => setForm({ ...form, heure_visite: e.target.value })} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("time")} /></div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <input className="input-soft text-sm" placeholder={t("talk_number")} value={form.talkNoOrType} onChange={(e) => setForm({ ...form, talkNoOrType: e.target.value })} />
          <input className="input-soft text-sm" placeholder={t("talk_theme")} value={form.talkTheme} onChange={(e) => setForm({ ...form, talkTheme: e.target.value })} />
        </div>
        <input className="input-soft text-sm" placeholder={t("phone")} value={form.speakerPhone} onChange={(e) => setForm({ ...form, speakerPhone: e.target.value })} />
        <select className="input-soft text-sm" value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value as Visit["locationType"] })} title={t("location")}>
          <option value="kingdom_hall">{t("kingdom_hall")}</option><option value="zoom">Zoom</option><option value="streaming">Streaming</option><option value="other">{t("other")}</option>
        </select>
        <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex gap-2 pt-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{t("add")}</motion.button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
