import { useEffect, useRef } from "react";
import { useVisitStore } from "../store/useVisitStore";
import { useSettingsStore } from "../store/useSettingsStore";
import {
  useNotificationStore,
  type ReminderType,
  type AppNotification,
} from "../store/useNotificationStore";
import { generateId } from "../lib/sheetUtils";

function diffDays(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function buildWhatsAppMessage(
  type: ReminderType,
  speakerName: string,
  visitDate: string,
  congregation: string,
  responsableName: string,
  lang: string
): string {
  const prenom = speakerName.split(" ")[0] || speakerName;
  const dateFormatted = new Date(visitDate + "T00:00:00").toLocaleDateString(
    lang === "pt" ? "pt-PT" : lang === "cv" ? "pt-CV" : "fr-FR",
    { weekday: "long", day: "numeric", month: "long" }
  );

  if (type === "j7") {
    if (lang === "cv")
      return `Bon dia ${prenom},\n\nN ta kontakta-bu pa lembra-bu di bu vizita ki sta programadu pa ${dateFormatted}.\nPor favor, konfirma-m si tudu sta dretu.\n\nFraternalmenti,\n${responsableName}`;
    if (lang === "pt")
      return `Bom dia ${prenom},\n\nEntro em contacto para relembrar a sua visita programada para ${dateFormatted}.\nPor favor, confirme se está tudo em ordem.\n\nFraternalmente,\n${responsableName}`;
    return `Bonjour ${prenom},\n\nJe vous contacte pour vous rappeler votre visite programmée le ${dateFormatted}.\nMerci de me confirmer que tout est en ordre.\n\nFraternellement,\n${responsableName}`;
  }

  if (type === "j2") {
    if (lang === "cv")
      return `Bon dia ${prenom},\n\nBu vizita sta pa txiga (${dateFormatted})! 🙏\nSi bu ten alguma pergunta di últimu óra, N sta disponível.\n\nFraternalmenti,\n${responsableName}`;
    if (lang === "pt")
      return `Bom dia ${prenom},\n\nA sua visita está a chegar (${dateFormatted})! 🙏\nSe tiver alguma dúvida de última hora, estou disponível.\n\nFraternalmente,\n${responsableName}`;
    return `Bonjour ${prenom},\n\nVotre visite approche (${dateFormatted}) ! 🙏\nSi vous avez une question de dernière minute, je reste disponible.\n\nFraternellement,\n${responsableName}`;
  }

  // j1_thanks
  if (lang === "cv")
    return `Bon dia ${prenom},\n\nNha sinseru obrigadu pa bu vizita i pa diskursu ki fortifika-nu tudu! 🙏✨\nFoi un grandi prazeri risebe bu.\n\nFraternalmenti,\n${responsableName}`;
  if (lang === "pt")
    return `Bom dia ${prenom},\n\nO nosso sincero obrigado pela sua visita e pelo discurso que fortaleceu todos nós! 🙏✨\nFoi um grande prazer recebê-lo.\n\nFraternalmente,\n${responsableName}`;
  return `Bonjour ${prenom},\n\nMerci sincèrement pour votre visite et votre discours qui nous a tous fortifiés ! 🙏✨\nCe fut un grand plaisir de vous accueillir.\n\nFraternellement,\n${responsableName}`;
}

/** Request browser notification permission */
function requestPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico" });
    } catch {
      // Silent fail on environments that don't support it
    }
  }
}

export function useReminderEngine() {
  const visits = useVisitStore((s) => s.visits);
  const settings = useSettingsStore((s) => s.settings);

  const lang = settings.language;
  const responsableName = settings.congregation.responsableName || "Le responsable";
  const notifEnabled = settings.notifications.enabled;
  const remindJ7 = settings.notifications.steps.remindJ7;
  const remindJ2 = settings.notifications.steps.remindJ2;

  // Stable ref for checkReminders to avoid re-creating on every render
  const visitsRef = useRef(visits);
  visitsRef.current = visits;
  const configRef = useRef({ notifEnabled, remindJ7, remindJ2, lang, responsableName });
  configRef.current = { notifEnabled, remindJ7, remindJ2, lang, responsableName };

  useEffect(() => {
    if (notifEnabled) {
      requestPermission();
    }
  }, [notifEnabled]);

  useEffect(() => {
    const check = () => {
      const { notifEnabled: enabled, remindJ7: j7, remindJ2: j2, lang: l, responsableName: rn } = configRef.current;
      if (!enabled) return;

      const { addNotification, hasNotification } = useNotificationStore.getState();
      const currentVisits = visitsRef.current;

      currentVisits.forEach((visit) => {
        if (visit.status === "cancelled" || visit.status === "completed") return;
        const days = diffDays(visit.visitDate);

        const createReminder = (type: ReminderType) => {
          if (hasNotification(visit.visitId, type)) return;
          const msg = buildWhatsAppMessage(type, visit.nom, visit.visitDate, visit.congregation, rn, l);
          addNotification({
            id: generateId(),
            visitId: visit.visitId,
            speakerName: visit.nom,
            visitDate: visit.visitDate,
            type,
            status: "pending",
            createdAt: new Date().toISOString(),
            whatsappMessage: msg,
            whatsappPhone: visit.speakerPhone || "",
          });
          const typeLabel = type === "j7" ? "J-7" : type === "j2" ? "J-2" : "Remerciement";
          sendBrowserNotification(`🔔 ${typeLabel} – ${visit.nom}`, `Visite du ${new Date(visit.visitDate + "T00:00:00").toLocaleDateString("fr-FR")}`);
        };

        if (j7 && days <= 7 && days > 2) createReminder("j7");
        if (j2 && days <= 2 && days >= 0) createReminder("j2");
        if (days <= -1 && days >= -3) createReminder("j1_thanks");
      });
    };

    // Run once after mount, then every 30 min
    const timeout = setTimeout(check, 1000);
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []); // Empty deps - uses refs for current values

  // Read pending count separately (safe, doesn't trigger the check loop)
  const pendingCount = useNotificationStore((s) => s.notifications.filter((n) => n.status === "pending").length);

  return { pendingCount };
}
