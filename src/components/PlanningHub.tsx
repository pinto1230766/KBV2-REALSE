import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Check, ChevronRight, Clock, MapPin, Archive, AlertTriangle,
  X, Info, Users, MessageSquare, CreditCard, Star, Phone, Mail, Send,
  Copy, Home, Utensils, Car, Building2, Pencil, Train, Plane, MoreHorizontal
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, VisitStatus, HostAssignment, Expense, GroupMealType } from "../store/visitTypes";
import { generateId } from "../lib/sheetUtils";

type DetailTab = "infos" | "hosts" | "messages" | "expenses" | "feedback";

// Message templates organized by category and recipient
const messageTemplates = {
  // ─── ORATEURS ───
  confirmation_speaker: {
    category: "speaker",
    fr: {
      title: "Confirmation – Orateur (Présentiel)",
      desc: "Premier contact pour confirmer la visite sur place",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nJe suis {ton_nom}, responsable de l'accueil au sein du Groupe Kabuverdianu de Lyon. 🙏\n\nC'est un grand plaisir de vous inviter pour une visite et un discours le {jour_semaine} {date_visite}, à {heure_visite} (Salle du Royaume de Lyon).\n\nMerci de me confirmer les points suivants :\n• ✅ Pouvez-vous venir à cette date et heure ?\n• 🏠 Avez-vous besoin d'un hébergement ?\n• 🍽️ Avez-vous des allergies alimentaires (vous + accompagnants) ?\n• 🚗 Quel mode de transport comptez-vous utiliser (voiture, train, avion) ?\n{question_enfants_block}{question_accompagnants_block}\nMerci de répondre dès que possible pour notre organisation.\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Konfirmaçon – Orador (Prezensial)",
      desc: "Primer kontaktu pa konfirmá vizita",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nMi é {ton_nom}, enkaregadu di resebe vizitantis na Grupu Kabuverdianu di Lyon. 🙏\n\nN ten un grandi prazer di pâpia ku bo pa konvida-u pa faze-nu un vizita i faze un diskursu na {jour_semaine} {date_visite}, na {heure_visite} (Salon di Reinu di Lyon).\n\nFavor, konfirma-m es kuzas li:\n• ✅ Bu pode ben na es data i óra?\n• 🏠 Bu meste di un lugar pa fika (alojamentu)?\n• 🍽️ Algum alerjia di kumida (bo + akonpanhantis)?\n• 🚗 Modi ki bu ta bem (karku, komboiu, avion)?\n{question_enfants_block}{question_accompagnants_block}\nFavor responde-m u más rápidu posível pa nu organiza dretu.\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Confirmação – Orador (Presencial)",
      desc: "Primeiro contacto para confirmar a visita",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nSou {ton_nom}, responsável pelo acolhimento no Grupo Cabo-verdiano de Lyon. 🙏\n\nÉ um grande prazer convidá-lo para uma visita e um discurso no {jour_semaine} {date_visite}, às {heure_visite} (Salão do Reino de Lyon).\n\nPor favor, confirme os seguintes pontos:\n• ✅ Pode vir nesta data e hora?\n• 🏠 Precisa de alojamento?\n• 🍽️ Tem alergias alimentares (você + acompanhantes)?\n• 🚗 Como pretende vir (carro, comboio, avião)?\n{question_enfants_block}{question_accompagnants_block}\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
    },
  },
  confirmation_speaker_online: {
    category: "speaker",
    fr: {
      title: "Confirmation – Orateur (Zoom/Streaming)",
      desc: "Premier contact pour visite en ligne",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nC'est un grand plaisir de vous inviter pour un discours par {visit_channel_label} le {jour_semaine} {date_visite}, à {heure_visite}.\n\nPouvez-vous nous confirmer votre disponibilité pour cette date ?\nLes liens de connexion vous seront envoyés quelques jours avant.\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Konfirmaçon – Orador (Zoom/Streaming)",
      desc: "Primer kontaktu pa vizita online",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nN ten un grandi prazer di konvida-u pa faze un diskursu pa {visit_channel_label} na {jour_semaine} {date_visite}, na {heure_visite}.\n\nBu pode konfirma-nu si bu sta disponível na es data?\nNu ta manda-u link di konexon uns dia antis.\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Confirmação – Orador (Zoom/Streaming)",
      desc: "Primeiro contacto para visita online",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nÉ um grande prazer convidá-lo para um discurso via {visit_channel_label} no {jour_semaine} {date_visite}, às {heure_visite}.\n\nPode confirmar a sua disponibilidade para esta data?\nOs links de ligação serão enviados alguns dias antes.\n\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
    },
  },
  preparation_speaker: {
    category: "speaker",
    fr: {
      title: "Préparation – Orateur (Présentiel)",
      desc: "Détails complets de l'organisation",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nMerci pour votre confirmation ! Voici le plan de votre séjour :\n\n📅 Dates et heures\n• Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n• Réunion : {jour_visite} {date_visite} à {heure_visite}\n• Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\n{speaker_hebergement_block}{speaker_repas_block}{speaker_transport_block}{accompagnants_details}\nSi vous avez la moindre question, je reste disponible au {mon_tel}.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Preparason – Orador (Prezensial)",
      desc: "Detalhes kompletu di organizason",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nObrigadu pa bu konfirmason! Li sta o planu di bu estadia:\n\n📅 Datas i óras\n• Txegada: {jour_arrivee} {date_arrivee} (volta di {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta di {heure_depart})\n\n{speaker_hebergement_block}{speaker_repas_block}{speaker_transport_block}{accompagnants_details}\nSi bu ten kualker pergunta,\nN sta disponível na {mon_tel}.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Preparação – Orador (Presencial)",
      desc: "Detalhes completos de organização",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nObrigado pela sua confirmação! Aqui está o plano da sua estadia:\n\n📅 Datas e horas\n• Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n• Reunião: {jour_visite} {date_visite} às {heure_visite}\n• Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\n{speaker_hebergement_block}{speaker_repas_block}{speaker_transport_block}{accompagnants_details}\nFraternalmente,\n{ton_nom}`,
    },
  },
  preparation_speaker_online: {
    category: "speaker",
    fr: {
      title: "Préparation – Orateur (Zoom/Streaming)",
      desc: "Détails pour la visite en ligne",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nMerci pour votre confirmation ! Voici les détails pour votre discours :\n\n📅 Date et heure\n• {jour_visite} {date_visite} à {heure_visite}\n\n💻 Connexion\n• Plateforme : {visit_channel_label}\n• Lien de connexion : (À insérer ici)\n• ID : (À insérer ici)\n• Code : (À insérer ici)\n\nMerci de vous connecter environ 15 minutes à l'avance pour tester le son et la vidéo.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Preparason – Orador (Zoom/Streaming)",
      desc: "Detalhes pa vizita online",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nObrigadu pa bu konfirmason! Li sta detalhes pa bu diskursu:\n\n📅 Data i óra\n• {jour_visite} {date_visite} na {heure_visite}\n\n💻 Konexon\n• Plataforma: {visit_channel_label}\n• Link di konexon: (Pô li)\n• ID: (Pô li)\n• Kodi: (Pô li)\n\nFavor, konecta uns 15 minutu antis pa nu testa som ku vídiu.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Preparação – Orador (Zoom/Streaming)",
      desc: "Detalhes para a visita online",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nObrigado pela sua confirmação! Aqui estão os detalhes para o seu discurso:\n\n📅 Data e hora\n• {jour_visite} {date_visite} às {heure_visite}\n\n💻 Ligação\n• Plataforma: {visit_channel_label}\n• Link de ligação: (Inserir aqui)\n• ID: (Inserir aqui)\n• Código: (Inserir aqui)\n\nPor favor, ligue-se cerca de 15 minutos antes para testarmos o som e vídeo.\n\nFraternalmente,\n{ton_nom}`,
    },
  },
  thanks_speaker: {
    category: "speaker",
    fr: {
      title: "Remerciements – Orateur",
      desc: "Message après la visite",
      body: `Bonjour Frère {prenom_orateur},\n\nJe vous remercie sincèrement pour votre présence et votre discours qui nous a tous fortifiés ! 🙏✨\nCe fut un grand plaisir de vous accueillir au sein du Groupe Kabuverdianu de Lyon.\n\nNous espérons vous revoir bientôt. Que Jéhovah continue de vous donner des forces pour le servir.\n\n📋 Si vous avez engagé des frais de déplacement, voici le formulaire de remboursement (H-8) à remplir et nous renvoyer :\n{lien_formulaire_h8}\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Agradecementu – Orador",
      desc: "Mensajen pós-vizita",
      body: `Bon dia Irmãu {prenom_orateur},\n\nNha sinseru obrigadu pa bu presensa i pa diskursu ki fortifika-nu tudu! 🙏✨\nFoi un grandi prazeri risebe bu na Grupu Kabuverdianu di Lyon.\n\nNu ta spera torna odja bu brebi. Ki Jeová kontinia da bu forsa pa sirbi-l.\n\n📋 Si bu ten despeza di deslocamentu, li sta formuláriu di reembolsu (H-8) pa preenche i manda-nu volta :\n{lien_formulaire_h8}\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador",
      desc: "Mensagem pós-visita",
      body: `Bom dia Irmão {prenom_orateur},\n\nO nosso sincero obrigado pela sua presença e pelo discurso que fortaleceu todos nós! 🙏✨\nFoi um grande prazer recebê-lo no Grupo Cabo-verdiano de Lyon.\n\nEsperamos vê-lo em breve. Que Jeová continue a dar-lhe forças.\n\n📋 Se teve despesas de deslocação, aqui está o formulário de reembolso (H-8) para preencher e nos devolver:\n{lien_formulaire_h8}\n\nFraternalmente,\n{ton_nom}`,
    },
  },
  thanks_speaker_online: {
    category: "speaker",
    fr: {
      title: "Remerciements – Orateur (Zoom/Streaming)",
      desc: "Message après visite en ligne",
      body: `Bonjour Frère {prenom_orateur},\n\nMerci du fond du cœur pour le discours partagé via {visit_channel_label} ! 🙏💻\nMême à distance, votre message a donné de la force à toute la congrégation.\n\nNous espérons l'opportunité de vous voir en personne. Que Jéhovah continue de bénir votre ministère.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Agradecementu – Orador (Zoom/Streaming)",
      desc: "Mensajen pós-bizita online",
      body: `Bon dia Irmãu {prenom_orateur},\n\nObrigadu di korason pa diskursu partilhadu via {visit_channel_label}! 🙏💻\nMesmu na distansia, bu mensajen da forsa pa kongregason interu.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador (Zoom/Streaming)",
      desc: "Mensagem pós-visita online",
      body: `Bom dia Irmão {prenom_orateur},\n\nObrigado de coração pelo discurso partilhado via {visit_channel_label}! 🙏💻\nMesmo à distância, a sua mensagem deu força a toda a congregação.\n\nFraternalmente,\n{ton_nom}`,
    },
  },
  // ─── LOGISTIQUE ───
  logistique_host: {
    category: "logistique",
    fr: {
      title: "Briefing – Hôte(s)",
      desc: "Message complet pour l'hôte assigné (hébergement, repas, transport)",
      body: `Bonjour,\n\nVoici les informations logistiques pour la visite de {prenom_orateur} {nom_orateur} :\n\n👨‍👩‍👧‍👦 Visiteurs\n{composition_visite_block}\n{repas_label}\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}\nMerci pour ton aide ! Fraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Briefing – Anfitriãus",
      desc: "Mensajen kompletu pa anfitrion atribuidu",
      body: `Bon dia,\n\nLi sta informason di lojístika pa vizita di {prenom_orateur} {nom_orateur}:\n\n👨‍👩‍👧‍👦 Vizitantis\n{composition_visite_block}\n{repas_label}\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}\nObrigadu pa bu juda! Fraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Briefing – Anfitriões",
      desc: "Mensagem completa para o anfitrião atribuído",
      body: `Bom dia,\n\nAqui estão as informações logísticas para a visita de {prenom_orateur} {nom_orateur}:\n\n👨‍👩‍👧‍👦 Visitantes\n{composition_visite_block}\n{repas_label}\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}\nObrigado pela ajuda! Fraternalmente,\n{ton_nom}`,
    },
  },
  // ─── GROUPES ───
  volunteers_group: {
    category: "groupe",
    fr: {
      title: "Recherche de volontaires",
      desc: "Message pour le groupe des hôtes",
      body: `Bonjour à tous ! 👋\n\nJe recherche des VOLONTAIRES pour recevoir notre prochain orateur :\n\n🎤 Orateur : Frère {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n👨‍👩‍👧‍👦 Visiteurs\n{composition_visite_block}\n{repas_label}\n\n📅 Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n📅 Réunion : {jour_visite} {date_visite} à {heure_visite}\n📅 Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\nNous avons besoin de :\n{besoins_volontaires_block}\n{details_allergies_block}Si vous pouvez aider, merci de me répondre dès que possible.\n\nMerci de tout cœur,\n{ton_nom}`,
    },
    cv: {
      title: "Buska voluntarius",
      desc: "Mensajen pa grupo di anfitrioens",
      body: `Bon dia a tudu! 👋\n\nN ta buska VOLUNTÁRIUS pa risebe nos prósimu orador:\n\n🎤 Orador: Irmãu {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n👨‍👩‍👧‍👦 Vizitantis\n{composition_visite_block}\n📅 Txegada: {jour_arrivee} {date_arrivee} (volta di {heure_arrivee})\n📅 Runion: {jour_visite} {date_visite} na {heure_visite}\n📅 Partida: {jour_depart} {date_depart} (volta di {heure_depart})\n\nNu meste di:\n{besoins_volontaires_block}\n{details_allergies_block}Si bu pode juda, favor responde-m u más rápidu posível.\n\nObrigadu di korason,\n{ton_nom}`,
    },
    pt: {
      title: "Procura de voluntários",
      desc: "Mensagem para o grupo de anfitriões",
      body: `Bom dia a todos! 👋\n\nProcuro VOLUNTÁRIOS para receber o nosso próximo orador:\n\n🎤 Orador: Irmão {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n👨‍👩‍👧‍👦 Visitantes\n{composition_visite_block}\n📅 Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n📅 Reunião: {jour_visite} {date_visite} às {heure_visite}\n📅 Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\nPrecisamos de:\n{besoins_volontaires_block}\n{details_allergies_block}Obrigado de coração,\n{ton_nom}`,
    },
  },
  preparation_group: {
    category: "groupe",
    fr: {
      title: "Préparation – Groupe des Hôtes",
      desc: "Brief complet pour tous les volontaires",
      body: `Bonjour la famille ! 👋\n\nVoici l'organisation pour la visite de {prenom_orateur} {nom_orateur} :\n\n👨‍👩‍👧‍👦 Visiteurs\n{composition_visite_block}\n📅 Dates/Heures\n• Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n• Réunion : {jour_visite} {date_visite} à {heure_visite}\n• Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}Merci à chaque volontaire pour votre aide précieuse ! 🙏✨`,
    },
    cv: {
      title: "Preparason – Grupo di Anfitriãus",
      desc: "Brief kompletu pa tudu voluntáriu",
      body: `Bon dia famía! 👋\n\nPlanifikason pa vizita di {prenom_orateur} {nom_orateur}:\n\n👨‍👩‍👧‍👦 Vizitantis\n{composition_visite_block}\n📅 Datas/Oras\n• Txegada: {jour_arrivee} {date_arrivee} (volta {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta {heure_depart})\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}Obrigadu pa kada voluntáriu pa bo disposti! 🙏✨`,
    },
    pt: {
      title: "Preparação – Grupo de Anfitriões",
      desc: "Brief completo para todos os voluntários",
      body: `Bom dia família! 👋\n\nAqui está a organização para a visita de {prenom_orateur} {nom_orateur}:\n\n👨‍👩‍👧‍👦 Visitantes\n{composition_visite_block}\n📅 Datas/Horas\n• Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n• Reunião: {jour_visite} {date_visite} às {heure_visite}\n• Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}Obrigado a cada voluntário pela ajuda preciosa! 🙏✨`,
    },
  },
};

