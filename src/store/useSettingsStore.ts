import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Language, CongregationProfile } from "./visitTypes";

interface SettingsState {
  settings: AppSettings;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  updateNotifications: (notif: Partial<AppSettings["notifications"]>) => void;
  updateCongregation: (data: Partial<CongregationProfile>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
}

const defaultSettings: AppSettings = {
  language: "fr",
  darkMode: false,
  notifications: {
    enabled: false,
    steps: { remindJ7: true, remindJ2: true },
  },
  soundEnabled: true,
  vibrationEnabled: true,
  congregation: {
    name: "Lyon KBV",
    city: "Lyon",
    day: "Dimanche",
    time: "11:30",
    responsableName: "",
    responsablePhone: "",
    whatsappGroup: "https://chat.whatsapp.com/LZp3kC8G3v6H8xNqK5X9vX",
    whatsappInviteId: "LZp3kC8G3v6H8xNqK5X9vX",
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/1drIzPPi6AohCroSyUkF1UmMFxuEtMACBF4XATDjBOcg/edit?gid=1530698388#gid=1530698388",
    lastSyncAt: "",
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setLanguage: (language) =>
        set((s) => ({ settings: { ...s.settings, language } })),
      setDarkMode: (darkMode) => {
        if (darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        set((s) => ({ settings: { ...s.settings, darkMode } }));
      },
      updateNotifications: (notif) =>
        set((s) => ({
          settings: {
            ...s.settings,
            notifications: { ...s.settings.notifications, ...notif },
          },
        })),
      updateCongregation: (data) =>
        set((s) => ({
          settings: {
            ...s.settings,
            congregation: { ...s.settings.congregation, ...data },
          },
        })),
      setSoundEnabled: (soundEnabled) =>
        set((s) => ({ settings: { ...s.settings, soundEnabled } })),
      setVibrationEnabled: (vibrationEnabled) =>
        set((s) => ({ settings: { ...s.settings, vibrationEnabled } })),
    }),
    {
      name: "kbv-settings",
      onRehydrateStorage: () => (state) => {
        if (state?.settings.darkMode) {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
