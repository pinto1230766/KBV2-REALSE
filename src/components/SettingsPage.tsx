import { useState } from "react";
import {
  Globe, Moon, Sun, Bell, Database, Download, Upload,
  Monitor, User, MessageSquare, CloudOff, Cloud, RefreshCw,
  FileSpreadsheet, FolderArchive, ExternalLink, Search, Trash2, Check, Link2, Loader2, AlertTriangle, Shield, BookOpen
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../store/useSettingsStore";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Language, Visit, Speaker, Host } from "../store/visitTypes";
import { syncCloud, deleteRemoteItem } from "../lib/syncCloud";
import { parseCSV, extractSheetInfo, parseRowsToData } from "../lib/sheetUtils";
import { getHostKey, getSpeakerKey, getVisitKey, mergeHosts, mergeSpeakers, mergeVisits } from "../lib/dedup";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { KbvLogo } from "./KbvLogo";

type SettingsTab = "general" | "appearance" | "notifications" | "data";
type ThemeMode = "light" | "dark" | "system";

export function SettingsPage({ onShowUserManual }: { onShowUserManual?: () => void }) {
  const { settings, setLanguage, setDarkMode, updateNotifications, updateCongregation, setSoundEnabled, setVibrationEnabled } = useSettingsStore();
  const congregation = settings.congregation || { name: "", city: "", day: "Dimanche", time: "11:30", responsableName: "", responsablePhone: "", whatsappGroup: "", whatsappInviteId: "", googleSheetUrl: "", lastSyncAt: "" };
  const notifications = settings.notifications || { enabled: false, steps: { remindJ7: true, remindJ2: true } };
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const soundEnabled = settings.soundEnabled;
  const vibrationEnabled = settings.vibrationEnabled;
  const [duplicates, setDuplicates] = useState<Array<{ type: string; name: string; ids: string[] }>>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [sheetUrlInput, setSheetUrlInput] = useState(congregation.googleSheetUrl || "");
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(import.meta.env.VITE_SUPABASE_URL || "");
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
  const [showSheetGuide, setShowSheetGuide] = useState(false);

  // Reset all data
  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const themeMode: ThemeMode = settings.darkMode ? "dark" : "light";

  const setThemeMode = (mode: ThemeMode) => {
    if (mode === "dark") {
      setDarkMode(true);
    } else if (mode === "light") {
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  };

  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudStatus("syncing");
    try {
      const result = await syncCloud();
      setCloudStatus("done");
      const totalPushed = result.pushed.visits + result.pushed.speakers + result.pushed.hosts;
      const totalPulled = result.pulled.visits + result.pulled.speakers + result.pulled.hosts;
      toast.success(`Cloud sync OK — ↑${totalPushed} envoyés, ↓${totalPulled} récupérés`);
      setTimeout(() => setCloudStatus("idle"), 5000);
    } catch (err) {
      console.error("Cloud sync error:", err);
      setCloudStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Erreur cloud: " + msg);
      setTimeout(() => setCloudStatus("idle"), 5000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSyncGoogleSheet = async () => {
    const url = congregation.googleSheetUrl || sheetUrlInput;
    if (!url) {
      setShowSheetConfig(true);
      return;
    }

    const info = extractSheetInfo(url);
    if (!info) {
      toast.error(t("invalid_sheet_url"));
      return;
    }

    setIsSyncing(true);
    try {
      // Use Google Visualization API endpoint (CORS-friendly for public sheets)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${info.id}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
      const response = await fetch(csvUrl);
      if (!response.ok) {
        // Fallback: try export endpoint
        const fallbackUrl = `https://docs.google.com/spreadsheets/d/${info.id}/export?format=csv&gid=${info.gid}`;
        const fallbackResp = await fetch(fallbackUrl);
        if (!fallbackResp.ok) throw new Error(`HTTP ${fallbackResp.status}`);
        const text = await fallbackResp.text();
        const rows = parseCSV(text);
        const { visits: newVisits, speakers: newSpeakers } = parseRowsToData(rows);
        await importData(newVisits, newSpeakers);
        return;
      }
      const text = await response.text();
      const rows = parseCSV(text);
      const { visits: newVisits, speakers: newSpeakers } = parseRowsToData(rows);
      await importData(newVisits, newSpeakers);
    } catch (err) {
      console.error("Sync error:", err);
      toast.error(t("sync_error"));
    } finally {
      setIsSyncing(false);
    }
  };

  const importData = async (newVisits: Visit[], newSpeakers: Speaker[]) => {
    const currentVisits = useVisitStore.getState().visits;
    const currentSpeakers = useSpeakerStore.getState().speakers;

    // Detect and remove "ghost" visits (old imports or moved visits)
    // A visit is a ghost if:
    // 1. It has a 'sheet-' prefix but is not in the new import
    // 2. OR it's on a date present in the new import but the speaker/key doesn't match (handles UUIDs from Supabase)
    const newVisitKeys = new Set(newVisits.map(getVisitKey));
    const newVisitDates = new Set(newVisits.map(v => v.visitDate));
    
    const ghosts = currentVisits.filter((v) => {
      const isSheetId = v.visitId.startsWith("sheet-");
      const isKeyInImport = newVisitKeys.has(getVisitKey(v));
      const isDateInImport = newVisitDates.has(v.visitDate);

      // It's a ghost if it's an old sheet ID no longer present
      if (isSheetId && !isKeyInImport) return true;
      
      // It's a ghost if it's on a date covered by the sheet but the speaker is different
      // (This is the most common case for moved visits synced via Supabase)
      if (isDateInImport && !isKeyInImport) return true;

      return false;
    });
    
    if (ghosts.length > 0) {
      console.log(`Removing ${ghosts.length} ghost visits...`, ghosts.map(g => g.nom));
      for (const ghost of ghosts) {
        useVisitStore.getState().deleteVisit(ghost.visitId);
        await deleteRemoteItem("visits", ghost.visitId);
      }
    }

    // Detect and remove "ghost" speakers (similar logic)
    const newSpeakerKeys = new Set(newSpeakers.map(getSpeakerKey));
    const ghostSpeakers = currentSpeakers.filter((s) => {
      const isSheetId = s.id.startsWith("sheet-");
      const isKeyInImport = newSpeakerKeys.has(getSpeakerKey(s));
      return isSheetId && !isKeyInImport;
    });
    
    if (ghostSpeakers.length > 0) {
      for (const gs of ghostSpeakers) {
        useSpeakerStore.getState().deleteSpeaker(gs.id);
        await deleteRemoteItem("speakers", gs.id);
      }
    }

    // Re-get state after deletions
    const updatedVisits = useVisitStore.getState().visits;
    const updatedSpeakers = useSpeakerStore.getState().speakers;

    // Merge new data
    const finalVisits = mergeVisits(updatedVisits, newVisits);
    useVisitStore.getState().setVisits(finalVisits);

    const finalSpeakers = mergeSpeakers(updatedSpeakers, newSpeakers);
    useSpeakerStore.getState().setSpeakers(finalSpeakers);

    updateCongregation({ lastSyncAt: new Date().toISOString() });
    
    const addedVisits = finalVisits.length - updatedVisits.length;
    toast.success(`${t("sync_success")}: ${newVisits.length} entrées synchronisées (${ghosts.length} fantômes supprimés)`);
  };

  const handleSaveSheetUrl = async () => {
    if (!sheetUrlInput) return;
    const info = extractSheetInfo(sheetUrlInput);
    if (!info) {
      toast.error(t("invalid_sheet_url"));
      return;
    }
    updateCongregation({ googleSheetUrl: sheetUrlInput });
    setShowSheetConfig(false);
    toast.success(t("sheet_url_saved"));
    // Auto-trigger sync after saving
    setTimeout(() => handleSyncGoogleSheet(), 300);
  };

  const handleSaveSupabaseConfig = () => {
    if (!supabaseUrlInput || !supabaseKeyInput) {
      toast.error("Veuillez saisir l'URL et la clé Supabase");
      return;
    }

    // Save to localStorage (since we can't modify env vars at runtime)
    localStorage.setItem('VITE_SUPABASE_URL', supabaseUrlInput);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseKeyInput);

    setShowSupabaseConfig(false);
    toast.success("Configuration Supabase sauvegardée. Rechargez la page pour appliquer les changements.");

    // Reload after a short delay to apply new config
    setTimeout(() => window.location.reload(), 1000);
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
        if (data.visits) useVisitStore.getState().setVisits(mergeVisits(useVisitStore.getState().visits, data.visits));
        if (data.hosts) useHostStore.getState().setHosts(mergeHosts(useHostStore.getState().hosts, data.hosts));
        if (data.speakers) useSpeakerStore.getState().setSpeakers(mergeSpeakers(useSpeakerStore.getState().speakers, data.speakers));
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

    const visitMap = new Map<string, string[]>();
    visits.forEach((v) => {
      const key = getVisitKey(v);
      if (!visitMap.has(key)) visitMap.set(key, []);
      visitMap.get(key)!.push(v.visitId);
    });
    visitMap.forEach((ids, name) => {
      if (ids.length > 1) dups.push({ type: "visit", name, ids });
    });

    // Check speakers
    const speakerMap = new Map<string, string[]>();
    speakers.forEach((s) => {
      const key = getSpeakerKey(s);
      if (!speakerMap.has(key)) speakerMap.set(key, []);
      speakerMap.get(key)!.push(s.id);
    });
    speakerMap.forEach((ids, name) => {
      if (ids.length > 1) dups.push({ type: "speaker", name, ids });
    });

    // Check hosts
    const hostMap = new Map<string, string[]>();
    hosts.forEach((h) => {
      const key = getHostKey(h);
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
      // Try deleting from all stores
      try { useVisitStore.getState().deleteVisit(id); } catch { /* ignore */ }
      try { useSpeakerStore.getState().deleteSpeaker(id); } catch { /* ignore */ }
      try { useHostStore.getState().deleteHost(id); } catch { /* ignore */ }
    });
    setSelectedDuplicates([]);
    findDuplicates();
    toast.success(t("duplicates_deleted"));
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: LucideIcon }> = [
    { id: "general", label: t("general"), icon: User },
    { id: "appearance", label: t("appearance"), icon: Sun },
    { id: "notifications", label: t("notifications_label"), icon: Bell },
    { id: "data", label: t("import_export"), icon: Database },
  ];

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} aria-label={enabled ? "Disable" : "Enable"} className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}>
      <motion.div layout className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-1"
        style={{ left: enabled ? "calc(100% - 24px)" : "4px" }} />
    </button>
  );

  return (
    <div className="py-4 md:py-6 space-y-5 md:space-y-6">
      {/* Tabs */}
      <div className="flex justify-around items-stretch border-b border-border pb-0 px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-1 min-w-0 flex-1 transition-colors border-b-2 -mb-[1px] touch-manipulation ${
              activeTab === tab.id
                ? "text-primary border-primary bg-primary/5"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <tab.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? "text-primary" : ""}`} />
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-tight leading-none text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 md:space-y-6">
          {/* Version Card */}
          {/* Version Card Compacte */}
          <div className="premium-card p-4 md:p-5 text-center">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                <KbvLogo className="w-full h-full" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">KBV Manager</p>
                <h2 className="text-lg font-black text-foreground">Version 2.0.0</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 rounded-xl bg-muted/50 text-left">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t("developer")}</p>
                <p className="text-xs font-bold text-foreground">Pinto Francisco</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/50 text-left">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t("last_update")}</p>
                <p className="text-xs font-bold text-foreground">Mars 2026</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/50 text-left col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Contact / Support</p>
                  <p className="text-xs font-bold text-foreground">pinto12397@gmail.com</p>
                </div>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider text-right">© 2025-2026</p>
              </div>
            </div>
          </div>

          {/* User Manual Button */}
          {onShowUserManual && (
            <button
              onClick={onShowUserManual}
              className="w-full premium-card p-4 md:p-5 flex items-center gap-4 hover:bg-accent transition-colors touch-manipulation"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-foreground">{t("user_manual")}</h3>
                <p className="text-sm text-muted-foreground">{t("user_manual_desc")}</p>
              </div>
            </button>
          )}

          {/* RGPD & Legal Info */}
          <div className="premium-card p-4 md:p-5 space-y-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <span>{t("legal_info")}</span>
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">{t("rgpd_protection")}:</strong> {t("rgpd_desc")}
              </p>
              <p>
                <strong className="text-foreground">{t("right_access")}:</strong> {t("right_access_desc")}
              </p>
              <p>
                <strong className="text-foreground">{t("contact_info")}:</strong> {t("contact_rgpd")} <a href="mailto:pinto12397@gmail.com" className="text-primary hover:underline">pinto12397@gmail.com</a>
              </p>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <button 
                onClick={() => alert(t("export_coming_soon"))}
                className="text-[10px] uppercase font-bold text-primary hover:underline"
              >
                {t("export_data_rgpd")}
              </button>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">RGPD Compliance</span>
            </div>
          </div>

          {/* Congregation Profile */}
          <div className="premium-card p-4 md:p-5 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t("congregation_profile")}</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-1">
                <label htmlFor="cong-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("congregation_name")}</label>
                <input id="cong-name" className="input-soft text-sm mt-1" value={congregation.name} onChange={(e) => updateCongregation({ name: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label htmlFor="cong-city" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("city")}</label>
                <input id="cong-city" className="input-soft text-sm mt-1" value={congregation.city} onChange={(e) => updateCongregation({ city: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label htmlFor="cong-day" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("day")}</label>
                <select id="cong-day" className="input-soft text-sm mt-1" value={congregation.day} onChange={(e) => updateCongregation({ day: e.target.value })}>
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label htmlFor="cong-time" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("time")}</label>
                <input id="cong-time" className="input-soft text-sm mt-1" type="time" value={congregation.time} onChange={(e) => updateCongregation({ time: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Responsable Accueil */}
          <div className="premium-card p-4 md:p-5 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{t("reception_manager")}</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-1">
                <label htmlFor="resp-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("full_name")}</label>
                <input id="resp-name" className="input-soft text-sm mt-1" value={congregation.responsableName} onChange={(e) => updateCongregation({ responsableName: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label htmlFor="resp-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("phone")}</label>
                <input id="resp-phone" className="input-soft text-sm mt-1" value={congregation.responsablePhone} onChange={(e) => updateCongregation({ responsablePhone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("whatsapp_group")}</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input className="input-soft text-xs" placeholder="Groupe/Admin" value={congregation.whatsappGroup} onChange={(e) => updateCongregation({ whatsappGroup: e.target.value })} />
                  <input id="whatsapp-invite" className="input-soft text-xs" placeholder="Invite ID" value={congregation.whatsappInviteId} onChange={(e) => updateCongregation({ whatsappInviteId: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="premium-card p-4 md:p-6 space-y-6">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary flex-shrink-0" />
              <span>{t("appearance")}</span>
            </h3>

            {/* Theme selector */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("theme")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label htmlFor="lang-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("display_language")}</label>
              <div className="relative">
                <select
                  id="lang-select"
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Google Sheet Config Modal */}
          <AnimatePresence>
            {showSheetConfig && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg bg-background rounded-3xl border border-border shadow-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">{t("configure_google_sheet")}</h3>
                      <p className="text-xs text-muted-foreground">{t("sheet_config_desc")}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("sheet_url")}</label>
                    <input
                      className="input-soft text-sm w-full"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">{t("sheet_url_hint")}</p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowSheetConfig(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                      {t("cancel")}
                    </button>
                    <button onClick={handleSaveSheetUrl} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
                      {t("save_and_sync")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
           </AnimatePresence>

           {/* Supabase Config Modal */}
           <AnimatePresence>
             {showSupabaseConfig && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg bg-background rounded-3xl border border-border shadow-2xl p-6 space-y-5">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <Cloud className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <h3 className="text-base font-black text-foreground">{t("configure_supabase")}</h3>
                       <p className="text-xs text-muted-foreground">{t("supabase_config_desc")}</p>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("supabase_url")}</label>
                       <input
                         className="input-soft text-sm w-full"
                         placeholder="https://votre-projet.supabase.co"
                         value={supabaseUrlInput}
                         onChange={(e) => setSupabaseUrlInput(e.target.value)}
                       />
                       <p className="text-[10px] text-muted-foreground">{t("supabase_url_hint")}</p>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("supabase_anon_key")}</label>
                       <input
                         type="password"
                         className="input-soft text-sm w-full"
                         placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                         value={supabaseKeyInput}
                         onChange={(e) => setSupabaseKeyInput(e.target.value)}
                       />
                       <p className="text-[10px] text-muted-foreground">{t("supabase_key_hint")}</p>
                     </div>
                   </div>

                   <div className="flex gap-3 justify-end">
                     <button onClick={() => setShowSupabaseConfig(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                       {t("cancel")}
                     </button>
                     <button onClick={handleSaveSupabaseConfig} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
                       {t("save")}
                     </button>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Supabase Guide Modal */}
           <AnimatePresence>
             {showSupabaseGuide && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl bg-background rounded-3xl border border-border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <Cloud className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-foreground">{t("supabase_guide_title")}</h3>
                       <p className="text-sm text-muted-foreground">{t("supabase_guide_desc")}</p>
                     </div>
                   </div>

                   <div className="space-y-6">
                     {/* Step 1 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">1</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("supabase_step1_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("supabase_step1_desc")}</p>
                       </div>
                     </div>

                     {/* Step 2 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">2</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("supabase_step2_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("supabase_step2_desc")}</p>
                       </div>
                     </div>

                     {/* Step 3 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">3</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("supabase_step3_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("supabase_step3_desc")}</p>
                       </div>
                     </div>

                     {/* Step 4 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">4</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("supabase_step4_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("supabase_step4_desc")}</p>
                       </div>
                     </div>

                     {/* Note */}
                     <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                       <p className="text-sm text-primary font-medium">{t("supabase_note")}</p>
                     </div>
                   </div>

                   <div className="flex gap-3 justify-end">
                     <button onClick={() => setShowSupabaseGuide(false)} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
                       {t("close")}
                     </button>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Google Sheet Guide Modal */}
           <AnimatePresence>
             {showSheetGuide && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl bg-background rounded-3xl border border-border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <FileSpreadsheet className="w-5 h-5 text-primary" />
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-foreground">{t("sheet_guide_title")}</h3>
                       <p className="text-sm text-muted-foreground">{t("sheet_guide_desc")}</p>
                     </div>
                   </div>

                   <div className="space-y-6">
                     {/* Step 1 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">1</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("sheet_step1_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("sheet_step1_desc")}</p>
                       </div>
                     </div>

                     {/* Step 2 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">2</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("sheet_step2_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("sheet_step2_desc")}</p>
                         <div className="p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                           {t("sheet_columns")}
                         </div>
                       </div>
                     </div>

                     {/* Step 3 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">3</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("sheet_step3_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("sheet_step3_desc")}</p>
                         <div className="space-y-2">
                           <p className="text-sm font-medium text-foreground">{t("sheet_example_title")}</p>
                           <div className="p-3 rounded-lg bg-muted/50 border font-mono text-sm">
                             {t("sheet_example_data")}
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Step 4 */}
                     <div className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <span className="text-sm font-bold text-primary">4</span>
                       </div>
                       <div className="space-y-2">
                         <h4 className="font-bold text-foreground">{t("sheet_step4_title")}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{t("sheet_step4_desc")}</p>
                       </div>
                     </div>

                     {/* Note */}
                     <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                       <p className="text-sm text-primary font-medium">{t("sheet_note")}</p>
                     </div>
                   </div>

                   <div className="flex gap-3 justify-end">
                     <button onClick={() => setShowSheetGuide(false)} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">
                       {t("close")}
                     </button>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Import / Export Card */}
          <div className="premium-card p-6 space-y-5">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              {t("import_export")}
            </h3>

            {/* Google Sheet Status Banner */}
            {congregation.googleSheetUrl ? (
              <div className="flex items-center gap-3 p-2 md:p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-primary truncate">Google Sheet {t("connected")}</p>
                   {congregation.lastSyncAt && (
                     <p className="text-[10px] text-muted-foreground">{t("last_sync")}: {new Date(congregation.lastSyncAt).toLocaleString("fr-FR")}</p>
                   )}
                 </div>
                 <div className="flex gap-2 flex-shrink-0">
                   <button onClick={() => setShowSheetGuide(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-primary hover:underline">
                     {t("sheet_guide")}
                   </button>
                   <button onClick={() => setShowSheetConfig(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                     {t("modify")}
                   </button>
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2 md:p-3 rounded-2xl bg-muted/50 border border-border">
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-muted-foreground truncate">Google Sheet non configuré</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setShowSheetGuide(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    {t("sheet_guide")}
                  </button>
                  <button onClick={() => setShowSheetConfig(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    Configurer
                  </button>
                </div>
              </div>
            )}

             {/* Supabase Status Banner */}
             {import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('VITE_SUPABASE_URL') ? (
               <div className="flex items-center gap-3 p-2 md:p-3 rounded-2xl bg-primary/5 border border-primary/20">
                 <Cloud className="w-4 h-4 text-primary flex-shrink-0" />
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-primary truncate">Supabase {t("connected")}</p>
                 </div>
                 <div className="flex gap-2 flex-shrink-0">
                   <button onClick={() => setShowSupabaseGuide(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-primary hover:underline">
                     {t("supabase_guide")}
                   </button>
                   <button onClick={() => setShowSupabaseConfig(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                     {t("modify")}
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-3 p-2 md:p-3 rounded-2xl bg-muted/50 border border-border">
                 <CloudOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                 <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-muted-foreground truncate">Supabase non configuré</p>
                 </div>
                 <div className="flex gap-2 flex-shrink-0">
                   <button onClick={() => setShowSupabaseGuide(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                     {t("supabase_guide")}
                   </button>
                   <button onClick={() => setShowSupabaseConfig(true)} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                     Configurer
                   </button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Cloud Sync Status */}
              <div className="p-2.5 md:p-4 rounded-2xl bg-muted/50 border border-border space-y-2 md:space-y-3">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${cloudStatus === "done" ? "text-emerald-400" : cloudStatus === "error" ? "text-destructive" : "text-cyan-400"}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${cloudStatus === "done" ? "text-emerald-400" : cloudStatus === "error" ? "text-destructive" : "text-cyan-400"}`}>Cloud Sync</p>
                </div>
                <p className="text-base font-black text-foreground">
                  {cloudStatus === "syncing" ? "Syncing..." : cloudStatus === "done" ? "✓ Synced" : cloudStatus === "error" ? "✗ Error" : "Idle"}
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-2 mt-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t("last_sync")}</p>
                  <p className="text-[10px] font-bold text-foreground">
                    {congregation.lastSyncAt ? new Date(congregation.lastSyncAt).toLocaleString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
                  </p>
                </div>
                 <button onClick={handleCloudSync} disabled={isCloudSyncing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 md:py-2 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors disabled:opacity-50">
                  {isCloudSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {isCloudSyncing ? "SYNCING..." : "SYNC CLOUD"}
                </button>
              </div>

              {/* Middle column: Sync Google Sheet + Import JSON */}
              <div className="flex flex-col gap-3">
                <button onClick={handleSyncGoogleSheet} disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  {isSyncing ? "Syncing..." : "Sync Google Sheet"}
                </button>
                <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <Upload className="w-4 h-4" /> {t("import_json")}
                </button>
              </div>

              {/* Right column: Sauvegarde + Répertoire */}
              <div className="flex flex-col gap-3">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" /> {t("full_backup")}
                </button>
                <button onClick={handleExportRepertoire} className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
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
              {congregation.googleSheetUrl ? (
                <a href={congregation.googleSheetUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <span className="text-sm font-bold text-primary">Google Sheet</span>
                  <ExternalLink className="w-4 h-4 text-primary" />
                </a>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-2xl border border-muted bg-muted/50 cursor-not-allowed">
                  <span className="text-sm font-bold text-muted-foreground">Google Sheet</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <a href="https://jw.org" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                <span className="text-sm font-bold text-primary">JW.org</span>
                <ExternalLink className="w-4 h-4 text-primary" />
              </a>
            </div>
          </div>

          {/* Duplicate Detection */}
          <div className="premium-card p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-foreground">{t("duplicate_detection")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("duplicate_desc")}</p>
              </div>
              <button onClick={findDuplicates} className="flex items-center justify-center gap-2 px-5 py-2 md:py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full md:w-auto">
                <Search className="w-4 h-4" /> {t("search_duplicates")}
              </button>
            </div>

            {duplicates.length > 0 && (
              <div className="space-y-2 mt-3">
                {duplicates.map((dup, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                    <input
                      id={`dup-${dup.ids[0]}`}
                      type="checkbox"
                      aria-label={`${dup.type === "visit" ? "Visites" : dup.type === "speaker" ? t("speakers") : t("hosts")} ${dup.name}`}
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
                    <span className="text-xs font-bold uppercase text-muted-foreground">{dup.type === "visit" ? "Visites" : dup.type === "speaker" ? t("speakers") : t("hosts")}</span>
                    <span className="text-sm font-bold text-foreground capitalize">{dup.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">×{dup.ids.length}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                {duplicates.length > 0 && (
                  <button
                    onClick={() => {
                      const allExtraIds = duplicates.flatMap((dup) => dup.ids.slice(1));
                      const allSelected = allExtraIds.every((id) => selectedDuplicates.includes(id));
                      if (allSelected) {
                        setSelectedDuplicates([]);
                      } else {
                        setSelectedDuplicates(allExtraIds);
                      }
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:underline transition-colors"
                  >
                    {duplicates.flatMap((d) => d.ids.slice(1)).every((id) => selectedDuplicates.includes(id))
                      ? t("deselect_all")
                      : t("select_all")}
                  </button>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {selectedDuplicates.length > 0 ? `${selectedDuplicates.length} ${t("selected")}` : t("no_selection")}
                </p>
              </div>
              <button
                onClick={deleteSelectedDuplicates}
                disabled={selectedDuplicates.length === 0}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("delete_selection")}
              </button>
            </div>

            {/* Reset All Data */}
            <div className="mt-8 p-5 rounded-2xl border-2 border-destructive/30 bg-destructive/5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-black text-destructive">{t("reset_all_data") || "Réinitialiser toutes les données"}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("reset_warning") || "Cela supprimera définitivement toutes les visites, intervenants, hébergeurs et paramètres. Cette action est irréversible."}
                  </p>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-destructive text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full justify-center">
                    <Trash2 className="w-4 h-4" />
                    {t("reset_button") || "Supprimer toutes les données"}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("reset_confirm_title") || "Êtes-vous sûr?"}</AlertDialogTitle>
                  </AlertDialogHeader>
                  <p className="text-sm text-muted-foreground">
                    {t("reset_confirm_message") || "Cette action supprimera définitivement toutes vos données locales. Cette action ne peut pas être annulée."}
                  </p>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel") || "Annuler"}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t("confirm_reset") || "Oui, supprimer tout"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
