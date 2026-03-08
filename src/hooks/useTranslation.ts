import { useSettingsStore } from "../store/useSettingsStore";
import type { Language } from "../store/visitTypes";

interface TranslationEntry {
  fr: string;
  cv: string;
  pt: string;
}

const dictionary: Record<string, TranslationEntry> = {
  // Navigation
  dashboard: { fr: "Tableau de bord", cv: "Painel", pt: "Painel" },
  planning: { fr: "Planning", cv: "Planifikason", pt: "Planeamento" },
  speakers: { fr: "Orateurs", cv: "Irmons", pt: "Oradores" },
  hosts: { fr: "Hôtes", cv: "Anfitrions", pt: "Anfitriões" },
  settings: { fr: "Paramètres", cv: "Configurasons", pt: "Configurações" },

  // Status
  all: { fr: "Tous", cv: "Tudu", pt: "Todos" },
  upcoming: { fr: "À venir", cv: "Ki sta pa bem", pt: "Próximas" },
  confirmed: { fr: "Confirmé", cv: "Confirmadu", pt: "Confirmado" },
  scheduled: { fr: "Planifié", cv: "Planifikadu", pt: "Planeado" },
  completed: { fr: "Terminé", cv: "Terminadu", pt: "Concluído" },
  cancelled: { fr: "Annulé", cv: "Kanseladu", pt: "Cancelado" },

  // Actions
  add: { fr: "Ajouter", cv: "Ajuntâ", pt: "Adicionar" },
  edit: { fr: "Modifier", cv: "Modifikâ", pt: "Editar" },
  delete: { fr: "Supprimer", cv: "Apagâ", pt: "Eliminar" },
  save: { fr: "Enregistrer", cv: "Gravâ", pt: "Guardar" },
  cancel: { fr: "Annuler", cv: "Kanselâ", pt: "Cancelar" },
  confirm: { fr: "Confirmer", cv: "Konfirmâ", pt: "Confirmar" },
  close: { fr: "Fermer", cv: "Fexâ", pt: "Fechar" },
  search: { fr: "Rechercher...", cv: "Buska...", pt: "Pesquisar..." },

  // Visit form
  add_visit: { fr: "Programmer une visite", cv: "Programâ un vizita", pt: "Programar uma visita" },
  edit_visit: { fr: "Modifier la visite", cv: "Modifikâ vizita", pt: "Editar a visita" },
  speaker_name: { fr: "Nom de l'orateur", cv: "Nomi di orador", pt: "Nome do orador" },
  congregation: { fr: "Congrégation", cv: "Kongregason", pt: "Congregação" },
  visit_date: { fr: "Date de visite", cv: "Data di vizita", pt: "Data da visita" },
  talk_number: { fr: "N° discours", cv: "N° diskursu", pt: "N° discurso" },
  talk_theme: { fr: "Thème", cv: "Tema", pt: "Tema" },
  location: { fr: "Lieu", cv: "Lugar", pt: "Local" },
  kingdom_hall: { fr: "Salle du Royaume", cv: "Sala di Reinu", pt: "Salão do Reino" },
  zoom: { fr: "Zoom", cv: "Zoom", pt: "Zoom" },
  streaming: { fr: "Streaming", cv: "Streaming", pt: "Streaming" },
  other: { fr: "Autre", cv: "Otru", pt: "Outro" },
  notes: { fr: "Notes", cv: "Notas", pt: "Notas" },
  phone: { fr: "Téléphone", cv: "Telefoni", pt: "Telefone" },
  email: { fr: "Email", cv: "Email", pt: "Email" },
  address: { fr: "Adresse", cv: "Enderesu", pt: "Endereço" },
  name: { fr: "Nom", cv: "Nomi", pt: "Nome" },
  status: { fr: "Statut", cv: "Statu", pt: "Estado" },

  // Dashboard
  total_visits: { fr: "Total visites", cv: "Total vizitas", pt: "Total visitas" },
  upcoming_visits: { fr: "Visites à venir", cv: "Vizitas ki sta pa bem", pt: "Próximas visitas" },
  total_speakers: { fr: "Orateurs", cv: "Irmons", pt: "Oradores" },
  total_hosts: { fr: "Hôtes", cv: "Anfitrions", pt: "Anfitriões" },
  recent_activity: { fr: "Activité récente", cv: "Atividadi resenti", pt: "Atividade recente" },
  no_visits: { fr: "Aucune visite programmée", cv: "Ninhun vizita programadu", pt: "Nenhuma visita programada" },
  welcome_message: { fr: "Bienvenue dans votre espace de coordination", cv: "Ben-vindu na bo espasu di koordinason", pt: "Bem-vindo ao seu espaço de coordenação" },

  // Settings
  language: { fr: "Langue", cv: "Lingua", pt: "Idioma" },
  dark_mode: { fr: "Mode sombre", cv: "Modu skuru", pt: "Modo escuro" },
  notifications_label: { fr: "Notifications", cv: "Notifikasons", pt: "Notificações" },
  remind_7_days: { fr: "Rappel J-7", cv: "Lembra J-7", pt: "Lembrete D-7" },
  remind_2_days: { fr: "Rappel J-2", cv: "Lembra J-2", pt: "Lembrete D-2" },
  general: { fr: "Général", cv: "Jeral", pt: "Geral" },
  appearance: { fr: "Apparence", cv: "Aparensia", pt: "Aparência" },
  data: { fr: "Données", cv: "Dadus", pt: "Dados" },
  export_data: { fr: "Exporter les données", cv: "Esportâ dadus", pt: "Exportar dados" },
  import_data: { fr: "Importer les données", cv: "Inportâ dadus", pt: "Importar dados" },
  import_success: { fr: "Import réussi", cv: "Inportason susesu", pt: "Importação com sucesso" },
  import_error: { fr: "Erreur lors de l'import", cv: "Eru na inportason", pt: "Erro na importação" },
  export_success: { fr: "Export réussi", cv: "Esportason susesu", pt: "Exportação com sucesso" },

  // Hosts
  add_host: { fr: "Ajouter un hôte", cv: "Ajuntâ un anfitrion", pt: "Adicionar anfitrião" },
  capacity: { fr: "Capacité", cv: "Kapasidadi", pt: "Capacidade" },
  role: { fr: "Rôle", cv: "Papel", pt: "Função" },
  hebergement: { fr: "Hébergement", cv: "Alojamentu", pt: "Alojamento" },
  transport: { fr: "Transport", cv: "Transporti", pt: "Transporte" },
  repas: { fr: "Repas", cv: "Kumida", pt: "Refeição" },

  // Speakers
  add_speaker: { fr: "Ajouter un orateur", cv: "Ajuntâ un orador", pt: "Adicionar orador" },

  // Calendar
  today: { fr: "Aujourd'hui", cv: "Oji", pt: "Hoje" },
  no_visits_today: { fr: "Aucune visite aujourd'hui", cv: "Ninhun vizita oji", pt: "Nenhuma visita hoje" },
  mon: { fr: "Lu", cv: "Sg", pt: "Sg" },
  tue: { fr: "Ma", cv: "Te", pt: "Te" },
  wed: { fr: "Me", cv: "Ku", pt: "Qu" },
  thu: { fr: "Je", cv: "Ki", pt: "Qi" },
  fri: { fr: "Ve", cv: "Ss", pt: "Sx" },
  sat: { fr: "Sa", cv: "Sb", pt: "Sb" },
  sun: { fr: "Di", cv: "Dm", pt: "Dm" },

  // Confirmations
  confirm_delete: { fr: "Confirmer la suppression ?", cv: "Konfirmâ apagâ ?", pt: "Confirmar eliminação?" },
  confirm_delete_visit: { fr: "Supprimer cette visite ?", cv: "Apagâ es vizita ?", pt: "Eliminar esta visita?" },
  confirm_delete_speaker: { fr: "Supprimer cet orateur ?", cv: "Apagâ es orador ?", pt: "Eliminar este orador?" },
  confirm_delete_host: { fr: "Supprimer cet hôte ?", cv: "Apagâ es anfitrion ?", pt: "Eliminar este anfitrião?" },
  yes_delete: { fr: "Oui, supprimer", cv: "Sin, apagâ", pt: "Sim, eliminar" },

  // Misc
  no_results: { fr: "Aucun résultat", cv: "Ninhun rezultadu", pt: "Nenhum resultado" },
  loading: { fr: "Chargement...", cv: "Karregâ...", pt: "A carregar..." },
  version: { fr: "Version", cv: "Verson", pt: "Versão" },
  visits_count: { fr: "visites", cv: "vizitas", pt: "visitas" },
  speakers_count: { fr: "orateurs", cv: "irmons", pt: "oradores" },
  hosts_count: { fr: "hôtes", cv: "anfitrions", pt: "anfitriões" },
  visit_added: { fr: "Visite ajoutée", cv: "Vizita ajuntadu", pt: "Visita adicionada" },
  visit_updated: { fr: "Visite modifiée", cv: "Vizita modifikadu", pt: "Visita atualizada" },
  visit_deleted: { fr: "Visite supprimée", cv: "Vizita apagadu", pt: "Visita eliminada" },
  speaker_added: { fr: "Orateur ajouté", cv: "Orador ajuntadu", pt: "Orador adicionado" },
  speaker_updated: { fr: "Orateur modifié", cv: "Orador modifikadu", pt: "Orador atualizado" },
  speaker_deleted: { fr: "Orateur supprimé", cv: "Orador apagadu", pt: "Orador eliminado" },
  host_added: { fr: "Hôte ajouté", cv: "Anfitrion ajuntadu", pt: "Anfitrião adicionado" },
  host_updated: { fr: "Hôte modifié", cv: "Anfitrion modifikadu", pt: "Anfitrião atualizado" },
  host_deleted: { fr: "Hôte supprimé", cv: "Anfitrion apagadu", pt: "Anfitrião eliminado" },
  visit_confirmed: { fr: "Visite confirmée", cv: "Vizita confirmadu", pt: "Visita confirmada" },

  // New — Dashboard
  welcome_back: { fr: "Bon retour ! Voici un aperçu de votre activité.", cv: "Ben-vindu di volta! Kel ki sta kontese.", pt: "Bem-vindo de volta! Aqui está um resumo da sua atividade." },
  confirmed_count: { fr: "Confirmées", cv: "Confirmadus", pt: "Confirmadas" },
  this_month: { fr: "Ce mois-ci", cv: "Es mes li", pt: "Este mês" },
  recent_activities: { fr: "Activités récentes", cv: "Atividadis resentis", pt: "Atividades recentes" },
  see_all: { fr: "Voir tout", cv: "Odja tudu", pt: "Ver tudo" },
  backup: { fr: "Backup", cv: "Backup", pt: "Backup" },
  in_person: { fr: "Présentiel", cv: "Prezensial", pt: "Presencial" },
  archived: { fr: "Archivées", cv: "Arkivadus", pt: "Arquivadas" },
  schedule: { fr: "Programmer", cv: "Programâ", pt: "Programar" },
  view: { fr: "Voir", cv: "Odja", pt: "Ver" },
  repertoire: { fr: "Répertoire", cv: "Repertóriu", pt: "Repertório" },
  global_repertoire: { fr: "Répertoire global", cv: "Repertóriu global", pt: "Repertório global" },
  search_speaker: { fr: "Rechercher un orateur...", cv: "Buska un orador...", pt: "Pesquisar um orador..." },
  search_host: { fr: "Chercher un hôte...", cv: "Buska un anfitrion...", pt: "Pesquisar um anfitrião..." },

  // Settings tabs
  congregation_profile: { fr: "Profil de la Congrégation", cv: "Perfil di Kongregason", pt: "Perfil da Congregação" },
  congregation_name: { fr: "Nom", cv: "Nomi", pt: "Nome" },
  city: { fr: "Ville", cv: "Sidadi", pt: "Cidade" },
  day: { fr: "Jour", cv: "Dia", pt: "Dia" },
  time: { fr: "Heure", cv: "Ora", pt: "Hora" },
  reception_manager: { fr: "Responsable Accueil", cv: "Responsavel Akolimentu", pt: "Responsável Acolhimento" },
  full_name: { fr: "Nom complet", cv: "Nomi kompletu", pt: "Nome completo" },
  whatsapp_group: { fr: "Groupe WhatsApp (Hôtes)", cv: "Grupu WhatsApp (Anfitrions)", pt: "Grupo WhatsApp (Anfitriões)" },
  whatsapp_invite_id: { fr: "Invite ID (Groupe WhatsApp)", cv: "Invite ID (Grupu WhatsApp)", pt: "Invite ID (Grupo WhatsApp)" },
  developer: { fr: "Développeur", cv: "Dezenvolvedor", pt: "Desenvolvedor" },
  last_update: { fr: "Dernière mise à jour", cv: "Última atualizason", pt: "Última atualização" },
  app_description: { fr: "Application de gestion des orateurs visiteurs pour la congrégation.", cv: "Aplikason di jeston di irmons vizitantes pa kongregason.", pt: "Aplicação de gestão de oradores visitantes para a congregação." },

  // Appearance
  theme: { fr: "Thème", cv: "Tema", pt: "Tema" },
  light: { fr: "Clair", cv: "Klaru", pt: "Claro" },
  light_desc: { fr: "Interface lumineuse", cv: "Interfasi klaru", pt: "Interface luminosa" },
  dark: { fr: "Sombre", cv: "Skuru", pt: "Escuro" },
  dark_desc: { fr: "Mode nuit", cv: "Modu noiti", pt: "Modo noite" },
  system: { fr: "Système", cv: "Sistema", pt: "Sistema" },
  system_desc: { fr: "Synchronisé OS", cv: "Sinkronizadu OS", pt: "Sincronizado OS" },
  display_language: { fr: "Langue d'affichage", cv: "Lingua di afixason", pt: "Idioma de exibição" },

  // Notifications
  notifications_and_reminders: { fr: "Notifications & Rappels", cv: "Notifikasons & Lembranças", pt: "Notificações & Lembretes" },
  notifications_desc: { fr: "Autoriser l'application à envoyer des rappels système.", cv: "Autorizâ aplikason pa manda lembranças sistema.", pt: "Autorizar a aplicação a enviar lembretes do sistema." },
  remind_j7_title: { fr: "Rappel J-7 : contacter l'orateur / obtenir confirmation", cv: "Lembra J-7 : kontaktâ orador / obtê konfirmason", pt: "Lembrete D-7 : contactar o orador / obter confirmação" },
  remind_j7_desc: { fr: "Notification une semaine avant la visite pour vérifier que l'orateur a été contacté et confirmé.", cv: "Notifikason un simana antis di vizita pa verifikâ ki orador foi kontaktadu i konfirmadu.", pt: "Notificação uma semana antes da visita para verificar que o orador foi contactado e confirmado." },
  remind_j2_title: { fr: "Rappel J-2 : infos hôtes (après confirmation)", cv: "Lembra J-2 : infus anfitrions (dipôs konfirmason)", pt: "Lembrete D-2 : infos anfitriões (após confirmação)" },
  remind_j2_desc: { fr: "Une fois la visite confirmée, rappeler de collecter toutes les infos des hôtes (hébergement, transport, repas).", cv: "Un bes ki vizita konfirmadu, lembra pa koletâ tudu infus di anfitrions.", pt: "Uma vez a visita confirmada, lembrar de recolher todas as infos dos anfitriões." },
  sounds: { fr: "Sons", cv: "Sons", pt: "Sons" },
  vibration: { fr: "Vibreur", cv: "Vibrador", pt: "Vibração" },

  // Data / Import-Export
  import_export: { fr: "Import / Export", cv: "Inportâ / Esportâ", pt: "Importar / Exportar" },
  import_json: { fr: "Importer JSON", cv: "Inportâ JSON", pt: "Importar JSON" },
  full_backup: { fr: "Sauvegarde complète", cv: "Backup kompletu", pt: "Backup completo" },
  repertoire_speakers_hosts: { fr: "Répertoire Orateurs/Hôtes", cv: "Repertóriu Irmons/Anfitrions", pt: "Repertório Oradores/Anfitriões" },
  last_sync: { fr: "Dernière synchro", cv: "Última sinkro", pt: "Última sincro" },
  export_hint: { fr: "Exportez d'abord le répertoire propre, chargez-le sur les nouvelles installations, puis utilisez Google Sheet uniquement pour les visites.", cv: "Esportâ primeru repertóriu limpu, kargâ na novas instalasons, dipôs uzâ Google Sheet sô pa vizitas.", pt: "Exporte primeiro o repertório limpo, carregue nas novas instalações, depois use Google Sheet apenas para as visitas." },
  quick_access: { fr: "Accès rapide", cv: "Asesu rapidu", pt: "Acesso rápido" },
  quick_access_desc: { fr: "Rouvre instantanément les ressources partagées avec la congrégation.", cv: "Rabri instantaneamenti rekursus partilhadu ku kongregason.", pt: "Reabra instantaneamente os recursos partilhados com a congregação." },
  duplicate_detection: { fr: "Détection des doublons", cv: "Deteson di doblons", pt: "Deteção de duplicados" },
  duplicate_desc: { fr: "Identifie les orateurs et hôtes avec les mêmes coordonnées pour nettoyer la base.", cv: "Identifikâ irmons i anfitrions ku mesmu koordenadas pa linpâ bazi.", pt: "Identifica os oradores e anfitriões com as mesmas coordenadas para limpar a base." },
  search_duplicates: { fr: "Rechercher les doublons", cv: "Buska doblons", pt: "Pesquisar duplicados" },
  no_duplicates: { fr: "Aucun doublon trouvé", cv: "Ninhun doblon atxadu", pt: "Nenhum duplicado encontrado" },
  duplicates_found: { fr: "doublons trouvés", cv: "doblons atxadu", pt: "duplicados encontrados" },
  duplicates_deleted: { fr: "Doublons supprimés", cv: "Doblons apagadu", pt: "Duplicados eliminados" },
  no_selection: { fr: "Aucune sélection", cv: "Ninhun seleson", pt: "Nenhuma seleção" },
  selected: { fr: "sélectionné(s)", cv: "selesonadu", pt: "selecionado(s)" },
  delete_selection: { fr: "Supprimer la sélection", cv: "Apagâ seleson", pt: "Eliminar seleção" },

  // Sidebar
  program_today: { fr: "Programme du jour", cv: "Programa di oji", pt: "Programa do dia" },
  messages_today: { fr: "Messages du jour", cv: "Mensajens di oji", pt: "Mensagens do dia" },
  upcoming_reminders: { fr: "Rappels à venir", cv: "Lembranças ki sta pa bem", pt: "Lembretes a vir" },

  // Speaker fiche
  speaker_card: { fr: "Fiche Orateur", cv: "Fixa Orador", pt: "Ficha Orador" },
  couple_photos: { fr: "Photos du couple", cv: "Fotus di kazal", pt: "Fotos do casal" },
  speaker_label: { fr: "Orateur", cv: "Orador", pt: "Orador" },
  spouse_label: { fr: "Épouse", cv: "Spoza", pt: "Esposa" },
  household_type: { fr: "Type de foyer", cv: "Tipu di foyer", pt: "Tipo de lar" },
  brother_alone: { fr: "Frère seul", cv: "Irmon so", pt: "Irmão sozinho" },
  couple: { fr: "Couple", cv: "Kazal", pt: "Casal" },
  spouse_name: { fr: "Nom de l'épouse", cv: "Nomi di spoza", pt: "Nome da esposa" },
  spouse_name_placeholder: { fr: "Prénom et Nom", cv: "Nomi i Sobrenomi", pt: "Nome e Apelido" },
  household_hint: { fr: "Ce paramètre garantit que l'attribution respecte les règles.", cv: "Es parametru garanti ki atribuison respeitâ regras.", pt: "Este parâmetro garante que a atribuição respeita as regras." },
  no_notes: { fr: "Aucune note", cv: "Ninhun nota", pt: "Nenhuma nota" },
  done: { fr: "Terminé", cv: "Terminadu", pt: "Concluído" },

  // Visit detail modal
  infos: { fr: "Infos", cv: "Infus", pt: "Infos" },
  messages_tab: { fr: "Messages", cv: "Mensajens", pt: "Mensagens" },
  expenses: { fr: "Dépenses", cv: "Despezas", pt: "Despesas" },
  feedback_label: { fr: "Feedback", cv: "Feedback", pt: "Feedback" },
  visit_details: { fr: "Détails de la visite", cv: "Detalhis di vizita", pt: "Detalhes da visita" },
  speaker_phone: { fr: "Téléphone orateur", cv: "Telefoni orador", pt: "Telefone orador" },
  phone_whatsapp_hint: { fr: "Utilisé pour les messages WhatsApp et les rappels.", cv: "Uzadu pa mensajens WhatsApp i lembranças.", pt: "Usado para mensagens WhatsApp e lembretes." },
  arrival_date: { fr: "Date arrivée orateur", cv: "Data txigada orador", pt: "Data chegada orador" },
  meeting_date: { fr: "Date réunion", cv: "Data reunion", pt: "Data reunião" },
  departure_date: { fr: "Date départ orateur", cv: "Data partida orador", pt: "Data partida orador" },
  arrival_time: { fr: "Heure arrivée orateur", cv: "Ora txigada orador", pt: "Hora chegada orador" },
  meeting_time: { fr: "Heure réunion", cv: "Ora reunion", pt: "Hora reunião" },
  departure_time: { fr: "Heure départ orateur", cv: "Ora partida orador", pt: "Hora partida orador" },
  arrival: { fr: "Arrivée", cv: "Txigada", pt: "Chegada" },
  meeting: { fr: "Réunion", cv: "Reunion", pt: "Reunião" },
  departure: { fr: "Départ", cv: "Partida", pt: "Partida" },
  location_hint: { fr: "Présentiel, Zoom ou Streaming selon disponibilité.", cv: "Prezensial, Zoom o Streaming segungu disponibilidadi.", pt: "Presencial, Zoom ou Streaming conforme disponibilidade." },
  no_hosts_assigned: { fr: "Aucun hôte assigné", cv: "Ninhun anfitrion atribuidu", pt: "Nenhum anfitrião atribuído" },
  hosts_hint: { fr: "Gérez les hôtes dans l'onglet dédié.", cv: "Jestionâ anfitrions na aba dedikadu.", pt: "Gerencie os anfitriões na aba dedicada." },
  dietary_allergies: { fr: "Régime & Allergies", cv: "Rejimi & Alerjias", pt: "Regime & Alergias" },
  speaker_allergies_placeholder: { fr: "Allergies de l'orateur...", cv: "Alerjias di orador...", pt: "Alergias do orador..." },
  spouse_allergies_placeholder: { fr: "Allergies de l'épouse...", cv: "Alerjias di spoza...", pt: "Alergias da esposa..." },
  visit_notes: { fr: "Notes de visite", cv: "Notas di vizita", pt: "Notas da visita" },
  add_notes_placeholder: { fr: "Ajouter des notes...", cv: "Ajuntâ notas...", pt: "Adicionar notas..." },
  visit_notes_hint: { fr: "Les visites se déroulent habituellement le dimanche à 11h30.", cv: "Vizitas acontese normalimenti na dumingu às 11h30.", pt: "As visitas decorrem habitualmente ao domingo às 11h30." },
  host_management: { fr: "Gestion des hôtes", cv: "Jeston di anfitrions", pt: "Gestão de anfitriões" },
  messages_section: { fr: "Messages WhatsApp", cv: "Mensajens WhatsApp", pt: "Mensagens WhatsApp" },
  messages_coming_soon: { fr: "Les templates de messages arrivent bientôt.", cv: "Templates di mensajens sta pa txiga.", pt: "Os templates de mensagens estão a chegar." },
  expenses_section: { fr: "Suivi des dépenses", cv: "Rastreamentu di despezas", pt: "Rastreamento de despesas" },
  expenses_coming_soon: { fr: "Le suivi des dépenses arrive bientôt.", cv: "Rastreamentu di despezas sta pa txiga.", pt: "O rastreamento de despesas está a chegar." },
  feedback_section: { fr: "Retour sur la visite", cv: "Retornu sobri vizita", pt: "Retorno sobre a visita" },
  rating: { fr: "Note", cv: "Nota", pt: "Nota" },
  feedback_comment: { fr: "Commentaire", cv: "Komentariu", pt: "Comentário" },
  feedback_placeholder: { fr: "Ajouter un retour...", cv: "Ajuntâ un retornu...", pt: "Adicionar um retorno..." },

  // Hosts tab
  reception_logistics: { fr: "Accueil & Logistique", cv: "Akolimentu & Lojistika", pt: "Acolhimento & Logística" },
  assign: { fr: "Assigner", cv: "Atribuí", pt: "Atribuir" },
  assign_host: { fr: "Assigner un hôte", cv: "Atribuí un anfitrion", pt: "Atribuir um anfitrião" },
  select_host: { fr: "Choisir un hôte...", cv: "Skodje un anfitrion...", pt: "Escolher um anfitrião..." },
  group_meal: { fr: "Repas de groupe", cv: "Kumida di grupu", pt: "Refeição de grupo" },
  group_meal_desc: { fr: "Ajoutez une mention Salle du Royaume ou Restaurant.", cv: "Ajuntâ menson Sala di Reinu o Restauranti.", pt: "Adicione uma menção Salão do Reino ou Restaurante." },
  meal_kingdom_hall_desc: { fr: "Repas prévu directement à la Salle du Royaume.", cv: "Kumida prevista diretamenti na Sala di Reinu.", pt: "Refeição prevista diretamente no Salão do Reino." },
  meal_restaurant: { fr: "Repas Restaurant", cv: "Kumida Restauranti", pt: "Refeição Restaurante" },
  meal_restaurant_desc: { fr: "Repas collectif au restaurant avec le groupe.", cv: "Kumida koletivu na restauranti ku grupu.", pt: "Refeição coletiva no restaurante com o grupo." },

  // Messages tab
  call: { fr: "Appel", cv: "Txamada", pt: "Chamada" },
  no_message_sent: { fr: "Aucun message envoyé pour l'instant.", cv: "Ninhun mensajen manadu pa agora.", pt: "Nenhuma mensagem enviada por enquanto." },
  compose: { fr: "Composer", cv: "Konponhi", pt: "Compor" },
  recipients: { fr: "Destinataires", cv: "Destinatarius", pt: "Destinatários" },
  write_message: { fr: "Écrire un message...", cv: "Skrebe un mensajen...", pt: "Escrever uma mensagem..." },
  copy: { fr: "Copier", cv: "Kopia", pt: "Copiar" },
  copied: { fr: "Copié !", cv: "Kopiadu!", pt: "Copiado!" },
  send_whatsapp: { fr: "Envoyer via WhatsApp", cv: "Manda via WhatsApp", pt: "Enviar via WhatsApp" },
  templates_by_step: { fr: "Modèles par étape", cv: "Modelus pa etapa", pt: "Modelos por etapa" },
  contact_step: { fr: "Contact", cv: "Kontaktu", pt: "Contacto" },
  preparation_step: { fr: "Préparation", cv: "Preparason", pt: "Preparação" },
  feedback_step: { fr: "Feedback", cv: "Feedback", pt: "Feedback" },
  insert_message: { fr: "Insérer dans le message", cv: "Inseri na mensajen", pt: "Inserir na mensagem" },

  // Expenses tab
  total_expenses: { fr: "Total dépenses", cv: "Total despezas", pt: "Total despesas" },
  expense_label: { fr: "Libellé de la dépense", cv: "Label di despeza", pt: "Rótulo da despesa" },
  add_expense: { fr: "Ajouter une dépense", cv: "Ajuntâ un despeza", pt: "Adicionar uma despesa" },

  // Feedback tab
  talk_quality: { fr: "Qualité du discours", cv: "Qualidadi di diskursu", pt: "Qualidade do discurso" },
  comments_followup: { fr: "Commentaires / Suivi", cv: "Komentarius / Seguimentu", pt: "Comentários / Seguimento" },
  feedback_visit_placeholder: { fr: "Comment s'est passée la visite ?", cv: "Komu vizita korreu?", pt: "Como correu a visita?" },
  save_feedback: { fr: "Enregistrer le feedback", cv: "Gravâ feedback", pt: "Guardar feedback" },
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
