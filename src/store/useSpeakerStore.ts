import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Speaker } from "./visitTypes";
import { mergeSpeakers } from "../lib/dedup";
import { idbStorage } from "../lib/idbStorage";

interface SpeakerState {
  speakers: Speaker[];
  addSpeaker: (speaker: Speaker) => void;
  setSpeakers: (speakers: Speaker[]) => void;
  updateSpeaker: (id: string, data: Partial<Speaker>) => void;
  deleteSpeaker: (id: string) => void;
}

export const useSpeakerStore = create<SpeakerState>()(
  persist(
    (set) => ({
      speakers: [],
      addSpeaker: (speaker) => set((s) => ({
        speakers: mergeSpeakers(s.speakers, [{ ...speaker, updatedAt: speaker.updatedAt || new Date().toISOString() }])
      })),
      setSpeakers: (speakers) => set({ speakers: mergeSpeakers(speakers) }),
      updateSpeaker: (id, data) =>
        set((s) => ({
          speakers: s.speakers.map((sp) => (sp.id === id ? { ...sp, ...data, updatedAt: new Date().toISOString() } : sp)),
        })),
      deleteSpeaker: (id) =>
        set((s) => ({ speakers: s.speakers.filter((sp) => sp.id !== id) })),
    }),
    {
      name: "kbv-speakers",
      // Photos Base64 peuvent dépasser le quota ~5 Mo de localStorage.
      // On utilise IndexedDB (quota beaucoup plus élevé) pour tout persister
      // sans perdre les photos au reload.
      storage: createJSONStorage(() => idbStorage),
      // Migration : on nettoie l'ancienne entrée localStorage qui pouvait
      // contenir une version sans photos (partialize précédent).
      onRehydrateStorage: () => () => {
        try { localStorage.removeItem("kbv-speakers"); } catch { /* noop */ }
      },
    }
  )
);
