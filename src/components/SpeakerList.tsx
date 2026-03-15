import { useState, useRef } from "react";
import { Users, Plus, Trash2, Edit3, Phone, ChevronRight, AlertTriangle, Search, Camera, Upload, X, MapPin, UserCircle, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Speaker, HouseholdType } from "../store/visitTypes";
import { generateId } from "../lib/sheetUtils";

/* Mini photo uploader for the fiche */
function AvatarUpload({ photoUrl, onPhotoChange, label }: { photoUrl?: string; onPhotoChange: (url: string | undefined) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-16 h-16 rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center relative group cursor-pointer overflow-hidden transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {photoUrl ? (
          <>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <UserCircle className="w-10 h-10 text-muted-foreground" />
        )}
        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center translate-x-1 translate-y-1">
          <Upload className="w-3 h-3 text-primary-foreground" />
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label={label} title={label} />
    </div>
  );
}

export function SpeakerList() {
  const speakers = useSpeakerStore((s) => s.speakers);
  const addSpeaker = useSpeakerStore((s) => s.addSpeaker);
  const updateSpeaker = useSpeakerStore((s) => s.updateSpeaker);
  const deleteSpeaker = useSpeakerStore((s) => s.deleteSpeaker);
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const congregationName = settings?.congregation?.name || "";

  const [viewSpeaker, setViewSpeaker] = useState<Speaker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);

  // Form state for fiche
  const [form, setForm] = useState({
    nom: "", congregation: "", telephone: "", email: "", notes: "",
    photoUrl: undefined as string | undefined,
    spousePhotoUrl: undefined as string | undefined,
    householdType: "single" as HouseholdType,
    spouseName: "",
  });

  const resetForm = () => {
    setForm({ nom: "", congregation: "", telephone: "", email: "", notes: "", photoUrl: undefined, spousePhotoUrl: undefined, householdType: "single", spouseName: "" });
    setEditing(null);
    setShowForm(false);
    setViewSpeaker(null);
    setEditingNotes(false);
  };

  const openFiche = (sp: Speaker) => {
    setForm({
      nom: sp.nom,
      congregation: sp.congregation,
      telephone: sp.telephone || "",
      email: sp.email || "",
      notes: sp.notes || "",
      photoUrl: sp.photoUrl,
      spousePhotoUrl: sp.spousePhotoUrl,
      householdType: sp.householdType || "single",
      spouseName: sp.spouseName || "",
    });
    setEditing(sp);
    setViewSpeaker(sp);
    setEditingNotes(false);
  };

  const openAddForm = () => {
    setForm({ nom: "", congregation: congregationName, telephone: "", email: "", notes: "", photoUrl: undefined, spousePhotoUrl: undefined, householdType: "single", spouseName: "" });
    setEditing(null);
    setShowForm(true);
    setViewSpeaker(null);
    setEditingNotes(false);
  };

  const handleSave = () => {
    if (!form.nom) return;
    if (editing) {
      updateSpeaker(editing.id, form);
      toast.success(t("speaker_updated"));
    } else {
      addSpeaker({ ...form, id: generateId() } as Speaker);
      toast.success(t("speaker_added"));
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteSpeaker(id);
    setConfirmDeleteId(null);
    resetForm();
    toast.success(t("speaker_deleted"));
  };

  const filtered = speakers.filter(
    (sp) => sp.nom.toLowerCase().includes(search.toLowerCase()) || sp.congregation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-4 md:py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="mr-auto">
          <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("repertoire")}</p>
          <p className="text-2xl md:text-3xl font-black text-foreground">{speakers.length} <span className="text-base md:text-lg font-bold text-muted-foreground uppercase">{t("speakers")}</span></p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors touch-manipulation">
          <Plus className="w-5 h-5" /> {t("add")}
        </motion.button>
      </div>

      <div className="relative group/search">
        <input 
          className="input-soft text-base py-2 pl-4 pr-12" 
          placeholder={t("search_speaker")} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
        <div className="absolute right-0 top-0 bottom-0 px-4 flex items-center bg-muted/50 rounded-r-xl border-l border-border/50">
          <Search className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">{t("no_results")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((sp) => (
              <motion.div
                key={`speaker-${sp.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="premium-card p-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all group relative"
                onClick={() => openFiche(sp)}
              >
                <div className="flex items-start gap-3">
                  {/* Photos/Avatars avec support couple */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {sp.householdType === "couple" ? (
                      <>
                        <div className="w-12 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
                          {sp.photoUrl ? (
                            <img src={sp.photoUrl} alt={sp.nom} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground/30" /></div>
                          )}
                        </div>
                        <div className="w-12 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 shadow-sm border border-border/50">
                          {sp.spousePhotoUrl ? (
                            <img src={sp.spousePhotoUrl} alt={sp.spouseName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground/30" /></div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 shadow-sm">
                        {sp.photoUrl ? (
                          <img src={sp.photoUrl} alt={sp.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground/30" /></div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{sp.nom}</p>
                    {sp.householdType === "couple" && sp.spouseName && (
                      <p className="text-[11px] font-bold text-primary/80 -mt-0.5">{t("with")} {sp.spouseName}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-1">
                      <Home className="w-3.5 h-3.5 flex-shrink-0 text-primary/50" /> {sp.congregation}
                    </p>
                    {sp.telephone && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-primary/50" />
                        <span className="font-medium">{sp.telephone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(sp.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 transition-colors" title={t("delete")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ============ FICHE ORATEUR MODAL ============ */}
      <AnimatePresence>
        {viewSpeaker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={resetForm}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="w-full max-w-2xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_card")}</p>
                    <h2 className="text-2xl font-black text-foreground mt-1">{form.nom}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setConfirmDeleteId(viewSpeaker.id)} className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:underline">
                      {t("delete")}
                    </button>
                    <button onClick={resetForm} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      {t("close")}
                    </button>
                  </div>
                </div>

                {/* Photos du couple */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("couple_photos")}</p>
                  <div className="flex gap-4">
                    <AvatarUpload
                      photoUrl={form.photoUrl}
                      onPhotoChange={(url) => setForm({ ...form, photoUrl: url })}
                      label={t("speaker_label")}
                    />
                    <AvatarUpload
                      photoUrl={form.spousePhotoUrl}
                      onPhotoChange={(url) => setForm({ ...form, spousePhotoUrl: url })}
                      label={t("spouse_label")}
                    />
                  </div>
                </div>

                {/* Congrégation + Téléphone */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 xs:gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("congregation")}</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("phone")}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                      <input className="input-soft text-sm" placeholder={t("phone")} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Type de foyer */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("household_type")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setForm({ ...form, householdType: "single" })}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                        form.householdType === "single"
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("brother_alone")}
                    </button>
                    <button
                      onClick={() => setForm({ ...form, householdType: "couple" })}
                      className={`py-3 rounded-2xl text-sm font-bold transition-all ${
                        form.householdType === "couple"
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("couple")}
                    </button>
                  </div>
                </div>

                {/* Nom de l'épouse (if couple) */}
                <AnimatePresence>
                  {form.householdType === "couple" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("spouse_name")}</p>
                      <input className="input-soft text-sm" placeholder={t("spouse_name_placeholder")} value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} />
                      <p className="text-[10px] text-muted-foreground">{t("household_hint")}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("notes")}</p>
                    <button onClick={() => setEditingNotes(!editingNotes)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                      {editingNotes ? t("done") : t("edit")}
                    </button>
                  </div>
                  {editingNotes ? (
                    <textarea
                      className="input-soft text-sm min-h-[80px] resize-none w-full"
                      placeholder={t("notes")}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-foreground p-3 rounded-xl bg-muted/30 min-h-[40px]">
                      {form.notes || <span className="text-muted-foreground italic">{t("no_notes")}</span>}
                    </p>
                  )}
                </div>

                {/* Save button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest"
                >
                  {t("save")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ ADD FORM MODAL (simple) ============ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{editing ? t("edit") : t("add_speaker")}</h3>
              
              {/* Photo */}
              <div className="flex justify-center">
                <AvatarUpload photoUrl={form.photoUrl} onPhotoChange={(url) => setForm({ ...form, photoUrl: url })} label={t("photo")} />
              </div>
              
              <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("phone")} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              
              {/* Type de foyer */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("household_type")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({ ...form, householdType: "single" })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      form.householdType === "single"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("brother_alone")}
                  </button>
                  <button
                    onClick={() => setForm({ ...form, householdType: "couple" })}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      form.householdType === "couple"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("couple")}
                  </button>
                </div>
              </div>
              
              {/* Nom du conjoint */}
              <input className="input-soft text-sm" placeholder={t("spouse_name")} value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} />
              
              {/* Notes */}
              <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{editing ? t("save") : t("add")}</motion.button>
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
              <p className="text-sm font-bold text-foreground">{t("confirm_delete_speaker")}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">{t("yes_delete")}</button>
                <button onClick={() => { setConfirmDeleteId(null); }} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}