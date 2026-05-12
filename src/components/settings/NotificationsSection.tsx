import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";
import type { AppSettings } from "../../store/settingsTypes";

type NotificationSettings = AppSettings["notifications"];

interface Props {
  t: (k: string) => string;
  notifications: NotificationSettings;
  updateNotifications: (patch: Partial<NotificationSettings>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (v: boolean) => void;
}

export function NotificationsSection({
  t, notifications, updateNotifications,
  soundEnabled, setSoundEnabled,
  vibrationEnabled, setVibrationEnabled,
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="premium-card p-6 space-y-5">
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
  );
}
