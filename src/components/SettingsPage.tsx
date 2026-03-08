import { useState } from "react";
import { Settings, Globe, Moon, Sun, Bell, Database, Download, Upload, Monitor, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/useSettingsStore";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Language } from "../store/visitTypes";

type SettingsTab = "general" | "appearance" | "notifications" | "data";

export function SettingsPage() {
  const { settings, setLanguage, setDarkMode, updateNotifications, updateCongregation } = useSettingsStore();
  const congregation = settings.congregation || { name: "", city: "", day: "Dimanche", time: "11:30", responsableName: "", responsablePhone: "", whatsappGroup: "", whatsappInviteId: "" };
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const handleExport = () => {
    const data = { visits, hosts, speakers, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kbv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("export_success"));
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.visits) data.visits.forEach((v: any) => useVisitStore.getState().addVisit(v));
        if (data.hosts) data.hosts.forEach((h: any) => useHostStore.getState().addHost(h));
        if (data.speakers) data.speakers.forEach((s: any) => useSpeakerStore.getState().addSpeaker(s));
        toast.success(t("import_success"));
      } catch {
        toast.error(t("import_error"));
      }
    };
    input.click();
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: "general", label: t("general"), icon: User },
    { id: "appearance", label: t("appearance"), icon: Sun },
    { id: "notifications", label: t("notifications_label"), icon: Bell },
    { id: "data", label: t("data"), icon: Database },
  ];

  return (
    <div className="py-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
          {/* Version Card */}
          <div className="premium-card p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">KBV Manager</p>
            <h2 className="text-xl font-black text-foreground mt-1">Version 2.0.0</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Cette application est conçue exclusivement pour l'organisation et la gestion des orateurs visiteurs pour la congrégation KBV DV Lyon.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("developer")}</p>
                <p className="text-sm font-bold text-foreground mt-1">Pinto Francisco</p>
              </div>
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("last_update")}</p>
                <p className="text-sm font-bold text-foreground mt-1">Mar 2026 (v2.0.0)</p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-4">© 2025-2026 Pinto Francisco · Tous droits réservés</p>
          </div>

          {/* Congregation Profile */}
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("congregation_profile")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("congregation_name")}</label>
                <input className="input-soft text-sm mt-1" value={congregation.name} onChange={(e) => updateCongregation({ name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("city")}</label>
                <input className="input-soft text-sm mt-1" value={congregation.city} onChange={(e) => updateCongregation({ city: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("day")}</label>
                <select className="input-soft text-sm mt-1" value={congregation.day} onChange={(e) => updateCongregation({ day: e.target.value })}>
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("time")}</label>
                <input className="input-soft text-sm mt-1" type="time" value={congregation.time} onChange={(e) => updateCongregation({ time: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Responsable Accueil */}
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              {t("reception_manager")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("full_name")}</label>
                <input className="input-soft text-sm mt-1" value={congregation.responsableName} onChange={(e) => updateCongregation({ responsableName: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("phone")}</label>
                <input className="input-soft text-sm mt-1" value={congregation.responsablePhone} onChange={(e) => updateCongregation({ responsablePhone: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("whatsapp_group")}</label>
                <input className="input-soft text-sm mt-1" placeholder="Numéro du groupe ou admin" value={congregation.whatsappGroup} onChange={(e) => updateCongregation({ whatsappGroup: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("whatsapp_invite_id")}</label>
                <input className="input-soft text-sm mt-1" value={congregation.whatsappInviteId} onChange={(e) => updateCongregation({ whatsappInviteId: e.target.value })} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
          {/* Language */}
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("language")}</h3>
            </div>
            <div className="flex gap-2">
              {(["fr", "cv", "pt"] as Language[]).map((lang) => (
                <motion.button key={lang} whileTap={{ scale: 0.95 }} onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    settings.language === lang ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}>
                  {lang === "fr" ? "Français" : lang === "cv" ? "Kriolu" : "Português"}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              {settings.darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("appearance")}</h3>
            </div>
            <button onClick={() => setDarkMode(!settings.darkMode)} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-foreground">{t("dark_mode")}</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.darkMode ? "bg-primary" : "bg-muted"}`}>
                <motion.div layout className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-0.5"
                  style={{ left: settings.darkMode ? "calc(100% - 22px)" : "2px" }} />
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("notifications_label")}</h3>
            </div>
            <button onClick={() => updateNotifications({ enabled: !settings.notifications.enabled })} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-foreground">{t("notifications_label")}</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.notifications.enabled ? "bg-primary" : "bg-muted"}`}>
                <motion.div layout className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-0.5"
                  style={{ left: settings.notifications.enabled ? "calc(100% - 22px)" : "2px" }} />
              </div>
            </button>
            {settings.notifications.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pl-3">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                  <input type="checkbox" checked={settings.notifications.steps.remindJ7} onChange={(e) => updateNotifications({ steps: { ...settings.notifications.steps, remindJ7: e.target.checked } })} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-foreground">{t("remind_7_days")}</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                  <input type="checkbox" checked={settings.notifications.steps.remindJ2} onChange={(e) => updateNotifications({ steps: { ...settings.notifications.steps, remindJ2: e.target.checked } })} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-foreground">{t("remind_2_days")}</span>
                </label>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Data Tab */}
      {activeTab === "data" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("data")}</h3>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                <Download className="w-4 h-4" /> {t("export_data")}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors">
                <Upload className="w-4 h-4" /> {t("import_data")}
              </motion.button>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {visits.length} {t("visits_count")} · {speakers.length} {t("speakers_count")} · {hosts.length} {t("hosts_count")}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
