import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Host } from "./visitTypes";

interface HostState {
  hosts: Host[];
  addHost: (host: Host) => void;
  setHosts: (hosts: Host[]) => void;
  updateHost: (id: string, data: Partial<Host>) => void;
  deleteHost: (id: string) => void;
}

export const useHostStore = create<HostState>()(
  persist(
    (set) => ({
      hosts: [],
      addHost: (host) => set((s) => ({ hosts: [...s.hosts, host] })),
      setHosts: (hosts) => set({ hosts }),
      updateHost: (id, data) =>
        set((s) => ({
          hosts: s.hosts.map((h) => (h.id === id ? { ...h, ...data } : h)),
        })),
      deleteHost: (id) =>
        set((s) => ({ hosts: s.hosts.filter((h) => h.id !== id) })),
    }),
    { name: "kbv-hosts" }
  )
);
