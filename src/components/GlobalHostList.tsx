import { useState } from "react";
import { Home, Plus, Trash2, Edit3, Phone, Mail, MapPin, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoUpload } from "./PhotoUpload";
import { useHostStore } from "../store/useHostStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Host } from "../store/visitTypes";

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

export function GlobalHostList() {
  const hosts = useHostStore((s) => s.hosts);
  const addHost = useHostStore((s) => s.addHost);
  const updateHost = useHostStore((s) => s.updateHost);
  const deleteHost = useHostStore((s) => s.deleteHost);
  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Host | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", adresse: "", capacity: 2, notes: "", role: "hebergement" as Host["role"], photoUrl: undefined as string | undefined });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ nom: "", telephone: "", email: "", adresse: "", capacity: 2, notes: "", role: "hebergement", photoUrl: undefined });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.nom) return;
    if (editing) {
      updateHost(editing.id, form);
      toast.success(t("host_updated"));
    } else {
      addHost({ ...form, id: generateId() } as Host);
      toast.success(t("host_added"));
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteHost(id);
    setConfirmDeleteId(null);
    toast.success(t("host_deleted"));
  };

  const openEdit = (h: Host) => {
    setForm({
      nom: h.nom, telephone: h.telephone, email: h.email || "",
      adresse: h.adresse || h.address || "", capacity: h.capacity || 2,
      notes: h.notes || "", role: h.role || "hebergement", photoUrl: h.photoUrl,
    });
    setEditing(h);
    setShowForm(true);
  };

  const filtered = hosts.filter((h) => h.nom.toLowerCase().includes(search.toLowerCase()));

  const roleLabel = (role?: string) => {
    if (role === "hebergement") return t("hebergement");
    if (role === "transport") return t("transport");
    if (role === "repas") return t("repas");
    return role || "";
  };

  const roleColor = (role?: string) => {
    if (role === "hebergement") return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
    if (role === "transport") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
    if (role === "repas") return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-500" />
          {t("hosts")} ({hosts.length})
        </h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("add_host")}
        </motion.button>
      </div>

      <input className="input-soft text-sm" placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{editing ? t("edit") : t("add_host")}</h3>
              <PhotoUpload photoUrl={form.photoUrl} onPhotoChange={(url) => setForm({ ...form, photoUrl: url })} />
              <input className="input-soft text-sm" placeholder={t("name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("phone")} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("address")} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("capacity")}</label>
                  <input className="input-soft text-sm" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("role")}</label>
                  <select className="input-soft text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Host["role"] })}>
                    <option value="hebergement">{t("hebergement")}</option>
                    <option value="transport">{t("transport")}</option>
                    <option value="repas">{t("repas")}</option>
                  </select>
                </div>
              </div>
              <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{editing ? t("save") : t("add")}</motion.button>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm font-bold text-foreground">{t("confirm_delete_host")}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">{t("yes_delete")}</button>
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("no_results")}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          <AnimatePresence>
            {filtered.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
                className="premium-card p-4 flex items-start gap-3"
              >
                {h.photoUrl ? (
                  <img src={h.photoUrl} alt={h.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{h.nom}</p>
                    {h.role && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${roleColor(h.role)}`}>
                        {roleLabel(h.role)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {h.telephone && (
                      <a href={`tel:${h.telephone}`} className="text-[10px] text-primary flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {h.telephone}
                      </a>
                    )}
                    {h.email && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {h.email}
                      </span>
                    )}
                    {(h.adresse || h.address) && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {h.adresse || h.address}
                      </span>
                    )}
                    {h.capacity && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" /> {h.capacity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(h)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => setConfirmDeleteId(h.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
