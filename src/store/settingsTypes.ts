// App-wide settings types.

export type Language = "fr" | "cv" | "pt";

export interface CongregationProfile {
  name: string;
  city: string;
  day: string;
  time: string;
  responsableName: string;
  responsablePhone: string;
  responsablePhoto?: string;
  whatsappGroup: string;
  whatsappInviteId: string;
  googleSheetUrl?: string;
  lastSyncAt?: string;
}

export interface AppSettings {
  language: Language;
  darkMode: boolean;
  notifications: {
    enabled: boolean;
    steps: {
      remindJ7: boolean;
      remindJ2: boolean;
    };
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  congregation: CongregationProfile;
}
