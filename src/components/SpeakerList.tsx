import { useState } from "react";
import { Users, Plus, Trash2, Edit3, Phone, Mail } from "lucide-react";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import type { Speaker } from "../store/visitTypes";

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

export function SpeakerList() {
  const speakers = useSpeakerStore((s) => s.speakers);
  const addSpeaker = useSpeakerStore((s) => s.addSpeaker);
  const updateSpeaker = useSpeakerStore((s) => s.updateSpeaker);
  const deleteSpeaker = useSpeakerStore((s) => s.deleteSpeaker);
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", congregation: "", telephone: "", email: "", notes: "" });

  const resetForm = () => {
    setForm({ nom: "", congregation: "", telephone: "", email: "", notes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.nom) return;
    if (editing) {
      updateSpeaker(editing.id, form);
    } else {
      addSpeaker({ ...form, id: generateId() } as Speaker);
    }
    resetForm();
  };

  const openEdit = (sp: Speaker) => {
    setForm({ nom: sp.nom, congregation: sp.congregation, telephone: sp.telephone || "", email: sp.email || "", notes: sp.notes || "" });
    setEditing(sp);
    setShowForm(true);
  };

  const filtered = speakers.filter(
    (sp) =>
      sp.nom.toLowerCase().includes(search.toLowerCase()) ||
      sp.congregation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          {t("speakers")} ({speakers.length})
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("add_speaker")}
        </button>
      </div>

      <input
        className="input-soft text-sm"
        placeholder={t("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
              {editing ? t("edit") : t("add_speaker")}
            </h3>
            <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
            <input className="input-soft text-sm" placeholder={t("phone")} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <input className="input-soft text-sm" placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{editing ? t("save") : t("add")}</button>
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("no_results")}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((sp) => (
            <div key={sp.id} className="premium-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-amber-600">{sp.nom.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{sp.nom}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{sp.congregation}</p>
                <div className="flex gap-3 mt-1">
                  {sp.telephone && (
                    <a href={`tel:${sp.telephone}`} className="text-[10px] text-primary-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {sp.telephone}
                    </a>
                  )}
                  {sp.email && (
                    <a href={`mailto:${sp.email}`} className="text-[10px] text-primary-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {sp.email}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(sp)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteSpeaker(sp.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
