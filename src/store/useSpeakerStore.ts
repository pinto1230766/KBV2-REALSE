import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Speaker } from "./visitTypes";

interface SpeakerState {
  speakers: Speaker[];
  addSpeaker: (speaker: Speaker) => void;
  updateSpeaker: (id: string, data: Partial<Speaker>) => void;
  deleteSpeaker: (id: string) => void;
}

export const useSpeakerStore = create<SpeakerState>()(
  persist(
    (set) => ({
      speakers: [],
      addSpeaker: (speaker) => set((s) => ({ speakers: [...s.speakers, speaker] })),
      updateSpeaker: (id, data) =>
        set((s) => ({
          speakers: s.speakers.map((sp) => (sp.id === id ? { ...sp, ...data } : sp)),
        })),
      deleteSpeaker: (id) =>
        set((s) => ({ speakers: s.speakers.filter((sp) => sp.id !== id) })),
    }),
    { name: "kbv-speakers" }
  )
);
