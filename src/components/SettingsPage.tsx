import { Settings, Globe, Moon, Sun, Bell, Database, Download, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/useSettingsStore";
import { useVisitStore } from "../store/useVisitStore";
import { useHostStore } from "../store/useHostStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Language } from "../store/visitTypes";

export function SettingsPage() {
  const { settings, setLanguage, setDarkMode, updateNotifications } = useSettingsStore();
  const visits = useVisitStore((s) => s.visits);
  const hosts = useHostStore((s) => s.hosts);
  const speakers = useSpeakerStore((s) => s.speakers);
  const { t } = useTranslation();

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
        if (data.visits) {
          const store = useVisitStore.getState();
          data.visits.forEach((v: any) => store.addVisit(v));
        }
        if (data.hosts) {
          const store = useHostStore.getState();
          data.hosts.forEach((h: any) => store.addHost(h));
        }
        if (data.speakers) {
          const store = useSpeakerStore.getState();
          data.speakers.forEach((s: any) => store.addSpeaker(s));
        }
        toast.success(t("import_success"));
      } catch {
        toast.error(t("import_error"));
      }
    };
    input.click();
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="py-6 space-y-6 max-w-2xl">
      <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        {t("settings")}
      </h2>

      {/* Language */}
      <motion.div variants={item} className="premium-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("language")}</h3>
        </div>
        <div className="flex gap-2">
          {(["fr", "cv", "pt"] as Language[]).map((lang) => (
            <motion.button
              key={lang}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                settings.language === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {lang === "fr" ? "Français" : lang === "cv" ? "Kriolu" : "Português"}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={item} className="premium-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          {settings.darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("appearance")}</h3>
        </div>
        <button
          onClick={() => setDarkMode(!settings.darkMode)}
          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">{t("dark_mode")}</span>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.darkMode ? "bg-primary" : "bg-muted"}`}>
            <motion.div
              layout
              className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-0.5"
              style={{ left: settings.darkMode ? "calc(100% - 22px)" : "2px" }}
            />
          </div>
        </button>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="premium-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("notifications_label")}</h3>
        </div>
        <button
          onClick={() => updateNotifications({ enabled: !settings.notifications.enabled })}
          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-medium text-foreground">{t("notifications_label")}</span>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.notifications.enabled ? "bg-primary" : "bg-muted"}`}>
            <motion.div
              layout
              className="w-5 h-5 rounded-full bg-background shadow-md border border-border absolute top-0.5"
              style={{ left: settings.notifications.enabled ? "calc(100% - 22px)" : "2px" }}
            />
          </div>
        </button>
        {settings.notifications.enabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pl-3">
            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.steps.remindJ7}
                onChange={(e) => updateNotifications({ steps: { ...settings.notifications.steps, remindJ7: e.target.checked } })}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground">{t("remind_7_days")}</span>
            </label>
            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.steps.remindJ2}
                onChange={(e) => updateNotifications({ steps: { ...settings.notifications.steps, remindJ2: e.target.checked } })}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground">{t("remind_2_days")}</span>
            </label>
          </motion.div>
        )}
      </motion.div>

      {/* Data */}
      <motion.div variants={item} className="premium-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{t("data")}</h3>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            {t("export_data")}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("import_data")}
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {visits.length} {t("visits_count")} · {speakers.length} {t("speakers_count")} · {hosts.length} {t("hosts_count")}
        </p>
      </motion.div>

      <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
        KBV Lyon v2.0 — Coordination
      </p>
    </motion.div>
  );
}
