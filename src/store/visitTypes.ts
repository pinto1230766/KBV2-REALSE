export type VisitStatus = "scheduled" | "confirmed" | "cancelled" | "completed";
export type LocationType = "kingdom_hall" | "zoom" | "streaming" | "other";
export type VisitHostRole = "hebergement" | "transport" | "repas";

export interface Host {
  id: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  notes?: string;
  role?: VisitHostRole;
  photoUrl?: string;
  capacity?: number;
}

export interface Companion {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  notes?: string;
  gender?: string;
  assignedHostId?: string;
  assignedHostName?: string;
  assignedHostRole?: VisitHostRole;
}

export interface HostAssignment {
  hostId?: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  hostAddress?: string;
  hostPhotoUrl?: string;
  role: VisitHostRole;
  day?: string;
  time?: string;
  origin?: string;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category?: string;
}

export type GroupMealType = "salle_du_royaume" | "restaurant" | "";


export interface Visit {
  visitId: string;
  nom: string;
  congregation: string;
  visitDate: string;
  heure_visite?: string;
  locationType: LocationType;
  status: VisitStatus;
  isEvent?: boolean;
  eventType?: "event" | "congres" | "assemblee";
  talkNoOrType: string;
  talkTheme?: string;
  hostAssignments?: HostAssignment[];
  speakerPhone?: string;
  notes?: string;
  feedback?: string;
  feedbackRating?: number;
  companions?: Companion[];
  date_arrivee?: string;
  heure_arrivee?: string;
  date_depart?: string;
  heure_depart?: string;
  speakerDietary?: string;
  spouseDietary?: string;
  expenses?: Expense[];
  groupMealType?: GroupMealType;
  updatedAt?: string;
}

export type HouseholdType = "single" | "couple";

export interface Speaker {
  id: string;
  nom: string;
  congregation: string;
  telephone?: string;
  email?: string;
  photoUrl?: string;
  spousePhotoUrl?: string;
  householdType?: HouseholdType;
  spouseName?: string;
  notes?: string;
}

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
  congregation: CongregationProfile;
}
