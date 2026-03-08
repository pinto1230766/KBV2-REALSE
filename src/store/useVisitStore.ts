import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Visit } from "./visitTypes";

interface VisitState {
  visits: Visit[];
  addVisit: (visit: Visit) => void;
  setVisits: (visits: Visit[]) => void;
  updateVisit: (visitId: string, data: Partial<Visit>) => void;
  deleteVisit: (visitId: string) => void;
}

export const useVisitStore = create<VisitState>()(
  persist(
    (set) => ({
      visits: [],
      addVisit: (visit) => set((s) => ({ visits: [...s.visits, visit] })),
      setVisits: (visits) => set({ visits }),
      updateVisit: (visitId, data) =>
        set((s) => ({
          visits: s.visits.map((v) =>
            v.visitId === visitId ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
          ),
        })),
      deleteVisit: (visitId) =>
        set((s) => ({ visits: s.visits.filter((v) => v.visitId !== visitId) })),
    }),
    { name: "kbv-visits" }
  )
);
