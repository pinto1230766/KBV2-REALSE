import { useSettingsStore } from "../store/useSettingsStore";
import type { Language } from "../store/visitTypes";

interface TranslationEntry {
  fr: string;
  cv: string;
  pt?: string;
}

const dictionary: Record<string, TranslationEntry> = {
  // Navigation
  dashboard: { fr: "Tableau de bord", cv: "Painel" },
  planning: { fr: "Planning", cv: "Planifikason" },
  speakers: { fr: "Orateurs", cv: "Irmons" },
  hosts: { fr: "Hôtes", cv: "Anfitrions" },
  settings: { fr: "Paramètres", cv: "Configurasons" },
  
  // Status
  upcoming: { fr: "À venir", cv: "Ki sta pa bem" },
  confirmed: { fr: "Confirmé", cv: "Confirmadu" },
  scheduled: { fr: "Planifié", cv: "Planifikadu" },
  completed: { fr: "Terminé", cv: "Terminadu" },
  cancelled: { fr: "Annulé", cv: "Kanseladu" },
  
  // Actions
  add: { fr: "Ajouter", cv: "Ajuntâ" },
  edit: { fr: "Modifier", cv: "Modifikâ" },
  delete: { fr: "Supprimer", cv: "Apagâ" },
  save: { fr: "Enregistrer", cv: "Gravâ" },
  cancel: { fr: "Annuler", cv: "Kanselâ" },
  confirm: { fr: "Confirmer", cv: "Konfirmâ" },
  close: { fr: "Fermer", cv: "Fexâ" },
  search: { fr: "Rechercher...", cv: "Buska..." },
  
  // Visit form
  add_visit: { fr: "Programmer une visite", cv: "Programâ un vizita" },
  speaker_name: { fr: "Nom de l'orateur", cv: "Nomi di orador" },
  congregation: { fr: "Congrégation", cv: "Kongregason" },
  visit_date: { fr: "Date de visite", cv: "Data di vizita" },
  talk_number: { fr: "N° discours", cv: "N° diskursu" },
  talk_theme: { fr: "Thème", cv: "Tema" },
  location: { fr: "Lieu", cv: "Lugar" },
  kingdom_hall: { fr: "Salle du Royaume", cv: "Sala di Reinu" },
  zoom: { fr: "Zoom", cv: "Zoom" },
  notes: { fr: "Notes", cv: "Notas" },
  phone: { fr: "Téléphone", cv: "Telefoni" },
  email: { fr: "Email", cv: "Email" },
  address: { fr: "Adresse", cv: "Enderesu" },
  
  // Dashboard
  total_visits: { fr: "Total visites", cv: "Total vizitas" },
  upcoming_visits: { fr: "Visites à venir", cv: "Vizitas ki sta pa bem" },
  total_speakers: { fr: "Orateurs", cv: "Irmons" },
  total_hosts: { fr: "Hôtes", cv: "Anfitrions" },
  recent_activity: { fr: "Activité récente", cv: "Atividadi resenti" },
  no_visits: { fr: "Aucune visite programmée", cv: "Ninhun vizita programadu" },
  
  // Settings
  language: { fr: "Langue", cv: "Lingua" },
  dark_mode: { fr: "Mode sombre", cv: "Modu skuru" },
  notifications_label: { fr: "Notifications", cv: "Notifikasons" },
  remind_7_days: { fr: "Rappel J-7", cv: "Lembra J-7" },
  remind_2_days: { fr: "Rappel J-2", cv: "Lembra J-2" },
  general: { fr: "Général", cv: "Jeral" },
  appearance: { fr: "Apparence", cv: "Aparensia" },
  data: { fr: "Données", cv: "Dadus" },
  export_data: { fr: "Exporter les données", cv: "Esportâ dadus" },
  import_data: { fr: "Importer les données", cv: "Inportâ dadus" },
  
  // Hosts
  add_host: { fr: "Ajouter un hôte", cv: "Ajuntâ un anfitrion" },
  capacity: { fr: "Capacité", cv: "Kapasidadi" },
  role: { fr: "Rôle", cv: "Papel" },
  hebergement: { fr: "Hébergement", cv: "Alojamentu" },
  transport: { fr: "Transport", cv: "Transporti" },
  repas: { fr: "Repas", cv: "Kumida" },
  
  // Speakers
  add_speaker: { fr: "Ajouter un orateur", cv: "Ajuntâ un orador" },
  
  // Misc
  no_results: { fr: "Aucun résultat", cv: "Ninhun rezultadu" },
  loading: { fr: "Chargement...", cv: "Karregâ..." },
  version: { fr: "Version", cv: "Verson" },
};

export function useTranslation() {
  const language = useSettingsStore((s) => s.settings.language);

  const t = (key: string): string => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[language as keyof TranslationEntry] || entry.fr || key;
  };

  return { t, language };
}
