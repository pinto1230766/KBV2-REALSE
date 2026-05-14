// Message templates organized by category and recipient.
// Extracted from PlanningHub for maintainability — pure data, no logic.

export type TemplateCategory = "speaker" | "logistique" | "groupe";

type LangBody = { title: string; desc: string; body: string };
export type TemplateEntry = {
  category: TemplateCategory;
  fr: LangBody;
  cv: LangBody;
  pt: LangBody;
};

export const messageTemplates: Record<string, TemplateEntry> = {
  // ─── ORATEURS – PRÉSENTIEL ───
  confirmation_speaker: {
    category: "speaker",
    fr: {
      title: "Confirmation – Orateur (Présentiel)",
      desc: "Premier contact pour confirmer la visite sur place",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nJe suis {ton_nom}, responsable de l'accueil au sein du Groupe Kabuverdianu de Lyon. \u{1F64F}\n\nC'est un grand plaisir de vous inviter pour une visite et un discours le {jour_semaine} {date_visite}, à {heure_visite}.\n\nMerci de me confirmer les points suivants :\n\u{2022} \u{2705} Pouvez-vous venir à cette date et heure ?\n\u{2022} \u{1F3E0} Avez-vous besoin d'un hébergement ?\n\u{2022} \u{1F37D} Avez-vous des allergies alimentaires (vous + accompagnants) ?\n\u{2022} \u{1F697} Quel mode de transport comptez-vous utiliser (voiture, train, avion) ?\n{question_enfants_block}{question_accompagnants_block}\nMerci de répondre dès que possible pour notre organisation.\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Konfirmaçon – Orador (Prezensial)",
      desc: "Primer kontaktu pa konfirmá vizita",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nMi é {ton_nom}, enkaregadu di resebe vizitantis na Grupu Kabuverdianu di Lyon. 🙏\n\nN ten un grandi prazer di pâpia ku bo pa konvida-u pa faze-nu un vizita i faze un diskursu na {jour_semaine} {date_visite}, na {heure_visite}.\n\nFavor, konfirma-m es kuzas li:\n• ✅ Bu pode ben na es data i óra?\n• 🏠 Bu meste di un lugar pa fika (alojamentu)?\n• 🍽️ Algum alerjia di kumida (bo + akonpanhantis)?\n• 🚗 Modi ki bu ta bem (karku, komboiu, avion)?\n{question_enfants_block}{question_accompagnants_block}\nFavor responde-m u más rápidu posível pa nu organiza dretu.\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Confirmação – Orador (Presencial)",
      desc: "Primeiro contacto para confirmar a visita",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nSou {ton_nom}, responsável pelo acolhimento no Grupo Cabo-verdiano de Lyon. 🙏\n\nÉ um grande prazer convidá-lo para uma visita e um discurso no {jour_semaine} {date_visite}, às {heure_visite}.\n\nPor favor, confirme os seguintes pontos:\n• ✅ Pode vir nesta data e hora?\n• 🏠 Precisa de alojamento?\n• 🍽️ Tem alergias alimentares (você + acompanhantes)?\n• 🚗 Como pretende vir (carro, comboio, avião)?\n{question_enfants_block}{question_accompagnants_block}\nPor favor, responda assim que possível.\n\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
    },
  },

  // ─── ORATEURS – ONLINE ───
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

  // ─── ORATEURS – LOCAL (KBV Lyon) ───
  confirmation_speaker_local: {
    category: "speaker",
    fr: {
      title: "Confirmation – Orateur local",
      desc: "Membre KBV Lyon, pas de logistique",
      body: `Bonjour {prenom_orateur},\n\nC'est confirmé pour ton discours le {jour_semaine} {date_visite} à {heure_visite}.\n\nMerci de me confirmer :\n\u{2022} \u{2705} Tout est bon pour cette date ?\n\u{2022} \u{1F4D6} Le thème : {theme_discours} (n°{numero_discours})\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Konfirmaçon – Orador lokal",
      desc: "Membru KBV Lyon, sen lojístika",
      body: `Bon dia {prenom_orateur},\n\nKonfirmadu pa bu diskursu na {jour_semaine} {date_visite} na {heure_visite}.\n\nFavor konfirma-m:\n• ✅ Tudu sta dretu pa es data?\n• 📖 Tema: {theme_discours} (nº{numero_discours})\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Confirmação – Orador local",
      desc: "Membro KBV Lyon, sem logística",
      body: `Bom dia {prenom_orateur},\n\nConfirmado para o teu discurso em {jour_semaine} {date_visite} às {heure_visite}.\n\nPor favor confirma:\n• ✅ Está tudo bem para esta data?\n• 📖 Tema: {theme_discours} (nº{numero_discours})\n\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
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
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nObrigadu pa bu konfirmason! Li sta o planu di bu estadia:\n\n📅 Datas i óras\n• Txegada: {jour_arrivee} {date_arrivee} (volta di {heure_arrivee})\n• Runion: {jour_visite} {date_visite} na {heure_visite}\n• Partida: {jour_depart} {date_depart} (volta di {heure_depart})\n\n{speaker_hebergement_block}{speaker_repas_block}{speaker_transport_block}{accompagnants_details}\nSi bu ten kualker pergunta, N sta disponível na {mon_tel}.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Preparação – Orador (Presencial)",
      desc: "Detalhes completos de organização",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nObrigado pela sua confirmação! Aqui está o plano da sua estadia:\n\n📅 Datas e horas\n• Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n• Reunião: {jour_visite} {date_visite} às {heure_visite}\n• Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\n{speaker_hebergement_block}{speaker_repas_block}{speaker_transport_block}{accompagnants_details}\nSe tiver alguma dúvida, fico disponível em {mon_tel}.\n\nFraternalmente,\n{ton_nom}`,
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

  preparation_speaker_local: {
    category: "speaker",
    fr: {
      title: "Rappel – Orateur local",
      desc: "Court rappel quelques jours avant",
      body: `Bonjour {prenom_orateur},\n\nPetit rappel pour ton discours :\n\u{1F4C5} {jour_visite} {date_visite} à {heure_visite}\n\u{1F4D6} Thème : {theme_discours} (n°{numero_discours})\n\nÀ très bientôt ! \u{1F64F}\n{ton_nom}`,
    },
    cv: {
      title: "Lembransa – Orador lokal",
      desc: "Lembransa kurtu uns dia antis",
      body: `Bon dia {prenom_orateur},\n\nLembransa pa bu diskursu:\n📅 {jour_visite} {date_visite} na {heure_visite}\n📖 Tema: {theme_discours} (nº{numero_discours})\n\nTé brebi! 🙏\n{ton_nom}`,
    },
    pt: {
      title: "Lembrete – Orador local",
      desc: "Lembrete curto alguns dias antes",
      body: `Bom dia {prenom_orateur},\n\nUm lembrete para o teu discurso:\n📅 {jour_visite} {date_visite} às {heure_visite}\n📖 Tema: {theme_discours} (nº{numero_discours})\n\nAté breve! 🙏\n{ton_nom}`,
    },
  },

  thanks_speaker: {
    category: "speaker",
    fr: {
      title: "Remerciements – Orateur",
      desc: "Message après la visite",
      body: `Bonjour Frère {prenom_orateur},\n\nJe vous remercie sincèrement pour votre présence et votre discours qui nous a tous fortifiés ! \u{1F64F}\u{2728}\nCe fut un grand plaisir de vous accueillir au sein du Groupe Kabuverdianu de Lyon.\n\nNous espérons vous revoir bientôt. Que Jéhovah continue de vous donner des forces pour le servir.\n\nSi vous avez engagé des frais de déplacement remplir et nous renvoye le formulaire 3007-f\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Agradecementu – Orador",
      desc: "Mensajen pós-vizita",
      body: `Bon dia Irmãu {prenom_orateur},\n\nNha sinseru obrigadu pa bu presensa i pa diskursu ki fortifika-nu tudu! 🙏✨\nFoi un grandi prazeri risebe bu na Grupu Kabuverdianu di Lyon.\n\nNu ta spera torna odja-u brebi. Ki Jeová kontinia da-u forsa pa sirbi-l.\n\nSi bu ten despeza di deslocamentu, favor preenche i manda-nu formuláriu 3007-f\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador",
      desc: "Mensagem pós-visita",
      body: `Bom dia Irmão {prenom_orateur},\n\nO nosso sincero obrigado pela sua presença e pelo discurso que fortaleceu todos nós! 🙏✨\nFoi um grande prazer recebê-lo no Grupo Cabo-verdiano de Lyon.\n\nEsperamos vê-lo em breve. Que Jeová continue a dar-lhe forças para O servir.\n\nSe teve despesas de deslocação, preencher e nos devolver o formulário 3007-f\n\nFraternalmente,\n{ton_nom}`,
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
      body: `Bon dia Irmãu {prenom_orateur},\n\nObrigadu di korason pa diskursu partilhadu via {visit_channel_label}! 🙏💻\nMesmu na distansia, bu mensajen da forsa pa kongregason interu.\n\nNu ta spera odja-u pesoalmenti un dia. Ki Jeová kontinia abensoa bu ministériu.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador (Zoom/Streaming)",
      desc: "Mensagem pós-visita online",
      body: `Bom dia Irmão {prenom_orateur},\n\nObrigado de coração pelo discurso partilhado via {visit_channel_label}! 🙏💻\nMesmo à distância, a sua mensagem deu força a toda a congregação.\n\nEsperamos ter a oportunidade de o ver pessoalmente. Que Jeová continue a abençoar o seu ministério.\n\nFraternalmente,\n{ton_nom}`,
    },
  },

  thanks_speaker_local: {
    category: "speaker",
    fr: {
      title: "Remerciements – Orateur local",
      desc: "Message court après le discours",
      body: `Bonjour {prenom_orateur},\n\nMerci pour ton discours, c'était une vraie bénédiction ! 🙏✨\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Agradecementu – Orador lokal",
      desc: "Mensajen kurtu pós-diskursu",
      body: `Bon dia {prenom_orateur},\n\nObrigadu pa bu diskursu, foi un verdaderu benson! 🙏✨\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Agradecimento – Orador local",
      desc: "Mensagem curta pós-discurso",
      body: `Bom dia {prenom_orateur},\n\nObrigado pelo teu discurso, foi uma verdadeira bênção! 🙏✨\n\nFraternalmente,\n{ton_nom}`,
    },
  },

  // ─── ANNULATION ───
  cancellation_speaker_local: {
    category: "speaker",
    fr: {
      title: "Annulation – Orateur local",
      desc: "Message court pour un membre KBV Lyon",
      body: `Bonjour {prenom_orateur},\n\nPetit message pour t'informer que ton discours du {jour_visite} {date_visite} doit être annulé / reporté. 🙏\n\nOn se recale dès que possible.\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Anulason – Orador lokal",
      desc: "Mensajen kurtu pa membru KBV Lyon",
      body: `Bon dia {prenom_orateur},\n\nSô pa informa-u ma bu diskursu di {jour_visite} {date_visite} ten ki ser anuladu / adiadu. 🙏\n\nNu ta volta marka logu ki da.\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Cancelamento – Orador local",
      desc: "Mensagem curta para membro KBV Lyon",
      body: `Bom dia {prenom_orateur},\n\nSó para te avisar que o teu discurso de {jour_visite} {date_visite} terá de ser cancelado / adiado. 🙏\n\nVoltamos a marcar assim que possível.\n\nFraternalmente,\n{ton_nom}`,
    },
  },

  cancellation_speaker: {
    category: "speaker",
    fr: {
      title: "Annulation / Report – Orateur",
      desc: "Informer l'orateur d'une annulation",
      body: `Bonjour {prenom_orateur} {nom_orateur},\n\nJe vous écris pour vous informer que la visite prévue le {jour_visite} {date_visite} doit être annulée / reportée.\n\nNous reviendrons vers vous très vite pour vous proposer une nouvelle date.\nMerci pour votre compréhension. 🙏\n\nFraternellement,\n{ton_nom}\n{mon_tel}`,
    },
    cv: {
      title: "Anulason / Adiamentu – Orador",
      desc: "Informa orador di un anulason",
      body: `Bon dia {prenom_orateur} {nom_orateur},\n\nN sta skrebe-u pa informa ma vizita previstu pa {jour_visite} {date_visite} ten ki ser anuladu / adiadu.\n\nNu ta volta kontatá-u brebi pa propon un nova data.\nObrigadu pa bu komprenson. 🙏\n\nFraternalmenti,\n{ton_nom}\n{mon_tel}`,
    },
    pt: {
      title: "Cancelamento / Adiamento – Orador",
      desc: "Informar orador de um cancelamento",
      body: `Bom dia {prenom_orateur} {nom_orateur},\n\nEscrevo para informar que a visita prevista para {jour_visite} {date_visite} terá de ser cancelada / adiada.\n\nVoltaremos a contactá-lo em breve para propor uma nova data.\nObrigado pela sua compreensão. 🙏\n\nFraternalmente,\n{ton_nom}\n{mon_tel}`,
    },
  },

  cancellation_group: {
    category: "groupe",
    fr: {
      title: "Annulation – Groupe",
      desc: "Informer le groupe d'une annulation",
      body: `Bonjour à tous,\n\nLa visite de {prenom_orateur} {nom_orateur} prévue le {jour_visite} {date_visite} est annulée / reportée.\n\nMerci à ceux qui s'étaient déjà proposés pour aider — on revient vers vous dès qu'une nouvelle date est fixée. 🙏`,
    },
    cv: {
      title: "Anulason – Grupo",
      desc: "Informa grupo di un anulason",
      body: `Bon dia a tudu,\n\nVizita di {prenom_orateur} {nom_orateur} previstu pa {jour_visite} {date_visite} sta anuladu / adiadu.\n\nObrigadu pa kes ki ja prupo juda — nu ta volta logo ki ten nova data. 🙏`,
    },
    pt: {
      title: "Cancelamento – Grupo",
      desc: "Informar o grupo de um cancelamento",
      body: `Bom dia a todos,\n\nA visita de {prenom_orateur} {nom_orateur} prevista para {jour_visite} {date_visite} foi cancelada / adiada.\n\nObrigado a quem já se tinha proposto para ajudar — voltaremos assim que houver nova data. 🙏`,
    },
  },

  // ─── LOGISTIQUE ───
  logistique_host: {
    category: "logistique",
    fr: {
      title: "Briefing – Hôte(s)",
      desc: "Message complet pour l'hôte assigné (hébergement, repas, transport)",
      body: `Bonjour,\n\nVoici les informations logistiques pour la visite de {prenom_orateur} {nom_orateur} :\n\n\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466} Visiteurs\n{composition_visite_block}\n{repas_label}\n\n{hebergement_planning_block}{repas_planning_block}{transport_planning_block}{transport_type_block}{details_allergies_block}\nMerci pour ton aide ! Fraternellement,\n{ton_nom}`,
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

  reminder_hosts: {
    category: "logistique",
    fr: {
      title: "Relance – Hôtes (J-3)",
      desc: "Petit rappel quelques jours avant la visite",
      body: `Bonjour,\n\nPetit rappel : la visite de {prenom_orateur} {nom_orateur} approche !\n📅 {jour_visite} {date_visite} à {heure_visite}\n\nMerci de me confirmer que tout est ok de ton côté (hébergement / repas / transport). 🙏\n\nFraternellement,\n{ton_nom}`,
    },
    cv: {
      title: "Lembransa – Anfitriãus (J-3)",
      desc: "Lembransa uns dia antis di vizita",
      body: `Bon dia,\n\nLembransa: vizita di {prenom_orateur} {nom_orateur} ta txega!\n📅 {jour_visite} {date_visite} na {heure_visite}\n\nFavor konfirma-m ma tudu sta dretu di bu ladu (alojamentu / kumida / transporti). 🙏\n\nFraternalmenti,\n{ton_nom}`,
    },
    pt: {
      title: "Lembrete – Anfitriões (J-3)",
      desc: "Pequeno lembrete alguns dias antes",
      body: `Bom dia,\n\nLembrete: a visita de {prenom_orateur} {nom_orateur} aproxima-se!\n📅 {jour_visite} {date_visite} às {heure_visite}\n\nPor favor, confirma-me que está tudo bem do teu lado (alojamento / refeições / transporte). 🙏\n\nFraternalmente,\n{ton_nom}`,
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
      body: `Bon dia a tudu! 👋\n\nN ta buska VOLUNTÁRIUS pa risebe nos prósimu orador:\n\n🎤 Orador: Irmãu {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n👨‍👩‍👧‍👦 Vizitantis\n{composition_visite_block}\n{repas_label}\n\n📅 Txegada: {jour_arrivee} {date_arrivee} (volta di {heure_arrivee})\n📅 Runion: {jour_visite} {date_visite} na {heure_visite}\n📅 Partida: {jour_depart} {date_depart} (volta di {heure_depart})\n\nNu meste di:\n{besoins_volontaires_block}\n{details_allergies_block}Si bu pode juda, favor responde-m u más rápidu posível.\n\nObrigadu di korason,\n{ton_nom}`,
    },
    pt: {
      title: "Procura de voluntários",
      desc: "Mensagem para o grupo de anfitriões",
      body: `Bom dia a todos! 👋\n\nProcuro VOLUNTÁRIOS para receber o nosso próximo orador:\n\n🎤 Orador: Irmão {prenom_orateur} {nom_orateur} ({congregation_orateur})\n\n👨‍👩‍👧‍👦 Visitantes\n{composition_visite_block}\n{repas_label}\n\n📅 Chegada: {jour_arrivee} {date_arrivee} (por volta de {heure_arrivee})\n📅 Reunião: {jour_visite} {date_visite} às {heure_visite}\n📅 Partida: {jour_depart} {date_depart} (por volta de {heure_depart})\n\nPrecisamos de:\n{besoins_volontaires_block}\n{details_allergies_block}Se puderem ajudar, respondam o mais cedo possível.\n\nObrigado de coração,\n{ton_nom}`,
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
