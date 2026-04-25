import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Host } from "./visitTypes";
import { mergeHosts } from "../lib/dedup";

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
      addHost: (host) => set((s) => ({ 
        hosts: mergeHosts(s.hosts, [{ ...host, updatedAt: host.updatedAt || new Date().toISOString() }]) 
      })),
      setHosts: (hosts) => set({ hosts: mergeHosts(hosts) }),
      updateHost: (id, data) =>
        set((s) => ({
          hosts: s.hosts.map((h) => (h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h)),
        })),
      deleteHost: (id) =>
        set((s) => ({ hosts: s.hosts.filter((h) => h.id !== id) })),
    }),
    { name: "kbv-hosts" }
  )
);
