import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Speaker } from "./visitTypes";
import { mergeSpeakers } from "../lib/dedup";

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
    { name: "kbv-speakers" }
  )
);
