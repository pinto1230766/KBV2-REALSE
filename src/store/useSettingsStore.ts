import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Language } from "./visitTypes";

interface SettingsState {
  settings: AppSettings;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  updateNotifications: (notif: Partial<AppSettings["notifications"]>) => void;
}

const defaultSettings: AppSettings = {
  language: "fr",
  darkMode: false,
  notifications: {
    enabled: false,
    steps: { remindJ7: true, remindJ2: true },
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
