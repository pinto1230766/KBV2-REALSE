import { useState, useMemo } from "react";
import {
  Plus, Trash2, Check, ChevronRight, Clock, MapPin, Archive, AlertTriangle,
  X, Info, Users, MessageSquare, CreditCard, Star, Phone, Mail, Send,
  Copy, Home, Utensils, Car, Building2, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisitStore } from "../store/useVisitStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import type { Visit, VisitStatus, HostAssignment, Expense, GroupMealType } from "../store/visitTypes";

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

type DetailTab = "infos" | "hosts" | "messages" | "expenses" | "feedback";

// Message templates organized by category and recipient
const messageTemplates = {
  // ─── ORATEURS ───
  confirmation_speaker: {
    category: "speaker",
    fr: {
      title: "Confirmation – Orateur",
      desc: "Premier contact pour confirmer la visite",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nJe suis {ton_nom}, responsable de l'accueil au sein du Groupe Kabuverdianu de Lyon. 🙏\n\nC'est un grand plaisir de vous inviter pour une visite et un discours le {jour_semaine} {date_visite}, à {heure_visite} (Salle du Royaume de Lyon).\n\nMerci de me confirmer les points suivants :\n• ✅ Pouvez-vous venir à cette date et heure ?\n• 🏠 Avez-vous besoin d'un hébergement ?\n• 🍽️ Avez-vous des allergies alimentaires à nous signaler (vous + vos accompagnants) ?\n• 🚗 Avez-vous besoin d'un transport depuis la gare ou l'aéroport ?\n\nMerci de répondre dès que possible pour notre organisation.\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Konfirmaçon – Orador",
      desc: "Primer kontaktu pa konfirmá vizita",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nMi é {ton_nom}, enkaregadu di resebe vizitantis na Grupu Kabuverdianu di Lyon. 🙏\n\nN ten un grandi prazer di pâpia ku bo pa konvida-u pa faze-nu un vizita i faze un diskursu na {jour_semaine} {date_visite}, na {heure_visite} (Salon di Reinu di Lyon).\n\nFavor, konfirma-m es kuzas li:\n• ✅ Bu pode ben na es data i óra?\n• 🏠 Bu meste di un lugar pa fika (alojamentu)?\n• 🍽️ Algum alerjia di kumida ki nu debe sabe (bo + bus akonpanhantis)?\n• 🚗 Bu meste di transportu ki ta sai di stason ô aeroportu?\n\nFavor responde-m u más rápidu posível pa nu organiza dretu.\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Confirmação – Orador",
      desc: "Primeiro contacto para confirmar a visita",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nSou {ton_nom}, responsável pelo acolhimento no Grupo Cabo-verdiano de Lyon. 🙏\n\nÉ um grande prazer convidá-lo para uma visita e um discurso no {jour_semaine} {date_visite}, às {heure_visite} (Salão do Reino de Lyon).\n\nPor favor, confirme os seguintes pontos:\n• ✅ Pode vir nesta data e hora?\n• 🏠 Precisa de alojamento?\n• 🍽️ Tem alergias alimentares (você + acompanhantes)?\n• 🚗 Precisa de transporte desde a estação ou aeroporto?\n\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
    },
  },
  preparation_speaker: {
    category: "speaker",
    fr: {
      title: "Préparation – Orateur",
      desc: "Détails complets de l'organisation",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nMerci pour votre confirmation ! Voici le plan de votre séjour :\n\n📅 Dates et heures\n• Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n• Réunion : {jour_visite} {date_visite} à {heure_visite}\n• Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\n🏠 Hébergement\n{hebergement_details}\n\n🍽️ Repas\n{repas_details}\n\n🚗 Transport\n{transport_details}\n\n{accompagnants_details}\n\nSi vous avez la moindre question, je reste disponible au {mon_tel}.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Preparason – Orador",
      desc: "Detalhes kompletu di organizason",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nObrigadu pa bu konfirmason! Li sta o planu di bu estadia:\n\n📅 Datas i óras\n• Txegada: {jour_arrivee} {date_arrivee} (volta di {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta di {heure_depart})\n\n🏠 Alojamentu\n{hebergement_details}\n\n🍽️ Kumida\n{repas_details}\n\n🚗 Transportu\n{transport_details}\n\n{accompagnants_details}\n\nSi bu ten kualker pergunta,\nN sta disponível na {mon_tel}.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Preparação – Orador",
      desc: "Detalhes completos de organização",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nObrigado pela sua confirmação! Aqui está o plano da sua estadia:\n\n📅 Datas e horas\n• Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n• Reunião: {jour_visite} {date_visite} às {heure_visite}\n• Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\n🏠 Alojamento\n{hebergement_details}\n\n🍽️ Refeições\n{repas_details}\n\n🚗 Transporte\n{transport_details}\n\n{accompagnants_details}\n\nFraternalmente,\n{ton_nom}`,
    },
  },
  thanks_speaker: {
    category: "speaker",
    fr: {
      title: "Remerciements – Orateur",
      desc: "Message après la visite",
      body: `Bonjour Frère {prenom_orateur},\n\nJe vous remercie sincèrement pour votre présence et votre discours qui nous a tous fortifiés ! 🙏✨\nCe fut un grand plaisir de vous accueillir au sein du Groupe Kabuverdianu de Lyon.\n\nNous espérons vous revoir bientôt. Que Jéhovah continue de vous donner des forces pour le servir.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Agradecementu – Orador",
      desc: "Mensajen pós-vizita",
      body: `Bon dia Irmãu {prenom_orateur},\n\nNha sinseru obrigadu pa bu presensa y pa diskursu ki fortifika nos tudu! 🙏✨\nFoi un grandi prazeri akolhe bu na Grupu Kabuverdianu di Lyon.\n\nNu ta spera torna odja bu brebe. Ma Jeová kontinia da bu forsa na servi.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador",
      desc: "Mensagem pós-visita",
      body: `Bom dia Irmão {prenom_orateur},\n\nO nosso sincero obrigado pela sua presença e pelo discurso que fortaleceu todos nós! 🙏✨\nFoi um grande prazer recebê-lo no Grupo Cabo-verdiano de Lyon.\n\nEsperamos vê-lo em breve. Que Jeová continue a dar-lhe forças.\n\nFraternalmente,\n{ton_nom}`,
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
      body: `Bon dia Irmãu {prenom_orateur},\n\nObrigadu di korason pa diskursu partilhadu via {visit_channel_label}! 🙏💻\nAnsim-mesmu na distansia, bo mensajen deu forsa pa congregason interu.\n\nNu ta spera oportunidade pa odja bu presensialmenti. Ma Jeová kontinia abensoa bo ministériu.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador (Zoom/Streaming)",
      desc: "Mensagem pós-visita online",
      body: `Bom dia Irmão {prenom_orateur},\n\nObrigado de coração pelo discurso partilhado via {visit_channel_label}! 🙏💻\nMesmo à distância, a sua mensagem deu força a toda a congregação.\n\nFraternalmente,\n{ton_nom}`,
    },
  },
  // ─── HÔTES ───
  repas_host: {
    category: "repas",
    fr: {
      title: "Repas – Détails",
      desc: "Message pour le responsable du repas",
      body: `Bonjour {prenom_responsable_repas},\n\nVoici les informations pour le repas de {prenom_orateur} {nom_orateur} :\n\n📅 Date : {date_repas} ({jour_repas})\n⏰ Heure : {heure_repas}\n🏠 Lieu : {adresse_repas}\n\n⚠️ Allergies : {details_allergies}\n👥 Accompagnants : {nb_accompagnants}\n\nMerci pour ton aide ! Fraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Kumida – Detalhes",
      desc: "Mensajen pa responsabel pa kumida",
      body: `Bon dia {prenom_responsable_repas},\n\nLi sta kel informason pa kumida di {prenom_orateur} {nom_orateur}:\n\n📅 Data: {date_repas} ({jour_repas})\n⏰ Óra: {heure_repas}\n🏠 Lugar: {adresse_repas}\n\n⚠️ Alerjia: {details_allergies}\n👥 Akonpanhantis: {nb_accompagnants}\n\nObrigadu pa bu juda! Fraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Refeição – Detalhes",
      desc: "Mensagem para o responsável da refeição",
      body: `Bom dia {prenom_responsable_repas},\n\nAqui estão as informações para a refeição de {prenom_orateur} {nom_orateur}:\n\n📅 Data: {date_repas} ({jour_repas})\n⏰ Hora: {heure_repas}\n🏠 Local: {adresse_repas}\n\n⚠️ Alergias: {details_allergies}\n👥 Acompanhantes: {nb_accompagnants}\n\nObrigado pela ajuda! Fraternalmente,\n{ton_nom}`,
    },
  },
  transport_host: {
    category: "transport",
    fr: {
      title: "Transport – Détails",
      desc: "Message pour le chauffeur",
      body: `Bonjour {prenom_chauffeur},\n\nVoici les informations pour le transport de {prenom_orateur} {nom_orateur} :\n\n📅 Date : {date_transport}\n⏰ Heure : {heure_transport}\n📍 De : {lieu_depart} ➡️ Vers : {lieu_arrivee}\n\nMerci pour ta disponibilité ! Fraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Transporti – Detalhes",
      desc: "Mensajen pa motorista",
      body: `Bon dia {prenom_chauffeur},\n\nLi sta kel informason pa transporti di {prenom_orateur} {nom_orateur}:\n\n📅 Data: {date_transport}\n⏰ Óra: {heure_transport}\n📍 Di: {lieu_depart} ➡️ Pa: {lieu_arrivee}\n\nObrigadu pa bu disponiblidi! Fraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Transporte – Detalhes",
      desc: "Mensagem para o motorista",
      body: `Bom dia {prenom_chauffeur},\n\nAqui estão as informações para o transporte de {prenom_orateur} {nom_orateur}:\n\n📅 Data: {date_transport}\n⏰ Hora: {heure_transport}\n📍 De: {lieu_depart} ➡️ Para: {lieu_arrivee}\n\nObrigado pela disponibilidade! Fraternalmente,\n{ton_nom}`,
    },
  },
  // ─── GROUPES ───
  volunteers_group: {
    category: "groupe",
    fr: {
      title: "Recherche de volontaires",
      desc: "Message pour le groupe des hôtes",
      body: `Bonjour à tous ! 👋\n\nJe recherche des VOLONTAIRES pour recevoir notre prochain orateur :\n\n🎤 Orateur : Frère {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n📅 Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n📅 Réunion : {jour_visite} {date_visite} à {heure_visite}\n📅 Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\nNous avons besoin de :\n• 🏠 Hébergement (logement + petit-déjeuner)\n• 🍽️ Repas (déjeuner / dîner)\n• 🚗 Transport (gare / aéroport ⇄ Salle du Royaume)\n\n⚠️ Allergies : {details_allergies}\n👥 Accompagnants : {nb_accompagnants}\n\nSi vous pouvez aider, merci de me répondre dès que possible.\n\nMerci de tout cœur,\n{ton_nom}`,
    },
    cv: {
      title: "Buska voluntarius",
      desc: "Mensajen pa grupo di anfitrioens",
      body: `Bon dia famía! 👋\n\nPlanifikason pa vizita di {prenom_orateur} {nom_orateur}:\n\n📅 Datas/Oras\n• Txegada: {jour_arrivee} {date_arrivee} (volta {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta {heure_depart})\n\n🏠 Alojamentu\n{hebergement_planning}\n\n🍽️ Kumida\n{repas_planning}\n\n🚗 Transporti\n{transport_planning}\n\n{accompagnants_details}\n\nObrigadu pa kada voluntáriu pa bo disposti! 🙏✨`,
    },
    pt: {
      title: "Procura de voluntários",
      desc: "Mensagem para o grupo de anfitriões",
      body: `Bom dia a todos! 👋\n\nProcuro VOLUNTÁRIOS para receber o nosso próximo orador:\n\n🎤 Orador: Irmão {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n📅 Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n📅 Reunião: {jour_visite} {date_visite} às {heure_visite}\n📅 Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\nPrecisamos de:\n• 🏠 Alojamento\n• 🍽️ Refeições\n• 🚗 Transporte\n\nObrigado de coração,\n{ton_nom}`,
    },
  },
  preparation_group: {
    category: "groupe",
    fr: {
      title: "Préparation – Groupe des Hôtes",
      desc: "Brief complet pour tous les volontaires",
      body: `Bonjour la famille ! 👋\n\nVoici l'organisation pour la visite de {prenom_orateur} {nom_orateur} :\n\n📅 Dates/Heures\n• Arrivée : {jour_arrivee} {date_arrivee} (vers {heure_arrivee})\n• Réunion : {jour_visite} {date_visite} à {heure_visite}\n• Départ : {jour_depart} {date_depart} (vers {heure_depart})\n\n⚠️ Allergies : {details_allergies}\n\n🏠 Hébergement\n{hebergement_planning}\n\n🍽️ Repas\n{repas_planning}\n\n🚗 Transport\n{transport_planning}\n\n{accompagnants_details}\n\nMerci à chaque volontaire pour votre aide précieuse ! 🙏✨`,
    },
    cv: {
      title: "Preparason – Grupo di Anfitriãus",
      desc: "Brief kompletu pa tudu voluntáriu",
      body: `Bon dia famía! 👋\n\nPlanifikason pa vizita di {prenom_orateur} {nom_orateur}:\n\n📅 Datas/Oras\n• Txegada: {jour_arrivee} {date_arrivee} (volta {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta {heure_depart})\n\n⚠️ Alerjia: {details_allergies}\n\n🏠 Alojamentu\n{hebergement_planning}\n\n🍽️ Kumida\n{repas_planning}\n\n🚗 Transporti\n{transport_planning}\n\n{accompagnants_details}\n\nObrigadu pa kada voluntáriu pa bo disposti! 🙏✨`,
    },
    pt: {
      title: "Preparação – Grupo de Anfitriões",
      desc: "Brief completo para todos os voluntários",
      body: `Bom dia família! 👋\n\nAqui está a organização para a visita de {prenom_orateur} {nom_orateur}:\n\n📅 Datas/Horas\n• Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n• Reunião: {jour_visite} {date_visite} às {heure_visite}\n• Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\n⚠️ Alergias: {details_allergies}\n\n🏠 Alojamento\n{hebergement_planning}\n\n🍽️ Refeições\n{repas_planning}\n\n🚗 Transporte\n{transport_planning}\n\n{accompagnants_details}\n\nObrigado a cada voluntário pela ajuda preciosa! 🙏✨`,
    },
  },
};

type TemplateCategory = "speaker" | "repas" | "transport" | "groupe";


export function PlanningHub() {
  const visits = useVisitStore((s) => s.visits);
  const addVisit = useVisitStore((s) => s.addVisit);
  const updateVisit = useVisitStore((s) => s.updateVisit);
  const deleteVisit = useVisitStore((s) => s.deleteVisit);
  const pendingVisitId = useUIStore((s) => s.pendingVisitId);
  const setPendingVisit = useUIStore((s) => s.setPendingVisit);
  const congregation = useSettingsStore((s) => s.settings.congregation);
  const speakers = useSpeakerStore((s) => s.speakers);
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

  const openDetail = (visit: Visit) => {
    setViewVisit(visit);
    setDetailForm({ ...visit });
    setDetailTab("infos");
    setMessageText("");
    setSelectedRecipient("orateur");
    setTemplateLang(language);
    setShowAssignHost(false);
  };

  const saveDetail = () => {
    if (!viewVisit) return;
    updateVisit(viewVisit.visitId, detailForm);
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
    const expenses = [...(detailForm.expenses || []), { id: generateId(), label: newExpenseLabel, amount: parseFloat(newExpenseAmount) || 0 }];
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
    const newAssignment: HostAssignment = {
      hostId: host.id, hostName: host.nom, hostPhone: host.telephone,
      hostEmail: host.email, hostAddress: host.adresse || host.address,
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
    const cleaned = phone.replace(/\s/g, "");
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  };

  // Get recipients for messages
  const getRecipients = () => {
    const recipients: Array<{ label: string; phone: string; type: string; hostName?: string }> = [];
    if (detailForm.speakerPhone) {
      recipients.push({ label: t("speaker_label"), phone: detailForm.speakerPhone, type: "orateur" });
    }
    (detailForm.hostAssignments || []).forEach((ha) => {
      if (ha.hostPhone) {
        recipients.push({ label: `${ha.hostName || ""} (${t(ha.role)})`, phone: ha.hostPhone, type: ha.role, hostName: ha.hostName });
      }
    });
    if (congregation.whatsappGroup) {
      recipients.push({ label: "👥 " + t("group"), phone: congregation.whatsappGroup, type: "groupe" });
    }
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
        return `${h.hostName || ""}${day ? " – " + day : ""}${time ? " à " + time : ""}${address ? "\n📍 " + address : ""}`;
      }).join("\n");
    };

    // Companions
    const companions = detailForm.companions || [];
    const nbAccompagnants = companions.length;
    const nomsAccompagnants = companions.map((c) => c.nom).join(", ") || "Aucun";
    const accompagnantsDetails = nbAccompagnants > 0
      ? `👥 Accompagnants (${nbAccompagnants}) : ${nomsAccompagnants}`
      : "";

    // Allergies
    const allergiesSpeaker = detailForm.speakerDietary || "Aucune";
    const allergiesSpouse = detailForm.spouseDietary || "";
    const detailsAllergies = allergiesSpouse ? `${allergiesSpeaker} / ${allergiesSpouse}` : allergiesSpeaker;

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
      "{nb_total_personnes}": String(nbAccompagnants + 1),
      "{allergies_orateur}": allergiesSpeaker,
      "{allergies_orateur_et_accompagnants}": detailsAllergies,
      "{details_allergies}": detailsAllergies,
      // Coordinateur
      "{ton_nom}": congregation.responsableName || "___",
      "{mon_tel}": congregation.responsablePhone || "___",
      "{hospitalityOverseer}": congregation.responsableName || "___",
      "{hospitalityOverseerPhone}": congregation.responsablePhone || "___",
      "{ta_tache}": "Responsable hospitalité",
      // Channel
      "{visit_channel_label}": channelLabel || "___",
    };

    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(key, value);
    }
    return result;
  };

  const detailTabs: Array<{ id: DetailTab; label: string; icon: any }> = [
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
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> {t("schedule")}
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
                  className="premium-card p-4 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => openDetail(visit)}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-14 rounded-xl bg-muted flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-primary">{monthShort}</span>
                      <span className="text-lg font-black text-foreground leading-tight">{dayNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate">{visit.nom}</p>
                      {visit.talkTheme && <p className="text-xs text-muted-foreground truncate mt-0.5">{visit.talkTheme}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          visit.status === "confirmed" ? "status-confirmed" : visit.status === "completed" ? "status-completed" : visit.status === "cancelled" ? "status-cancelled" : "status-scheduled"
                        }`}>{t(visit.status)}</span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">{locationLabel(visit.locationType)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {visit.heure_visite || "11:30"}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {visit.congregation}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {visit.status !== "confirmed" && visit.status !== "completed" && (
                        <button onClick={(e) => { e.stopPropagation(); updateVisit(visit.visitId, { status: "confirmed" }); toast.success(t("visit_confirmed")); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(visit.visitId); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-1"><ChevronRight className="w-4 h-4 text-muted-foreground/30" /></div>
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
              className="w-full max-w-3xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-black text-foreground">{viewVisit.nom}</h2>
                          {speaker?.spouseName && <p className="text-sm text-primary font-medium">& {speaker.spouseName}</p>}
                          <p className="text-sm font-medium text-foreground mt-1">{dayLabel}</p>
                          <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                            {detailForm.date_arrivee && <p>{t("arrival")} : {detailForm.date_arrivee} · {detailForm.heure_arrivee || "--:--"}</p>}
                            <p>{t("meeting")} : {viewVisit.visitDate} · {viewVisit.heure_visite || "11:30"}</p>
                            {detailForm.date_depart && <p>{t("departure")} : {detailForm.date_depart} · {detailForm.heure_depart || "--:--"}</p>}
                          </div>
                        </div>
                        <button onClick={closeDetail} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                      </div>
                      <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide border-b border-border pb-0">
                        {detailTabs.map((tab) => (
                          <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-[1px] ${
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
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("visit_details")}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_theme")}</p>
                            <input className="input-soft text-base font-bold" value={detailForm.talkTheme || ""} onChange={(e) => setDetailForm({ ...detailForm, talkTheme: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("talk_number")}</p>
                            <input className="input-soft text-2xl font-black w-32" value={detailForm.talkNoOrType || ""} onChange={(e) => setDetailForm({ ...detailForm, talkNoOrType: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("speaker_phone")}</p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                              <input className="input-soft text-sm" value={detailForm.speakerPhone || ""} onChange={(e) => setDetailForm({ ...detailForm, speakerPhone: e.target.value })} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t("phone_whatsapp_hint")}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("arrival_date")}</p><input className="input-soft text-sm" type="date" value={detailForm.date_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, date_arrivee: e.target.value })} /></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("meeting_date")}</p><input className="input-soft text-sm" type="date" value={detailForm.visitDate || ""} onChange={(e) => setDetailForm({ ...detailForm, visitDate: e.target.value })} /></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("departure_date")}</p><input className="input-soft text-sm" type="date" value={detailForm.date_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, date_depart: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("arrival_time")}</p><input className="input-soft text-sm" type="time" value={detailForm.heure_arrivee || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_arrivee: e.target.value })} /></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("meeting_time")}</p><input className="input-soft text-sm" type="time" value={detailForm.heure_visite || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_visite: e.target.value })} /></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("departure_time")}</p><input className="input-soft text-sm" type="time" value={detailForm.heure_depart || ""} onChange={(e) => setDetailForm({ ...detailForm, heure_depart: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("location")}</p>
                              <select className="input-soft text-sm" value={detailForm.locationType || "kingdom_hall"} onChange={(e) => setDetailForm({ ...detailForm, locationType: e.target.value as Visit["locationType"] })}>
                                <option value="kingdom_hall">{t("in_person")}</option><option value="zoom">Zoom</option><option value="streaming">Streaming</option><option value="other">{t("other")}</option>
                              </select>
                              <p className="text-[10px] text-muted-foreground">{t("location_hint")}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("status")}</p>
                              <select className="input-soft text-sm" value={detailForm.status || "scheduled"} onChange={(e) => setDetailForm({ ...detailForm, status: e.target.value as VisitStatus })}>
                                <option value="scheduled">{t("scheduled")}</option><option value="confirmed">{t("confirmed")}</option><option value="completed">{t("completed")}</option><option value="cancelled">{t("cancelled")}</option>
                              </select>
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
                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => {
                                const newAssignment: HostAssignment = {
                                  hostName: "Repas Salle du Royaume", role: "repas",
                                  day: detailForm.visitDate || "", time: "12:00", origin: "kingdom_hall",
                                };
                                setDetailForm({ ...detailForm, groupMealType: "salle_du_royaume", hostAssignments: [...(detailForm.hostAssignments || []), newAssignment] });
                              }}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${detailForm.groupMealType === "salle_du_royaume" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-border"}`}>
                                <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div className="text-left"><p className="text-sm font-bold text-foreground">{t("kingdom_hall")}</p><p className="text-[10px] text-muted-foreground">{t("meal_kingdom_hall_desc")}</p></div>
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
                                <div className="text-left"><p className="text-sm font-bold text-foreground">{t("meal_restaurant")}</p><p className="text-[10px] text-muted-foreground">{t("meal_restaurant_desc")}</p></div>
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
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-muted-foreground" /></div>
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
                                      <button onClick={() => sendWhatsApp(ha.hostPhone!, "")} className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"><MessageSquare className="w-4 h-4 text-emerald-600" /></button>
                                      <a href={`tel:${ha.hostPhone}`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Phone className="w-4 h-4 text-primary" /></a>
                                    </>
                                  )}
                                  <button onClick={() => removeHostAssignment(origIdx)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
                                </div>
                              </div>
                              {isEditing && (
                                <div className="space-y-2 pt-1">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("role")}</label>
                                      <select className="input-soft text-sm" value={ha.role} onChange={(e) => updateHostAssignment(origIdx, "role", e.target.value)}>
                                        <option value="hebergement">{t("hebergement")}</option>
                                        <option value="transport">{t("transport")}</option>
                                        <option value="repas">{t("repas")}</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("date")}</label>
                                      <input type="date" className="input-soft text-sm" value={ha.day || ""} onChange={(e) => updateHostAssignment(origIdx, "day", e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("time")}</label>
                                      <input type="time" className="input-soft text-sm" value={ha.time || ""} onChange={(e) => updateHostAssignment(origIdx, "time", e.target.value)} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Origine</label>
                                    <select className="input-soft text-sm" value={ha.origin || "host"} onChange={(e) => updateHostAssignment(origIdx, "origin", e.target.value)}>
                                      <option value="host">{t("hosts")}</option>
                                      <option value="kingdom_hall">Salle du Royaume</option>
                                      <option value="restaurant">Restaurant</option>
                                    </select>
                                  </div>
                                  {(ha.origin === "restaurant") && (
                                    <div className="grid grid-cols-2 gap-2">
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
                                <select className="input-soft text-sm" value={assignHostId} onChange={(e) => setAssignHostId(e.target.value)}>
                                  <option value="">{t("select_host")}</option>
                                  {allHosts.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
                                </select>
                                <select className="input-soft text-sm" value={assignRole} onChange={(e) => setAssignRole(e.target.value as HostAssignment["role"])}>
                                  <option value="hebergement">{t("hebergement")}</option>
                                  <option value="transport">{t("transport")}</option>
                                  <option value="repas">{t("repas")}</option>
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                  <input className="input-soft text-sm" placeholder={t("day")} value={assignDay} onChange={(e) => setAssignDay(e.target.value)} />
                                  <input className="input-soft text-sm" type="time" placeholder={t("time")} value={assignTime} onChange={(e) => setAssignTime(e.target.value)} />
                                </div>
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
                            <p className="text-[10px] text-muted-foreground">
                              {viewVisit.nom} · {detailForm.speakerPhone || ""}
                            </p>
                            <textarea ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(80, el.scrollHeight) + "px"; } }} className="input-soft text-sm min-h-[80px] max-h-[60vh] resize-y w-full" placeholder={t("write_message")} value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => copyText(messageText)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors">
                                <Copy className="w-3.5 h-3.5" /> {t("copy")}
                              </button>
                              <button onClick={() => { const phone = detailForm.speakerPhone || ""; if (phone) sendWhatsApp(phone, messageText); }}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                <Send className="w-3.5 h-3.5" /> {t("send_whatsapp")}
                              </button>
                            </div>
                          </div>

                          {/* Templates */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{t("templates_by_step")}</p>
                              <select className="input-soft text-xs w-28" value={templateLang} onChange={(e) => setTemplateLang(e.target.value as any)}>
                                <option value="fr">FR Français</option>
                                <option value="cv">CV Kriolu</option>
                                <option value="pt">PT Português</option>
                              </select>
                            </div>

                            {Object.entries(messageTemplates).map(([key, templates]) => {
                              const lang = templateLang as "fr" | "cv" | "pt";
                              const tmpl = templates[lang] || templates.fr;
                              if (typeof tmpl === "string") return null;
                              const categoryLabel = templates.category === "speaker" ? "🎤 Orateur"
                                : templates.category === "repas" ? "🍽️ Hôte – Repas"
                                : templates.category === "transport" ? "🚗 Hôte – Transport"
                                : "👥 Groupe";
                              return (
                                <div key={key} className="premium-card p-4 space-y-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{categoryLabel}</p>
                                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                                    <p className="text-sm font-bold text-foreground">{tmpl.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{tmpl.desc}</p>
                                    <p className="text-xs text-foreground whitespace-pre-line line-clamp-6">{tmpl.body}</p>
                                  </div>
                                  <button onClick={() => { setMessageText(tmpl.body); setTimeout(() => { const ta = document.querySelector('textarea[placeholder]'); if (ta) ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                                    {t("insert_message")}
                                  </button>
                                </div>
                              );
                            })}
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

                          {/* Expense list */}
                          {(detailForm.expenses || []).map((exp) => (
                            <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                              <span className="text-sm font-bold text-foreground">{exp.label}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-foreground">{exp.amount.toFixed(2)} €</span>
                                <button onClick={() => removeExpense(exp.id)} className="p-1 hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}

                          {/* Add expense */}
                          <div className="border-2 border-dashed border-border rounded-2xl p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <input className="input-soft text-sm col-span-2" placeholder={t("expense_label")} value={newExpenseLabel} onChange={(e) => setNewExpenseLabel(e.target.value)} />
                              <input className="input-soft text-sm" type="number" step="0.01" placeholder="0.00" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} />
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
                                <button key={n} onClick={() => setDetailForm({ ...detailForm, feedbackRating: n })} className="transition-transform hover:scale-110">
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
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("visit_date")}</label><input className="input-soft text-sm" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">{t("time")}</label><input className="input-soft text-sm" type="time" value={form.heure_visite} onChange={(e) => setForm({ ...form, heure_visite: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-soft text-sm" placeholder={t("talk_number")} value={form.talkNoOrType} onChange={(e) => setForm({ ...form, talkNoOrType: e.target.value })} />
                <input className="input-soft text-sm" placeholder={t("talk_theme")} value={form.talkTheme} onChange={(e) => setForm({ ...form, talkTheme: e.target.value })} />
              </div>
              <input className="input-soft text-sm" placeholder={t("phone")} value={form.speakerPhone} onChange={(e) => setForm({ ...form, speakerPhone: e.target.value })} />
              <select className="input-soft text-sm" value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value as Visit["locationType"] })}>
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