type TemplateCategory = "speaker" | "logistique" | "groupe";


export function PlanningHub() {
  const visits = useVisitStore((s) => s.visits);
  const addVisit = useVisitStore((s) => s.addVisit);
  const updateVisit = useVisitStore((s) => s.updateVisit);
  const deleteVisit = useVisitStore((s) => s.deleteVisit);
  const pendingVisitId = useUIStore((s) => s.pendingVisitId);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const congregation = useSettingsStore((s) => s.settings.congregation);
  const speakers = useSpeakerStore((s) => s.speakers);
  const updateSpeaker = useSpeakerStore((s) => s.updateSpeaker);
  const allHosts = useHostStore((s) => s.hosts);
  const { t, language } = useTranslation();

  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [viewVisit, setViewVisit] = useState<Visit | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("infos");
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);



  // Detail form
  const [detailForm, setDetailForm] = useState<Partial<Visit>>({});
  // Messages
  const [messageText, setMessageText] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("orateur");
  const [templateLang, setTemplateLang] = useState(language);
  // Expenses
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("carburant");
  // Host assignment
  const [showAssignHost, setShowAssignHost] = useState(false);
  const [assignHostId, setAssignHostId] = useState("");
  const [assignRole, setAssignRole] = useState<HostAssignment["role"]>("hebergement");
  const [assignDay, setAssignDay] = useState("");
  const [assignTime, setAssignTime] = useState("");
  const [editingHostIdx, setEditingHostIdx] = useState<number | null>(null);

  const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";
  const now = new Date();

  const { upcomingVisits, archivedVisits } = useMemo(() => {
    const now = new Date();
    const sorted = [...visits].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    const upcoming = sorted.filter((v) => new Date(v.visitDate) >= now || v.status === "scheduled" || v.status === "confirmed");
    const archived = sorted.filter((v) => v.status === "completed" || v.status === "cancelled");
    return { upcomingVisits: upcoming, archivedVisits: archived };
  }, [visits]);

  const displayedVisits = showArchived ? archivedVisits : upcomingVisits;

  const [form, setForm] = useState({
    nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "",
    locationType: "kingdom_hall" as Visit["locationType"],
    speakerPhone: "", notes: "", status: "scheduled" as VisitStatus, heure_visite: congregation?.time || "11:30",
  });

  const resetForm = () => {
    setForm({ nom: "", congregation: "", visitDate: "", talkNoOrType: "", talkTheme: "", locationType: "kingdom_hall", speakerPhone: "", notes: "", status: "scheduled", heure_visite: congregation?.time || "11:30" });
    setEditingVisit(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.nom || !form.visitDate) return;
    if (editingVisit) {
      updateVisit(editingVisit.visitId, form);
      toast.success(t("visit_updated"));
    } else {
      addVisit({ ...form, visitId: generateId() } as Visit);
      toast.success(t("visit_added"));
    }
    resetForm();
  };

  const handleDelete = (visitId: string) => {
    deleteVisit(visitId);
    setConfirmDeleteId(null);
    setViewVisit(null);
    toast.success(t("visit_deleted"));
  };

  const openDetail = useCallback((visit: Visit) => {
    setViewVisit(visit);
    // Format dates for date inputs (yyyy-MM-dd)
    const formatDateForInput = (dateStr?: string) => {
      if (!dateStr) return "";
      // If already in yyyy-MM-dd format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // If ISO format, extract just the date part
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };
    setDetailForm({ 
      ...visit,
      visitDate: formatDateForInput(visit.visitDate),
      date_arrivee: formatDateForInput(visit.date_arrivee),
      date_depart: formatDateForInput(visit.date_depart),
      transportType: visit.transportType || "car",
      childrenCount: visit.childrenCount ?? getSpeakerForVisit(visit)?.childrenCount,
      childrenAges: visit.childrenAges ?? getSpeakerForVisit(visit)?.childrenAges,
      speakerDietary: visit.speakerDietary ?? getSpeakerForVisit(visit)?.dietary,
      spouseDietary: visit.spouseDietary ?? getSpeakerForVisit(visit)?.spouseDietary,
    });
    setDetailTab("infos");
    setMessageText("");
    setSelectedRecipient("orateur");
    setTemplateLang(language);
    setShowAssignHost(false);
  }, [language, setViewVisit, setDetailForm, setDetailTab, setMessageText, setSelectedRecipient, setTemplateLang, setShowAssignHost]);

  // Auto-open visit when clicking from calendar (without scroll)
  useEffect(() => {
    if (pendingVisitId) {
      const visit = visits.find((v) => v.visitId === pendingVisitId);
      if (visit) {
        openDetail(visit);
        setPendingVisit(null); // Clear pending after opening
      }
    }
  }, [pendingVisitId, visits, setPendingVisit, openDetail]);

  const saveDetail = () => {
    if (!viewVisit) return;
    updateVisit(viewVisit.visitId, detailForm);
    
    // Sync children and dietary info back to speaker if changed
    const speaker = getSpeakerForVisit(viewVisit);
    if (speaker) {
      updateSpeaker(speaker.id, {
        ...speaker,
        childrenCount: detailForm.childrenCount,
        childrenAges: detailForm.childrenAges,
        dietary: detailForm.speakerDietary,
        spouseDietary: detailForm.spouseDietary,
      });
    }
    
    toast.success(t("visit_updated"));
    setViewVisit(null);
  };

  const closeDetail = () => { setViewVisit(null); setDetailForm({}); };

  const locationLabel = (loc: string) => {
    if (loc === "kingdom_hall") return t("in_person");
    if (loc === "zoom") return "Zoom";
    if (loc === "streaming") return "Streaming";
    return t("other");
  };

  const getSpeakerForVisit = (visit: Visit) => speakers.find((s) => s.nom.toLowerCase() === visit.nom.toLowerCase());

  const roleIcon = (role: string) => {
    if (role === "hebergement") return <Home className="w-3.5 h-3.5" />;
    if (role === "transport") return <Car className="w-3.5 h-3.5" />;
    return <Utensils className="w-3.5 h-3.5" />;
  };

  const roleColor = (role: string) => {
    if (role === "hebergement") return "text-amber-600";
    if (role === "transport") return "text-blue-600";
    return "text-emerald-600";
  };

  // Add expense
  const addExpense = () => {
    if (!newExpenseLabel || !newExpenseAmount) return;
    const expenses = [...(detailForm.expenses || []), { id: generateId(), label: newExpenseLabel, amount: parseFloat(newExpenseAmount) || 0, category: newExpenseCategory }];
    setDetailForm({ ...detailForm, expenses });
    setNewExpenseLabel("");
    setNewExpenseAmount("");
  };

  const removeExpense = (id: string) => {
    setDetailForm({ ...detailForm, expenses: (detailForm.expenses || []).filter((e) => e.id !== id) });
  };

  const totalExpenses = (detailForm.expenses || []).reduce((sum, e) => sum + e.amount, 0);

  // Add host assignment
  const addHostAssignment = () => {
    if (!assignHostId) return;
    const host = allHosts.find((h) => h.id === assignHostId);
    if (!host) return;

    // Conflict detection: check if host is already assigned to another visit on the same day
    const hasConflict = visits.some(v => 
      v.visitId !== viewVisit?.visitId && 
      v.status !== "cancelled" &&
      v.hostAssignments?.some(ha => ha.hostId === host.id && ha.day === assignDay)
    );
    
    if (hasConflict && assignDay) {
      const confirmMsg = templateLang === "cv" ? `⚠️ ${host.nom} dja sta atribuidu na otu vizita na dia ${formatDateFull(assignDay)}. Bu kre kontinia?` : 
                        templateLang === "pt" ? `⚠️ ${host.nom} já está atribuído(a) a outra visita no dia ${formatDateFull(assignDay)}. Deseja continuar?` :
                        `⚠️ ${host.nom} est déjà assigné(e) à une autre visite le ${formatDateFull(assignDay)}. Voulez-vous continuer ?`;
      if (!window.confirm(confirmMsg)) return;
    }

    // Capacity check
    if (host.capacity && totalPeople > host.capacity) {
      const capacityMsg = templateLang === "cv" ? `⚠️ ${host.nom} ten kapasidadi pa ${host.capacity} pesoas, mas bu ten ${totalPeople}. Kontinia?` :
                         templateLang === "pt" ? `⚠️ ${host.nom} tem capacidade para ${host.capacity} pessoas, mas você tem ${totalPeople}. Continuar?` :
                         `⚠️ ${host.nom} n'a une capacité que de ${host.capacity} personnes, mais vous en avez ${totalPeople}. Continuer ?`;
      if (!window.confirm(capacityMsg)) return;
    }

    const newAssignment: HostAssignment = {
      hostId: host.id, hostName: host.nom, hostPhone: host.telephone,
      hostEmail: host.email, hostAddress: host.adresse,
      hostPhotoUrl: host.photoUrl, role: assignRole, day: assignDay, time: assignTime,
    };
    setDetailForm({ ...detailForm, hostAssignments: [...(detailForm.hostAssignments || []), newAssignment] });
    setShowAssignHost(false);
    setAssignHostId("");
    setAssignDay("");
    setAssignTime("");
  };

  const removeHostAssignment = (idx: number) => {
    const updated = [...(detailForm.hostAssignments || [])];
    updated.splice(idx, 1);
    setDetailForm({ ...detailForm, hostAssignments: updated });
  };

  const updateHostAssignment = (idx: number, field: string, value: string) => {
    const updated = [...(detailForm.hostAssignments || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setDetailForm({ ...detailForm, hostAssignments: updated });
  };

  const sendWhatsApp = (phone: string, text: string) => {
    // Always copy message first
    navigator.clipboard.writeText(text);
    if (phone === WHATSAPP_INVITE_ID || phone.length < 6) {
      // For group: use generic share link, user picks the group natively
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("✅ Message copié – Choisissez le groupe dans WhatsApp");
      return;
    }
    const cleaned = phone.replace(/\s/g, "");
    // Use direct link with anchor click to bypass iframe restrictions
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("✅ Message copié + WhatsApp ouvert");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  const { settings } = useSettingsStore();
  const WHATSAPP_INVITE_ID = settings.congregation.whatsappInviteId || "Di5J5Jl4VjU4e9QURFHsrf";

  // Get recipients for messages
  const getRecipients = () => {
    const recipients: Array<{ label: string; phone: string; type: string; hostName?: string }> = [];
    if (detailForm.speakerPhone) {
      recipients.push({ label: `🎤 ${viewVisit?.nom || t("speaker_label")}`, phone: detailForm.speakerPhone, type: "orateur" });
    }
    (detailForm.hostAssignments || []).forEach((ha, i) => {
      if (ha.hostPhone) {
        const roleEmoji = ha.role === "hebergement" ? "🏠" : ha.role === "transport" ? "🚗" : "🍽️";
        recipients.push({ label: `${roleEmoji} ${ha.hostName || ""} (${t(ha.role)})`, phone: ha.hostPhone, type: `host_${i}`, hostName: ha.hostName });
      }
    });
    recipients.push({ label: "👥 Groupe WhatsApp", phone: WHATSAPP_INVITE_ID, type: "groupe" });
    return recipients;
  };

  const getSelectedRecipient = () => getRecipients().find((r) => r.type === selectedRecipient);

  // Format a date string to French full format
  const formatDateFull = (dateStr?: string) => {
    if (!dateStr) return "___";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return dateStr; }
  };
  const formatDayOnly = (dateStr?: string) => {
    if (!dateStr) return "___";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, { weekday: "long" });
    } catch { return "___"; }
  };

  // Total people calculation (used for messages and capacity warnings)
  const currentSpeaker = viewVisit ? getSpeakerForVisit(viewVisit) : null;
  const isCouple = currentSpeaker?.householdType === "couple";
  const childrenCount = detailForm.childrenCount ?? currentSpeaker?.childrenCount ?? 0;
  const nbAccompagnants = (detailForm.companions || []).length;
  const totalPeople = 1 + (isCouple ? 1 : 0) + childrenCount + nbAccompagnants;

  // Resolve all template variables with real data
  const resolveVariables = (text: string): string => {
    if (!viewVisit) return text;
    const speaker = getSpeakerForVisit(viewVisit);
    const nameParts = viewVisit.nom?.split(" ") || [];
    const prenom = nameParts[0] || "";
    const nom = nameParts.slice(1).join(" ") || "";

    // Find hosts by role
    const hostsByRole = (role: string) => (detailForm.hostAssignments || []).filter((ha) => ha.role === role);
    const hebergementHosts = hostsByRole("hebergement");
    const repasHosts = hostsByRole("repas");
    const transportHosts = hostsByRole("transport");

    // Build planning sections
    const buildHostSection = (hosts: HostAssignment[]) => {
      if (hosts.length === 0) return "Non défini";
      return hosts.map((h) => {
        const day = h.day ? formatDateFull(h.day) : "";
        const time = h.time || "";
        const address = h.hostAddress || "";
        const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";
        
        let section = `${h.hostName || ""}${day ? " – " + day : ""}${time ? " à " + time : ""}`;
        if (address) section += `\n📍 ${address}`;
        if (mapsUrl) section += `\n🗺️ Google Maps : ${mapsUrl}`;
        return section;
      }).join("\n");
    };

    // Companions (External only)
    const companions = detailForm.companions || [];
    const nomsAccompagnantsList = companions.map((c) => c.nom);
    const nbAccompagnants = nomsAccompagnantsList.length;
    const nomsAccompagnants = nomsAccompagnantsList.join(", ") || "Aucun";
    const accompagnantsDetails = nbAccompagnants > 0
      ? `👥 Accompagnants (${nbAccompagnants}) : ${nomsAccompagnants}\n\n`
      : "";

    // Allergies
    const allergiesSpeaker = detailForm.speakerDietary || "Aucune";
    const allergiesSpouse = detailForm.spouseDietary || "";
    const detailsAllergies = allergiesSpouse ? `${allergiesSpeaker} / ${allergiesSpouse}` : allergiesSpeaker;

    // Enfants (from speaker store)
    const childrenAges = speaker?.childrenAges || "";
    const enfantsDetails = childrenCount > 0
      ? `${childrenCount} enfant(s)${childrenAges ? ` (${childrenAges})` : ""}`
      : "Aucun";

    // Composition for hosts
    const visitorParts = [`• Orateur : ${prenom} ${nom}`];
    if (speaker?.householdType === "couple" && speaker.spouseName) {
      visitorParts.push(`• Épouse : ${speaker.spouseName}`);
    }
    if (childrenCount > 0) {
      visitorParts.push(`• Enfants : ${enfantsDetails}`);
    }
    if (nbAccompagnants > 0) {
      visitorParts.push(`• Accompagnants (${nbAccompagnants}) : ${nomsAccompagnants}`);
    }
    const compositionBlock = visitorParts.join("\n") + "\n";

    // Channel label
    const channelLabel = detailForm.locationType === "zoom" ? "Zoom" : detailForm.locationType === "streaming" ? "Streaming" : "";

    // First repas host info
    const firstRepas = repasHosts[0];
    const firstTransport = transportHosts[0];

    const vars: Record<string, string> = {
      // Orateur
      "{prenom_orateur}": prenom,
      "{nom_orateur}": nom,
      "{congregation_orateur}": viewVisit.congregation || "",
      "{tel_orateur}": detailForm.speakerPhone || "",
      "{speakerName}": viewVisit.nom || "",
      "{congregation}": viewVisit.congregation || "",
      // Visite
      "{date_visite}": formatDateFull(viewVisit.visitDate),
      "{jour_semaine}": formatDayOnly(viewVisit.visitDate),
      "{heure_visite}": detailForm.heure_visite || congregation.time || "11:30",
      "{theme_discours}": detailForm.talkTheme || "",
      "{numero_discours}": detailForm.talkNoOrType || "",
      "{talkTitle}": detailForm.talkTheme || "",
      "{visitDate}": formatDateFull(viewVisit.visitDate),
      "{visitTime}": detailForm.heure_visite || "",
      "{location}": detailForm.locationType === "kingdom_hall" ? "Salle du Royaume" : channelLabel || "Autre",
      // Arrivée / Départ
      "{date_arrivee}": formatDateFull(detailForm.date_arrivee),
      "{jour_arrivee}": formatDayOnly(detailForm.date_arrivee),
      "{heure_arrivee}": detailForm.heure_arrivee || "___",
      "{date_depart}": formatDateFull(detailForm.date_depart),
      "{jour_depart}": formatDayOnly(detailForm.date_depart),
      "{heure_depart}": detailForm.heure_depart || "___",
      "{jour_visite}": formatDayOnly(viewVisit.visitDate),
      // Hébergement
      "{hebergement_details}": buildHostSection(hebergementHosts),
      "{hebergement_planning}": buildHostSection(hebergementHosts),
      "{nom_hebergeur}": hebergementHosts[0]?.hostName || "___",
      "{prenom_hotesse}": hebergementHosts[0]?.hostName?.split(" ")[0] || "___",
      "{adresse_hebergeur}": hebergementHosts[0]?.hostAddress || "___",
      "{tel_hebergeur}": hebergementHosts[0]?.hostPhone || "___",
      // Repas
      "{repas_details}": buildHostSection(repasHosts),
      "{repas_planning}": buildHostSection(repasHosts),
      "{nom_responsable_repas}": firstRepas?.hostName || "___",
      "{prenom_responsable_repas}": firstRepas?.hostName?.split(" ")[0] || "___",
      "{tel_responsable_repas}": firstRepas?.hostPhone || "___",
      "{date_repas}": firstRepas?.day ? formatDateFull(firstRepas.day) : "___",
      "{jour_repas}": firstRepas?.day ? formatDayOnly(firstRepas.day) : "___",
      "{heure_repas}": firstRepas?.time || "___",
      "{adresse_repas}": firstRepas?.hostAddress || "___",
      // Transport
      "{transport_details}": buildHostSection(transportHosts),
      "{transport_planning}": buildHostSection(transportHosts),
      "{nom_chauffeur}": firstTransport?.hostName || "___",
      "{prenom_chauffeur}": firstTransport?.hostName?.split(" ")[0] || "___",
      "{tel_chauffeur}": firstTransport?.hostPhone || "___",
      "{date_transport}": firstTransport?.day ? formatDateFull(firstTransport.day) : "___",
      "{heure_transport}": firstTransport?.time || "___",
      "{lieu_depart}": "___",
      "{lieu_arrivee}": "Salle du Royaume",
      // Accompagnants
      "{nb_accompagnants}": String(nbAccompagnants),
      "{noms_accompagnants}": nomsAccompagnants,
      "{nb_total_personnes}": String(totalPeople),
      "{nb_total_repas}": String(totalPeople),
      "{repas_label}": templateLang === "cv" ? `🍽️ ${totalPeople} pratu di kumida` : templateLang === "pt" ? `🍽️ ${totalPeople} refeições` : `🍽️ ${totalPeople} repas au total`,
      "{allergies_orateur}": allergiesSpeaker,
      "{allergies_orateur_et_accompagnants}": detailsAllergies,
      "{details_allergies}": detailsAllergies,
      "{accompagnants_details}": accompagnantsDetails,
      // Enfants
      "{enfants_details}": enfantsDetails,
      "{nb_enfants}": String(childrenCount),
      "{ages_enfants}": childrenAges,
      // Coordinateur
      "{ton_nom}": congregation.responsableName || "___",
      "{mon_tel}": congregation.responsablePhone || "___",
      "{hospitalityOverseer}": congregation.responsableName || "___",
      "{hospitalityOverseerPhone}": congregation.responsablePhone || "___",
      "{ta_tache}": "Responsable hospitalité",
      // Channel
      "{visit_channel_label}": channelLabel || "___",
      // Transport
      "{type_transport}": detailForm.transportType ? t(detailForm.transportType) : "___",
      // Formulaire H-8
      "{lien_formulaire_h8}": `${window.location.origin}/documents/H-8_remboursement.pdf`,

      // --- BLOCS CONDITIONNELS (PROPRES) ---
      "{details_allergies_block}": (detailsAllergies && detailsAllergies !== "Aucune" && detailsAllergies !== "Ninhun" && detailsAllergies !== "Nenhuma") ? `⚠️ Allergies : ${detailsAllergies}\n` : "",
      "{accompagnants_block}": nbAccompagnants > 0 ? `👥 Accompagnants (${nbAccompagnants}) : ${nomsAccompagnants}\n` : "",
      "{enfants_block}": childrenCount > 0 ? `🧒 Enfants : ${enfantsDetails}\n` : "",
      "{transport_type_block}": (detailForm.transportType && detailForm.transportType !== "car") ? `🚗 Mode de voyage : ${t(detailForm.transportType)}${detailForm.transportDetails ? ` (${detailForm.transportDetails})` : ""}\n` : "",
      "{hebergement_planning_block}": hebergementHosts.length > 0 ? `🏠 HÉBERGEMENT\n${buildHostSection(hebergementHosts)}\n\n` : "",
      "{repas_planning_block}": repasHosts.length > 0 ? `🍽️ REPAS\n${buildHostSection(repasHosts)}\n\n` : "",
      "{transport_planning_block}": transportHosts.length > 0 ? `🚗 TRANSPORT\n${buildHostSection(transportHosts)}\n\n` : "",
      "{composition_visite_block}": compositionBlock,
      "{question_enfants_block}": childrenCount === 0 ? (templateLang === "cv" ? "• 🧒 Bu ta bem ku fidjos? Si sim, kantu i ki idad?\n" : templateLang === "pt" ? "• 🧒 Vem acompanhado de crianças? Se sim, quantas e que idades?\n" : "• 🧒 Êtes-vous accompagné(e) d'enfants ? Si oui, combien et quel âge ?\n") : "",
      "{question_transport_block}": !detailForm.transportType ? (templateLang === "cv" ? "• 🚗 Modi ki bu ta bem (karku, komboiu, avion)?\n" : templateLang === "pt" ? "• 🚗 Como pretende vir (carro, comboio, avião)?\n" : "• 🚗 Quel mode de transport comptez-vous utiliser (voiture, train, avion) ?\n") : "",
      "{question_accompagnants_block}": nbAccompagnants === 0 ? (templateLang === "cv" ? "• 👥 Bu ta bem ku otus pesoas?\n" : templateLang === "pt" ? "• 👥 Vem acompanhado de outras pessoas?\n" : "• 👥 Serez-vous accompagné d'autres personnes (amis, famille) ?\n") : "",
      "{besoins_volontaires_block}": [
        templateLang === "cv" ? "• 🏠 Alojamentu (lugar pa fika + kafé di manha)" : templateLang === "pt" ? "• 🏠 Alojamento" : "• 🏠 Hébergement (logement + petit-déjeuner)",
        templateLang === "cv" ? "• 🍽️ Kumida (almosu / janta)" : templateLang === "pt" ? "• 🍽️ Refeições" : "• 🍽️ Repas (déjeuner / dîner)",
        (!detailForm.transportType || detailForm.transportType !== "car") ? (templateLang === "cv" ? "• 🚗 Transporti (stason / aeroportu ⇄ Salon di Reinu)" : templateLang === "pt" ? "• 🚗 Transporte" : "• 🚗 Transport (gare / aéroport ⇄ Salle du Royaume)") : null
      ].filter(Boolean).join("\n") + "\n",
      "{speaker_transport_block}": detailForm.transportType === "car" ? (templateLang === "cv" ? "🚗 Transportu\nBu fla ma bu ta bem na bu karku.\n\n" : templateLang === "pt" ? "🚗 Transporte\nIndicou que vem com a sua própria viatura.\n\n" : "🚗 Transport\nVous avez indiqué venir avec votre propre véhicule.\n\n") : (transportHosts.length > 0 ? `🚗 Transport\n${buildHostSection(transportHosts)}\n\n` : ""),
      "{speaker_hebergement_block}": hebergementHosts.length > 0 ? `🏠 Hébergement\n${buildHostSection(hebergementHosts)}\n\n` : "",
      "{speaker_repas_block}": repasHosts.length > 0 ? `🍽️ Repas\n${buildHostSection(repasHosts)}\n\n` : "",
    };

    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      result = result.split(key).join(value);
    }
    return result;
  };

  const detailTabs: Array<{ id: DetailTab; label: string; icon: LucideIcon }> = [
    { id: "infos", label: t("infos"), icon: Info },
    { id: "hosts", label: t("hosts"), icon: Users },
    { id: "messages", label: t("messages_tab"), icon: MessageSquare },
    { id: "expenses", label: t("expenses"), icon: CreditCard },
    { id: "feedback", label: t("feedback_label"), icon: Star },
  ];

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="mr-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("upcoming")}</p>
          <p className="text-3xl font-black text-foreground">{upcomingVisits.length}</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg active:scale-95">
          <Plus className="w-5 h-5 flex-shrink-0" /> {t("add")}
        </motion.button>
        <button onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${showArchived ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Archive className="w-4 h-4" /> {t("archived")} ({archivedVisits.length})
        </button>
      </div>

      {/* Visit Grid */}
      {displayedVisits.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p className="text-sm">{t("no_visits")}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {displayedVisits.map((visit, i) => {
              const d = new Date(visit.visitDate);
              const monthShort = d.toLocaleDateString(locale, { month: "short" }).toUpperCase().replace(".", "");
              const dayNum = d.getDate();
              return (
                <motion.div key={visit.visitId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}
                  className="premium-card p-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => openDetail(visit)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-14 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-primary">{monthShort}</span>
                      <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
                    </div>

                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-sm font-black text-foreground truncate">{visit.nom}</p>
                      {visit.talkTheme && <p className="text-xs text-muted-foreground truncate mt-0.5">{visit.talkTheme}</p>}
                      <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
                        }`}>{t(visit.status)}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{locationLabel(visit.locationType)}</span>
                        {(() => {
                          const assignments = visit.hostAssignments || [];
                          const hasH = assignments.some(a => a.role === 'hebergement');
                          const hasR = assignments.some(a => a.role === 'repas');
                          const hasT = assignments.some(a => a.role === 'transport');
                          const isOnline = visit.locationType === 'zoom' || visit.locationType === 'streaming';
                          if (isOnline) return null;
                          return (
                            <div className="flex items-center gap-1.5 ml-1 border-l border-border/50 pl-2">
                              <Home className={`w-3 h-3 ${hasH ? 'text-amber-500' : 'text-muted-foreground/20'}`} />
                              <Utensils className={`w-3 h-3 ${hasR ? 'text-emerald-500' : 'text-muted-foreground/20'}`} />
                              <Car className={`w-3 h-3 ${hasT ? 'text-blue-500' : 'text-muted-foreground/20'}`} />
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {visit.heure_visite || "11:30"}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {visit.congregation}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-center self-stretch justify-center pr-1">
                      {visit.status !== "confirmed" && visit.status !== "completed" && (
                        <button onClick={(e) => { e.stopPropagation(); updateVisit(visit.visitId, { status: "confirmed" }); toast.success(t("visit_confirmed")); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors" title="Confirmer">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(visit.visitId); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 mt-auto" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ============ VISIT DETAIL MODAL ============ */}
      <AnimatePresence>
        {viewVisit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeDetail}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="w-full max-w-5xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const speaker = getSpeakerForVisit(viewVisit);
                const visitD = new Date(viewVisit.visitDate);
                const dayLabel = visitD.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
                const hostCount = (detailForm.hostAssignments || []).length;
                return (
                  <div className="max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start gap-4">
                        {speaker?.photoUrl ? (
                          <img src={speaker.photoUrl} alt={viewVisit.nom} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Users className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-black text-foreground">{viewVisit.nom}</h2>
                          {(() => {
                            const pastVisits = visits
                              .filter(v => v.nom.toLowerCase() === viewVisit.nom.toLowerCase() && v.visitId !== viewVisit.visitId && new Date(v.visitDate) < new Date(viewVisit.visitDate))
                              .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
                            const lastVisit = pastVisits[0];
                            return (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                {speaker?.spouseName && <span className="text-sm text-primary font-medium"> avec {speaker.spouseName}</span>}
                                {lastVisit && (
                                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-bold uppercase tracking-wider">
                                    Dernière visite : {new Date(lastVisit.visitDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })} (Discours #{lastVisit.talkNoOrType})
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <p className="text-sm font-medium text-foreground mt-2">{dayLabel}</p>
                        </div>
                        <button onClick={closeDetail} className="p-2 rounded-xl hover:bg-muted transition-colors" title="Fermer"><X className="w-5 h-5 text-muted-foreground" /></button>
                      </div>
                      <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide border-b border-border pb-0 px-1">
                        {detailTabs.map((tab) => (
                          <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 -mb-[1px] ${
                              detailTab === tab.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                            }`}>
                            <tab.icon className="w-3.5 h-3.5" />{tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* ---- INFOS TAB ---- */}
                      {detailTab === "infos" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                          {(() => {
                            const sixMonthsAgo = new Date();
                            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                            const pastVisits = visits
                              .filter(v => v.nom.toLowerCase() === viewVisit.nom.toLowerCase() && v.visitId !== viewVisit.visitId && new Date(v.visitDate) < new Date(viewVisit.visitDate))
                              .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
                            const lastVisit = pastVisits[0];
                            const isRecent = lastVisit && new Date(lastVisit.visitDate) > sixMonthsAgo;
                            
                            if (isRecent) {
                              return (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                  <p className="text-[11px] font-bold text-amber-600 leading-tight uppercase">
                                    Attention : Cet orateur est venu récemment ({new Date(lastVisit.visitDate).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}).
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("visit_details")}</p>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-[3] space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_theme")}</p>
                              <input className="input-soft text-base font-bold" value={detailForm.talkTheme || ""} onChange={(e) => setDetailForm({ ...detailForm, talkTheme: e.target.value })} placeholder={t("talk_theme")} />
                            </div>
                            <div className="flex-1 space-y-1 min-w-[100px]">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_number")}</p>
                              <input className="input-soft text-2xl font-black w-full" value={detailForm.talkNoOrType || ""} onChange={(e) => setDetailForm({ ...detailForm, talkNoOrType: e.target.value })} placeholder={t("talk_number")} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_phone")}</p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                              <input className="input-soft text-sm" value={detailForm.speakerPhone || ""} onChange={(e) => setDetailForm({ ...detailForm, speakerPhone: e.target.value })} placeholder={t("phone")} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("phone_whatsapp_hint")}</p>
                          </div>
                          <div className="space-y-4">
                            {/* Arrivée */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1">{t("arrival")}</p>
                              <div className="flex flex-col xs:flex-row gap-2">
                                <div className="flex-1">
                                  <input className="input-soft text-sm" type="date" value={detailForm.date_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, date_arrivee: e.target.value })} title={t("arrival_date")} />
                                </div>
                                <div className="xs:w-32">
                                  <input className="input-soft text-sm" type="time" value={detailForm.heure_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_arrivee: e.target.value })} title={t("arrival_time")} />
                                </div>
                              </div>
                            </div>

                            {/* Réunion */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1">{t("meeting")}</p>
                              <div className="flex flex-col xs:flex-row gap-2">
                                <div className="flex-1">
                                  <input className="input-soft text-sm" type="date" value={detailForm.visitDate || ""} onChange={(e) => setDetailForm({ ...detailForm, visitDate: e.target.value })} title={t("meeting_date")} />
                                </div>
                                <div className="xs:w-32">
                                  <input className="input-soft text-sm" type="time" value={detailForm.heure_visite || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_visite: e.target.value })} title={t("meeting_time")} />
                                </div>
                              </div>
                            </div>

                            {/* Départ */}
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1">{t("departure")}</p>
                              <div className="flex flex-col xs:flex-row gap-2">
                                <div className="flex-1">
                                  <input className="input-soft text-sm" type="date" value={detailForm.date_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, date_depart: e.target.value })} title={t("departure_date")} />
                                </div>
                                <div className="xs:w-32">
                                  <input className="input-soft text-sm" type="time" value={detailForm.heure_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_depart: e.target.value })} title={t("departure_time")} />
                                </div>
                              </div>
                            </div>

                            {/* Lieu & Statut */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("location")}</p>
                                <select className="input-soft text-sm" value={detailForm.locationType || "kingdom_hall"} onChange={(e) => setDetailForm({ ...detailForm, locationType: e.target.value as Visit["locationType"] })} title={t("location")}>
                                  <option value="kingdom_hall">{t("in_person")}</option><option value="zoom">Zoom</option><option value="streaming">Streaming</option><option value="other">{t("other")}</option>
                                </select>
                              </div>
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("status")}</p>
                                <select className="input-soft text-sm" value={detailForm.status || "scheduled"} onChange={(e) => setDetailForm({ ...detailForm, status: e.target.value as VisitStatus })} title={t("status")}>
                                  <option value="scheduled">{t("scheduled")}</option><option value="confirmed">{t("confirmed")}</option><option value="completed">{t("completed")}</option><option value="cancelled">{t("cancelled")}</option>
                                </select>
                              </div>
                            </div>

                            {/* Transport Type */}
                            <div className="space-y-3 pt-2">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("transport_type")}</p>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { id: "car", icon: Car, label: t("car") },
                                  { id: "train", icon: Train, label: t("train") },
                                  { id: "plane", icon: Plane, label: t("plane") },
                                  { id: "other", icon: MoreHorizontal, label: t("other_transport") }
                                ].map((tr) => (
                                  <button
                                    key={tr.id}
                                    onClick={() => setDetailForm({ ...detailForm, transportType: tr.id as any })}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                                      (detailForm.transportType || "car") === tr.id
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                                    }`}
                                  >
                                    <tr.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase">{tr.label}</span>
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{t("transport_hint")}</p>
                              
                              {/* Transport Details (Train/Plane) */}
                              <AnimatePresence>
                                {["train", "plane"].includes(detailForm.transportType || "") && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 mt-3 overflow-hidden">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("transport_details")}</p>
                                    <input
                                      className="input-soft text-sm"
                                      placeholder={t("transport_details_placeholder")}
                                      value={detailForm.transportDetails || ""}
                                      onChange={(e) => setDetailForm({ ...detailForm, transportDetails: e.target.value })}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Enfants (Injected from Speaker but editable for the visit) */}
                            <div className="space-y-4 pt-2 border-t border-border mt-4">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">👶 {t("children")}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("children_count")}</p>
                                  <div className="flex gap-1.5">
                                    {[0, 1, 2, 3, 4].map((n) => (
                                      <button
                                        key={n}
                                        onClick={() => setDetailForm({ ...detailForm, childrenCount: n })}
                                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                          (detailForm.childrenCount ?? 0) === n
                                            ? "bg-amber-500 text-white shadow-md"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {n === 4 ? "4+" : n}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("children_ages")}</p>
                                  <input
                                    className="input-soft text-sm"
                                    placeholder={t("children_ages_placeholder")}
                                    value={detailForm.childrenAges || ""}
                                    onChange={(e) => setDetailForm({ ...detailForm, childrenAges: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("dietary_allergies")}</p>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_label")}</p><input className="input-soft text-sm" placeholder={t("speaker_allergies_placeholder")} value={detailForm.speakerDietary || ""} onChange={(e) => setDetailForm({ ...detailForm, speakerDietary: e.target.value })} /></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("spouse_label")}</p><input className="input-soft text-sm" placeholder={t("spouse_allergies_placeholder")} value={detailForm.spouseDietary || ""} onChange={(e) => setDetailForm({ ...detailForm, spouseDietary: e.target.value })} /></div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("visit_notes")}</p>
                            <textarea className="input-soft text-sm min-h-[80px] resize-y w-full" placeholder={t("add_notes_placeholder")} value={detailForm.notes || ""} onChange={(e) => setDetailForm({ ...detailForm, notes: e.target.value })} />
                            <p className="text-[10px] text-muted-foreground">{t("visit_notes_hint")}</p>
                          </div>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={saveDetail} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest">{t("save")}</motion.button>
                        </motion.div>
                      )}

                      {/* ---- HOSTS TAB ---- */}
                      {detailTab === "hosts" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          {/* Orange banner */}
                          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{t("reception_logistics")}</p>
                                <p className="text-2xl font-black mt-1">{hostCount} {t("hosts")}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1">{t("hebergement")} · {t("transport")} · {t("repas")}</p>
                              </div>
                              <button onClick={() => setShowAssignHost(true)} className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/30 transition-colors">
                                + {t("assign")}
                              </button>
                            </div>
                          </div>

                          {/* Group meal */}
                          <div className="premium-card p-4 space-y-3 border-2 border-dashed border-amber-300/30">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">{t("group_meal")}</p>
                            <p className="text-sm text-muted-foreground">{t("group_meal_desc")}</p>
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                              <button onClick={() => {
                                const newAssignment: HostAssignment = {
                                  hostName: "Repas Salle du Royaume", role: "repas",
                                  day: detailForm.visitDate || "", time: "12:00", origin: "kingdom_hall",
                                };
                                setDetailForm({ ...detailForm, groupMealType: "salle_du_royaume", hostAssignments: [...(detailForm.hostAssignments || []), newAssignment] });
                              }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${detailForm.groupMealType === "salle_du_royaume" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-border"}`}>
                                <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div className="text-left"><p className="text-sm font-bold text-foreground">{t("kingdom_hall")}</p><p className="text-[10px] text-muted-foreground line-clamp-1">{t("meal_kingdom_hall_desc")}</p></div>
                              </button>
                              <button onClick={() => {
                                const newAssignment: HostAssignment = {
                                  hostName: "Repas Restaurant", role: "repas",
                                  day: detailForm.visitDate || "", time: "12:00", origin: "restaurant",
                                };
                                setDetailForm({ ...detailForm, groupMealType: "restaurant", hostAssignments: [...(detailForm.hostAssignments || []), newAssignment] });
                              }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${detailForm.groupMealType === "restaurant" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-border"}`}>
                                <Utensils className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div className="text-left"><p className="text-sm font-bold text-foreground">{t("meal_restaurant")}</p><p className="text-[10px] text-muted-foreground line-clamp-1">{t("meal_restaurant_desc")}</p></div>
                              </button>
                            </div>
                          </div>

                          {/* Host cards — sorted by date */}
                          {[...(detailForm.hostAssignments || [])].sort((a, b) => {
                            const da = a.day ? new Date(a.day).getTime() : 0;
                            const db = b.day ? new Date(b.day).getTime() : 0;
                            if (da !== db) return da - db;
                            return (a.time || "").localeCompare(b.time || "");
                          }).map((ha, idx) => {
                            // Find original index for editing
                            const origIdx = (detailForm.hostAssignments || []).indexOf(ha);
                            const resolvedPhoto = ha.hostPhotoUrl || (ha.hostId ? allHosts.find((h) => h.id === ha.hostId)?.photoUrl : undefined);
                            const isEditing = editingHostIdx === origIdx;
                            const formattedDay = ha.day ? new Date(ha.day + "T00:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) : "";
                            return (
                            <div key={origIdx} className="premium-card p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                {resolvedPhoto ? (
                                  <img src={resolvedPhoto} alt={ha.hostName || ""} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                ) : ha.origin === "kingdom_hall" ? (
                                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-amber-600" /></div>
                                ) : ha.origin === "restaurant" ? (
                                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0"><Utensils className="w-5 h-5 text-orange-600" /></div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <Home className="w-6 h-6 text-muted-foreground/30" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-foreground uppercase">{ha.hostName}</p>
                                  {!isEditing && (
                                    <>
                                      <p className={`text-[10px] font-bold uppercase tracking-widest ${roleColor(ha.role)}`}>{t(ha.role)}</p>
                                      {formattedDay && <p className="text-[10px] text-muted-foreground capitalize">{formattedDay} {ha.time && `· ${ha.time}`}</p>}
                                      {ha.hostPhone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {ha.hostPhone}</p>}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setEditingHostIdx(isEditing ? null : origIdx)} className={`p-1.5 rounded-lg transition-colors ${isEditing ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                                    {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4 text-muted-foreground" />}
                                  </button>
                                  {!isEditing && ha.hostPhone && (
                                    <>
                                      <button onClick={() => sendWhatsApp(ha.hostPhone!, "")} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors" title="Envoyer WhatsApp"><MessageSquare className="w-4 h-4 text-emerald-600" /></button>
                                      <a href={`tel:${ha.hostPhone}`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Appeler"><Phone className="w-4 h-4 text-primary" /></a>
                                    </>
                                  )}
                                  <button onClick={() => removeHostAssignment(origIdx)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Retirer"><X className="w-4 h-4 text-muted-foreground" /></button>
                                </div>
                              </div>
                              {isEditing && (
                                <div className="space-y-2 pt-1">
                                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("role")}</label>
                                      <select className="input-soft text-sm" value={ha.role} onChange={(e) => updateHostAssignment(origIdx, "role", e.target.value)} title={t("role")}>
                                        <option value="hebergement">{t("hebergement")}</option>
                                        <option value="transport">{t("transport")}</option>
                                        <option value="repas">{t("repas")}</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("date")}</label>
                                      <input type="date" className="input-soft text-sm" value={ha.day || ""} onChange={(e) => updateHostAssignment(origIdx, "day", e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("date")} />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("time")}</label>
                                      <input type="time" className="input-soft text-sm" value={ha.time || ""} onChange={(e) => updateHostAssignment(origIdx, "time", e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("time")} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Origine</label>
                                    <select className="input-soft text-sm" value={ha.origin || "host"} onChange={(e) => updateHostAssignment(origIdx, "origin", e.target.value)} title="Origine">
                                      <option value="host">{t("hosts")}</option>
                                      <option value="kingdom_hall">Salle du Royaume</option>
                                      <option value="restaurant">Restaurant</option>
                                    </select>
                                  </div>
                                  {(ha.origin === "restaurant") && (
                                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nom restaurant</label>
                                        <input type="text" className="input-soft text-sm" placeholder="Ex: La Brasserie" value={ha.hostName || ""} onChange={(e) => updateHostAssignment(origIdx, "hostName", e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Adresse</label>
                                        <input type="text" className="input-soft text-sm" placeholder="Adresse du restaurant" value={ha.hostAddress || ""} onChange={(e) => updateHostAssignment(origIdx, "hostAddress", e.target.value)} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {!isEditing && ha.hostAddress && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Home className="w-3.5 h-3.5 flex-shrink-0" /> {ha.hostAddress}</p>}
                            </div>
                          )})}



                          {hostCount === 0 && (
                            <div className="text-center py-6 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">{t("no_hosts_assigned")}</p></div>
                          )}

                          {/* Assign host form */}
                          <AnimatePresence>
                            {showAssignHost && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="premium-card p-4 space-y-3 overflow-hidden">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("assign_host")}</p>
                                <select className="input-soft text-sm" value={assignHostId} onChange={(e) => setAssignHostId(e.target.value)} title={t("select_host")}>
                                  <option value="">{t("select_host")}</option>
                                  {allHosts.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
                                </select>
                                <select className="input-soft text-sm" value={assignRole} onChange={(e) => setAssignRole(e.target.value as HostAssignment["role"])} title={t("role")}>
                                  <option value="hebergement">{t("hebergement")}</option>
                                  <option value="transport">{t("transport")}</option>
                                  <option value="repas">{t("repas")}</option>
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                  <input className="input-soft text-sm" type="date" placeholder={t("day")} value={assignDay} onChange={(e) => setAssignDay(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
                                  <input className="input-soft text-sm" type="time" placeholder={t("time")} value={assignTime} onChange={(e) => setAssignTime(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} />
                                </div>
                                
                                {/* Capacity Warning */}
                                {assignRole === "hebergement" && assignHostId && (
                                  (() => {
                                    const selectedHost = allHosts.find(h => h.id === assignHostId);
                                    if (selectedHost?.capacity && selectedHost.capacity < totalPeople) {
                                      return (
                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                          <p className="text-[10px] font-bold leading-tight">
                                            Capacité insuffisante : L'hôte peut accueillir {selectedHost.capacity} personnes, mais la visite compte {totalPeople} personnes.
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()
                                )}

                                <div className="flex gap-2">
                                  <button onClick={addHostAssignment} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{t("add")}</button>
                                  <button onClick={() => setShowAssignHost(false)} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <motion.button whileTap={{ scale: 0.97 }} onClick={saveDetail} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest">{t("save")}</motion.button>
                        </motion.div>
                      )}

                      {/* ---- MESSAGES TAB ---- */}
                      {detailTab === "messages" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                          {/* Call button */}
                          {detailForm.speakerPhone && (
                            <div className="flex justify-end">
                              <a href={`tel:${detailForm.speakerPhone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors">
                                <Phone className="w-4 h-4" /> {t("call")}
                              </a>
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground">{t("no_message_sent")}</p>

                          {/* Composer */}
                          <div className="premium-card p-4 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("compose")}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {t("recipients")}</p>
                            <div className="flex flex-wrap gap-2">
                              {getRecipients().map((r, i) => (
                                <button key={i} onClick={() => { setSelectedRecipient(r.type); }}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    selectedRecipient === r.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                  }`}>
                                  {r.label}
                                </button>
                              ))}
                            </div>
                            {(() => {
                              const recipient = getSelectedRecipient();
                              return (
                                <p className="text-[10px] text-muted-foreground">
                                  {recipient ? `${recipient.label} · ${recipient.phone}` : viewVisit.nom}
                                </p>
                              );
                            })()}
                            <textarea ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(80, el.scrollHeight) + "px"; } }} className="input-soft text-sm min-h-[80px] max-h-[60vh] resize-y w-full" placeholder={t("write_message")} value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => copyText(messageText)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors">
                                <Copy className="w-3.5 h-3.5" /> {t("copy")}
                              </button>
                              <button onClick={() => { const recipient = getSelectedRecipient(); const phone = recipient?.phone || detailForm.speakerPhone || ""; if (phone) sendWhatsApp(phone, messageText); }}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                <Send className="w-3.5 h-3.5" /> {t("send_whatsapp")}
                              </button>
                            </div>
                          </div>

                          {/* Templates organized by Progress Steps */}
                          <div className="space-y-6 pt-4 border-t border-border mt-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Chronologie des messages</h3>
                              <select className="input-soft text-xs w-28" value={templateLang} onChange={(e) => setTemplateLang(e.target.value as "fr" | "cv" | "pt")} title="Langue">
                                <option value="fr">FR Français</option>
                                <option value="cv">CV Kriolu</option>
                                <option value="pt">PT Português</option>
                              </select>
                            </div>

                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                              {(detailForm.locationType === "zoom" || detailForm.locationType === "streaming"
                                ? [
                                    { step: 1, color: "bg-blue-500", label: "Étape 1 : Planification", keys: ["confirmation_speaker_online"] },
                                    { step: 2, color: "bg-primary", label: "Étape 2 : Briefing Final", keys: ["preparation_speaker_online"] },
                                    { step: 3, color: "bg-emerald-500", label: "Étape 3 : Après-Visite", keys: ["thanks_speaker_online"] },
                                  ]
                                : [
                                    { step: 1, color: "bg-blue-500", label: "Étape 1 : Lancement & Recherche", keys: ["confirmation_speaker", "volunteers_group"] },
                                    { step: 2, color: "bg-amber-500", label: "Étape 2 : Confirmation des Hôtes", keys: ["logistique_host"] },
                                    { step: 3, color: "bg-primary", label: "Étape 3 : Coordination & Rappel", keys: ["preparation_speaker", "preparation_group"] },
                                    { step: 4, color: "bg-emerald-500", label: "Étape 4 : Après-Visite", keys: ["thanks_speaker"] },
                                  ]
                              ).map((group) => (
                                <div key={group.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card ${group.color} text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                                    {group.step}
                                  </div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold text-foreground">{group.label}</h4>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {group.keys.map((key) => {
                                        const templates = messageTemplates[key];
                                        if (!templates) return null;
                                        const lang = templateLang as "fr" | "cv" | "pt";
                                        const tmpl = templates[lang] || templates.fr;
                                        if (typeof tmpl === "string") return null;

                                        const categoryLabel = templates.category === "speaker" ? "🎤 Orateur"
                                          : templates.category === "logistique" ? "⚙️ Hôte – Logistique"
                                          : "👥 Groupe";

                                        return (
                                          <div key={key} className="bg-muted/30 rounded-xl p-3 border border-border/50 hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                              <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">{categoryLabel}</p>
                                                <p className="text-sm font-bold text-foreground leading-tight">{tmpl.title}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{tmpl.desc}</p>
                                              </div>
                                              <button onClick={() => {
                                                const resolved = resolveVariables(tmpl.body);
                                                setMessageText(resolved);
                                                if (templates.category === "speaker") setSelectedRecipient("orateur");
                                                else if (templates.category === "logistique") {
                                                  const idx = (detailForm.hostAssignments || []).findIndex((ha) => ha.role === "repas" || ha.role === "transport" || ha.role === "hebergement");
                                                  setSelectedRecipient(idx >= 0 ? `host_${idx}` : "groupe");
                                                } else if (templates.category === "groupe") setSelectedRecipient("groupe");
                                                setTimeout(() => { const ta = document.querySelector('textarea[placeholder]'); if (ta) ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
                                              }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shrink-0 hover:scale-105 active:scale-95 transition-transform">
                                                Insérer
                                              </button>
                                            </div>
                                            <p className="text-[10px] text-foreground/70 whitespace-pre-line line-clamp-3 italic">"{resolveVariables(tmpl.body)}"</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ---- EXPENSES TAB ---- */}
                      {detailTab === "expenses" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                          {/* Total banner */}
                          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/80">{t("total_expenses")}</p>
                            <p className="text-3xl font-black mt-1">{totalExpenses.toFixed(2)} €</p>
                          </div>

                          {/* Expense list by category */}
                          {(() => {
                            const categories = ["carburant", "peage", "parking", "transport_commun", "restaurant", "hebergement", "autre"];
                            const categoryLabels: Record<string, string> = {
                              carburant: "⛽ Carburant", peage: "🛣️ Péage", parking: "🅿️ Parking",
                              transport_commun: "🚆 Transport en commun", restaurant: "🍽️ Restaurant",
                              hebergement: "🏠 Hébergement", autre: "📋 Autres frais"
                            };
                            const expenses = detailForm.expenses || [];
                            const grouped = categories.map((cat) => ({
                              cat, label: categoryLabels[cat],
                              items: expenses.filter((e) => e.category === cat),
                            })).filter((g) => g.items.length > 0);
                            // Uncategorized
                            const uncategorized = expenses.filter((e) => !e.category || !categories.includes(e.category));
                            if (uncategorized.length > 0) grouped.push({ cat: "non_classe", label: "📋 Non classé", items: uncategorized });

                            return grouped.map((g) => (
                              <div key={g.cat} className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{g.label}</p>
                                {g.items.map((exp) => (
                                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                                    <span className="text-sm font-bold text-foreground">{exp.label}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-black text-foreground">{exp.amount.toFixed(2)} €</span>
                                      <button onClick={() => removeExpense(exp.id)} className="p-1 hover:text-destructive transition-colors" title="Supprimer"><X className="w-4 h-4" /></button>
                                    </div>
                                  </div>
                                ))}
                                <p className="text-xs text-right text-muted-foreground font-bold">Sous-total : {g.items.reduce((s, e) => s + e.amount, 0).toFixed(2)} €</p>
                              </div>
                            ));
                          })()}

                          {(detailForm.expenses || []).length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">Aucune dépense enregistrée</p>
                          )}

                          {/* Add expense with category */}
                          <div className="border-2 border-dashed border-border rounded-2xl p-4 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Nouvelle dépense (H-8)</p>
                            <select className="input-soft text-sm" value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} title="Catégorie">
                              <option value="carburant">⛽ Carburant</option>
                              <option value="peage">🛣️ Péage</option>
                              <option value="parking">🅿️ Parking</option>
                              <option value="transport_commun">🚆 Transport en commun</option>
                              <option value="restaurant">🍽️ Restaurant</option>
                              <option value="hebergement">🏠 Hébergement</option>
                              <option value="autre">📋 Autres frais</option>
                            </select>
                            <div className="grid grid-cols-3 gap-2">
                              <input className="input-soft text-sm col-span-2" placeholder={t("expense_label")} value={newExpenseLabel} onChange={(e) => setNewExpenseLabel(e.target.value)} />
                              <input className="input-soft text-sm" type="number" step="0.01" placeholder="0.00 €" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} />
                            </div>
                            <button onClick={addExpense} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground uppercase tracking-widest hover:border-primary hover:text-primary transition-colors">
                              + {t("add_expense")}
                            </button>
                          </div>

                          <motion.button whileTap={{ scale: 0.97 }} onClick={saveDetail} className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest">{t("save")}</motion.button>
                        </motion.div>
                      )}

                      {/* ---- FEEDBACK TAB ---- */}
                      {detailTab === "feedback" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                          {/* Rating */}
                          <div className="rounded-2xl bg-muted/50 p-5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("talk_quality")}</p>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <button key={n} onClick={() => setDetailForm({ ...detailForm, feedbackRating: n })} className="transition-transform hover:scale-110" title={`Note ${n}`}>
                                  <Star className={`w-8 h-8 ${(detailForm.feedbackRating || 0) >= n ? "text-amber-400" : "text-muted-foreground/30"}`}
                                    fill={(detailForm.feedbackRating || 0) >= n ? "currentColor" : "none"} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("comments_followup")}</p>
                            <textarea className="input-soft text-sm min-h-[120px] resize-y w-full" placeholder={t("feedback_visit_placeholder")} value={detailForm.feedback || ""} onChange={(e) => setDetailForm({ ...detailForm, feedback: e.target.value })} />
                          </div>

                          <motion.button whileTap={{ scale: 0.97 }} onClick={saveDetail} className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <Send className="w-4 h-4" /> {t("save_feedback")}
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetForm}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t("add_visit")}</h3>
              <input className="input-soft text-sm" placeholder={t("speaker_name")} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              <input className="input-soft text-sm" placeholder={t("congregation")} value={form.congregation} onChange={(e) => setForm({ ...form, congregation: e.target.value })} />
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("visit_date")}</label><input className="input-soft text-sm" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("visit_date")} /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("time")}</label><input className="input-soft text-sm" type="time" value={form.heure_visite} onChange={(e) => setForm({ ...form, heure_visite: e.target.value })} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} title={t("time")} /></div>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <input className="input-soft text-sm" placeholder={t("talk_number")} value={form.talkNoOrType} onChange={(e) => setForm({ ...form, talkNoOrType: e.target.value })} />
                <input className="input-soft text-sm" placeholder={t("talk_theme")} value={form.talkTheme} onChange={(e) => setForm({ ...form, talkTheme: e.target.value })} />
              </div>
              <input className="input-soft text-sm" placeholder={t("phone")} value={form.speakerPhone} onChange={(e) => setForm({ ...form, speakerPhone: e.target.value })} />
              <select className="input-soft text-sm" value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value as Visit["locationType"] })} title={t("location")}>
                <option value="kingdom_hall">{t("kingdom_hall")}</option><option value="zoom">Zoom</option><option value="streaming">Streaming</option><option value="other">{t("other")}</option>
              </select>
              <textarea className="input-soft text-sm min-h-[60px] resize-none" placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">{t("add")}</motion.button>
                <button onClick={resetForm} className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6 text-destructive" /></div>
              <p className="text-sm font-bold text-foreground">{t("confirm_delete_visit")}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">{t("yes_delete")}</button>
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">{t("cancel")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}