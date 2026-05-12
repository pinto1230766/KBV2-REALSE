import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReminderType = "j7" | "j2" | "j1_thanks";
export type NotificationStatus = "pending" | "sent" | "dismissed";

export interface AppNotification {
  id: string;
  visitId: string;
  speakerName: string;
  visitDate: string;
  type: ReminderType;
  status: NotificationStatus;
  createdAt: string;
  /** WhatsApp message pre-generated */
  whatsappMessage?: string;
  whatsappPhone?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: AppNotification) => void;
  updateNotification: (id: string, data: Partial<AppNotification>) => void;
  dismissNotification: (id: string) => void;
  markSent: (id: string) => void;
  clearAll: () => void;
  hasNotification: (visitId: string, type: ReminderType) => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [...s.notifications, n] })),
      updateNotification: (id, data) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, ...data } : n
          ),
        })),
      dismissNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: "dismissed" as const } : n
          ),
        })),
      markSent: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: "sent" as const } : n
          ),
        })),
      clearAll: () => set({ notifications: [] }),
      hasNotification: (visitId, type) =>
        get().notifications.some((n) => n.visitId === visitId && n.type === type),
    }),
    { name: "kbv-notifications" }
  )
);
