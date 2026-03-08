import { useState } from "react";
import {
  Globe, Moon, Sun, Bell, Database, Download, Upload,
  Monitor, User, MessageSquare, CloudOff, Cloud, RefreshCw,
  FileSpreadsheet, FolderArchive, ExternalLink, Search, Trash2, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../store/useSettingsStore";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Language } from "../store/visitTypes";

type SettingsTab = "general" | "appearance" | "notifications" | "data";
type ThemeMode = "light" | "dark" | "system";

export function SettingsPage() {
  const { settings, setLanguage, setDarkMode, updateNotifications, updateCongregation } = useSettingsStore();
  const congregation = settings.congregation || { name: "", city: "", day: "Dimanche", time: "11:30", responsableName: "", responsablePhone: "", whatsappGroup: "", whatsappInviteId: "" };
  const notifications = settings.notifications || { enabled: false, steps: { remindJ7: true, remindJ2: true } };
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [duplicates, setDuplicates] = useState<Array<{ type: string; name: string; ids: string[] }>>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);

  const themeMode: ThemeMode = settings.darkMode ? "dark" : "light";

  const setThemeMode = (mode: ThemeMode) => {
    if (mode === "dark") {
      setDarkMode(true);
    } else if (mode === "light") {
      setDarkMode(false);
    } else {
      // System mode: follow OS preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  };

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

  const handleExportRepertoire = () => {
    const data = { speakers, hosts, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kbv-repertoire-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("export_success"));
  };

  const findDuplicates = () => {
    const dups: Array<{ type: string; name: string; ids: string[] }> = [];

    // Check speakers
    const speakerMap = new Map<string, string[]>();
    speakers.forEach((s) => {
      const key = s.nom.toLowerCase().trim();
      if (!speakerMap.has(key)) speakerMap.set(key, []);
      speakerMap.get(key)!.push(s.id);
    });
    speakerMap.forEach((ids, name) => {
      if (ids.length > 1) dups.push({ type: "speaker", name, ids });
    });

    // Check hosts
    const hostMap = new Map<string, string[]>();
    hosts.forEach((h) => {
      const key = h.nom.toLowerCase().trim();
      if (!hostMap.has(key)) hostMap.set(key, []);
      hostMap.get(key)!.push(h.id);
    });
    hostMap.forEach((ids, name) => {
      if (ids.length > 1) dups.push({ type: "host", name, ids });
    });

    setDuplicates(dups);
    setSelectedDuplicates([]);
    if (dups.length === 0) {
      toast.success(t("no_duplicates"));
    } else {
      toast.info(`${dups.length} ${t("duplicates_found")}`);
    }
  };

  const deleteSelectedDuplicates = () => {
    selectedDuplicates.forEach((id) => {
      // Try deleting from both stores
      try { useSpeakerStore.getState().deleteSpeaker(id); } catch {}
      try { useHostStore.getState().deleteHost(id); } catch {}
    });
    setSelectedDuplicates([]);
    findDuplicates();
    toast.success(t("duplicates_deleted"));
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: "general", label: t("general"), icon: User },
    { id: "appearance", label: t("appearance"), icon: Sun },
    { id: "notifications", label: t("notifications_label"), icon: Bell },
    { id: "data", label: t("import_export"), icon: Database },
  ];

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}>
      <motion.div layout className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-1"
        style={{ left: enabled ? "calc(100% - 24px)" : "4px" }} />
    </button>
  );

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
              {t("app_description")}
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
          <div className="premium-card p-6 space-y-6">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t("appearance")}
            </h3>

            {/* Theme selector */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("theme")}</p>
              <div className="grid grid-cols-3 gap-3">
                {/* Light */}
                <button
                  onClick={() => setThemeMode("light")}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-2 ${
                    themeMode === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  {themeMode === "light" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    themeMode === "light" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Sun className={`w-5 h-5 ${themeMode === "light" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("light")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("light_desc")}</p>
                  </div>
                </button>

                {/* Dark */}
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-2 ${
                    themeMode === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  {themeMode === "dark" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    themeMode === "dark" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Moon className={`w-5 h-5 ${themeMode === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("dark")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("dark_desc")}</p>
                  </div>
                </button>

                {/* System */}
                <button
                  onClick={() => setThemeMode("system")}
                  className="relative p-4 rounded-2xl border-2 border-border hover:border-muted-foreground/30 transition-all flex flex-col items-start gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("system")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("system_desc")}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Language selector */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("display_language")}</p>
              <div className="relative">
                <select
                  value={settings.language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="input-soft text-sm w-full appearance-none pr-10 font-bold"
                >
                  <option value="fr">FR  Français</option>
                  <option value="cv">CV  Kriolu</option>
                  <option value="pt">PT  Português</option>
                </select>
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
          <div className="premium-card p-6 space-y-5">
            {/* Header with toggle */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                {t("notifications_and_reminders")}
              </h3>
              <ToggleSwitch enabled={notifications.enabled} onToggle={() => updateNotifications({ enabled: !notifications.enabled })} />
            </div>
            <p className="text-sm text-muted-foreground">{t("notifications_desc")}</p>

            <AnimatePresence>
              {notifications.enabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  {/* J-7 Reminder */}
                  <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.steps?.remindJ7 ?? true}
                        onChange={(e) => updateNotifications({ steps: { ...notifications.steps, remindJ7: e.target.checked } })}
                        className="w-5 h-5 rounded accent-primary mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">{t("remind_j7_title")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("remind_j7_desc")}</p>
                      </div>
                    </label>
                  </div>

                  {/* J-2 Reminder */}
                  <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.steps?.remindJ2 ?? true}
                        onChange={(e) => updateNotifications({ steps: { ...notifications.steps, remindJ2: e.target.checked } })}
                        className="w-5 h-5 rounded accent-primary mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">{t("remind_j2_title")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("remind_j2_desc")}</p>
                      </div>
                    </label>
                  </div>

                  {/* Sons & Vibreur */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30">
                      <span className="text-sm font-bold text-foreground">{t("sounds")}</span>
                      <ToggleSwitch enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30">
                      <span className="text-sm font-bold text-foreground">{t("vibration")}</span>
                      <ToggleSwitch enabled={vibrationEnabled} onToggle={() => setVibrationEnabled(!vibrationEnabled)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Data / Import-Export Tab */}
      {activeTab === "data" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
          {/* Import / Export Card */}
          <div className="premium-card p-6 space-y-5">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              {t("import_export")}
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Cloud Sync Status */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Cloud Sync</p>
                </div>
                <p className="text-base font-black text-foreground">Idle</p>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("last_sync")}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{new Date().toLocaleString("fr-FR")}</p>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> SYNC CLOUD
                </button>
              </div>

              {/* Middle column: Sync Google Sheet + Import JSON */}
              <div className="flex flex-col gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <FileSpreadsheet className="w-4 h-4" /> Sync Google Sheet
                </button>
                <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <Upload className="w-4 h-4" /> {t("import_json")}
                </button>
              </div>

              {/* Right column: Sauvegarde + Répertoire */}
              <div className="flex flex-col gap-3">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /> {t("full_backup")}
                </button>
                <button onClick={handleExportRepertoire} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <FolderArchive className="w-4 h-4" /> {t("repertoire_speakers_hosts")}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="text-center pt-2">
              <p className="text-sm font-black text-foreground uppercase tracking-widest">
                {speakers.length} {t("speakers_count")} · {hosts.length} {t("hosts_count")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {t("export_hint")}
              </p>
            </div>
          </div>

          {/* Quick Access */}
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{t("quick_access")}</h3>
            <p className="text-sm text-muted-foreground">{t("quick_access_desc")}</p>
            <div className="grid grid-cols-2 gap-3">
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm font-bold text-primary">Google Sheet</span>
                <ExternalLink className="w-4 h-4 text-primary" />
              </a>
              <a href="https://jw.org" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm font-bold text-primary">JW.org</span>
                <ExternalLink className="w-4 h-4 text-primary" />
              </a>
            </div>
          </div>

          {/* Duplicate Detection */}
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-foreground">{t("duplicate_detection")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("duplicate_desc")}</p>
              </div>
              <button onClick={findDuplicates} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                <Search className="w-4 h-4" /> {t("search_duplicates")}
              </button>
            </div>

            {duplicates.length > 0 && (
              <div className="space-y-2 mt-3">
                {duplicates.map((dup, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                    <input
                      type="checkbox"
                      checked={dup.ids.slice(1).some((id) => selectedDuplicates.includes(id))}
                      onChange={(e) => {
                        const extraIds = dup.ids.slice(1);
                        if (e.target.checked) {
                          setSelectedDuplicates((prev) => [...prev, ...extraIds]);
                        } else {
                          setSelectedDuplicates((prev) => prev.filter((id) => !extraIds.includes(id)));
                        }
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-xs font-bold uppercase text-muted-foreground">{dup.type === "speaker" ? t("speakers") : t("hosts")}</span>
                    <span className="text-sm font-bold text-foreground capitalize">{dup.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">×{dup.ids.length}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {selectedDuplicates.length > 0 ? `${selectedDuplicates.length} ${t("selected")}` : t("no_selection")}
              </p>
              <button
                onClick={deleteSelectedDuplicates}
                disabled={selectedDuplicates.length === 0}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors"
              >
                {t("delete_selection")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
